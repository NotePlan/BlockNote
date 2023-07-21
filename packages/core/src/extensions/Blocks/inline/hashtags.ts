import { Mark } from "@tiptap/core";
import { InlineParser } from "./inlineParser";

export interface HashtagOptions {
  HTMLAttributes: Record<string, any>;
  href: string;
}

export const hashtagInputRegex = /(?<=(^|\s))((#|@)[\w-_/]+)/g;

export const Hashtag = Mark.create<HashtagOptions>({
  name: "hashtag",

  parseHTML() {
    return [
      {
        tag: "a",
        getAttrs: (element: HTMLElement | string) => {
          if (typeof element === "string") {
            return false;
          }

          if (element.getAttribute("data-hashtag") === this.name) {
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
        "data-hashtag": this.name,
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
      hashtag: {
        default: false,
        parseHTML: (element) => element.getAttribute("data-hashtag"),
        renderHTML: () => ({
          "data-hashtag": true,
        }),
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      new InlineParser({
        markType: this.type,
        regex: hashtagInputRegex,
        matchIndex: 0,
      }).plugin,
    ];
  },
});
