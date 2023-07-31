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
    strikethrough: {
      /**
       * Set a strikethrough mark
       */
      setStrikethrough: () => ReturnType;
      /**
       * Toggle a strikethrough mark
       */
      toggleStrikethrough: () => ReturnType;
      /**
       * Unset a strikethrough mark
       */
      unsetStrikethrough: () => ReturnType;
    };
  }
}

export const strikethroughInputRegex = /(?:^|\s)((?:~~)((?:[^~`]+))(?:~~))$/;
export const strikethroughPasteRegex = /(?:^|\s)((?:~~)((?:[^~`]+))(?:~~))/g;

export const Strikethrough = Mark.create({
  name: "strikethrough",

  defaultOptions: {
    HTMLAttributes: {},
  },

  parseHTML() {
    return [{ tag: "del" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "del",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },

  addCommands() {
    return {
      setStrikethrough:
        () =>
        ({ commands }) => {
          return commands.setMark(this.name);
        },
      toggleStrikethrough:
        () =>
        ({ commands }) => {
          return commands.toggleMark(this.name);
        },
      unsetStrikethrough:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Shift-S": () => this.editor.commands.toggleStrikethrough(),
    };
  },

  addInputRules() {
    return [
      markInputRule({
        find: strikethroughInputRegex,
        type: this.type,
      }),
    ];
  },

  addPasteRules() {
    return [
      markPasteRule({
        find: strikethroughPasteRegex,
        type: this.type,
      }),
    ];
  },
});
