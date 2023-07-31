import {
  Mark,
  markInputRule,
  markPasteRule,
  mergeAttributes,
} from "@tiptap/core";

export interface BoldOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    highlighted: {
      /**
       * Set a highlighted mark
       */
      setHighlighted: () => ReturnType;
      /**
       * Toggle a highlighted mark
       */
      toggleHighlighted: () => ReturnType;
      /**
       * Unset a highlighted mark
       */
      unsetHighlighted: () => ReturnType;
    };
  }
}

export const highlightedInputRegex = /(?:^|\s)((?:==)((?:[^=`]+))(?:==))$/;
export const highlightedPasteRegex = /(?:^|\s)((?:==)((?:[^=`]+))(?:==))/g;

export const Highlighted = Mark.create({
  name: "highlighted",

  defaultOptions: {
    HTMLAttributes: {},
  },

  parseHTML() {
    return [{ tag: "mark" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "mark",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },

  addCommands() {
    return {
      setHighlighted:
        () =>
        ({ commands }) => {
          return commands.setMark(this.name);
        },
      toggleHighlighted:
        () =>
        ({ commands }) => {
          return commands.toggleMark(this.name);
        },
      unsetHighlighted:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Shift-M": () => this.editor.commands.toggleHighlighted(),
    };
  },

  addInputRules() {
    return [
      markInputRule({
        find: highlightedInputRegex,
        type: this.type,
      }),
    ];
  },

  addPasteRules() {
    return [
      markPasteRule({
        find: highlightedPasteRegex,
        type: this.type,
      }),
    ];
  },
});
