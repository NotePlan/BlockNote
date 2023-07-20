import { InputRule, Mark, markPasteRule } from "@tiptap/core";
import { Plugin } from "prosemirror-state";

export interface HashtagOptions {
  HTMLAttributes: Record<string, any>;
}

export const hashtagInputRegex = /(?<=(^|\s))((#|@)[\w-_/]+)$/;
export const hashtagPasteRegex = /((^|\s)#[\w-_/]+)/g;
export const mentionPasteRegex = /((^|\s)@[\w-_/]+)/g;

export const Hashtag = Mark.create<HashtagOptions>({
  name: "hashtag",

  parseHTML() {
    return [
      {
        tag: "span",
        getAttrs: (element: HTMLElement | string) => {
          if (typeof element === "string") {
            return false;
          }

          if (element.getAttribute("data-hashtag") === this.name) {
            return {};
          }

          return false;
        },
      },
    ];
  },

  renderHTML() {
    return ["span", { "data-hashtag": this.name }, 0];
  },

  addAttributes() {
    return {
      hashtag: {
        default: false,
        parseHTML: (element) => element.getAttribute("data-hashtag"),
        renderHTML: () => ({
          "data-hashtag": true,
        }),
      },
    };
  },

  addInputRules() {
    return [
      new InputRule({
        find: new RegExp(hashtagInputRegex),
        handler: ({ state, match, range }) => {
          const attrs = { hashtag: true };
          const tr = state.tr.insertText(match[0], range.from, range.to);
          state.tr.addMark(range.from, range.to + 1, this.type.create(attrs));
          state.applyTransaction(tr);
        },
      }),
    ];
  },

  addPasteRules() {
    return [
      markPasteRule({
        find: hashtagPasteRegex,
        type: this.type,
      }),
      markPasteRule({
        find: mentionPasteRegex,
        type: this.type,
      }),
    ];
  },

  addProseMirrorPlugins() {
    // this plugin will clear the hashtag mark when a space is typed
    return [
      new Plugin({
        props: {
          handleTextInput: (view, from, to, text) => {
            const { state } = view;
            const { $from } = state.selection;
            const markType = this.type;

            if (
              text === " " &&
              $from.marks().some((mark) => mark.type === markType)
            ) {
              const transaction = state.tr.replaceWith(
                from,
                to,
                state.schema.text(text)
              );
              view.dispatch(transaction);

              return true;
            }

            return false;
          },
        },
      }),
    ];
  },
});
