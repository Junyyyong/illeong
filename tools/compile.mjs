// 타깃 컴파일: targets/ 이미지들을 site/targets.mind 로 변환 (Node에서 직접 실행)
// build.mjs가 자동으로 호출하므로 보통 직접 실행할 일은 없다.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadImage } from "canvas";
import { OfflineCompiler } from "mind-ar/src/image-target/offline-compiler.js";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const targetsDir = path.join(root, "targets");
const siteDir = path.join(root, "site");

const imageExts = new Set([".png", ".jpg", ".jpeg"]);
const files = fs.readdirSync(targetsDir)
  .filter((f) => imageExts.has(path.extname(f).toLowerCase()))
  .sort();

if (files.length === 0) {
  console.error("targets/ 폴더에 이미지가 없습니다.");
  process.exit(1);
}

console.log(`타깃 컴파일 시작: ${files.join(", ")}`);
const images = await Promise.all(files.map((f) => loadImage(path.join(targetsDir, f))));

const compiler = new OfflineCompiler();
let lastShown = -10;
await compiler.compileImageTargets(images, (progress) => {
  if (progress - lastShown >= 10) {
    lastShown = progress;
    process.stdout.write(`\r진행률 ${Math.round(progress)}%   `);
  }
});
process.stdout.write("\r진행률 100%   \n");

const buffer = compiler.exportData();
fs.mkdirSync(siteDir, { recursive: true });
fs.writeFileSync(path.join(siteDir, "targets.mind"), Buffer.from(buffer));
console.log(`site/targets.mind 저장 완료 (${buffer.byteLength.toLocaleString()} bytes)`);
