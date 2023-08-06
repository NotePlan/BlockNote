import { BlockNoteEditor, BlockSchema } from "@blocknote/core";
import { Toolbar } from "../../SharedComponents/Toolbar/components/Toolbar";
import { CreateLinkButton } from "./DefaultButtons/CreateLinkButton";
import { ToggledStyleButton } from "./DefaultButtons/ToggledStyleButton";

export const FormattingToolbar = <BSchema extends BlockSchema>(props: {
  editor: BlockNoteEditor<BSchema>;
}) => {
  return (
    <Toolbar>
      <ToggledStyleButton editor={props.editor} toggledStyle={"bold"} />
      <ToggledStyleButton editor={props.editor} toggledStyle={"italic"} />
      <ToggledStyleButton editor={props.editor} toggledStyle={"underlined"} />
      <ToggledStyleButton editor={props.editor} toggledStyle={"highlighted"} />

      <ToggledStyleButton
        editor={props.editor}
        toggledStyle={"strikethrough"}
      />
      <ToggledStyleButton editor={props.editor} toggledStyle={"code"} />
      <CreateLinkButton editor={props.editor} />
    </Toolbar>
  );
};
