import { createLinkMark } from "../api/createLinkMark";

export const Hashtag = createLinkMark({
  name: "hashtag",
  regex: /(?<=(^|\s))((#|@)[\w-_/]+)/g,
  dataAttr: "data-hashtag",
  hrefPrefix: undefined,
  attrsMap: {
    wikilink: 0,
    href: 0,
  },
});
