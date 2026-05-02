import type { DetailedHTMLProps, HTMLAttributes } from "react";

type ZephloCustomElement = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "zephlo-fab": ZephloCustomElement;
      "zephlo-chat": ZephloCustomElement;
    }
  }
}

export {};
