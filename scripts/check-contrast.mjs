// WCAG contrast audit for theme.css. Parses the light and dark token sets
// and fails (exit 1) if any required pair drops below its AA threshold.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const themePath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..", "client", "src", "theme.css"
);
const css = readFileSync(themePath, "utf8");

function tokensIn(block) {
  const out = {};
  for (const m of block.matchAll(/(--[\w-]+):\s*(#[0-9a-fA-F]{6})/g)) {
    out[m[1]] = m[2];
  }
  return out;
}

const rootBlock = css.match(/:root\s*\{[^}]*\}/s)?.[0] ?? "";
const darkBlock = css.match(/\[data-theme="dark"\]\s*\{[^}]*\}/s)?.[0] ?? "";
const light = tokensIn(rootBlock);
const dark = { ...light, ...tokensIn(darkBlock) };

function luminance(hex) {
  const c = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function ratio(fg, bg) {
  const [a, b] = [luminance(fg), luminance(bg)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}

// [foreground, background, minimum ratio, note]
// 4.5 = AA normal text, 3.0 = AA large text (>=24px, or >=18.66px bold).
const PAIRS = [
  ["--ink", "--bg-page", 4.5, "body text"],
  ["--ink", "--bg-card", 4.5, "card text"],
  ["--ink", "--bg-butter", 4.5, "hero text"],
  ["--ink", "--bg-sand", 4.5, "chip text"],
  ["--ink-soft", "--bg-page", 4.5, "muted text"],
  ["--ink-soft", "--bg-card", 4.5, "muted card text"],
  ["--heading", "--bg-page", 4.5, "headings"],
  ["--heading", "--bg-butter", 4.5, "hero headings"],
  ["--accent-text", "--bg-page", 4.5, "price text"],
  ["--accent-text", "--bg-card", 4.5, "price on cards"],
  ["--accent-contrast", "--accent", 4.5, "primary button label"],
  ["--error", "--bg-card", 4.5, "form error text"],
  ["--success", "--bg-page", 4.5, "success text"],
  ["--on-forest", "--forest", 4.5, "footer text"],
  ["--success", "--bg-card", 4.5, "toast success icon"],
];

let failed = false;
for (const [name, tokens] of [["light", light], ["dark", dark]]) {
  for (const [fg, bg, min, note] of PAIRS) {
    if (!tokens[fg] || !tokens[bg]) {
      console.error(`${name}: MISSING token ${!tokens[fg] ? fg : bg}`);
      failed = true;
      continue;
    }
    const r = ratio(tokens[fg], tokens[bg]);
    const ok = r >= min;
    if (!ok) failed = true;
    console.log(
      `${ok ? "PASS" : "FAIL"} [${name}] ${note}: ${fg} on ${bg} = ${r.toFixed(2)} (min ${min})`
    );
  }
}
process.exit(failed ? 1 : 0);
