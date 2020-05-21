#!/usr/bin/env node

import { Remarkable } from "remarkable";
import { stringifyTree } from "stringify-tree";
import * as fs from "fs";
import { promisify } from "util";
import { fork } from "child_process";
import * as path from "path";

const files = process.argv.filter(s => s.endsWith(".md"));

if (files.length === 0) {
  console.log("USAGE: list-images <name of markdown file...>");
  process.exit(1);
}

if (files.length > 1) {
  files.forEach(f => fork("index.js", [path.resolve(f)], {}));
} else {

  const filepath = files[0];
  //console.log("The file is: " + filepath);

  const markdownIt = new Remarkable();

  type Image = { alt: string, title: string, src: string, markdownFile: string }

  function imagesFromFile(path: string): Promise<Image[]> {
    const stringContent: Promise<string> = promisify(fs.readFile)(filepath, { encoding: "UTF-8" });

    return stringContent.then(content => {
      const p = markdownIt.parse(content, {});
      // printTree(p);
      const images = allImageTokens(p);
      //console.log("Image tokens: " + images.map(i => JSON.stringify(i)).join("\n"))
      return images.map((i: any) => ({
        markdownFile: filepath,
        src: i.src as string,
        alt: i.alt as string,
        title: i.title as string,
      }));
    });
  };

  const output = imagesFromFile(files[0]).catch(err => {
    console.error(err);
    return ([] as Image[]);
  });

  output.then(all => all.flat().map(a => JSON.stringify(a)).forEach(a => console.log(a)));

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
}

function printTree(p: any) {
  const printedTree = stringifyTree<{ children: (typeof p) | null, type: string }>(
    { children: p, type: "top-level" },
    t => t.type, t => (t.children || []))

  console.log(printedTree);
}