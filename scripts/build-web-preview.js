/**
 * Builds the web preview for GitHub Pages: demo mode on (test Pro, sample data, no purchases),
 * served from https://<owner>.github.io/<repo>/. Usage: node scripts/build-web-preview.js [baseUrl]
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(path.dirname(process.argv[1]), "..");
const appJsonPath = path.join(root, "app.json");
const baseUrl = process.argv[2] ?? "/StopScroll";
const original = fs.readFileSync(appJsonPath, "utf8");

try {
  const config = JSON.parse(original);
  config.expo.experiments = { ...config.expo.experiments, baseUrl };
  fs.writeFileSync(appJsonPath, `${JSON.stringify(config, null, 2)}\n`);
  execSync("npx expo export --platform web --output-dir dist", {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, EXPO_PUBLIC_DEMO: "1" },
  });
  // Any unknown path (e.g. a refresh on a deep link) falls back to the app.
  fs.copyFileSync(path.join(root, "dist/index.html"), path.join(root, "dist/404.html"));
  // Stop GitHub Pages from running Jekyll, which would hide the "_expo" folder.
  fs.writeFileSync(path.join(root, "dist/.nojekyll"), "");
} finally {
  fs.writeFileSync(appJsonPath, original);
}
