// import logo from './logo.svg'
import "@blocknote/core/style.css";
import { BlockNoteView, useBlockNote } from "@blocknote/react";
import styles from "./App.module.css";
import { parseNoteToBlocks } from "../../../packages/core/src/api/formatConversions/notePlanConversions";

import { useEffect, useState } from "react";
import { BlockNoteEditor, BlockSchema, PartialBlock } from "@blocknote/core";

type WindowWithProseMirror = Window &
  typeof globalThis & { ProseMirror: any; editor?: any };

function App() {
  const [input, setInput] = useState<string>("");
  const [markdown, setMarkdown] = useState<string>("");
  const [json, setJSON] = useState<string>("");

  const editor: BlockNoteEditor | null = useBlockNote({
    onEditorContentChange: (editor: BlockNoteEditor) => {
      const saveBlocksAsMarkdown = async () => {
        const markdown: string = await editor.blocksToMarkdown(
          editor.topLevelBlocks
        );
        setMarkdown(markdown);
        const json: string = JSON.stringify(editor.topLevelBlocks, null, 2);
        setJSON(json);
      };
      saveBlocksAsMarkdown();
    },
    editorDOMAttributes: {
      class: styles.editor,
      "data-test": "editor",
    },
    theme: "light",
  });

  useEffect(() => {
    if (editor) {
      // Whenever the current Markdown content changes, converts it to an array
      // of PartialBlock objects and replaces the editor's content with them.
      const getBlocks = async () => {
        const blocks: PartialBlock<BlockSchema>[] = parseNoteToBlocks(input);
        console.log(blocks);
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
      <h3>Output</h3>
      <pre>{json}</pre>
      <pre>{markdown}</pre>
    </div>
  );
}

export default App;
