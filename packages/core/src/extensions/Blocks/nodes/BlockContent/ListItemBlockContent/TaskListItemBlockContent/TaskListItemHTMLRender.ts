import { DOMOutputSpec } from "@tiptap/pm/model";
import styles from "../../../Block.module.css";
import { mergeAttributes } from "@tiptap/core";

export function TaskListItemListHTMLRender(
  name: string,
  HTMLAttributes: any
): DOMOutputSpec {
  return [
    "div",
    { class: styles.blockContent, "data-content-type": name },
    [
      "label",
      [
        "input",
        {
          type: "checkbox",
        },
      ],
      ["span"],
    ],
    [
      "div",
      mergeAttributes(HTMLAttributes, {
        // This has to be here or we can't copy the styles
        class: styles.inlineContent,
      }),
      0,
    ], // This has to be a 'div' here and in parseHTML where we define the tags
  ];
}
