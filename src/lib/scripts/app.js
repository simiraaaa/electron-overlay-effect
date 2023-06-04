import { writable } from "svelte/store";

/** @type {import("svelte/store").Writable<AppData.Settings>} */
export let settings = writable({
  enableMouse: true,
  enableKeyboard: true,
  enableChapter: false,
});

export const chapterText = writable('');
export const chapterIndex = writable(0);

export const init = async () => {
  const electron = globalThis.electron;
  if (!electron) return;

  try {
    const s = await electron.getSettings();
    if (s) settings.set(s);
    chapterText.set(await electron.getChapterText());
    chapterIndex.set(await electron.getChapterIndex());
  }
  catch (e) {
    console.error(e);
  }

  electron.onChangeMouseEnable((checked) => {
    settings.update((s) => {
      s.enableMouse = checked;
      return s;
    });
  });
  electron.onChangeKeyboardEnable((checked) => {
    settings.update((s) => {
      s.enableKeyboard = checked;
      return s;
    });
  });
  electron.onChangeChapterEnable((checked) => {
    settings.update((s) => {
      s.enableChapter = checked;
      return s;
    });
  });

  electron.onChangeChapterText((text) => {
    chapterText.set(text);
  });
  electron.onChangeChapterIndex((index) => {
    chapterIndex.set(index);
  });
};

export const KEY_CONSTANTS = {
  shift: '⇧',
  control: '⌃',
  command: '⌘',
  option: '⌥',
  return: '⏎',
  delete: '⌫',
  tab: '⇥',
  // escape: '⎋',
  escape: 'esc',
};

export const KEY_PRIORITIES = {
  [KEY_CONSTANTS.control]: 0,
  [KEY_CONSTANTS.option]: 1,
  [KEY_CONSTANTS.shift]: 2,
  [KEY_CONSTANTS.command]: 3,
};

export const MODIFIER_KEYS = new Set([
  KEY_CONSTANTS.shift,
  KEY_CONSTANTS.control,
  KEY_CONSTANTS.command,
  KEY_CONSTANTS.option,
]);
