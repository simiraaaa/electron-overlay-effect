import { writable } from "svelte/store";

/** @type {import("svelte/store").Writable<AppData.Settings>} */
export let settings = writable({
  enableMouse: true,
  enableKeyboard: true,
});

export const init = async () => {
  const electron = globalThis.electron;
  if (!electron) return;

  try {
    const s = await electron.getSettings();
    if (s) settings.set(s);
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
};
