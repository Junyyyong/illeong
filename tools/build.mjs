// 빌드 스크립트: targets/ + videos/ 를 스캔해서 site/ (배포용 정적 사이트)를 생성한다.
// 사용법: npm run build
// 규칙: targets/<이름>.png|jpg ↔ videos/<이름>.mp4 (파일명이 같아야 짝으로 묶임)
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const targetsDir = path.join(root, "targets");
const videosDir = path.join(root, "videos");
const siteDir = path.join(root, "site");

const imageExts = new Set([".png", ".jpg", ".jpeg"]);

// 사이트 제목·문구는 site.config.json에서 읽는다 (브랜딩 바꿀 때 코드 수정 불필요)
const config = JSON.parse(fs.readFileSync(path.join(root, "site.config.json"), "utf8"));

function probeSize(file) {
  const out = execFileSync("ffprobe", [
    "-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=width,height",
    "-of", "csv=p=0", file,
  ]).toString().trim();
  const [w, h] = out.split(",").map(Number);
  return { width: w, height: h };
}

const targetFiles = fs.readdirSync(targetsDir)
  .filter((f) => imageExts.has(path.extname(f).toLowerCase()))
  .sort();

if (targetFiles.length === 0) {
  console.error("targets/ 폴더에 이미지가 없습니다.");
  process.exit(1);
}

const entries = targetFiles.map((img) => {
  const name = path.basename(img, path.extname(img));
  const video = `${name}.mp4`;
  if (!fs.existsSync(path.join(videosDir, video))) {
    console.error(`짝이 되는 영상이 없습니다: videos/${video} (targets/${img})`);
    process.exit(1);
  }
  const { width, height } = probeSize(path.join(targetsDir, img));
  return { name, image: img, video, aspect: height / width };
});

fs.mkdirSync(path.join(siteDir, "videos"), { recursive: true });
for (const e of entries) {
  fs.copyFileSync(path.join(videosDir, e.video), path.join(siteDir, "videos", e.video));
}

const assets = entries.map((e, i) =>
  `      <video id="vid${i}" src="./videos/${e.video}" preload="auto" loop playsinline webkit-playsinline crossorigin="anonymous"></video>`
).join("\n");

const targets = entries.map((e, i) => `      <a-entity mindar-image-target="targetIndex: ${i}" ar-video="video: #vid${i}">
        <a-video src="#vid${i}" position="0 0 0" width="1" height="${e.aspect.toFixed(4)}"></a-video>
      </a-entity>`).join("\n");

const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <title>${config.title}</title>
  <script src="./vendor/aframe.min.js"></script>
  <script type="module" src="./vendor/mindar/mindar-image-aframe.prod.js"></script>
  <style>
    html, body { margin: 0; height: 100%; overflow: hidden; font-family: -apple-system, "Apple SD Gothic Neo", sans-serif; background: #000; }
    #header {
      position: fixed; top: 0; left: 0; right: 0; z-index: 5;
      padding: calc(16px + env(safe-area-inset-top)) 16px 28px;
      text-align: center; color: #fff; pointer-events: none;
      background: linear-gradient(rgba(0, 0, 0, .6), transparent);
    }
    #header h1 { margin: 0; font-size: 19px; font-weight: 700; }
    #header p { margin: 4px 0 0; font-size: 13px; opacity: .85; }
    #message {
      position: fixed; inset: 0; z-index: 10; display: none;
      align-items: center; justify-content: center; text-align: center;
      background: #111; color: #fff; padding: 24px; line-height: 1.7;
    }
    .a-enter-vr, .a-enter-ar { display: none !important; }
  </style>
</head>
<body>
  <div id="header">
    <h1>${config.title}</h1>
    <p>${config.tagline}</p>
  </div>
  <div id="message"></div>

  <a-scene mindar-image="imageTargetSrc: ./targets.mind; autoStart: true; uiLoading: no; uiError: no; uiScanning: no; filterMinCF: 0.0001; filterBeta: 0.001"
           color-space="sRGB" renderer="colorManagement: true" embedded
           vr-mode-ui="enabled: false" device-orientation-permission-ui="enabled: false">
    <a-assets>
${assets}
    </a-assets>
    <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>
${targets}
  </a-scene>

  <script>
    // 타깃을 찾으면 영상 재생(소리 재생이 막히면 무음으로라도), 놓치면 일시정지
    AFRAME.registerComponent("ar-video", {
      schema: { video: { type: "selector" } },
      init() {
        this.el.addEventListener("targetFound", () => {
          const v = this.data.video;
          v.dataset.onTarget = "1";
          v.play().catch(() => { v.muted = true; v.play().catch(() => {}); });
        });
        this.el.addEventListener("targetLost", () => {
          delete this.data.video.dataset.onTarget;
          this.data.video.pause();
        });
      },
    });

    // 첫 터치에서 소리 재생 제한 해제 (iOS 등)
    const unlock = () => {
      document.removeEventListener("pointerdown", unlock);
      for (const v of document.querySelectorAll("a-assets video")) {
        if (v.paused) {
          const p = v.play();
          if (p) p.then(() => { if (!v.dataset.onTarget) { v.pause(); v.currentTime = 0; } }).catch(() => {});
        }
        v.muted = false;
      }
    };
    document.addEventListener("pointerdown", unlock);

    document.querySelector("a-scene").addEventListener("arError", () => {
      const msg = document.getElementById("message");
      msg.style.display = "flex";
      msg.textContent = "카메라를 켤 수 없습니다. 브라우저의 카메라 권한을 허용한 뒤 새로고침해 주세요.";
    });
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(siteDir, "index.html"), html);

console.log(`site/index.html 생성 완료 (타깃 ${entries.length}개: ${entries.map((e) => e.name).join(", ")})`);

// 타깃 이미지가 바뀌었으면(또는 .mind가 없으면) 인식 데이터 재컴파일
const mindFile = path.join(siteDir, "targets.mind");
const newestTarget = Math.max(...targetFiles.map((f) => fs.statSync(path.join(targetsDir, f)).mtimeMs));
if (!fs.existsSync(mindFile) || fs.statSync(mindFile).mtimeMs < newestTarget) {
  execFileSync("node", [path.join(root, "tools", "compile.mjs")], { stdio: "inherit" });
} else {
  console.log("site/targets.mind 최신 상태 — 컴파일 생략");
}
