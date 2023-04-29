// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces

import { ElectronAPI } from './preload.cjs';
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface Platform {}
	}

	var electron: ElectronAPI;
}

export {};
