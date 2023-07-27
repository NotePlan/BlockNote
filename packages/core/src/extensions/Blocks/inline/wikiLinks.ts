import { createLinkMark } from "../api/createLinkMark";

export const WikiLink = createLinkMark({
  name: "wikilink",
  regex: /(\[{2})(.*?)(\]{2})/g,
  dataAttr: "data-wikilink",
  hrefPrefix: "title",
  attrsMap: {
    wikilink: 2,
    href: 2,
  },
});
