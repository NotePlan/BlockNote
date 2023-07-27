import { Mark } from "@tiptap/core";
import { InlineParser } from "./inlineParser";

export interface WikiLinkOptions {
  HTMLAttributes: Record<string, any>;
  href: string;
}

export const wikiLinkRegex = /(\[{2})(.*?)(\]{2})/g;

export const WikiLink = Mark.create<WikiLinkOptions>({
  name: "wikilink",

  parseHTML() {
    return [
      {
        tag: "a",
        getAttrs: (element: HTMLElement | string) => {
          if (typeof element === "string") {
            return false;
          }

          if (element.getAttribute("data-wikilink") === this.name) {
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
        href: "/?search=" + HTMLAttributes.href,
        target: "_self",
        "data-wikilink": true,
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
      wikilink: {
        default: false,
        parseHTML: (element) => element.getAttribute("data-wikilink"),
        renderHTML: () => ({
          "data-wikilink": true,
        }),
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      new InlineParser({
        markType: this.type,
        regex: wikiLinkRegex,
        matchIndex: 2,
      }).plugin,
    ];
  },
});
