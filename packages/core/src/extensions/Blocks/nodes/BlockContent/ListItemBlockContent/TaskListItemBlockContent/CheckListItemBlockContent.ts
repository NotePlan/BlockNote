import { InputRule, mergeAttributes } from "@tiptap/core";
import { createTipTapBlock } from "../../../../api/block";
import {
  handleEnter,
  handleComplete,
  handleCancel,
} from "../ListItemKeyboardShortcuts";
import styles from "../../../Block.module.css";
import { TaskListItemNodeView } from "./TaskListItemNodeView";

export const CheckListItemBlockContent = createTipTapBlock<"checkListItem">({
  name: "checkListItem",
  content: "inline*",

  // This is needed to detect when the user types "*", so it gets converted into a task item.
  addInputRules() {
    return [
      // Creates an unordered list when starting with "*".
      new InputRule({
        find: new RegExp(`^\\+\\s$`),
        handler: ({ state, chain, range }) => {
          chain()
            .BNUpdateBlock(state.selection.from, {
              type: this.name,
              props: {
                checked: "false",
                canceled: "false",
              },
            })
            // Removes the "*" character used to set the list.
            .deleteRange({ from: range.from, to: range.to });
        },
      }),
    ];
  },

  addKeyboardShortcuts() {
    return {
      Enter: () => handleEnter(this.editor),
      "Cmd-d": () => handleComplete(this.editor),
      "Cmd-s": () => handleCancel(this.editor),
    };
  },

  addAttributes() {
    console.log("adding attributes");
    return {
      checked: {
        default: false,
        keepOnSplit: false, // When you hit enter and create a new task in the middle or empty, don't keep the checked attribute
        parseHTML: (element) => element.getAttribute("data-checked") === "true",
        renderHTML: (attributes) => ({
          "data-checked": attributes.checked,
        }),
      },
      cancelled: {
        default: false,
        keepOnSplit: false,
        parseHTML: (element) =>
          element.getAttribute("data-cancelled") === "true",
        renderHTML: (attributes) => ({
          "data-cancelled": attributes.cancelled,
        }),
      },
    };
  },

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
        tag: "p",
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
      [
        "label",
        [
          "input",
          {
            type: "checkbox",
          },
        ],
        ["span"],
      ],
      ["div", { class: styles.inlineContent }, 0],
    ];
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      return TaskListItemNodeView(node, editor, getPos, this.name);
    };
  },
});
