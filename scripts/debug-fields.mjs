#!/usr/bin/env node
// 一時調査用: 不動産情報ライブラリAPIのレスポンスに実際にどんなフィールド名が
// 入っているかを確認するためのスクリプト。原因調査が終わったら削除してよい。
//
// 使い方: node scripts/debug-fields.mjs --pref 13 --city 13211 --year 2024

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function loadEnvLocal() {
  const envPath = path.join(ROOT, ".env.local");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnvLocal();

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      const value = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
      args[key] = value;
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const PREF_CODE = args.pref || "13";
const CITY_CODE = args.city || "13211";
const YEAR = args.year || "2024";

const REINFOLIB_API_KEY = process.env.REINFOLIB_API_KEY;
if (!REINFOLIB_API_KEY) {
  console.error("エラー: REINFOLIB_API_KEY が設定されていません。");
  process.exit(1);
}

const url = new URL("https://www.reinfolib.mlit.go.jp/ex-api/external/XIT001");
url.searchParams.set("year", YEAR);
url.searchParams.set("area", PREF_CODE);
url.searchParams.set("city", CITY_CODE);

const res = await fetch(url, {
  headers: { "Ocp-Apim-Subscription-Key": REINFOLIB_API_KEY },
});

if (!res.ok) {
  console.error(`APIエラー (${res.status}): ${await res.text()}`);
  process.exit(1);
}

const json = await res.json();
const records = json?.data ?? json ?? [];

console.log("=== 件数 ===");
console.log(records.length);

console.log("\n=== 1件目の全フィールド(キーと値) ===");
console.log(JSON.stringify(records[0], null, 2));

console.log("\n=== 全フィールド名一覧 ===");
console.log(Object.keys(records[0]).join(", "));
