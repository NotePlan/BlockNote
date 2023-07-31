import { ToolbarButton } from "../../../SharedComponents/Toolbar/components/ToolbarButton";
import { formatKeyboardShortcut } from "../../../utils";
import {
  RiBold,
  RiCodeFill,
  RiItalic,
  RiStrikethrough,
  RiUnderline,
  RiHashtag,
  RiLink,
} from "react-icons/ri";
import { BlockNoteEditor, BlockSchema, ToggledStyle } from "@blocknote/core";
import { IconType } from "react-icons";

const shortcuts: Record<ToggledStyle, string> = {
  bold: "Mod+B",
  italic: "Mod+I",
  underlined: "Mod+U",
  strikethrough: "Mod+Shift+X",
  code: "",
  hashtag: "",
  wikilink: "",
  datelink: "",
};

const icons: Record<ToggledStyle, IconType> = {
  bold: RiBold,
  italic: RiItalic,
  underlined: RiUnderline,
  strikethrough: RiStrikethrough,
  highlighted: RiCodeFill,
  code: RiCodeFill,
  hashtag: RiHashtag,
  wikilink: RiLink,
  datelink: RiLink,
};

export const ToggledStyleButton = <BSchema extends BlockSchema>(props: {
  editor: BlockNoteEditor<BSchema>;
  toggledStyle: ToggledStyle;
}) => {
  const toggleStyle = (style: ToggledStyle) => {
    props.editor.focus();
    props.editor.toggleStyles({ [style]: true });
  };

  return (
    <ToolbarButton
      onClick={() => toggleStyle(props.toggledStyle)}
      isSelected={props.toggledStyle in props.editor.getActiveStyles()}
      mainTooltip={
        props.toggledStyle.slice(0, 1).toUpperCase() +
        props.toggledStyle.slice(1)
      }
      secondaryTooltip={formatKeyboardShortcut(shortcuts[props.toggledStyle])}
      icon={icons[props.toggledStyle]}
    />
  );
};
