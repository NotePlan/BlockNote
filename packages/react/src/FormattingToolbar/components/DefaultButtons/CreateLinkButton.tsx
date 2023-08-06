import { useCallback } from "react";
import { BlockNoteEditor, BlockSchema } from "@blocknote/core";
import LinkToolbarButton from "../LinkToolbarButton";
import { formatKeyboardShortcut } from "../../../utils";
import iconsData from "../FontIcons";
const { link } = iconsData;
export const CreateLinkButton = <BSchema extends BlockSchema>(props: {
  editor: BlockNoteEditor<BSchema>;
}) => {
  const setLink = useCallback(
    (url: string, text?: string) => {
      props.editor.focus();
      props.editor.createLink(url, text);
    },
    [props.editor]
  );

  return (
    <LinkToolbarButton
      isSelected={!!props.editor.getSelectedLinkUrl()}
      mainTooltip="Link"
      secondaryTooltip={formatKeyboardShortcut("Mod+K")}
      icon={link}
      hyperlinkIsActive={!!props.editor.getSelectedLinkUrl()}
      activeHyperlinkUrl={props.editor.getSelectedLinkUrl() || ""}
      activeHyperlinkText={props.editor.getSelectedText()}
      setHyperlink={setLink}
    />
  );
};
