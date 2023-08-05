import { ToolbarButton } from "../../../SharedComponents/Toolbar/components/ToolbarButton";
import { formatKeyboardShortcut } from "../../../utils";
import { BlockNoteEditor, BlockSchema, ToggledStyle } from "@blocknote/core";
import { IconType } from "react-icons";
import iconsData from "../FontIcons";
const {
  bold,
  link,
  italic,
  underlined,
  strikethrough,
  highlighted,
  code,
  hashtag,
  task,
  checkbox,
} = iconsData;

const shortcuts: Record<ToggledStyle, string> = {
  task: "",
  checkbox: "",
  bold: "Mod+B",
  italic: "Mod+I",
  underlined: "Mod+U",
  strikethrough: "Mod+Shift+X",
  highlighted: "Mod+Shift+H",
  code: "",
  hashtag: "",
  wikilink: "",
  datelink: "",
  inlineFile: "",
  inlineImage: "",
};

const icons: Record<ToggledStyle, IconType> = {
  task,
  checkbox,
  bold,
  italic,
  underlined,
  strikethrough,
  highlighted,
  code,
  hashtag,
  wikilink: link,
  datelink: link,
  inlineFile: link,
  inlineImage: link,
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
