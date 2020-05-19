
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

type Image = { alt: string, title: string, src: string, markdownFile: string }


function imagesFromFile(path: string): Promise<Image[]> {
  const stringContent: Promise<string> = promisify(fs.readFile)(files[0], { encoding: "UTF-8" });

  return stringContent.then(content => {
    const p = markdownIt.parse(content, {});

    printTree(p);

    const images = allImageTokens(p);

    console.log("Image tokens: " + images.map(i => JSON.stringify(i)).join("\n"))
    return images as any;
  });
};

imagesFromFile(files[0]).catch(err => {
  console.error(err);
  return ([] as Image[]);
});

type Tree = { type: string, children: Tree[] | null }

// not tail-recursive
function allImageTokens(input: Tree[]): Tree[] {
  if (!input || input.length === 0) {
    return [];
  };
  const images = input.filter(t => t.type === "image");
  const rest = input.filter(t => t.type !== "image").flatMap(t => t.children || []);
  return images.concat(allImageTokens(rest));
}

function printTree(p: any) {
  const printedTree = stringifyTree<{ children: (typeof p) | null, type: string }>(
    { children: p, type: "top-level" },
    t => t.type, t => (t.children || []))

  console.log(printedTree);
}
