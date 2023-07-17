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

export const handleComplete = (editor: Editor) => {
  const node = editor.state.selection.$from.node();

  console.log(node.attrs);
  if (node) {
    // transaction to toggle checked attribute
    return editor
      .chain()
      .command(({ tr }) => {
        tr.setNodeMarkup(editor.state.selection.$from.before(), undefined, {
          checked: !node.attrs.checked,
          cancelled: false,
          scheduled: false,
        });
        return true;
      })
      .run();
  }
  return false;
};

export const handleCancel = (editor: Editor) => {
  const node = editor.state.selection.$from.node();
  if (node) {
    // transaction to toggle checked attribute
    return editor
      .chain()
      .command(({ tr }) => {
        tr.setNodeMarkup(editor.state.selection.$from.before(), undefined, {
          checked: false,
          cancelled: !node.attrs.cancelled,
          scheduled: false,
        });
        return true;
      })
      .run();
  }
  return false;
};
