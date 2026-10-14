import { ExtensionStorage } from "@bacons/apple-targets";

/**
 * The App Group shared with the widget (see app.json and targets/widget).
 * The widget reads from it; only the app writes.
 */
export const APP_GROUP = "group.app.stopscroll.mobile";

export const sharedStorage = new ExtensionStorage(APP_GROUP);

export const reloadWidgets = () => ExtensionStorage.reloadWidget();
