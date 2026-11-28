// Bundles the game into one self-contained page: index.html
import { build } from "esbuild";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const here = (path) => fileURLToPath(new URL(path, import.meta.url));
const out = await build({
  entryPoints: [here("src/ui/main.ts")],
  bundle: true,
  format: "iife",
  minify: true,
  target: "es2020",
  write: false,
});
const js = out.outputFiles[0].text.replaceAll("</script", "<\\/script");
const page = readFileSync(here("src/ui/page.html"), "utf8");
// for the web address: Home Screen icon and name, and an offline copy
const head = `<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" href="icon-180.png">
<link rel="apple-touch-icon" href="icon-180.png">
<meta name="theme-color" content="#17130f">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="RedWall">
<meta name="apple-mobile-web-app-status-bar-style" content="black">
<script>if ("serviceWorker" in navigator && location.protocol === "https:") addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));</script>`;
writeFileSync(here("index.html"), page.replace("<!--HEAD-->", () => head).replace("/*GAME*/", () => js));
console.log("wrote index.html");
