import { mergeAttributes, Node } from "@tiptap/core";

// WIP: This is work in progress, when we create a table, we need to add this as a cell. Also, rows are still missing.
// See: https://tiptap.dev/api/nodes/table#allow-table-node-selection
// See: https://github.com/ueberdosis/tiptap/blob/main/packages/extension-table-cell/src/table-cell.ts

export interface TableCellOptions {
  HTMLAttributes: Record<string, any>;
}

export const TableCell = Node.create<TableCellOptions>({
  name: "tableCell",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  content: "block+",
  tableRole: "cell",

  isolating: true,

  parseHTML() {
    return [{ tag: "td" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "td",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },
});
