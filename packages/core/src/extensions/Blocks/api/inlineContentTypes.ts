export type Styles = {
  bold?: true;
  italic?: true;
  strikethrough?: true;
  inlineImage?: true;
  inlineFile?: true;
  code?: true;
  textColor?: string;
  backgroundColor?: string;
  highlighted?: true;
  underlined?: true;
  hashtag?: true;
  wikilink?: true;
  datelink?: true;
};

export type ToggledStyle = {
  [K in keyof Styles]-?: Required<Styles>[K] extends true ? K : never;
}[keyof Styles];

export type ColorStyle = {
  [K in keyof Styles]-?: Required<Styles>[K] extends string ? K : never;
}[keyof Styles];

export type StyledText = {
  type: "text";
  text: string;
  styles: Styles;
  attr?: {};
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
