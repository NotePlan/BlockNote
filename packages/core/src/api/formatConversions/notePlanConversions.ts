import {
  Block,
  BlockSchema,
  PartialBlock,
  PropSchema,
  Props,
} from "../../extensions/Blocks/api/blockTypes";
import {
  InlineContent,
  PartialInlineContent,
} from "../../extensions/Blocks/api/inlineContentTypes";
import { DefaultBlockSchema } from "../..";
import Tokenizr from "tokenizr";

// fallback polyfill for window.matchMedia
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

type BlockType = keyof DefaultBlockSchema;

function createBlock(
  type: BlockType,
  innerText: string,
  props?: Props<PropSchema>
): PartialBlock<DefaultBlockSchema> {
  let block: PartialBlock<DefaultBlockSchema> = {
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
  const dateLinkRegex =
    /([>@](today|tomorrow|yesterday|(([0-9]{4})(-((0[1-9]|1[0-2])(-(0[1-9]|1[0-9]|2[0-9]|3[0-1]))?|Q[1-4]|W0[1-9]|W[1-4]\d|W5[0-3]))?)))/;
  const wikilinkRegex = /(\[{2}(.*?)\]{2})/;
  const fileLinkRegex = /!\[(file)\]\(([^()]+)\)/;
  const imageLinkRegex = /!\[(image)\]\(([^()]+)\)/;
  const namedLinkRegex = /\[([^[\]]*)\]\(([^()]+)\)/;
  const linkRegex =
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;
  const doneDateRegex =
    /@done\((([0-9]{4})-(0[1-9]|1[0-2])-(0[1-9]|1[0-9]|2[0-9]|3[0-1]))( ((0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]( ?[aApP][mM])?))?\)/;
  const hashTagRegex =
    /(?!#[\d!"#$%&'()*+,\-./:;<=>?@[\]^_`{|}~]+(\s|$))(#([^!"#$%&'()*+,\-./:;<=>?@[\]^_`{|}~\s]|[-_/])+?\\(.*?\\)|#([^!"#$%&'()*+,\-./:;<=>?@[\]^_`{|}~\s]|[-_/])+)/;
  const atRegex =
    /(?!@[\d!"#$%&'()*+,\-./:;<=>?@[\]^_`{|}~]+(\s|$))(@([^!"#$%&'()*+,\-./:;<=>?@[\]^_`{|}~\s]|[-_/])+?\\(.*?\\)|@([^!"#$%&'()*+,\-./:;<=>?@[\]^_`{|}~\s]|[-_/])+)/;

  let lexer = new Tokenizr();
  // date link
  lexer.rule(dateLinkRegex, (ctx, match) => {
    ctx.accept("date-link", { name: match[1], link: match[2] });
  });
  // wiki link
  lexer.rule(wikilinkRegex, (ctx, match) => {
    ctx.accept("wiki-link", { name: match[1], link: match[2] });
  });
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
  lexer.rule(linkRegex, (ctx, _match) => {
    ctx.accept("link");
  });
  // done date
  lexer.rule(doneDateRegex, (ctx, _match) => {
    ctx.accept("done-date");
  });
  // hash tag
  lexer.rule(hashTagRegex, (ctx, _match) => {
    ctx.accept("hash-tag");
  });
  // at tag
  lexer.rule(atRegex, (ctx, _match) => {
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
  lexer.rule(/==(.*?)==/, (ctx, match) => {
    ctx.accept("highlight", match[1]);
  });
  // plain text
  let plaintext = "";
  lexer.before((ctx, _match, rule) => {
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
        break;
      case "image-link":
        inlineContent.push({
          type: "link",
          href: token.value,
          content: "image",
        });
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
          styles: { hashtag: true },
        });
        break;
      case "at-tag":
        inlineContent.push({
          type: "text",
          text: token.value,
          styles: { hashtag: true },
        });
        break;
      case "wiki-link":
        inlineContent.push({
          type: "text",
          text: token.value.name,
          styles: { wikilink: true },
        });
        break;
      case "date-link":
        inlineContent.push({
          type: "text",
          text: token.value.name,
          styles: { datelink: true },
        });
    }
  });

  return inlineContent;
}

function parseHeader(
  line: string,
  regex: RegExp,
  level: number
): PartialBlock<DefaultBlockSchema> | null {
  let matches = regex.exec(line);

  if (matches == null) {
    return null;
  }

  let substring = line.substring(matches[0].length);
  // let header = createElement(type, substring);
  // header.id = generateHeaderID(substring);
  // TODO use as BlockIdentifier?
  let header = createBlock("heading" as BlockType, substring, {
    level: level.toString(),
  });

  return header;
}

function parseIndentedBlock(
  line: string,
  regex: RegExp,
  type: BlockType
): PartialBlock<DefaultBlockSchema> | null {
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

function parseParagraph(line: string): PartialBlock<DefaultBlockSchema> {
  if (line.length === 0) {
    return createBlock("paragraph" as BlockType, "");
  }

  let matches = /^(\s*)\S*/.exec(line);
  if (matches != null) {
    let leadingWhitespace = matches[1].length;
    if (leadingWhitespace > 1) {
      let level = Math.floor(leadingWhitespace / 2);
      return createBlock(
        "paragraph" as BlockType,
        line.substring(leadingWhitespace),
        {
          level: level.toString(),
        }
      );
    }
  }

  return createBlock("paragraph" as BlockType, line);
}

function parseHeader1(line: string): PartialBlock<DefaultBlockSchema> | null {
  return parseHeader(line, /^#\s+/, 1);
}

function parseHeader2(line: string): PartialBlock<DefaultBlockSchema> | null {
  return parseHeader(line, /^##\s+/, 2);
}

function parseHeader3(line: string): PartialBlock<DefaultBlockSchema> | null {
  return parseHeader(line, /^###\s+/, 3);
}

function parseHeader4(line: string): PartialBlock<DefaultBlockSchema> | null {
  return parseHeader(line, /^#+\s+/, 4);
}

function parseSeparator(line: string): PartialBlock<DefaultBlockSchema> | null {
  return parseIndentedBlock(
    line,
    /^\s*([-*]\s*){3,}$/,
    "separator" as BlockType
  );
}

function parseQuote(line: string): PartialBlock<DefaultBlockSchema> | null {
  return parseIndentedBlock(line, /^(\s*?)>\s+/, "quoteListItem" as BlockType);
}

function parseListWithIcon(
  line: string,
  regex: RegExp,
  type: BlockType,
  props?: Props<PropSchema>
): PartialBlock<DefaultBlockSchema> | null {
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

function parseOrderedList(
  line: string
): PartialBlock<DefaultBlockSchema> | null {
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

  let block = createBlock("numberedListItem" as BlockType, substring, {
    level: level.toString(),
  });
  return block;
}

function parseToDoHyphen(
  line: string
): PartialBlock<DefaultBlockSchema> | null {
  return parseListWithIcon(
    line,
    /^(\s*?)- \[ \]\s+/,
    "taskListItem" as BlockType
  );
}

function parseToDoHyphenCancelled(
  line: string
): PartialBlock<DefaultBlockSchema> | null {
  return parseListWithIcon(
    line,
    /^(\s*?)- \[-\]\s+/,
    "taskListItem" as BlockType,
    {
      cancelled: "true",
    }
  );
}

function parseToDoHyphenComplete(
  line: string
): PartialBlock<DefaultBlockSchema> | null {
  return parseListWithIcon(
    line,
    /^(\s*?)- \[x\]\s+/,
    "taskListItem" as BlockType,
    {
      checked: "true",
    }
  );
}

function parseToDoHyphenScheduled(
  line: string
): PartialBlock<DefaultBlockSchema> | null {
  return parseListWithIcon(
    line,
    /^(\s*?)- \[>\]\s+/,
    "taskListItem" as BlockType,
    {
      scheduled: "true",
    }
  );
}

function parseToDoAsteriskCancelled(
  line: string
): PartialBlock<DefaultBlockSchema> | null {
  return parseListWithIcon(
    line,
    /^(\s*?)\* \[-\]\s+/,
    "taskListItem" as BlockType,
    {
      cancelled: "true",
    }
  );
}

function parseToDoAsteriskComplete(
  line: string
): PartialBlock<DefaultBlockSchema> | null {
  return parseListWithIcon(
    line,
    /^(\s*?)\* \[x\]\s+/,
    "taskListItem" as BlockType,
    {
      checked: "true",
    }
  );
}

function parseToDoAsteriskScheduled(
  line: string
): PartialBlock<DefaultBlockSchema> | null {
  return parseListWithIcon(
    line,
    /^(\s*?)\* \[>\]\s+/,
    "taskListItem" as BlockType,
    {
      scheduled: "true",
    }
  );
}

function parseToDoAsterisk(
  line: string
): PartialBlock<DefaultBlockSchema> | null {
  return parseListWithIcon(
    line,
    /^(\s*?)\*( \[ \])?\s+/,
    "taskListItem" as BlockType
  );
}

function parseChecklistPlusCancelled(
  line: string
): PartialBlock<DefaultBlockSchema> | null {
  return parseListWithIcon(
    line,
    /^(\s*?)\+ \[-\]\s+/,
    "checkListItem" as BlockType,
    {
      cancelled: "true",
    }
  );
}

function parseChecklistPlusComplete(
  line: string
): PartialBlock<DefaultBlockSchema> | null {
  return parseListWithIcon(
    line,
    /^(\s*?)\+ \[x\]\s+/,
    "checkListItem" as BlockType,
    {
      checked: "true",
    }
  );
}

function parseChecklistPlusScheduled(
  line: string
): PartialBlock<DefaultBlockSchema> | null {
  return parseListWithIcon(
    line,
    /^(\s*?)\+ \[>\]\s+/,
    "checkListItem" as BlockType,
    {
      scheduled: "true",
    }
  );
}

function parseChecklistPlus(
  line: string
): PartialBlock<DefaultBlockSchema> | null {
  return parseListWithIcon(
    line,
    /^(\s*?)\+( \[ \])?\s+/,
    "checkListItem" as BlockType
  );
}

function parseUnorderedList(
  line: string
): PartialBlock<DefaultBlockSchema> | null {
  return parseListWithIcon(line, /^(\s*?)-\s+/, "bulletListItem" as BlockType);
}

const parseFunctions = [
  parseHeader1,
  parseHeader2,
  parseHeader3,
  parseHeader4,
  parseQuote,
  parseSeparator,
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

function parseNoteLine(line: string): PartialBlock<DefaultBlockSchema> {
  let parseFunctionsLength = parseFunctions.length;

  for (let i = 0; i < parseFunctionsLength; ++i) {
    //TODO handle lines with separator
    let block = parseFunctions[i](line);

    if (block != null) {
      return block;
    }
  }
  // nothing matched, return a paragraph
  return createBlock("paragraph" as BlockType, line);
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

export function parseNoteToBlocks(
  note: string
): PartialBlock<DefaultBlockSchema>[] {
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
  } else if (prop.cancelled === "true") {
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
  block: Block<DefaultBlockSchema>,
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
  let text = lines.join("\n");
  // if there are more than one line and the last line is empty, remove it
  if (linesLength > 1 && lines[linesLength - 1] === "") {
    text = text.substring(0, text.length - 2);
  }
  return text;
}

export function serializeBlocksToNote(
  blocks: Block<DefaultBlockSchema>[]
): string {
  let text = "";
  let blocksLength = blocks.length;
  for (let i = 0; i < blocksLength; ++i) {
    text += serializeBlock(blocks[i], 0);
  }
  // post process text
  return postProcessNote(text);
}
