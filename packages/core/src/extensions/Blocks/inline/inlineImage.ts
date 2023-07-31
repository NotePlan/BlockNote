import { Mark } from "@tiptap/core";

export const InlineImage = Mark.create({
  name: "inlineImage",

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (element) => element.getAttribute("src"),
        renderHTML: (attributes) => ({
          src: attributes.src,
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
        tag: "img",
        getAttrs: (element: HTMLElement | string) => {
          if (typeof element === "string") {
            return false;
          }

          if (element.getAttribute("data-inline-image") === this.name) {
            return {
              src: element.getAttribute("src") || null,
            };
          }

          return false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "img",
      {
        ...HTMLAttributes,
        src: HTMLAttributes.src,
        "data-inline-image": this.name,
      },
      0,
    ];
  },
});
