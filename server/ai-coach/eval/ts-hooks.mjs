// Lets Node run the Worker's TypeScript sources as they are (Node strips the types itself):
// relative imports without an extension ("./prompts", "../i18n") resolve to the .ts file.
import { register } from "node:module";

register("./ts-resolve.mjs", import.meta.url);
