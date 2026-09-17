import { build } from "esbuild";

// Bundles React together with the widget into one self-mounting file. The
// output lands in the web app's public dir, so the instance serves /widget.js.
await build({
  entryPoints: ["src/embed.tsx"],
  outfile: "../../apps/web/public/widget.js",
  bundle: true,
  minify: true,
  format: "iife",
  platform: "browser",
  target: "es2020",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
});
