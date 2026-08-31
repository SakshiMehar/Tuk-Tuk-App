const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "../Components/enter-mobile.jsx");
const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
const start = lines.findIndex((line) => line.includes('name: "Algeria"'));
const end = lines.findIndex((line, index) => index > start && line.trim() === "];");
const duplicate = lines.findIndex(
  (line, index) => index > end && line.startsWith("export default function EnterMobile")
);

if (start < 0 || end < 0 || duplicate < 0) {
  throw new Error(`Could not clean file (${start}, ${end}, ${duplicate})`);
}

const cleaned = [...lines.slice(0, start), ...lines.slice(duplicate)];
fs.writeFileSync(file, cleaned.join("\n"));
