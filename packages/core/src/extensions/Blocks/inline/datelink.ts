import { createLinkMark } from "../api/createLinkMark";

export const DateLink = createLinkMark({
  name: "datelink",
  regex:
    /[>@](today|tomorrow|yesterday|(([0-9]{4})(-((0[1-9]|1[0-2])(-(0[1-9]|1[0-9]|2[0-9]|3[0-1]))?|Q[1-4]|W0[1-9]|W[1-4]\d|W5[0-3]))?))/g,
  dataAttr: "data-datelink",
  hrefPrefix: "date",
  attrsMap: {
    datelink: 0,
    href: 1,
  },
});
