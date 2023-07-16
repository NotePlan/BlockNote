// import logo from './logo.svg'
import { useState, useEffect } from "react";
import "@blocknote/core/style.css";
import { BlockNoteView, useBlockNote } from "@blocknote/react";
import styles from "./App.module.css";
import { BlockNoteEditor, PartialBlock, BlockSchema } from "@blocknote/core";

type WindowWithProseMirror = Window &
  typeof globalThis & { ProseMirror: any; editor: any };

function App() {
  const [input, setInput] = useState<string>("");
  const [output, setOutput] = useState<string>("");

  const editor: BlockNoteEditor | null = useBlockNote({
    onEditorContentChange: (editor: BlockNoteEditor) => {
      const saveBlocksAsMarkdown = async () => {
        const markdown: string = await editor.blocksToMarkdown(
          editor.topLevelBlocks
        );
        setOutput(markdown);
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
        const blocks: PartialBlock<BlockSchema>[] =
          await editor.markdownToBlocks(input);
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
      <pre>{output}</pre>
    </div>
  );
}

export default App;
