import { Mark } from "@tiptap/core";
import { Plugin } from "prosemirror-state";

export interface HashtagOptions {
  HTMLAttributes: Record<string, any>;
  href: string;
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
        default: "test",
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
            const attrs = { hashtag: true, href: match[0] };
            tr.addMark(fromHashtag, toHashtag, markType.create(attrs));
          }

          if (tr.docChanged) {
            // Only return the transaction if the document has changed
            return tr;
          } else {
            return newState.tr;
          }
        },
      }),
    ];
  },
});
