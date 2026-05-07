const fs = require("fs");

// Đọc 2 file
const vocab1 = JSON.parse(fs.readFileSync("toeic_800_vocab.json", "utf8"));
const vocab2 = JSON.parse(fs.readFileSync("vocab.json", "utf8"));

// Gộp
const merged = [...vocab1, ...vocab2];

// Xóa trùng theo word
const unique = [];
const seen = new Set();

for (const item of merged) {
    const word = item.word.toLowerCase();

    if (!seen.has(word)) {
        seen.add(word);
        unique.push(item);
    }
}

// Ghi file mới
fs.writeFileSync(
    "merged_vocab.json",
    JSON.stringify(unique, null, 2),
    "utf8"
);

console.log(`Đã merge xong: ${unique.length} từ`);