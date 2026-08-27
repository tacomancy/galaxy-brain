/** Type declaration for the operation-specific API exposed by preload. */
import type { FreshWorkbench } from "../modules/workbench-session";

declare global {
  interface Window {
    workbench: {
      // Keep renderer callers typed to the same public result as the preload
      // bridge and Workbench Session Module.
      openFreshWorkbench(): Promise<FreshWorkbench>;
    };
  }
}

export {};
