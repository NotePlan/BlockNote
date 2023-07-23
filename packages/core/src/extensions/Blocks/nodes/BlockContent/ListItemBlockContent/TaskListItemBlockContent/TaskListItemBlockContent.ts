import { InputRule } from "@tiptap/core";
import { createTipTapBlock } from "../../../../api/block";
import { handleEnter, handleAttribute } from "../ListItemKeyboardShortcuts";
import { TaskListItemNodeView } from "./TaskListItemNodeView";
import { TaskListItemHTMLParser } from "./TaskListItemHTMLParser";
import { TaskListItemListHTMLRender } from "./TaskListItemHTMLRender";

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
      "Cmd-d": () => handleAttribute(this.editor, "checked"),
      "Cmd-s": () => handleAttribute(this.editor, "cancelled"),
    };
  },

  addAttributes() {
    return {
      checked: {
        default: false,
        parseHTML: (element) => element.getAttribute("data-checked"),
        renderHTML: (attributes) => ({
          "data-checked": attributes.checked,
        }),
      },
      cancelled: {
        default: false,
        keepOnSplit: false,
        parseHTML: (element) => element.getAttribute("data-cancelled"),
        renderHTML: (attributes) => ({
          "data-cancelled": attributes.cancelled,
        }),
      },
      scheduled: {
        default: false,
        keepOnSplit: false,
        parseHTML: (element) => element.getAttribute("data-scheduled"),
        renderHTML: (attributes) => ({
          "data-scheduled": attributes.scheduled,
        }),
      },
    };
  },

  parseHTML() {
    return TaskListItemHTMLParser(this.name);
  },

  renderHTML({ HTMLAttributes }) {
    return TaskListItemListHTMLRender(this.name, HTMLAttributes);
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      return TaskListItemNodeView(node, editor, getPos, this.name);
    };
  },
});
