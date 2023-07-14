import { Editor, InputRule, mergeAttributes } from "@tiptap/core";
import { createTipTapBlock } from "../../../../api/block";
import {
  handleEnter,
  handleComplete,
  handleCancel,
} from "../ListItemKeyboardShortcuts";
import styles from "../../../Block.module.css";

import { NodeView } from "prosemirror-view";
import { Node } from "prosemirror-model";

function addTaskListItemBlockContentView(
  node: Node,
  editor: Editor,
  getPos: (() => number) | boolean
): NodeView {
  const dom = document.createElement("div");
  const checked = node.attrs.checked || false;
  let altKey = false;

  dom.className = "blockContent";
  dom.dataset.contentType = "taskListItem";
  dom.dataset.checked = checked;
  dom.dataset.cancelled = node.attrs.cancelled || false;

  const label = document.createElement("label");
  const input = document.createElement("input");
  const span = document.createElement("span");
  const content = document.createElement("div");

  input.type = "checkbox";
  input.checked = checked;

  content.classList.add(styles.inlineContent);

  input.addEventListener("click", (event) => {
    altKey = event.altKey;
  });

  input.addEventListener("change", (event) => {
    const checked = (event.target as HTMLInputElement).checked;
    if (editor.isEditable && typeof getPos === "function") {
      editor
        .chain()
        .focus(undefined, { scrollIntoView: false })
        .command(({ tr }) => {
          const position = getPos();
          const currentNode = tr.doc.nodeAt(position);
          tr.setNodeMarkup(position, undefined, {
            ...(currentNode === null || currentNode === void 0
              ? void 0
              : currentNode.attrs),
            checked: altKey ? true : checked,
            cancelled: altKey ? true : false,
          });
          return true;
        })
        .run();
    }
    if (!editor.isEditable) {
      // Reset state if onReadOnlyChecked returns false
      input.checked = !input.checked;
    }
  });

  label.appendChild(input);
  label.appendChild(span);
  dom.appendChild(label);
  dom.appendChild(content);

  return {
    dom: dom,
    contentDOM: content,
    update: (updatedNode: Node) => {
      if (updatedNode.type !== node.type) {
        return false;
      }

      dom.dataset.checked = updatedNode.attrs.checked || false;
      dom.dataset.cancelled = updatedNode.attrs.cancelled || false;

      if (updatedNode.attrs.checked) {
        input.setAttribute("checked", "checked");
      } else {
        input.removeAttribute("checked");
      }

      return true;
    },
  };
}

export const TaskListItemBlockContent = createTipTapBlock<"taskListItem">({
  name: "taskListItem",
  content: "inline*",

  // This is needed to detect when the user types "*", so it gets converted into a task item.
  addInputRules() {
    return [
      // Creates an unordered list when starting with "*".
      new InputRule({
        find: new RegExp(`^[*]\\s$`),
        handler: ({ state, chain, range }) => {
          chain()
            .BNUpdateBlock(state.selection.from, {
              type: "taskListItem",
              props: {},
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
      checklist: {
        default: false,
        keepOnSplit: true,
        parseHTML: (element) =>
          element.getAttribute("data-checklist") === "true",
        renderHTML: (attributes) => ({
          "data-checklist": attributes.checklist,
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
        node: "taskListItem",
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

          if (parent.getAttribute("data-content-type") === "taskListItem") {
            return {};
          }

          return false;
        },
        priority: 300,
        node: "taskListItem",
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
      return addTaskListItemBlockContentView(node, editor, getPos);
    };
  },
});
