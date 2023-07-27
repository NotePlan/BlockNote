import { Mark } from "@tiptap/core";
import { InlineParser } from "./inlineParser";

export interface LinkOptions {
  HTMLAttributes: Record<string, any>;
}

interface LinkMarkOptions {
  name: string;
  regex: RegExp;
  dataAttr: string;
  hrefPrefix: string | undefined;
  attrsMap: { [attr: string]: number };
}

export const createLinkMark = ({
  name,
  regex,
  dataAttr,
  hrefPrefix,
  attrsMap,
}: LinkMarkOptions) =>
  Mark.create<LinkOptions>({
    name,

    parseHTML() {
      return [
        {
          tag: "a",
          getAttrs: (element: HTMLElement | string) => {
            if (typeof element === "string") {
              return false;
            }

            if (element.getAttribute(dataAttr) === this.name) {
              return {
                href: element.getAttribute("href") || null,
              };
            }

            return false;
          },
        },
      ];
    },

    renderHTML({ HTMLAttributes }) {
      return [
        "a",
        {
          ...HTMLAttributes,
          href: "/?" + (hrefPrefix ?? "search") + "=" + HTMLAttributes.href,
          target: "_self",
          [dataAttr]: this.name,
        },
        0,
      ];
    },

    addAttributes() {
      return {
        href: {
          default: null,
          parseHTML: (element) => element.getAttribute("href"),
          renderHTML: (attributes) => ({
            href: attributes.href,
          }),
        },
        [name]: {
          default: false,
          parseHTML: (element) => element.getAttribute(dataAttr),
          renderHTML: () => ({
            [dataAttr]: true,
          }),
        },
      };
    },

    addProseMirrorPlugins() {
      return [
        new InlineParser({
          markType: this.type,
          regex,
          attrsMap: attrsMap,
        }).plugin,
      ];
    },
  });
