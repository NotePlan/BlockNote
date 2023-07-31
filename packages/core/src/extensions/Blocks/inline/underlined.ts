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
    underlined: {
      /**
       * Set a underlined mark
       */
      setUnderlined: () => ReturnType;
      /**
       * Toggle a underlined mark
       */
      toggleUnderlined: () => ReturnType;
      /**
       * Unset a underlined mark
       */
      unsetUnderlined: () => ReturnType;
    };
  }
}

export const underlinedInputRegex = /(?:^|\s)((?:~)((?:[^~]+))(?:~))$/;
export const underlinedPasteRegex = /(?:^|\s)((?:~)((?:[^~]+))(?:~))/g;

export const Underlined = Mark.create({
  name: "underlined",

  defaultOptions: {
    HTMLAttributes: {},
  },

  parseHTML() {
    return [{ tag: "u" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "u",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },

  addCommands() {
    return {
      setUnderlined:
        () =>
        ({ commands }) => {
          return commands.setMark(this.name);
        },
      toggleUnderlined:
        () =>
        ({ commands }) => {
          return commands.toggleMark(this.name);
        },
      unsetUnderlined:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-U": () => this.editor.commands.toggleUnderlined(),
    };
  },

  addInputRules() {
    return [
      markInputRule({
        find: underlinedInputRegex,
        type: this.type,
      }),
    ];
  },

  addPasteRules() {
    return [
      markPasteRule({
        find: underlinedPasteRegex,
        type: this.type,
      }),
    ];
  },
});
