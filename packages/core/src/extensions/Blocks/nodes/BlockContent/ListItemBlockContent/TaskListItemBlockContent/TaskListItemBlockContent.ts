import { InputRule, mergeAttributes } from "@tiptap/core";
import { createTipTapBlock } from "../../../../api/block";
import {
  handleEnter,
  handleComplete,
  handleCancel,
} from "../ListItemKeyboardShortcuts";
import styles from "../../../Block.module.css";
import { TaskListItemNodeView } from "./TaskListItemNodeView";
import { TaskListItemHTMLParser } from "./TaskListItemHTMLParser";

export const TaskListItemBlockContent = createTipTapBlock<"taskListItem">({
  name: "taskListItem",
  content: "inline*",

  // This is needed to detect when the user types "*", so it gets converted into a task item.
  addInputRules() {
    return [
      // Creates an unordered list when starting with "*".
      new InputRule({
        find: new RegExp(`^\\*\\s$`),
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
    return TaskListItemHTMLParser(this.name);
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
      ["p", { class: styles.inlineContent }, 0], // This has to be a 'p' here and in parseHTML where we define the tags
    ];
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      return TaskListItemNodeView(node, editor, getPos, this.name);
    };
  },
});
