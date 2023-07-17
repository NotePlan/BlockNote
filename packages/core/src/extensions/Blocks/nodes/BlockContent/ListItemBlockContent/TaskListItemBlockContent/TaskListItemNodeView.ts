import { Editor } from "@tiptap/core";
import styles from "../../../Block.module.css";

import { NodeView } from "prosemirror-view";
import { Node } from "prosemirror-model";

export function TaskListItemNodeView(
  node: Node,
  editor: Editor,
  getPos: (() => number) | boolean,
  type: string
): NodeView {
  const dom = document.createElement("div");
  const checked = node.attrs.checked || false;
  let altKey = false;

  dom.className = "blockContent";
  dom.dataset.contentType = type;
  dom.dataset.checked = checked;
  dom.dataset.cancelled = node.attrs.cancelled || false;
  dom.dataset.scheduled = node.attrs.scheduled || false;

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
            scheduled: false,
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
      dom.dataset.scheduled = updatedNode.attrs.scheduled || false;

      if (updatedNode.attrs.checked) {
        input.setAttribute("checked", "checked");
      } else {
        input.removeAttribute("checked");
      }

      return true;
    },
  };
}
