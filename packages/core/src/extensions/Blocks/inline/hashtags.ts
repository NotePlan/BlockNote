import { createLinkMark } from "../api/createLinkMark";

export const Hashtag = createLinkMark({
  name: "hashtag",
  regex: /(?<=(^|\s))((#|@)[\w-_/]+)/g,
  dataAttr: "data-hashtag",
  hrefPrefix: undefined,
  attrsMap: {
    hashtag: 0,
    href: 0,
  },
});
