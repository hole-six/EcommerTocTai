import { Settings } from "@/models/Settings";

export async function getShippingSettings() {
  const settings = await Settings.findOne({ key: "store" }).lean();
  return {
    shippingFee: settings?.shippingFee ?? 30000,
    freeShippingThreshold: settings?.freeShippingThreshold ?? 200000,
  };
}
