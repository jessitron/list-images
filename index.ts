
console.log("GIVE ME YOUR MARKDOWN");

const files = process.argv.filter(s => s.endsWith(".md"));


if (files.length === 0) {
  console.log("USAGE: list-images <name of markdown file...>");
  process.exit(1);
}

console.log("The files are: " + files.join(" "))

import { Remarkable } from "remarkable";
import { stringifyTree } from "stringify-tree";
import * as fs from "fs";
import { promisify } from "util";

const markdownIt = new Remarkable();

const stringContent = promisify(fs.readFile)(files[0], { encoding: "UTF-8" });
stringContent.then(content => {
  const p = markdownIt.parse(content, {});

  const printedTree = stringifyTree<{ children: (typeof p) | null, type: string }>(
    { children: p, type: "top-level" },
    t => t.type, t => (t.children || []))

  console.log(printedTree);

  // not tail-recursive
  function allImageTokens(input: typeof p): typeof p {
    if (!input || input.length === 0) {
      return [];
    };
    const images = input.filter(t => t.type === "image");
    const rest = input.filter(t => t.type !== "image").flatMap(t => t.children || []);
    return images.concat(allImageTokens(rest));
  }
  const images = allImageTokens(p);

  console.log("Image tokens: " + images.map(i => JSON.stringify(i)).join("\n"))
});
