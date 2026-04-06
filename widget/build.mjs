import * as esbuild from "esbuild";
import { cpSync } from "fs";

const watch = process.argv.includes("--watch");
const minify = !watch;

const builds = [
  { entryPoints: ["src/index.ts"], format: "iife", outfile: "dist/chatbot-widget.js" },
  { entryPoints: ["src/zephlo.ts"], format: "esm", outfile: "dist/zephlo.esm.js" },
  { entryPoints: ["src/zephlo.ts"], format: "iife", globalName: "Zephlo", outfile: "dist/zephlo.js" },
];

for (const build of builds) {
  const options = { ...build, bundle: true, minify, target: ["es2020"], sourcemap: watch };
  if (watch) {
    const ctx = await esbuild.context(options);
    await ctx.watch();
  } else {
    await esbuild.build(options);
  }
  console.log(`Built ${build.outfile}`);
}

cpSync("src/types.d.ts", "dist/types.d.ts");
console.log("Copied types.d.ts");
