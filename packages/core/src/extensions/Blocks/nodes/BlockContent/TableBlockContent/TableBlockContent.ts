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
            // Removes the "#" character(s) used to set the heading.
            .deleteRange({ from: range.from, to: range.to })
            .insertContentAt(range.to + 1, {
              type: "paragraph",
              props: {},
            });
        },
      }),
    ];
  },

  addKeyboardShortcuts() {
    return {
      ArrowUp: () => handleSelectAboveBelow(this.editor, "above", this.name),
      ArrowDown: () => handleSelectAboveBelow(this.editor, "below", this.name),
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
});
