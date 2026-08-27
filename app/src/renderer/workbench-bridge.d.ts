import type { FreshWorkbench } from "../modules/workbench-session";

declare global {
  interface Window {
    workbench: {
      openFreshWorkbench(): Promise<FreshWorkbench>;
    };
  }
}

export {};
