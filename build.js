import * as fs from "fs";
import * as readline from "readline";

const injectFile = function (output, tag, path) {
  output(`<${tag}>\n`, 4);
  fs.readFileSync(path)
    .toString()
    .split("\n")
    .map((ln) => output(ln + "\n", 6));
  output(`</${tag}>\n`, 4);
};

const output = (function () {
  const stream = fs.createWriteStream("dist/sliding-pictre-pzuzle.html");
  return function (content, indent) {
    stream.write(" ".repeat(indent) + content);
  };
})();

const template = readline.createInterface({
  input: fs.createReadStream("src/index.html"),
});
template.on("line", (line) => {
  switch (line.trim()) {
    case '<link rel="stylesheet" href="main.css" />':
      injectFile(output, "style", "src/main.css");
      break;
    case '<script src="main.js"></script>':
      injectFile(output, "script", "src/main.js");
      break;
    default:
      output(line + "\n");
  }
});
