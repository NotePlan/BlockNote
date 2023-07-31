import { InputRule, mergeAttributes } from "@tiptap/core";

import { createTipTapBlock } from "../../../api/block";
import styles from "../../Block.module.css";
import { handleSelectAboveBelow } from "../ListItemBlockContent/ListItemKeyboardShortcuts";

export const TableBlockContent = createTipTapBlock<"tableBlockItem">({
  name: "tableBlockItem",
  content: "inline*",
  selectable: true,

  addAttributes() {
    return {
      data: {
        default: [
          ["", "", ""],
          ["", "", ""],
          ["", "", ""],
        ],
      },
    };
  },

  addInputRules() {
    return [
      // Creates a table when typing "===".
      new InputRule({
        find: /^(={3,})\s$/,
        handler: ({ state, match, chain, range }) => {
          const matchLength = match[1].length;

          chain()
            .BNUpdateBlock(state.selection.from, {
              type: this.name,
              props: {
                data: Array.from({ length: matchLength }, () =>
                  Array(matchLength).fill("")
                ),
              },
            })
            // Removes the "=== " character(s) used to set the table.
            .deleteRange({ from: range.from, to: range.to })
            .insertContentAt(range.to + 1, {
              type: "paragraph",
              props: {},
            });

          // WIP: We need to create the table instead as a node and then add the table cells individually also as block items
          // Otherwise, we can't get the content of the cells as the user types them into the table into the node
          // To do this, we need to use NoteType.createChecked(null, cells), do this also with rows.
          // See: https://github.com/ueberdosis/tiptap/blob/main/packages/extension-table/src/utilities/createTable.ts

          // Current issue with this: It creates the table node as a child of a paragraph
          //   const node = this.type.createChecked(null);

          //   // Add this node to the documen
          //   const tr = state.tr;
          //   //   tr.deleteRange(range.from, range.to);
          //   tr.insert(range.from, node);
          //   const newState = state.apply(tr);

          //   // Update the editor with the new state.
          //   this.editor.view.updateState(newState);
        },
      }),
    ];
  },

  addKeyboardShortcuts() {
    return {
      ArrowUp: () => handleSelectAboveBelow(this.editor, "above", this.name),
      ArrowDown: () => handleSelectAboveBelow(this.editor, "below", this.name),
      //   Tab: () => {
      //     if (this.editor.commands.goToNextCell()) {
      //       return true
      //     }

      //     if (!this.editor.can().addRowAfter()) {
      //       return false
      //     }

      //     return this.editor.chain().addRowAfter().goToNextCell().run()
      //   },
      //   'Shift-Tab': () => this.editor.commands.goToPreviousCell(),
      //   Backspace: deleteTableWhenAllCellsSelected,
      //   'Mod-Backspace': deleteTableWhenAllCellsSelected,
      //   Delete: deleteTableWhenAllCellsSelected,
      //   'Mod-Delete': deleteTableWhenAllCellsSelected,
    };
  },

  parseHTML() {
    return [
      {
        tag: "table",
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const tableData = node.attrs.data || [[]];
    const tableRows = [];

    // Generate the rows with td elements
    for (let i = 0; i < tableData.length; i++) {
      const cells = tableData[i];
      const tableCells = cells.map((cell: string) => [
        i === 0 ? "th" : "td",
        { contenteditable: true },
        cell,
      ]);
      tableRows.push(["tr", ...tableCells]);
    }

    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        class: styles.blockContent,
        "data-content-type": this.name,
      }),
      ["table", ...tableRows],
    ];
  },

  //    Set the data prop here after the user changes the table
  //    This is another approach that doesn't quite work. We are able to get the data.
  //    But we are not able to find the node to add it:
  //   addProseMirrorPlugins() {
  //     return [
  //       new Plugin({
  //         props: {
  //           handleDOMEvents: {
  //             input(view, event) {
  //               // As the user types into the table cells, get the content
  //               const tableData = [];
  //               const tableRows = view.dom.querySelectorAll("tr");

  //               for (let i = 0; i < tableRows.length; i++) {
  //                 const row = tableRows[i];
  //                 const rowData = [];
  //                 const cells = row.querySelectorAll("td, th");
  //                 for (let j = 0; j < cells.length; j++) {
  //                   const cell = cells[j];
  //                   rowData.push(cell.textContent);
  //                 }
  //                 tableData.push(rowData);
  //               }

  //               // How to access the current node
  //               console.log(view.state.selection.$from.nodeBefore);

  //               //   this.props.attributes.data = tableData;
  //             },
  //           },
  //         },
  //       }),
  //     ];
  //   },
});
