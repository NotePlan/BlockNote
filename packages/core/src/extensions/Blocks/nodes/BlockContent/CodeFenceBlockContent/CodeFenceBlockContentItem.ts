import CodeBlockLowlight, {
  CodeBlockLowlightOptions,
} from "@tiptap/extension-code-block-lowlight";

// export const CodeFenceBlockContent = createTipTapBlock<"codefence">({
//   name: "codefence",
//   content: "inline*",

//   addInputRules() {
//     return [
//       // Creates a code block when starting with "```".
//       new InputRule({
//         find: new RegExp(/^`{3}.*?$/),
//         // handler: ({ state, chain, range }) => {
//         //   chain().deleteRange({ from: range.from, to: range.to }).run();

//         //   this.editor.commands.insertContent({
//         //     type: "codeBlockLowlight",
//         //     content: [
//         //       {
//         //         type: "text",
//         //         text: "var a = b",
//         //       },
//         //     ],
//         //   });

//         //   this.editor.chain().focus().setCodeBlock().run();
//         // },
//         handler: ({ state, chain, range }) => {
//           chain()
//             .BNUpdateBlock(state.selection.from, {
//               type: this.name,
//             })
//             // Removes the "#" character(s) used to set the heading.
//             .deleteRange({ from: range.from, to: range.to })
//             .insertContentAt(range.to + 1, {
//               type: "paragraph",
//               props: {},
//             });
//           // chain()
//           //   .setCodeBlock()
//           //   .deleteRange({ from: range.from, to: range.to })
//           //   .insertContentAt(range.to + 1, {
//           //     type: "paragraph",
//           //     props: {},
//           //   });
//         },
//       }),
//     ];
//   },

//   // addKeyboardShortcuts() {
//   //   return {
//   //     ArrowUp: () => handleSelectAboveBelow(this.editor, "above", this.name),
//   //     ArrowDown: () => handleSelectAboveBelow(this.editor, "below", this.name),
//   //   };
//   // },

//   parseHTML() {
//     return [
//       {
//         tag: "pre",
//       },
//     ];
//   },

//   renderHTML({ HTMLAttributes }) {
//     return [
//       "div",
//       mergeAttributes(HTMLAttributes, {
//         class: styles.blockContent,
//         "data-content-type": this.name,
//       }),
//       [
//         "pre",
//         [
//           "code",
//           mergeAttributes(HTMLAttributes, {
//             class: "hljs",
//           }),
//           0,
//         ],
//       ],
//     ];
//   },
// });

// TODO: When I rename this, don't forget to rename it also in the handleEnter func which is in the shortcuts file
export const CodeBlockLowlightBlockContent =
  CodeBlockLowlight.extend<CodeBlockLowlightOptions>({
    name: "codefence",
    group: "blockContent",

    // renderHTML({ HTMLAttributes }) {
    //   return [
    //     "div",
    //     mergeAttributes(HTMLAttributes, {
    //       class: styles.blockContent,
    //       "data-content-type": this.name,
    //     }),
    //     [
    //       "pre",
    //       [
    //         "code",
    //         mergeAttributes(HTMLAttributes, {
    //           // class: "hljs",
    //         }),
    //         0,
    //       ],
    //     ],
    //   ];
    // },
  });
