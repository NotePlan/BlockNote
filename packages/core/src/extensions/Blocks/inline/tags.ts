import { InputRule, Mark, markPasteRule } from "@tiptap/core";
import { Plugin } from "prosemirror-state";

export interface HashtagOptions {
  HTMLAttributes: Record<string, any>;
}
// export const hashtagInputRegex = /(?<=(^|\s))((#|@)[\w-_/]+)$/;

export const hashtagInputRegex = /(?<=(^|\s))((#|@)[\w-_/]+)/g;
export const hashtagPasteRegex = /(?:^|\s)(#[\w-_/]+)/g;
export const mentionPasteRegex = /(?:^|\s)(@[\w-_/]+)/g;

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

  //   addInputRules() {
  //     return [
  //       new InputRule({
  //         find: new RegExp(hashtagInputRegex),
  //         handler: ({ state, match, range }) => {
  //           const attrs = { hashtag: true };
  //           const tr = state.tr.insertText(match[0], range.from, range.to);
  //           state.tr.addMark(range.from, range.to + 1, this.type.create(attrs));
  //           state.applyTransaction(tr);
  //         },
  //       }),
  //     ];
  //   },

  //   addPasteRules() {
  //     return [
  //       markPasteRule({
  //         find: hashtagPasteRegex,
  //         type: this.type,
  //       }),
  //       markPasteRule({
  //         find: mentionPasteRegex,
  //         type: this.type,
  //       }),
  //     ];
  //   },

  addProseMirrorPlugins() {
    // this plugin will clear the hashtag mark when a space is typed
    // and also detect valid mentions and hashtags that become valid due to space insertion
    return [
      new Plugin({
        props: {},
        appendTransaction: (_transactions, _oldState, newState) => {
          const state = newState;
          const markType = this.type;
          const { tr } = state;

          // Start of line position
          const lineStart = state.doc
            .resolve(state.selection.$from.pos)
            .start(-1);
          // End of line position
          const lineEnd = state.doc.resolve(state.selection.$from.pos).end(-1);

          // Remove all hashtag marks in the line
          tr.removeMark(lineStart, lineEnd, markType);

          // Scan the whole line for valid mentions or hashtags
          const lineText = state.doc.textBetween(lineStart, lineEnd, "\n");

          let match;
          while ((match = hashtagInputRegex.exec(lineText)) !== null) {
            // If there is a valid mention or hashtag, add the mark
            const fromHashtag = lineStart + match.index + 1;
            const toHashtag = fromHashtag + match[0].length;
            const attrs = { hashtag: true };
            tr.addMark(fromHashtag, toHashtag, markType.create(attrs));
          }

          return tr;
        },
      }),
    ];
  },
});
