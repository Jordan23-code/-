#!/usr/bin/env node
// GitHub Actionsの週次スケジュールから呼ばれるランナー。
// content/queues/<vertical>.json の先頭エリアを1件取り出し、対応する
// generate-*.mjs を実行する。成功したらキューから取り除いて保存し、
// 失敗した場合はキューをそのまま残す(次回の実行で同じエリアを再試行する)。
//
// 使い方: node scripts/run-scheduled.mjs vacation-homes
//         node scripts/run-scheduled.mjs apartment-management

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const VERTICALS = {
  "vacation-homes": {
    queueFile: path.join(ROOT, "content", "queues", "vacation-homes.json"),
    script: path.join(ROOT, "scripts", "generate-vacation-article.mjs"),
  },
  "apartment-management": {
    queueFile: path.join(ROOT, "content", "queues", "apartment-management.json"),
    script: path.join(ROOT, "scripts", "generate-apartment-article.mjs"),
  },
};

function writeOutput(key, value) {
  const outFile = process.env.GITHUB_OUTPUT;
  if (outFile) fs.appendFileSync(outFile, `${key}=${value}\n`);
}

const vertical = process.argv[2];
const config = VERTICALS[vertical];
if (!config) {
  console.error(
    `エラー: 不明なバーティカル "${vertical}"。vacation-homes か apartment-management を指定してください。`
  );
  process.exit(1);
}

let queue = [];
if (fs.existsSync(config.queueFile)) {
  queue = JSON.parse(fs.readFileSync(config.queueFile, "utf-8"));
}

if (!Array.isArray(queue) || queue.length === 0) {
  console.log(
    `[${vertical}] キューが空です。生成をスキップします。content/queues/${vertical}.json に次のエリアを追加してください。`
  );
  writeOutput("generated", "false");
  process.exit(0);
}

const next = queue[0];
const year = next.year || String(new Date().getFullYear() - 1);
console.log(`[${vertical}] 次のエリアを生成します: ${next.cityName}(${next.city}) / ${year}年`);

const args = [
  config.script,
  "--pref", String(next.pref),
  "--pref-name", next.prefName,
  "--city", String(next.city),
  "--cityName", next.cityName,
  "--year", String(year),
];

try {
  execFileSync("node", args, { stdio: "inherit", cwd: ROOT });
} catch (err) {
  console.error(`[${vertical}] 生成に失敗しました。キューは変更せず、次回の実行で再試行します。`);
  writeOutput("generated", "false");
  process.exit(1);
}

// 成功した場合のみキューから先頭を取り除いて保存する
queue.shift();
fs.writeFileSync(config.queueFile, JSON.stringify(queue, null, 2) + "\n");

writeOutput("generated", "true");
writeOutput("cityName", next.cityName);
console.log(`[${vertical}] 完了: ${next.cityName}`);
