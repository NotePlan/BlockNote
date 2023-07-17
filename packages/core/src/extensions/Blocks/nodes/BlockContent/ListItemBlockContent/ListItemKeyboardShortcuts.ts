import { Editor } from "@tiptap/core";
import { getBlockInfoFromPos } from "../../../helpers/getBlockInfoFromPos";

export const handleEnter = (editor: Editor) => {
  const { node, contentType } = getBlockInfoFromPos(
    editor.state.doc,
    editor.state.selection.from
  )!;

  const selectionEmpty =
    editor.state.selection.anchor === editor.state.selection.head;

  if (!contentType.name.endsWith("ListItem") || !selectionEmpty) {
    return false;
  }

  return editor.commands.first(({ state, chain, commands }) => [
    () =>
      // Changes list item block to a text block if the content is empty.
      commands.command(() => {
        if (node.textContent.length === 0) {
          return commands.BNUpdateBlock(state.selection.from, {
            type: "paragraph",
            props: {},
          });
        }

        return false;
      }),

    () =>
      // Splits the current block, moving content inside that's after the cursor to a new block of the same type
      // below.
      commands.command(() => {
        if (node.textContent.length > 0) {
          chain()
            .deleteSelection()
            .BNSplitBlock(state.selection.from, true)
            .run();

          return true;
        }

        return false;
      }),
  ]);
};

export const handleAttribute = (
  editor: Editor,
  attribute: "checked" | "cancelled" | "scheduled"
) => {
  const { from, to } = editor.state.selection;

  // First, find if any node in the range has attribute = false
  let anyUnset = false;
  editor.state.doc.nodesBetween(from, to, (node) => {
    if (node.attrs[attribute] !== undefined && !node.attrs[attribute]) {
      anyUnset = true;
    }
  });

  // Then, set all nodes' attribute based on anyUnset
  editor.state.doc.nodesBetween(from, to, (node, pos) => {
    if (node.attrs[attribute] !== undefined) {
      const newAttributes = {
        ...node.attrs,
        [attribute]: anyUnset, // if any node had attribute = false, all nodes will have it set to true
      };

      if (attribute !== "cancelled") {
        newAttributes.cancelled = false;
      }

      if (attribute !== "scheduled") {
        newAttributes.scheduled = false;
      }

      if (attribute !== "checked") {
        newAttributes.checked = false;
      }

      editor
        .chain()
        .command(({ tr }) => {
          tr.setNodeMarkup(pos, undefined, newAttributes);
          return true;
        })
        .run();
    }
  });

  return true;
};
