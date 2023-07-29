import { HeadingBlockContent } from "../nodes/BlockContent/HeadingBlockContent/HeadingBlockContent";
import { SeparatorBlockContent } from "../nodes/BlockContent/SeparatorBlockContent/SeparatorBlockContent";
import { BulletListItemBlockContent } from "../nodes/BlockContent/ListItemBlockContent/BulletListItemBlockContent/BulletListItemBlockContent";
import { NumberedListItemBlockContent } from "../nodes/BlockContent/ListItemBlockContent/NumberedListItemBlockContent/NumberedListItemBlockContent";
import { QuotListItemBlockContent } from "../nodes/BlockContent/ListItemBlockContent/QuoteListItemBlockContent/QuoteBlockContent";
import { TaskListItemBlockContent } from "../nodes/BlockContent/ListItemBlockContent/TaskListItemBlockContent/TaskListItemBlockContent";
import { CheckListItemBlockContent } from "../nodes/BlockContent/ListItemBlockContent/TaskListItemBlockContent/CheckListItemBlockContent";
import { ParagraphBlockContent } from "../nodes/BlockContent/ParagraphBlockContent/ParagraphBlockContent";
import { PropSchema, TypesMatch } from "./blockTypes";
import { TableBlockContent } from "../nodes/BlockContent/TableBlockContent/TableBlockContent";

export const defaultProps = {
  backgroundColor: {
    default: "transparent" as const,
  },
  textColor: {
    default: "black" as const, // TODO
  },
  textAlignment: {
    default: "left" as const,
    values: ["left", "center", "right", "justify"] as const,
  },
} satisfies PropSchema;

export type DefaultProps = typeof defaultProps;

const taskAndCheckProps = {
  checked: {
    default: false,
  },
  cancelled: {
    default: false,
  },
  scheduled: {
    default: false,
  },
} satisfies PropSchema;

const tableProps = {
  data: {
    default: "" as const,
  },
} satisfies PropSchema;

const levelProps = {
  level: {
    default: "0" as const,
  },
} satisfies PropSchema;

export const defaultBlockSchema = {
  paragraph: {
    propSchema: {
      ...defaultProps,
      ...levelProps,
    },
    node: ParagraphBlockContent,
  },
  heading: {
    propSchema: {
      ...defaultProps,
      level: { default: "1", values: ["1", "2", "3"] as const },
    },
    node: HeadingBlockContent,
  },
  separator: {
    propSchema: {
      ...defaultProps,
    },
    node: SeparatorBlockContent,
  },
  bulletListItem: {
    propSchema: {
      ...defaultProps,
      ...levelProps,
    },
    node: BulletListItemBlockContent,
  },
  taskListItem: {
    propSchema: {
      ...defaultProps,
      ...levelProps,
      ...taskAndCheckProps,
    },
    node: TaskListItemBlockContent,
  },
  checkListItem: {
    propSchema: {
      ...defaultProps,
      ...taskAndCheckProps,
    },
    node: CheckListItemBlockContent,
  },
  quoteListItem: {
    propSchema: {
      ...defaultProps,
    },
    node: QuotListItemBlockContent,
  },
  numberedListItem: {
    propSchema: {
      ...defaultProps,
    },
    node: NumberedListItemBlockContent,
  },
  tableBlockItem: {
    propSchema: {
      ...defaultProps,
      ...tableProps,
    },
    node: TableBlockContent,
  },
} as const;

export type DefaultBlockSchema = TypesMatch<typeof defaultBlockSchema>;
