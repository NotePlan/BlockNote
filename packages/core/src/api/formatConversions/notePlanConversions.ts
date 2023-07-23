import {
  Block,
  PartialBlock,
  BlockSchema,
  PropSchema,
  Props,
} from "../../extensions/Blocks/api/blockTypes";
import {
  InlineContent,
  PartialInlineContent,
} from "../../extensions/Blocks/api/inlineContentTypes";
import { DefaultBlockSchema } from "../..";
import Tokenizr from "tokenizr";

var attachmentCount = 0;
var imageCount = 0;
var attachments = [];
const imageExtension = ["png", "jpeg", "jpg", "bmp", "tiff", "ico", "svg"];

const codeFenceOpenRegex = /^```/;
const codeFenceCloseRegex = /^```\s*$/;
const separatorRegex =
  /(?:^|\v)([\-\_]{3,}|\*\*\* |(\-(\h|$)){3,}|\*{5,})(?:$|\v)/;

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

function downloadFile(url: string, isImage: boolean): string | null {
  // If we find an attachment, be in an image or file, we donwload it from CloudKit, then display it. That's the only way.
  // It would be better if we can simply link file attachments, but we get an odd downloadURL from Apple, which downloads the
  // file when clicking on it with a weird filename.
  // TODO create image and file block: https://www.blocknotejs.org/docs/block-types#custom-block-types
  let currentAttachmentCount = isImage ? imageCount : attachmentCount;
  // Get the downloadURL from the asset object from CloudKit
  if (!attachments || !attachments[currentAttachmentCount]) {
    return null;
  }

  // Extract the extension (so we can check if its an image) and the filename.
  let split = url.split(".");
  let ext = split[split.length - 1];

  split = url.split("/");
  let filename = split[split.length - 1];

  if (ext) {
    isImage = imageExtension.includes(ext);
  }

  let downloadUrl = attachments[currentAttachmentCount].downloadURL;

  fetch(downloadUrl)
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
        if (ext !== "pdf") {
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

  // Attachment counter to walk through the assets array
  if (isImage) {
    imageCount += 1;
  } else {
    attachmentCount += 1;
  }

  return replace;
}

type BlockType = keyof DefaultBlockSchema;

function createBlock(
  type: BlockType,
  innerText: string,
  props?: Props<PropSchema>
): PartialBlock<BlockSchema> {
  let block: PartialBlock<BlockSchema> = {
    type: type,
    content: [],
    children: [],
  };

  block.content = createInlineContent(innerText);

  if (props) {
    return { ...block, props: props };
  } else {
    return block;
  }
}

function createInlineContent(text: string): PartialInlineContent[] {
  const fileLinkRegex = /\!\[(file)\]\(([^\(\)]+)\)/;
  const imageLinkRegex = /\!\[(image)\]\(([^\(\)]+)\)/;
  const namedLinkRegex = /\[([^\[\]]*)\]\(([^\(\)]+)\)/;
  const linkRegex =
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&\/\/=]*)/;
  const doneDateRegex =
    /@done\((([0-9]{4})-(0[1-9]|1[0-2])-(0[1-9]|1[0-9]|2[0-9]|3[0-1]))( ((0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]( ?[aApP][mM])?))?\)/;
  const hashTagRegex =
    /(?!#[\d!"#$%&'()*+,\-.\/:;<=>?@[\]^_`{|}~]+(\s|$))(#([^!"#$%&'()*+,\-.\/:;<=>?@[\]^_`{|}~\s]|[\-_\/])+?\\(.*?\\)|#([^!"#$%&'()*+,\-.\/:;<=>?@[\]^_`{|}~\s]|[\-_\/])+)/;
  const atRegex =
    /(?!@[\d!"#$%&'()*+,\-.\/:;<=>?@[\]^_`{|}~]+(\s|$))(@([^!"#$%&'()*+,\-.\/:;<=>?@[\]^_`{|}~\s]|[\-_\/])+?\\(.*?\\)|@([^!"#$%&'()*+,\-.\/:;<=>?@[\]^_`{|}~\s]|[\-_\/])+)/;

  let lexer = new Tokenizr();
  // file link
  lexer.rule(fileLinkRegex, (ctx, match) => {
    ctx.accept("file-link", match[2]);
  });
  // image link
  lexer.rule(imageLinkRegex, (ctx, match) => {
    ctx.accept("image-link", match[2]);
  });
  // named link
  lexer.rule(namedLinkRegex, (ctx, match) => {
    ctx.accept("named-link", { name: match[1], link: match[2] });
  });
  // link
  lexer.rule(linkRegex, (ctx, match) => {
    ctx.accept("link");
  });
  // done date
  lexer.rule(doneDateRegex, (ctx, match) => {
    ctx.accept("done-date");
  });
  // hash tag
  lexer.rule(hashTagRegex, (ctx, match) => {
    ctx.accept("hash-tag");
  });
  // at tag
  lexer.rule(atRegex, (ctx, match) => {
    ctx.accept("at-tag");
  });
  // code
  lexer.rule(/`(.*?)`/, (ctx, match) => {
    ctx.accept("code", match[1]);
  });
  // bold
  lexer.rule(/\*\*(.*?)\*\*/, (ctx, match) => {
    ctx.accept("bold", match[1]);
  });
  // bold with underscore
  lexer.rule(/__(.*?)__/, (ctx, match) => {
    ctx.accept("bold", match[1]);
  });
  // italic
  lexer.rule(/\*(.*?)\*/, (ctx, match) => {
    ctx.accept("italic", match[1]);
  });
  // italic with underscore
  lexer.rule(/_(.*?)_/, (ctx, match) => {
    ctx.accept("italic", match[1]);
  });
  // strikethrough
  lexer.rule(/~~(.*?)~~/, (ctx, match) => {
    ctx.accept("strike", match[1]);
  });
  // highlight
  lexer.rule(/::(.*?)::/, (ctx, match) => {
    ctx.accept("highlight", match[1]);
  });
  // plain text
  let plaintext = "";
  lexer.before((ctx, match, rule) => {
    if (rule.name !== "text" && plaintext !== "") {
      ctx.accept("text", plaintext);
      plaintext = "";
    }
  });
  lexer.rule(
    /./,
    (ctx, match) => {
      plaintext += match[0];
      ctx.ignore();
    },
    "text"
  );
  lexer.finish((ctx) => {
    if (plaintext !== "") {
      ctx.accept("text", plaintext);
    }
  });

  lexer.input(text);

  let inlineContent: PartialInlineContent[] = [];
  lexer.tokens().forEach((token) => {
    switch (token.type) {
      case "text":
        inlineContent.push({ type: "text", text: token.value, styles: {} });
        break;
      case "bold":
        inlineContent.push({
          type: "text",
          text: token.value,
          styles: { bold: true },
        });
        break;
      case "italic":
        inlineContent.push({
          type: "text",
          text: token.value,
          styles: { italic: true },
        });
        break;
      case "strike":
        inlineContent.push({
          type: "text",
          text: token.value,
          styles: { strike: true },
        });
        break;
      case "highlight":
        inlineContent.push({
          type: "text",
          text: token.value,
          styles: { backgroundColor: "highlight-color" },
        });
        break;
      case "code":
        inlineContent.push({
          type: "text",
          text: token.value,
          styles: { code: true },
        });
        break;
      case "file-link":
        inlineContent.push({
          type: "link",
          href: token.value,
          content: "file",
        });
        downloadFile(token.value, false);
        break;
      case "image-link":
        inlineContent.push({
          type: "link",
          href: token.value,
          content: "image",
        });
        downloadFile(token.value, true);
        break;
      case "link":
        inlineContent.push({
          type: "link",
          href: token.value,
          content: token.value,
        });
        break;
      case "named-link":
        inlineContent.push({
          type: "link",
          href: token.value.link,
          content: token.value.name,
        });
        break;
      case "done-date":
        inlineContent.push({
          type: "text",
          text: token.value,
          styles: { textColor: "done-color" },
        });
        break;
      case "hash-tag":
        inlineContent.push({
          type: "text",
          text: token.value,
          styles: { textColor: "hashtag-color" },
        });
        break;
      case "at-tag":
        inlineContent.push({
          type: "text",
          text: token.value,
          styles: { textColor: "at-color" },
        });
        break;
    }
  });

  return inlineContent;
}

function parseHeader(
  line: string,
  regex: RegExp,
  level: number
): PartialBlock<BlockSchema> | null {
  let matches = regex.exec(line);

  if (matches == null) {
    return null;
  }

  let substring = line.substring(matches[0].length);
  // let header = createElement(type, substring);
  // header.id = generateHeaderID(substring);
  // TODO use as BlockIdentifier?
  let header = createBlock("heading", substring, { level: level.toString() });

  return header;
}

function parseIndentedBlock(
  line: string,
  regex: RegExp,
  type: BlockType
): PartialBlock<BlockSchema> | null {
  let matches = regex.exec(line);

  if (matches == null) {
    return null;
  }

  let substring = line.substring(matches[0].length);
  let block = createBlock(type, substring);

  // TODO how to handle indeted quote blocks?
  // let leadingWhitespace = matches[1].length;
  // let div = document.createElement(outterType);
  // if (leadingWhitespace > 0) {
  //   div.style.marginLeft = (leadingWhitespace * 36).toString() + "px";
  // }

  return block;
}

function parseParagraph(line: string): PartialBlock<BlockSchema> {
  if (line.length === 0) {
    return createBlock("paragraph", "");
  }

  let matches = /^(\s*)\S*/.exec(line);
  console.log(matches);
  if (matches != null) {
    let leadingWhitespace = matches[1].length;
    if (leadingWhitespace > 1) {
      let level = Math.floor(leadingWhitespace / 2);
      return createBlock("paragraph", line.substring(leadingWhitespace), {
        level: level.toString(),
      });
    }
  }

  return createBlock("paragraph", line);
}

function parseHeader1(line: string): PartialBlock<BlockSchema> | null {
  return parseHeader(line, /^#\s+/, 1);
}

function parseHeader2(line: string): PartialBlock<BlockSchema> | null {
  return parseHeader(line, /^##\s+/, 2);
}

function parseHeader3(line: string): PartialBlock<BlockSchema> | null {
  return parseHeader(line, /^###\s+/, 3);
}

function parseHeader4(line: string): PartialBlock<BlockSchema> | null {
  return parseHeader(line, /^#+\s+/, 4);
}

function parseQuote(line: string): PartialBlock<BlockSchema> | null {
  return parseIndentedBlock(line, /^(\s*?)>\s+/, "quoteListItem");
}

function parseListWithIcon(
  line: string,
  regex: RegExp,
  type: BlockType,
  props?: Props<PropSchema>
): PartialBlock<BlockSchema> | null {
  let matches = regex.exec(line);

  if (matches == null) {
    return null;
  }

  let substring = line.substring(matches[0].length);

  let leadingWhitespace = matches[1].length;
  let level = 0;
  if (leadingWhitespace > 1) {
    level = Math.floor(leadingWhitespace / 2);
  }

  let block = createBlock(type, substring, {
    ...props,
    level: level.toString(),
  });
  return block;
}

function parseOrderedList(line: string): PartialBlock<BlockSchema> | null {
  let matches = /^(\s*?)(\d+)\.\s+/.exec(line);

  if (matches == null) {
    return null;
  }

  let substring = line.substring(matches[0].length);

  let leadingWhitespace = matches[1].length;
  let level = 0;
  if (leadingWhitespace > 1) {
    level = Math.floor(leadingWhitespace / 2);
  }

  let block = createBlock("numberedListItem", substring, {
    level: level.toString(),
  });
  return block;
}

function parseToDoHyphen(line: string): PartialBlock<BlockSchema> | null {
  return parseListWithIcon(line, /^(\s*?)- \[ \]\s+/, "taskListItem");
}

function parseToDoHyphenCancelled(
  line: string
): PartialBlock<BlockSchema> | null {
  return parseListWithIcon(line, /^(\s*?)- \[-\]\s+/, "taskListItem", {
    canceled: "true",
  });
}

function parseToDoHyphenComplete(
  line: string
): PartialBlock<BlockSchema> | null {
  return parseListWithIcon(line, /^(\s*?)- \[x\]\s+/, "taskListItem", {
    checked: "true",
  });
}

function parseToDoHyphenScheduled(
  line: string
): PartialBlock<BlockSchema> | null {
  return parseListWithIcon(line, /^(\s*?)- \[>\]\s+/, "taskListItem", {
    scheduled: "true",
  });
}

function parseToDoAsteriskCancelled(
  line: string
): PartialBlock<BlockSchema> | null {
  return parseListWithIcon(line, /^(\s*?)\* \[-\]\s+/, "taskListItem", {
    canceled: "true",
  });
}

function parseToDoAsteriskComplete(
  line: string
): PartialBlock<BlockSchema> | null {
  return parseListWithIcon(line, /^(\s*?)\* \[x\]\s+/, "taskListItem", {
    checked: "true",
  });
}

function parseToDoAsteriskScheduled(
  line: string
): PartialBlock<BlockSchema> | null {
  return parseListWithIcon(line, /^(\s*?)\* \[>\]\s+/, "taskListItem", {
    scheduled: "true",
  });
}

function parseToDoAsterisk(line: string): PartialBlock<BlockSchema> | null {
  return parseListWithIcon(line, /^(\s*?)\*( \[ \])?\s+/, "taskListItem");
}

function parseChecklistPlusCancelled(
  line: string
): PartialBlock<BlockSchema> | null {
  return parseListWithIcon(line, /^(\s*?)\+ \[-\]\s+/, "checkListItem", {
    canceled: "true",
  });
}

function parseChecklistPlusComplete(
  line: string
): PartialBlock<BlockSchema> | null {
  return parseListWithIcon(line, /^(\s*?)\+ \[x\]\s+/, "checkListItem", {
    checked: "true",
  });
}

function parseChecklistPlusScheduled(
  line: string
): PartialBlock<BlockSchema> | null {
  return parseListWithIcon(line, /^(\s*?)\+ \[>\]\s+/, "checkListItem", {
    scheduled: "true",
  });
}

function parseChecklistPlus(line: string): PartialBlock<BlockSchema> | null {
  return parseListWithIcon(line, /^(\s*?)\+( \[ \])?\s+/, "checkListItem");
}

function parseUnorderedList(line: string): PartialBlock<BlockSchema> | null {
  return parseListWithIcon(line, /^(\s*?)-\s+/, "bulletListItem");
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
  parseOrderedList,
  parseParagraph,
];

function parseNoteLine(line: string): PartialBlock<BlockSchema> {
  let parseFunctionsLength = parseFunctions.length;

  for (let i = 0; i < parseFunctionsLength; ++i) {
    //TODO handle lines with separator
    let block = parseFunctions[i](line);

    if (block != null) {
      return block;
    }
  }
  // nothing matched, return a paragraph
  return createBlock("paragraph", line);
}

// TODO adapt to new block structure
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

function postProcessBlocks(blocks: PartialBlock<BlockSchema>[]): void {
  let blocksLength = blocks.length;
  // go through all blocks and nest blocks with lower level into previous blocks
  for (let i = 1; i < blocksLength; ++i) {
    let currentBlock = blocks[i];
    let previousBlock = blocks[i - 1];

    if (
      [
        "bulletListItem",
        "taskListItem",
        "numberedListItem",
        "checkListItem",
        "paragraph",
      ].includes(currentBlock.type || "") &&
      [
        "bulletListItem",
        "taskListItem",
        "numberedListItem",
        "checkListItem",
        "paragraph",
      ].includes(previousBlock.type || "")
    ) {
      const previousLevel = previousBlock.props?.level || 0;
      const currentLevel = currentBlock.props?.level || 0;
      if (previousBlock.children && currentLevel > previousLevel) {
        previousBlock.children.push(currentBlock);
        blocks.splice(i, 1);
        --blocksLength;
        --i;
      }
      postProcessBlocks(previousBlock.children || []);
    }
  }
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

    // html += parseMarkdownLine(lines[i]).outerHTML;
  }

  return html;
}

export function parseNoteToBlocks(note: string): PartialBlock<BlockSchema>[] {
  let lines = note.split(/\r?\n/);
  const linesCount = lines.length;
  let blocks = [];
  for (let i = 0; i < linesCount; i++) {
    blocks.push(parseNoteLine(lines[i]));
  }
  postProcessBlocks(blocks);
  return blocks;
}

function serializeTaskStates(prop: Props<PropSchema>): string {
  if (prop.checked === "true") {
    return "[x]";
  } else if (prop.canceled === "true") {
    return "[-]";
  } else if (prop.scheduled === "true") {
    return "[>]";
  } else {
    return "[ ]";
  }
}

function serializeBlockContent(content: InlineContent[]): string {
  let text = "";
  let contentLength = content.length;
  for (let i = 0; i < contentLength; ++i) {
    let contentItem = content[i];
    switch (contentItem.type) {
      case "text":
        // serialize styles
        if (contentItem.styles.bold) {
          text += "**" + contentItem.text + "**";
        } else if (contentItem.styles.italic) {
          text += "*" + contentItem.text + "*";
        } else if (contentItem.styles.strike) {
          text += "~~" + contentItem.text + "~~";
        } else if (contentItem.styles.backgroundColor === "highlight-color") {
          text += "::" + contentItem.text + "::";
        } else if (contentItem.styles.code) {
          text += "`" + contentItem.text + "`";
        } else {
          text += contentItem.text;
        }
        break;
      case "link":
        const linkContent = serializeBlockContent(contentItem.content);
        switch (linkContent) {
          case "file":
          case "image":
            text += "![" + linkContent + "](" + contentItem.href + ")";
            break;
          default:
            text += "[" + linkContent + "](" + contentItem.href + ")";
            break;
        }
        break;
    }
  }
  return text;
}

export function serializeBlock(
  block: Block<BlockSchema>,
  depth: number
): string {
  let text = "  ".repeat(depth);
  // serialize block types
  switch (block.type) {
    case "heading":
      text += "#".repeat(parseInt(block.props?.level || "1")) + " ";
      break;
    case "quoteListItem":
      text += "> ";
      break;
    case "bulletListItem":
      text += "- ";
      break;
    case "numberedListItem":
      text += "1. ";
      break;
    case "taskListItem":
      text += "* " + serializeTaskStates(block.props || {}) + " ";
      break;
    case "checkListItem":
      text += "+ " + serializeTaskStates(block.props || {}) + " ";
      break;
    case "paragraph":
      break;
  }

  // serialize content array with InlineContent
  text += serializeBlockContent(block.content);

  // end block with newline
  text += "\n";
  let children = block.children || [];
  let childrenLength = children.length;

  for (let i = 0; i < childrenLength; ++i) {
    text += serializeBlock(children[i], depth + 1);
  }

  return text;
}

function postProcessNote(note: string): string {
  // adjust numbering of numbered list items according to their level
  let lines = note.split(/\r?\n/);
  let linesLength = lines.length;
  let currentNumber = 0;
  let previousLevel = 0;
  for (let i = 0; i < linesLength; ++i) {
    let line = lines[i];
    let matches = /^(\s*?)(\d+)\.\s+(.*)/.exec(line);
    console.log(matches);
    if (matches != null) {
      let leadingWhitespace = matches[1].length;
      let level = 0;
      if (leadingWhitespace > 1) {
        level = Math.floor(leadingWhitespace / 2);
      }
      if (level === previousLevel) {
        currentNumber++;
      } else {
        currentNumber = 1;
      }
      lines[i] = matches[1] + currentNumber.toString() + ". " + matches[3];
      previousLevel = level;
    }
  }
  return lines.join("\n");
}

export function serializeBlocksToNote(blocks: Block<BlockSchema>[]): string {
  let text = "";
  let blocksLength = blocks.length;
  for (let i = 0; i < blocksLength; ++i) {
    text += serializeBlock(blocks[i], 0);
  }
  // post process text
  return postProcessNote(text);
}
