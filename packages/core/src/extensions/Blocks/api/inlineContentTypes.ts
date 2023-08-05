export type Styles = {
  task?: boolean;
  checkbox?: boolean;
  bold?: boolean;
  italic?: boolean;
  strikethrough?: boolean;
  inlineImage?: boolean;
  inlineFile?: boolean;
  code?: boolean;
  textColor?: string;
  backgroundColor?: string;
  highlighted?: boolean;
  underlined?: boolean;
  hashtag?: boolean;
  wikilink?: boolean;
  datelink?: boolean;
};

export type ContentAttributes = {
  src?: string;
  href?: string;
};

export type ToggledStyle = {
  [K in keyof Styles]-?: Required<Styles>[K] extends boolean ? K : never;
}[keyof Styles];

export type ColorStyle = {
  [K in keyof Styles]-?: Required<Styles>[K] extends string ? K : never;
}[keyof Styles];

export type StyledText = {
  type: "text";
  text: string;
  styles: Styles;
  attrs?: ContentAttributes;
};

export type Link = {
  type: "link";
  href: string;
  content: StyledText[];
};

export type PartialLink = Omit<Link, "content"> & {
  content: string | Link["content"];
};

export type InlineContent = StyledText | Link;
export type PartialInlineContent = StyledText | PartialLink;
