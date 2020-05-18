
console.log("GIVE ME YOUR MARKDOWN");

const files = process.argv.filter(s => s.endsWith(".md"));

console.log("The files are: " + files.join(" "))

if (files.length === 0) {
  console.log("USAGE: list-images <name of markdown file...>");
  process.exit(1);
}

