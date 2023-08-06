const getIcon = (
  name: string | number,
  type: string = "solid",
  family: string = ""
) => <i className={`fa-${type} fa-${name} ${family}`}></i>;

const iconsData = {
  task: () => getIcon("circle-check", "regular"),
  checkbox: () => getIcon("square-check", "regular"),
  bold: () => getIcon("bold"),
  italic: () => getIcon("italic"),
  underlined: () => getIcon("underline"),
  strikethrough: () => getIcon("strikethrough"),
  highlighted: () => getIcon("highlighter", "regular", "sharp"),
  hashtag: () => getIcon("hashtag"),
  code: () => getIcon("code-simple"),
  link: () => getIcon("link"),
  getIcon,
  bullet: () => getIcon("circle-small"),
  heading: () => getIcon("heading"),
  numList: () => getIcon("list-ol"),
  left: () => getIcon("align-left"),
  center: () => getIcon("align-center"),
  right: () => getIcon("align-right"),
  justify: () => getIcon("align-justify"),
};
export default iconsData;
