#!/usr/bin/env node
// 市区町村コード確認用の一回限りのツール。
// 使い方: node scripts/list-cities.mjs --area 14 --filter 三浦
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

const REINFOLIB_API_KEY = process.env.REINFOLIB_API_KEY;
if (!REINFOLIB_API_KEY) {
  console.error("エラー: REINFOLIB_API_KEY が設定されていません。");
  process.exit(1);
}

const args = process.argv.slice(2);
function getArg(name) {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? null : args[i + 1];
}

const area = getArg("area");
const filter = getArg("filter") || "";
if (!area) {
  console.error("使い方: node scripts/list-cities.mjs --area <都道府県コード2桁> [--filter <部分一致文字列>]");
  process.exit(1);
}

const endpoint = `https://www.reinfolib.mlit.go.jp/ex-api/external/XIT002?area=${area}&language=ja`;
const res = await fetch(endpoint, {
  headers: { "Ocp-Apim-Subscription-Key": REINFOLIB_API_KEY },
});

if (!res.ok) {
  console.error(`APIエラー (${res.status}): ${await res.text()}`);
  process.exit(1);
}

const data = await res.json();
const list = data?.data ?? data ?? [];
const filtered = filter ? list.filter((c) => c.name?.includes(filter)) : list;

console.log(`都道府県コード ${area} の市区町村一覧(${filtered.length}件):`);
for (const c of filtered) {
  console.log(`  ${c.id}  ${c.name}`);
}
