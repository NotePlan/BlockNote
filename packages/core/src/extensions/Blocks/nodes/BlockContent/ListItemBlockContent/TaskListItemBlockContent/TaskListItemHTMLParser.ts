export function TaskListItemHTMLParser(name: string) {
  return [
    // Case for regular HTML list structure.
    {
      tag: "li",
      getAttrs: (element: HTMLElement | string) => {
        if (typeof element === "string") {
          return false;
        }

        const parent = element.parentElement;

        if (parent === null) {
          return false;
        }

        if (parent.tagName === "UL") {
          return {};
        }

        return false;
      },
      node: name,
    },
    // Case for BlockNote list structure.
    {
      tag: "p",
      getAttrs: (element: HTMLElement | string) => {
        if (typeof element === "string") {
          return false;
        }

        const parent = element.parentElement;

        if (parent === null) {
          return false;
        }

        if (parent.getAttribute("data-content-type") === name) {
          return {};
        }

        return false;
      },
      priority: 300,
      node: name,
    },
  ];
}
