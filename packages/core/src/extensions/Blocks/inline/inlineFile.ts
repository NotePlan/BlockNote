import { Mark } from "@tiptap/core";

export const InlineFile = Mark.create({
  name: "inlineFile",
  selectable: true,

  addAttributes() {
    return {
      href: {
        default: null,
        parseHTML: (element) => element.getAttribute("href"),
        renderHTML: (attributes) => ({
          href: attributes.href,
        }),
      },
    };
  },

  //   addInputRules() {
  //     return [

  //     ];
  //   },

  parseHTML() {
    return [
      {
        tag: "a",
        getAttrs: (element: HTMLElement | string) => {
          if (typeof element === "string") {
            return false;
          }

          if (element.getAttribute("data-content-type") === this.name) {
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
      "div",
      { "data-content-type": this.name },
      [
        "a",
        {
          ...HTMLAttributes,
          href: HTMLAttributes.href,
          target: "_blank",
        },
        ["i", { class: "far fa-paperclip" }],
        ["span", 0],
      ],
    ];
  },
});
