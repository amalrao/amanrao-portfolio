import * as THREE from "three";

const CODE_LINES = [
  "const app = createApp();",
  "function analyze(data) {",
  "  return data.map(x => x * 2);",
  "}",
  "import pandas as pd",
  "df.groupby('col').mean()",
  "export default function App() {",
  "SELECT * FROM projects;",
  "const [state, setState] = useState();",
  "git commit -m 'ship it'",
  "npm run build",
  "class Model(nn.Module):",
];

/** A persistent canvas + texture pair for the laptop screen's scrolling code effect. */
export function createCodeCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext("2d")!;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return { canvas, ctx, texture };
}

/** Redraws the code canvas with lines scrolled by `offset` pixels. */
export function drawCodeFrame(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  offset: number,
) {
  ctx.fillStyle = "#001133";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = "18px 'Courier New', monospace";
  ctx.fillStyle = "#33FF99";

  const lineHeight = 26;
  const linesVisible = Math.ceil(canvas.height / lineHeight) + 2;
  const baseIndex = Math.floor(offset / lineHeight);
  const y0 = -(offset % lineHeight);

  for (let i = 0; i < linesVisible; i++) {
    const text = CODE_LINES[(baseIndex + i) % CODE_LINES.length];
    ctx.fillText(text, 14, y0 + i * lineHeight + lineHeight);
  }
}
