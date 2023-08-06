import {
  BaseSlashMenuItem,
  DefaultBlockSchema,
  defaultSlashMenuItems,
} from "@blocknote/core";
import { formatKeyboardShortcut } from "../utils";
import { ReactSlashMenuItem } from "./ReactSlashMenuItem";
import iconsData from "../FormattingToolbar/components/FontIcons";
const { heading, task, numList, bullet, checkbox, getIcon } = iconsData;

const FullHeadingIcon = ({ order }: { order: number }) => (
  <>
    {heading()}
    {getIcon(order)}
  </>
);
const extraFields: Record<
  string,
  Omit<
    ReactSlashMenuItem<DefaultBlockSchema>,
    keyof BaseSlashMenuItem<DefaultBlockSchema>
  >
> = {
  Task: {
    group: "Basic blocks",
    icon: task(),
    markdownHint: "* task",
    hint: "Used to display a task list",
    shortcut: "",
  },
  Checklist: {
    group: "Basic blocks",
    icon: checkbox(),
    markdownHint: "+ checklist",
    hint: "Used to display a checkbox list",
    shortcut: "",
  },
  "Bullet Point": {
    group: "Basic blocks",
    icon: bullet(),
    markdownHint: "- bullet",
    hint: "Used to display an unordered list",
    shortcut: formatKeyboardShortcut("Mod-Alt-9"),
  },
  "Numbered List": {
    group: "Basic blocks",
    icon: numList(),
    markdownHint: ". number",
    hint: "Used to display a numbered list",
    shortcut: formatKeyboardShortcut("Mod-Alt-7"),
  },
  Heading: {
    group: "Headings",
    icon: <FullHeadingIcon order={1} />,
    markdownHint: "# H1",
    hint: "Used for a top-level heading",
    shortcut: formatKeyboardShortcut("Mod-Alt-1"),
  },
  "Heading 2": {
    group: "Headings",
    icon: <FullHeadingIcon order={2} />,
    markdownHint: "## H2",
    hint: "Used for key sections",
    shortcut: formatKeyboardShortcut("Mod-Alt-2"),
  },
  "Heading 3": {
    group: "Headings",
    icon: <FullHeadingIcon order={3} />,
    markdownHint: "### H3",
    hint: "Used for subsections and group headings",
    shortcut: formatKeyboardShortcut("Mod-Alt-3"),
  },
};

export const defaultReactSlashMenuItems = defaultSlashMenuItems.map(
  (item) =>
    new ReactSlashMenuItem<DefaultBlockSchema>(
      item.name,
      item.execute,
      item.aliases,
      extraFields[item.name].group,
      extraFields[item.name].icon,
      extraFields[item.name].hint,
      extraFields[item.name].shortcut,
      extraFields[item.name].markdownHint
    )
);
