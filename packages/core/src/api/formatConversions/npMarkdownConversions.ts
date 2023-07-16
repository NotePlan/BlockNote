import ReactDOM from "react-dom";

const headerIDs = new Set();
var attachmentCount = 0;
var imageCount = 0;
var attachments = [];
const imageExtension = ["png", "jpeg", "jpg", "bmp", "tiff", "ico", "svg"];

const fileLinkRegex = /\!\[(file)\]\(([^\(\)]+)\)/g;
const imageLinkRegex = /\!\[(image)\]\(([^\(\)]+)\)/g;
const namedLinkRegex = /\[([^\[\]]*)\]\(([^\(\)]+)\)/g;
const linkRegex =
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&\/\/=]*)/g;
const boldRegex =
  /(^|\W)(?:(?!\\1)|(?=^))((\*|_)\3)(?=\S)(.*?[^*_])(\3\3)(?!\2)(?=\W|$)/g;
const italicRegex =
  /(^|\W)(?:(?!\\1)|(?=^))((\*|_))(?=\S)(.*?[^*_])(\3)(?!\2)(?=\W|$)/g;
const strikethroughRegex =
  /(^|\W)(?:(?!\\1)|(?=^))((~)\3)(?=\S)(.*?[^*_])(\3\3)(?!\2)(?=\W|$)/g;
const highlightRegex =
  /(^|\W)(?:(?!\\1)|(?=^))((:)\3)(?=\S)(.*?[^*_])(\3\3)(?!\2)(?=\W|$)/g;
const codeRegex =
  /(^|\W)(?:(?!\\1)|(?=^))((`))(?=\S)(.*?[^*_])(\3)(?!\2)(?=\W|$)/g;
const doneDateRegex =
  /@done\((([0-9]{4})-(0[1-9]|1[0-2])-(0[1-9]|1[0-9]|2[0-9]|3[0-1]))( ((0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]( ?[aApP][mM])?))?\)/g;
const hashtagRegex =
  /(\s|^|[\\"\'\(\[\{\*\_])(?!#[\d!"#$%&'()*+,\-.\/:;<=>?@[\]^_`{|}~]+(\s|$))(#([^!"#$%&'()*+,\-.\/:;<=>?@[\]^_`{|}~\s]|[\-_\/])+?\\(.*?\\)|#([^!"#$%&'()*+,\-.\/:;<=>?@[\]^_`{|}~\s]|[\-_\/])+)/g;
const atRegex =
  /(\s|^|[\\"\'\(\[\{\*\_])(?!@[\d!"#$%&'()*+,\-.\/:;<=>?@[\]^_`{|}~]+(\s|$))(@([^!"#$%&'()*+,\-.\/:;<=>?@[\]^_`{|}~\s]|[\-_\/])+?\\(.*?\\)|@([^!"#$%&'()*+,\-.\/:;<=>?@[\]^_`{|}~\s]|[\-_\/])+)/g;
const codeFenceOpenRegex = /^```/;
const codeFenceCloseRegex = /^```\s*$/;
const separatorRegex =
  /(?:^|\v)([\-\_]{3,}|\*\*\* |(\-(\h|$)){3,}|\*{5,})(?:$|\v)/g;

window.matchMedia =
  window.matchMedia ||
  function () {
    return {
      matches: false,
      addListener: function () {},
      removeListener: function () {},
      addEventListener: function () {},
      removeEventListener: function () {},
    };
  };

function generateHeaderID(text) {
  let id = text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");

  let count = 0;

  while (true) {
    if (!headerIDs.has(id)) {
      return id;
    }

    count += 1;
    id = id + count.toString();
  }
}

function shouldIgnore(ignoreRanges, offset) {
  let length = ignoreRanges.length;

  for (let i = 0; i < length; i++) {
    let range = ignoreRanges[i];

    if (offset >= range[0] && offset <= range[1]) {
      return true;
    }
  }

  return false;
}

function fileLinkReplacer(ignoreRanges, isImageRegex) {
  // If we find an attachment, be in an image or file, we donwload it from CloudKit, then display it. That's the only way.
  // It would be better if we can simply link file attachments, but we get an odd downloadURL from Apple, which downloads the
  // file when clicking on it with a weird filename.
  return function (match, title, url, offset) {
    let currentAttachmentCount = isImageRegex ? attachmentCount : imageCount;

    // Get the downloadURL from the asset object from CloudKit
    if (!attachments || !attachments[currentAttachmentCount]) {
      return "N/A";
    }

    // Extract the extension (so we can check if its an image) and the filename.

    let split = url.split(".");
    let ext = split[split.length - 1];
    let isImage = true;

    split = url.split("/");
    let filename = split[split.length - 1];

    if (ext) {
      isImage = imageExtension.includes(ext);
    }

    let downloadUrl = attachments[currentAttachmentCount].downloadURL;

    let f = fetch(downloadUrl)
      .then((response) => {
        return response.blob();
      })
      .then((blob) => {
        // Create an URL to the blob, which can be opened by the browser (PDF) or displayed (image)
        const url = window.URL.createObjectURL(
          new Blob([blob], { type: "application/" + ext })
        );

        // Find the placeholder which we are showing before the file is downloaded.
        const item = document.getElementById(
          "attachment-" + currentAttachmentCount
        );

        // Either set the image source or link up the attachment.
        if (isImage) {
          item.src = url;
        } else {
          item.href = url;
          item.className = "note-attachment"; // Indicate the attachment is clickable now
          if (ext != "pdf") {
            // If it's a PDF we can open it directly, no need to download
            item.download = filename;
          }
        }

        // Hide the loading indicator
        document
          .getElementById("attachment-loading-" + currentAttachmentCount)
          ?.remove();
      });

    // Create the placeholder html object while we load the attachments
    let placeholderId = "attachment-" + currentAttachmentCount;
    let placeholderLoadingId = "attachment-loading-" + currentAttachmentCount;
    let replace = isImage
      ? "<div><div id='" +
        placeholderLoadingId +
        "' class='inline-loader'></div><img class='note-image' id='" +
        placeholderId +
        "'/></div>"
      : "<div class='attachment-container'><div id='" +
        placeholderLoadingId +
        "' class='inline-loader'></div><a target='_blank' class='note-attachment-disabled' id='" +
        placeholderId +
        "'><i class='far fa-paperclip'></i><span class='attachment-name'>" +
        filename +
        "</span></a></div>";

    ignoreRanges.push([offset, offset + replace.length]);

    // Attachment counter to walk through the assets array
    if (isImageRegex) {
      attachmentCount += 1;
    } else {
      imageCount += 1;
    }

    return replace;
  };
}

function separatorReplacer(ignoreRanges) {
  return function (match, offset) {
    if (shouldIgnore(ignoreRanges, offset)) {
      return match;
    }

    let replace = "<hr/>";
    ignoreRanges.push([offset, offset + replace.length]);
    return replace;
  };
}

function prependHttpsIfNeeded(url) {
  const urlPattern = new RegExp(
    /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/
  );

  if (urlPattern.test(url)) {
    //string is url

    ///clear http && https from string
    url = url.replace("https://", "").replace("http://", "");

    //add https to string
    url = `https://${url}`;
  }

  return url;
}

function namedLinkReplacer(ignoreRanges) {
  return function (match, title, url, offset) {
    var secureUrl = prependHttpsIfNeeded(url);
    let replace =
      "<a target='_blank' href='" +
      secureUrl +
      "' class='named-link'>" +
      title +
      "</a>";

    ignoreRanges.push([offset, offset + replace.length]);
    return replace;
  };
}

function linkReplacer(ignoreRanges) {
  return function (match, g1, g2, offset) {
    if (shouldIgnore(ignoreRanges, offset)) {
      return match;
    }

    let replace =
      "<a target='_blank' href=" +
      match +
      " class='named-link'>" +
      match +
      "</a>";
    ignoreRanges.push([offset, offset + replace.length]);
    return replace;
  };
}

function tagReplacer(ignoreRanges, tag, groupIndecesLeft, groupIndecesInside) {
  return function (match) {
    let offset = arguments[arguments.length - 2];

    if (shouldIgnore(ignoreRanges, offset)) {
      return match;
    }

    let replacementsInside = "";
    groupIndecesInside.forEach(
      (index) => (replacementsInside += arguments[index])
    );

    let replacementsLeft = "";
    groupIndecesLeft.forEach((index) => (replacementsLeft += arguments[index]));

    return (
      replacementsLeft + "<" + tag + ">" + replacementsInside + "</" + tag + ">"
    );
  };
}

function doneDateReplacer(ignoreRanges) {
  return function (match) {
    let offset = arguments[arguments.length - 2];

    if (shouldIgnore(ignoreRanges, offset)) {
      return match;
    }

    return "<span class=done-date>" + match + "</span>";
  };
}

function spanReplacer(
  ignoreRanges,
  styleClass,
  groupIndecesLeft,
  groupIndecesInside
) {
  return function (match) {
    let offset = arguments[arguments.length - 2];

    if (shouldIgnore(ignoreRanges, offset)) {
      return match;
    }

    let replacementsInside = "";
    groupIndecesInside.forEach(
      (index) => (replacementsInside += arguments[index])
    );

    let replacementsLeft = "";
    groupIndecesLeft.forEach((index) => (replacementsLeft += arguments[index]));

    return (
      replacementsLeft +
      "<span class=" +
      styleClass +
      ">" +
      replacementsInside +
      "</span>"
    );
  };
}

function createElement(name: string, innerText: string) {
  let ignoreRanges: any[] = [];
  let text = document.createTextNode(innerText);
  let node = document.createElement(name);

  node.appendChild(text);

  // Parses line by line
  let parsed = node.innerHTML
    .replace(separatorRegex, separatorReplacer(ignoreRanges))
    .replace(boldRegex, tagReplacer(ignoreRanges, "strong", [1], [4]))
    .replace(italicRegex, tagReplacer(ignoreRanges, "em", [1], [4]))
    .replace(strikethroughRegex, tagReplacer(ignoreRanges, "del", [1], [4]))
    .replace(highlightRegex, tagReplacer(ignoreRanges, "mark", [1], [4]))
    .replace(codeRegex, tagReplacer(ignoreRanges, "code", [1], [4]))
    .replace(doneDateRegex, doneDateReplacer(ignoreRanges))
    .replace(hashtagRegex, spanReplacer(ignoreRanges, "hashtag", [1], [3]))
    .replace(atRegex, spanReplacer(ignoreRanges, "at", [1], [3]))
    .replace(imageLinkRegex, fileLinkReplacer(ignoreRanges, true))
    .replace(fileLinkRegex, fileLinkReplacer(ignoreRanges, false))
    .replace(namedLinkRegex, namedLinkReplacer(ignoreRanges))
    .replace(linkRegex, linkReplacer(ignoreRanges));

  node.innerHTML = parsed;
  return node;
}

function parseHeader(line, regex, type) {
  let matches = regex.exec(line);

  if (matches == null) {
    return null;
  }

  let substring = line.substring(matches[0].length);
  let header = createElement(type, substring);
  header.id = generateHeaderID(substring);

  return header;
}

function parseIndentedBlock(line, regex, outterType, innerType) {
  let matches = regex.exec(line);

  if (matches == null) {
    return null;
  }

  let substring = line.substring(matches[0].length);
  let leadingWhitespace = matches[1].length;

  let div = document.createElement(outterType);
  if (leadingWhitespace > 0) {
    div.style.marginLeft = (leadingWhitespace * 36).toString() + "px";
  }

  let node = createElement(innerType, substring);
  div.appendChild(node);
  return div;
}

function parseList(line, regex) {
  let matches = regex.exec(line);

  if (matches == null) {
    return null;
  }

  let substring = line.substring(matches[0].length);
  let leadingWhitespace = matches[1].length;

  let li = createElement("li", substring);
  if (leadingWhitespace > 0) {
    li.style.marginLeft = (leadingWhitespace * 36).toString() + "px";
  }

  return li;
}

function parseParagraph(line) {
  if (line.length === 0) {
    let node = document.createElement("div");
    node.classList.add("empty-line");
    return node;
  }

  return createElement("p", line);
}

function parseHeader1(line) {
  return parseHeader(line, /^#\s+/, "h1");
}

function parseHeader2(line) {
  return parseHeader(line, /^##\s+/, "h2");
}

function parseHeader3(line) {
  return parseHeader(line, /^###\s+/, "h3");
}

function parseHeader4(line) {
  return parseHeader(line, /^#+\s+/, "h4");
}

function parseQuote(line) {
  return parseIndentedBlock(line, /^(\s*?)>\s+/, "div", "blockquote");
}

function parseListWithIcon(line, regex, fontWeight, iconName) {
  let li = parseList(line, regex);

  if (li == null) {
    return null;
  }

  let ul = document.createElement("ul");
  ul.classList.add("fa-ul");

  let span = document.createElement("span");
  span.classList.add("fa-li");

  let icon = document.createElement("i");
  icon.classList.add(fontWeight);
  icon.classList.add(iconName);

  let argc = arguments.length;

  for (let i = 4; i < argc; i++) {
    let name = arguments[i];
    icon.classList.add(name + "-icon");
    li.classList.add(name);
  }

  span.appendChild(icon);
  li.insertBefore(span, li.childNodes[0]);
  ul.appendChild(li);

  return ul;
}

function parseOrderedList(line) {
  let matches = /^(\s*?)(\d+)\.\s+/.exec(line);

  if (matches == null) {
    return null;
  }

  let substring = line.substring(matches[0].length);
  let leadingWhitespace = matches[1].length;

  let li = createElement("li", substring);
  if (leadingWhitespace > 0) {
    li.style.marginLeft = (leadingWhitespace * 36).toString() + "px";
  }

  li.value = matches[2];

  let ul = document.createElement("ol");
  ul.classList.add("ordered-list");
  ul.appendChild(li);

  return ul;
}

function parseToDoHyphen(line) {
  return parseListWithIcon(
    line,
    /^(\s*?)- \[ \]\s+/,
    "far",
    "fa-circle",
    "to-do"
  );
}

function parseToDoHyphenCancelled(line) {
  return parseListWithIcon(
    line,
    /^(\s*?)- \[-\]\s+/,
    "far",
    "fa-times-circle",
    "to-do-cancelled",
    "to-do"
  );
}

function parseToDoHyphenComplete(line) {
  return parseListWithIcon(
    line,
    /^(\s*?)- \[x\]\s+/,
    "far",
    "fa-check-circle",
    "to-do-complete",
    "to-do"
  );
}

function parseToDoHyphenScheduled(line) {
  return parseListWithIcon(
    line,
    /^(\s*?)- \[>\]\s+/,
    "far",
    "fa-clock",
    "to-do-scheduled",
    "to-do"
  );
}

function parseToDoAsteriskCancelled(line) {
  return parseListWithIcon(
    line,
    /^(\s*?)\* \[-\]\s+/,
    "far",
    "fa-times-circle",
    "to-do-cancelled",
    "to-do"
  );
}

function parseToDoAsteriskComplete(line) {
  return parseListWithIcon(
    line,
    /^(\s*?)\* \[x\]\s+/,
    "far",
    "fa-check-circle",
    "to-do-complete",
    "to-do"
  );
}

function parseToDoAsteriskScheduled(line) {
  return parseListWithIcon(
    line,
    /^(\s*?)\* \[>\]\s+/,
    "far",
    "fa-clock",
    "to-do-scheduled",
    "to-do"
  );
}

function parseToDoAsterisk(line) {
  return parseListWithIcon(
    line,
    /^(\s*?)\*( \[ \])?\s+/,
    "far",
    "fa-circle",
    "to-do"
  );
}

function parseChecklistPlusCancelled(line) {
  return parseListWithIcon(
    line,
    /^(\s*?)\+ \[-\]\s+/,
    "far",
    "fa-square-xmark",
    "to-do-cancelled",
    "to-do"
  );
}

function parseChecklistPlusComplete(line) {
  return parseListWithIcon(
    line,
    /^(\s*?)\+ \[x\]\s+/,
    "far",
    "fa-square-check",
    "to-do-complete",
    "to-do"
  );
}

function parseChecklistPlusScheduled(line) {
  return parseListWithIcon(
    line,
    /^(\s*?)\+ \[>\]\s+/,
    "far",
    "fa-clock",
    "to-do-scheduled",
    "to-do"
  );
}

function parseChecklistPlus(line) {
  return parseListWithIcon(
    line,
    /^(\s*?)\+( \[ \])?\s+/,
    "far",
    "fa-square",
    "to-do"
  );
}

function parseUnorderedList(line) {
  return parseListWithIcon(
    line,
    /^(\s*?)-\s+/,
    "fas",
    "fa-circle",
    "unordered-list"
  );
}

const parseFunctions = [
  parseHeader1,
  parseHeader2,
  parseHeader3,
  parseHeader4,
  parseQuote,
  parseToDoHyphen,
  parseToDoHyphenComplete,
  parseToDoHyphenCancelled,
  parseToDoHyphenScheduled,
  parseToDoAsteriskComplete,
  parseToDoAsteriskCancelled,
  parseToDoAsteriskScheduled,
  parseToDoAsterisk,
  parseChecklistPlusComplete,
  parseChecklistPlusCancelled,
  parseChecklistPlusScheduled,
  parseChecklistPlus,
  parseUnorderedList,
  // parseOrderedList,
  parseParagraph,
];

function parseMarkdownLine(line: string) {
  let parseFunctionsLength = parseFunctions.length;

  for (let i = 0; i < parseFunctionsLength; ++i) {
    let node = parseFunctions[i](line);

    if (node != null) {
      return node;
    }
  }
}

function parseTable(markdown: string): string {
  const tableRegex = /\|(.+)\|\n\|( *[-:]+[-| :]*)+\|\n((\|.*\|\n)+)/gm;
  let match;

  while ((match = tableRegex.exec(markdown)) !== null) {
    const rows = match[0].trim().split("\n");
    const headerCells = rows[0]
      .split("|")
      .map((cell) => cell.trim())
      .slice(1, -1);
    const numColumns = headerCells.length;

    let html = "<table><thead><tr>";
    for (const cell of headerCells) {
      html += `<th>${cell}</th>`;
    }
    html += "</tr></thead><tbody>";

    for (let i = 2; i < rows.length; i++) {
      const cells = rows[i]
        .split("|")
        .map((cell) => cell.trim())
        .slice(1, -1);
      if (cells.length !== numColumns) {
        throw new Error(
          `Row ${i} has ${cells.length} cells, expected ${numColumns}`
        );
      }
      html += "<tr>";
      for (const cell of cells) {
        html += `<td>${cell}</td>`;
      }
      html += "</tr>";
    }

    html += "</tbody></table>";
    markdown = markdown.replace(
      match[0],
      "<div class='table-content'>" + html + "</div><br>"
    );
  }

  return markdown;
}

function findCodeFenceClose(lines: string[], start: number) {
  let linesLength = lines.length;

  for (let i = start; i < linesLength; i++) {
    if (codeFenceCloseRegex.test(lines[i])) {
      return i;
    }
  }

  return -1;
}

function createCodeFence(
  lines: string[],
  first: number,
  last: number
): HTMLElement {
  let div = document.createElement("div");
  div.classList.add("code-fence");

  let code = "";
  for (let i = first; i < last; i++) {
    code += lines[i] + "\n";
  }

  // Render the React element into the div
  //   ReactDOM.render(<Highlight>{code}</Highlight>, div);

  return div;
}

export function parseMarkdown(markdown: string): string {
  // Count the images beforehand, because in the attachments array (where the images and files are stored), the images come first, then the other files, so we need to keep track of the index
  imageCount = (markdown.match(imageLinkRegex) || []).length;
  markdown = parseTable(markdown);

  let lines = markdown.split(/\r?\n/);
  let linesCount = lines.length;
  let html = "";

  for (let i = 0; i < linesCount; i++) {
    let line = lines[i];

    if (codeFenceOpenRegex.test(line)) {
      let first = i + 1;
      let last = findCodeFenceClose(lines, first);

      if (last !== -1) {
        let codeFenceNode = createCodeFence(lines, first, last);
        html += codeFenceNode.outerHTML;
        i = last;
        continue;
      }
    }

    // If the line starts with <table>, ignore it
    if (line.startsWith("<div class='table-content'>")) {
      html += line;
      continue;
    }

    html += parseMarkdownLine(lines[i]).outerHTML;
  }

  return html;
}
