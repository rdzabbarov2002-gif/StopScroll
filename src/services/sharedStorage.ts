/**
 * The App Group shared with the iOS widget exists only on iOS (sharedStorage.ios.ts);
 * elsewhere nothing reads these values.
 */
export const APP_GROUP = "group.app.stopscroll.mobile";

export const sharedStorage = {
  set(_key: string, _value?: string | number): void {},
};

export const reloadWidgets = () => {};
