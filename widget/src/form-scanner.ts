import { toolRegistry } from "./webmcp";

// Maps HTML input types to JSON Schema types
const TYPE_MAP: Record<string, string> = {
  text: "string",
  email: "string",
  url: "string",
  tel: "string",
  search: "string",
  password: "string",
  color: "string",
  date: "string",
  time: "string",
  "datetime-local": "string",
  month: "string",
  week: "string",
  hidden: "string",
  number: "number",
  range: "number",
  checkbox: "boolean",
};

// Input types we skip — can't be set programmatically or aren't tool params
const SKIP_TYPES = new Set(["submit", "button", "reset", "image", "file"]);

interface SchemaProperty {
  type: string;
  description?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  enum?: string[];
}

interface InputSchema {
  type: "object";
  properties: Record<string, SchemaProperty>;
  required: string[];
}

function buildSchemaFromForm(form: HTMLFormElement): InputSchema {
  const properties: Record<string, SchemaProperty> = {};
  const required: string[] = [];
  const seen = new Set<string>();

  const fields = form.querySelectorAll<HTMLElement>("input[name], select[name], textarea[name]");

  for (const field of fields) {
    const name = (field as HTMLInputElement).name;
    if (!name || seen.has(name)) continue;
    seen.add(name);

    // Skip non-param input types
    if (field instanceof HTMLInputElement && SKIP_TYPES.has(field.type)) {
      if (field.type === "file") {
        console.warn(`[Flunkie FormScanner] Skipping file input "${name}" — file inputs can't be set programmatically.`);
      }
      continue;
    }

    const prop: SchemaProperty = { type: "string" };

    // Determine type
    if (field instanceof HTMLInputElement) {
      prop.type = TYPE_MAP[field.type] || "string";

      // Radio group: collect values as enum
      if (field.type === "radio") {
        const radios = form.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`);
        const values: string[] = [];
        for (const radio of radios) {
          if (radio.value) values.push(radio.value);
        }
        if (values.length > 0) prop.enum = values;
      }

      // Numeric constraints
      if (field.min) prop.minimum = Number(field.min);
      if (field.max) prop.maximum = Number(field.max);

      // String constraints
      if (field.minLength > 0) prop.minLength = field.minLength;
      if (field.maxLength > 0 && field.maxLength < 524288) prop.maxLength = field.maxLength;
      if (field.pattern) prop.pattern = field.pattern;
    } else if (field instanceof HTMLSelectElement) {
      const values: string[] = [];
      for (const opt of field.options) {
        if (opt.value) values.push(opt.value);
      }
      if (values.length > 0) prop.enum = values;
    } else if (field instanceof HTMLTextAreaElement) {
      prop.type = "string";
      if (field.minLength > 0) prop.minLength = field.minLength;
      if (field.maxLength > 0 && field.maxLength < 524288) prop.maxLength = field.maxLength;
    }

    // Description from flunkie attribute
    const desc = field.getAttribute("flunkie-param-description");
    if (desc) prop.description = desc;

    // Required
    if ((field as HTMLInputElement).required) {
      required.push(name);
    }

    properties[name] = prop;
  }

  return { type: "object", properties, required };
}

function createFormToolExecute(form: HTMLFormElement): (params: Record<string, unknown>) => Promise<string> {
  return async (params: Record<string, unknown>): Promise<string> => {
    const autoSubmit = form.hasAttribute("flunkie-auto-submit");

    // Step 1: Populate every field from agent params
    for (const [key, value] of Object.entries(params)) {
      const field = form.elements.namedItem(key);
      if (!field) continue;

      if (field instanceof HTMLInputElement && field.type === "checkbox") {
        field.checked = Boolean(value);
      } else if (field instanceof HTMLInputElement && field.type === "radio") {
        const radios = form.querySelectorAll<HTMLInputElement>(`input[name="${key}"]`);
        for (const radio of radios) {
          radio.checked = radio.value === String(value);
        }
      } else if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) {
        field.value = String(value);
      }

      // Dispatch events so frameworks (React, Vue) pick up the change
      (field as HTMLElement).dispatchEvent(new Event("input", { bubbles: true }));
      (field as HTMLElement).dispatchEvent(new Event("change", { bubbles: true }));
    }

    // Step 2: If no auto-submit, stop here
    if (!autoSubmit) {
      return "Form fields populated. Waiting for user to review and submit.";
    }

    // Step 3: Auto-submit — dispatch submit event with agent flag
    let resultPromise: Promise<string> | null = null;

    const submitEvent = new Event("submit", { bubbles: true, cancelable: true }) as any;
    submitEvent.agentInvoked = true;
    submitEvent.respondWith = (promise: Promise<string>) => {
      resultPromise = promise;
    };

    form.dispatchEvent(submitEvent);

    // Step 4: Resolve the result
    if (resultPromise) {
      return await resultPromise;
    }

    const attrResult = form.getAttribute("flunkie-result");
    if (attrResult) {
      form.removeAttribute("flunkie-result");
      return attrResult;
    }

    return "Form submitted successfully";
  };
}

export class FormScanner {
  private root: Document | ShadowRoot;
  private observer: MutationObserver | null = null;
  private scanTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(root?: Document | ShadowRoot) {
    this.root = root || document;
  }

  scan(): void {
    const forms = this.root.querySelectorAll<HTMLFormElement>("form[flunkie-tool-name]:not([flunkie-scanned])");

    for (const form of forms) {
      const name = form.getAttribute("flunkie-tool-name");
      if (!name) continue;

      const description = form.getAttribute("flunkie-tool-description") || "";
      const inputSchema = buildSchemaFromForm(form);
      const execute = createFormToolExecute(form);

      toolRegistry.register({ name, description, inputSchema, execute });
      form.setAttribute("flunkie-scanned", "");
    }
  }

  observe(): void {
    if (this.observer) return;

    this.observer = new MutationObserver(() => {
      // Debounce — batch rapid DOM changes into one scan
      if (this.scanTimeout) clearTimeout(this.scanTimeout);
      this.scanTimeout = setTimeout(() => this.scan(), 100);
    });

    this.observer.observe(this.root === document ? document.body : this.root, {
      childList: true,
      subtree: true,
    });
  }

  disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
      this.scanTimeout = null;
    }
  }
}
