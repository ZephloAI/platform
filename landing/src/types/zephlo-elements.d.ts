import type { DetailedHTMLProps, HTMLAttributes } from "react";

type ZephloCustomElement = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "zephlo-fab": ZephloCustomElement;
      "zephlo-chat": ZephloCustomElement;
    }
  }

  // Allow the widget's declarative tool attributes on any element
  // (consumed by the form scanner in the Zephlo widget).
  interface HTMLAttributes<T> {
    "zephlo-tool-name"?: string;
    "zephlo-tool-description"?: string;
    "zephlo-auto-submit"?: boolean | "";
    "zephlo-param-description"?: string;
    "zephlo-result"?: string;
  }
}

export {};
