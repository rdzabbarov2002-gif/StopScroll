import { hasAndroidWidgets } from "./nativeWidgets";

if (hasAndroidWidgets) {
  // A conditional require, so the library is never evaluated without its module (nativeWidgets.ts).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("./androidTask");
}
