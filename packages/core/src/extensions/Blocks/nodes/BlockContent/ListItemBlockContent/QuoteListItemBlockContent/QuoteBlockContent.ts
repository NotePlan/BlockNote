import { InputRule, mergeAttributes } from "@tiptap/core";
import { createTipTapBlock } from "../../../../api/block";
import { handleEnter } from "../ListItemKeyboardShortcuts";
import styles from "../../../Block.module.css";

export const QuotListItemBlockContent = createTipTapBlock<"quoteListItem">({
  name: "quoteListItem",
  content: "inline*",

  addInputRules() {
    return [
      // Creates an unordered list when starting with ">".
      new InputRule({
        find: new RegExp(`^[>]\\s$`),
        handler: ({ state, chain, range }) => {
          chain()
            .BNUpdateBlock(state.selection.from, {
              type: this.name,
              props: {},
            })
            // Removes the ">" character used to set the list.
            .deleteRange({ from: range.from, to: range.to });
        },
      }),
    ];
  },

  addKeyboardShortcuts() {
    return {
      Enter: () => handleEnter(this.editor),
    };
  },

  // Parsed into tip tap nodes
  parseHTML() {
    return [
      // Case for regular HTML list structure.
      {
        tag: "li",
        getAttrs: (element) => {
          if (typeof element === "string") {
            return false;
          }

          const parent = element.parentElement;

          if (parent === null) {
            return false;
          }

          if (parent.tagName === "UL") {
            return {};
          }

          return false;
        },
        node: this.name,
      },
      // Case for BlockNote list structure.
      {
        tag: "p", // This has to overlap with what is defined in the BlockContent node (the node type, here p)
        getAttrs: (element) => {
          if (typeof element === "string") {
            return false;
          }

          const parent = element.parentElement;

          if (parent === null) {
            return false;
          }

          if (parent.getAttribute("data-content-type") === this.name) {
            return {};
          }

          return false;
        },
        priority: 300,
        node: this.name,
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
      ["p", { class: styles.inlineContent }, 0], // This p has to overlap with the tags in parseHTML
    ];
  },
});
