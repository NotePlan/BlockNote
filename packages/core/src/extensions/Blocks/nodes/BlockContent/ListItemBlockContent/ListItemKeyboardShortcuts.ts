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

export const handleMove = (editor: Editor, direction: "up" | "down") => {
  const { $anchor, $head } = editor.state.selection;

  // Look for items with this as the parent node
  const parentNode = $head.node(-2);

  const nodes: any[] = [];
  editor.state.doc.nodesBetween(
    $anchor.pos,
    $head.pos,
    (node, _pos, parent) => {
      if (parent !== null && parent.eq(parentNode)) {
        nodes.push(node);
        return false;
      }
      return;
    }
  );

  // Save first and last nodes for setting the cursor later
  const startNode = editor.state.selection.$from.node(-1);
  const endNode = editor.state.selection.$to.node(-1);

  // Save the cursor offset within the taskNode before moving
  const cursorOffsetStart = editor.state.selection.$from.parentOffset;
  const cursorOffsetEnd = editor.state.selection.$to.parentOffset;

  // Get task or check node of the text node and its index
  const nodeIndexStart = editor.state.selection.$from.index(-2);
  const nodeIndexEnd = editor.state.selection.$to.index(-2);

  // Determine the target index based on the direction
  const targetIndex =
    direction === "up" ? nodeIndexStart - 1 : nodeIndexEnd + 2;

  // Ensure movement is possible (not out of bounds)
  const listNode = editor.state.selection.$from.node(-2);
  const isWithinBounds =
    direction === "up"
      ? nodeIndexStart > 0
      : nodeIndexEnd < listNode.childCount - 1;

  if (nodes.length > 0 && isWithinBounds) {
    // Start a transaction
    let tr = editor.state.tr;

    // Delete the range
    const deleteAction = () => {
      tr = tr.deleteRange(
        editor.state.selection.$from.posAtIndex(nodeIndexStart, -2),
        editor.state.selection.$to.posAtIndex(nodeIndexEnd + 1, -2)
      );
    };

    const insertAction = () => {
      // Insert the fragment at the target index
      // Loop through all nodes in nodes
      for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i];

        // Insert each node at the target index
        tr = tr.insert(
          editor.state.selection.$from.posAtIndex(targetIndex, -2),
          node
        );
      }
    };

    if (direction === "up") {
      deleteAction();
      insertAction();
    } else {
      insertAction();
      deleteAction();
    }

    // Apply the transaction
    editor.view.dispatch(tr);

    // Fix the cursor selection or it's always at the end of the node, which is not good if the node has children
    // First find the first and last node in the list to fetch the start and end pos
    let startPos = -1;
    let endPos = -1;
    editor.state.doc.descendants((node, pos) => {
      if (node.attrs.id === startNode.attrs.id) {
        startPos = pos;
      }

      if (node.attrs.id === endNode.attrs.id) {
        endPos = pos;
      }
    });

    // Set the cursor selection to the pos
    if (startPos > -1 && endPos > -1) {
      editor
        .chain()
        .setTextSelection({
          from: startPos + cursorOffsetStart + 2,
          to: endPos + cursorOffsetEnd + 2,
        })
        .run();
    }
  }

  return true;
};
