// import logo from './logo.svg'
import "@blocknote/core/style.css";
import { BlockNoteView, useBlockNote } from "@blocknote/react";
import styles from "./App.module.css";
import {
  parseNoteToBlocks,
  serializeBlocksToNote,
} from "../../../packages/core/src/api/formatConversions/notePlanConversions";
import { diffChars } from "diff";

import { useEffect, useState } from "react";
import {
  BlockNoteEditor,
  DefaultBlockSchema,
  PartialBlock,
} from "@blocknote/core";

type WindowWithProseMirror = Window &
  typeof globalThis & { ProseMirror: any; editor?: any };

function App() {
  const [input, setInput] = useState<string>("");
  const [markdown, setMarkdown] = useState<string>("");
  const [json, setJSON] = useState<string>("");
  const [diff, setDiff] = useState<string>("");

  const editor: BlockNoteEditor | null = useBlockNote({
    onEditorContentChange: (editor: BlockNoteEditor) => {
      const note = serializeBlocksToNote(editor.topLevelBlocks);
      setMarkdown(note);
      const json: string = JSON.stringify(editor.topLevelBlocks, null, 2);
      setJSON(json);
      if (input !== note) {
        // calculate diff
        const diffResult = diffChars(input, note);
        let diffString = "";
        diffResult.forEach((part) => {
          const color = part.added ? "blue" : part.removed ? "red" : "grey";
          diffString += `<span style="color:${color}">${part.value}</span>`;
        });
        setDiff(diffString);
      }
    },
    editorDOMAttributes: {
      class: styles.editor,
      "data-test": "editor",
    },
    theme: window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light",
  });

  useEffect(() => {
    if (editor) {
      // Whenever the current Markdown content changes, converts it to an array
      // of PartialBlock objects and replaces the editor's content with them.
      const getBlocks = async () => {
        const blocks: PartialBlock<DefaultBlockSchema>[] =
          parseNoteToBlocks(input);
        editor.replaceBlocks(editor.topLevelBlocks, blocks);
      };
      getBlocks();
    }
  }, [editor, input]);

  // Give tests a way to get prosemirror instance
  (window as WindowWithProseMirror).ProseMirror = editor?._tiptapEditor;
  (window as WindowWithProseMirror).editor = editor;

  return (
    <div>
      <h3>Input</h3>
      <textarea
        style={{ width: "100%", height: "200px", margin: "10px auto" }}
        value={input}
        onChange={(event) => setInput(event.target.value)}
      />
      <h3>Editor</h3>
      <BlockNoteView editor={editor} />
      {diff && (
        <div>
          <h3>Diff</h3>
          <pre dangerouslySetInnerHTML={{ __html: diff }} />
        </div>
      )}
      <h3>Output</h3>
      <pre>{markdown}</pre>
      <pre>{json}</pre>
    </div>
  );
}

export default App;
