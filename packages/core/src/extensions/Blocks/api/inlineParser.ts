import { EditorState, Plugin } from "prosemirror-state";
import { MarkType } from "@tiptap/pm/model";
import { Node } from "prosemirror-model";

// Define the mark options which include the MarkType and regex to be used for parsing the content.
interface MarkOptions {
  markType: MarkType;
  regex: RegExp;
  attrsMap: { [attr: string]: number };
}

// Class to manage the key of a Mark.
class MarkKey {
  constructor(
    public from: number,
    public to: number,
    public attrs: { [attr: string]: string | Boolean }
  ) {}

  // Convert the MarkKey instance into a string representation.
  toString() {
    return JSON.stringify(this);
  }
}

// Main class for the inline parser.
export class InlineParser {
  private markType: MarkType;
  private regex: RegExp;
  private attrsMap: { [attr: string]: number };

  constructor({ markType, regex, attrsMap }: MarkOptions) {
    this.markType = markType;
    this.regex = regex;
    this.attrsMap = attrsMap;
  }

  // Extract the existing marks within the given range.
  private extractExistingMarks(
    state: EditorState,
    lineStart: number,
    lineEnd: number
  ): Map<string, MarkKey> {
    let existingMarks = new Map<string, MarkKey>();

    // Traverse the nodes within the line.
    state.doc.nodesBetween(lineStart, lineEnd, (node: Node, pos: number) => {
      // If the node has the markType, create a MarkKey and add it to the map.
      node.marks.forEach((mark) => {
        if (mark.type === this.markType) {
          const key = new MarkKey(pos, pos + node.nodeSize, mark.attrs);
          existingMarks.set(key.toString(), key);
        }
      });
    });

    return existingMarks;
  }

  // Extract the new marks from the content using regex.
  private extractNewMarks(
    state: EditorState,
    lineStart: number,
    lineEnd: number
  ): Map<string, MarkKey> {
    const lineText = state.doc.textBetween(lineStart, lineEnd, "\n");
    let newMarks = new Map<string, MarkKey>();

    // Use the regex to find the new marks.
    let match;
    while ((match = this.regex.exec(lineText)) !== null) {
      let attrs: { [key: string]: string | Boolean } = {};

      for (const [attrKey, groupIndex] of Object.entries(this.attrsMap)) {
        if (match[groupIndex] !== undefined) {
          attrs[attrKey] = match[groupIndex];

          const from =
            lineStart + match.index + match[0].indexOf(match[groupIndex]);
          const to = from + match[groupIndex].length;

          const key = new MarkKey(from + 1, to + 1, attrs);
          newMarks.set(key.toString(), key);
        }
      }
    }

    return newMarks;
  }

  // Generate a ProseMirror Plugin for handling the marks.
  get plugin() {
    // Helper function to ensure lineStart and lineEnd are within bounds of document
    const validateBounds = (
      lineStart: number,
      lineEnd: number,
      docSize: number
    ) => {
      return !(lineStart >= docSize || lineEnd > docSize);
    };

    // Helper function to handle mark changes
    const handleMarkChanges = (
      tr: any,
      existingMarks: Map<string, MarkKey>,
      newMarks: Map<string, MarkKey>
    ) => {
      // Remove marks that no longer exist
      for (let [key, markKey] of existingMarks) {
        if (!newMarks.has(key)) {
          tr = tr.removeMark(markKey.from, markKey.to, this.markType);
        }
      }

      // Add new marks
      for (let [key, markKey] of newMarks) {
        if (!existingMarks.has(key)) {
          tr = tr.addMark(
            markKey.from,
            markKey.to,
            this.markType.create(markKey.attrs)
          );
        }
      }
      return tr;
    };

    return new Plugin({
      props: {},
      appendTransaction: (_transactions, oldState, newState) => {
        // Start and end of line positions
        const lineStart = newState.doc
          .resolve(newState.selection.$from.pos)
          .start(-1);
        const lineEnd = newState.doc
          .resolve(newState.selection.$from.pos)
          .end(-1);

        // If lineStart and lineEnd are not within the bounds of the oldState document, return early
        if (!validateBounds(lineStart, lineEnd, oldState.doc.content.size)) {
          return null;
        }

        // Get the old and new line text
        const oldLineText = oldState.doc.textBetween(lineStart, lineEnd, "\n");
        const newLineText = newState.doc.textBetween(lineStart, lineEnd, "\n");

        // If the line text has not changed, return early
        if (oldLineText === newLineText) {
          return null;
        }

        // Get the existing and new marks.
        let existingMarks = this.extractExistingMarks(
          newState,
          lineStart,
          lineEnd
        );
        let newMarks = this.extractNewMarks(newState, lineStart, lineEnd);

        // Handle mark changes
        let tr = handleMarkChanges(newState.tr, existingMarks, newMarks);

        // Only return the transaction if the document has changed to avoid an infinite loop
        if (tr.docChanged) {
          return tr;
        } else {
          return null;
        }
      },
    });
  }
}
