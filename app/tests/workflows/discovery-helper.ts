import { $ } from "@wdio/globals";

export const openDiscovery = async (): Promise<void> => {
  const trigger = await $("#discovery-trigger");
  await trigger.waitForDisplayed();
  await trigger.click();
  await $("#discovery-surface").waitForDisplayed();
};
