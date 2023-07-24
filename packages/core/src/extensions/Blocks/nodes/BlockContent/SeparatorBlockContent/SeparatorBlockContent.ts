import { InputRule, mergeAttributes } from "@tiptap/core";
import { createTipTapBlock } from "../../../api/block";
import styles from "../../Block.module.css";

export const SeparatorBlockContent = createTipTapBlock<"separator">({
  name: "separator",
  content: "inline*",
  selectable: true,

  addInputRules() {
    return [
      // Creates a heading of appropriate level when starting with "#", "##", or "###".
      new InputRule({
        find: new RegExp(/^\s*([-*]\s*){3,}$/),
        handler: ({ state, chain, range }) => {
          chain()
            .BNUpdateBlock(state.selection.from, {
              type: this.name,
            })
            // Removes the "#" character(s) used to set the heading.
            .deleteRange({ from: range.from, to: range.to })
            .insertContentAt(range.to + 1, {
              type: "paragraph",
              props: {},
            });
        },
      }),
    ];
  },

  parseHTML() {
    return [
      {
        tag: "hr",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        class: styles.blockContent,
        "data-content-type": this.name,
      }),
      ["hr", { contenteditable: false }, 0],
    ];
  },
});
