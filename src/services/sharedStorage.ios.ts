import { ExtensionStorage } from "@bacons/apple-targets";

/**
 * The App Group shared with the widget and the Shortcuts action (see app.json and targets/).
 * Both extensions read from it; only the app writes.
 */
export const APP_GROUP = "group.app.stopscroll.mobile";

export const sharedStorage = new ExtensionStorage(APP_GROUP);

export const reloadWidgets = () => ExtensionStorage.reloadWidget();
