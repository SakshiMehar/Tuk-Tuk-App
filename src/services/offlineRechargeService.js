import { getOfflineRechargeAgent } from "../api/rechargeApi";
import { getUser } from "../store/authStore";
import { resolveUserCountryName, syncUserCountryToServer } from "./userCountryService";

const firstText = (...values) =>
  values.find((value) => typeof value === "string" && value.trim().length > 0) ?? null;

const firstValue = (...values) =>
  values.find((value) => value !== undefined && value !== null) ?? null;

const unwrapAgent = (data) => {
  if (!data || typeof data !== "object") return {};
  return data.agent ?? data.data ?? data.result ?? data;
};

export const parseOfflineRechargeAgent = (data) => {
  const raw = unwrapAgent(data);

  return {
    id: firstValue(raw.id, raw.agentId, raw.userId),
    name: firstText(raw.name, raw.agentName, raw.displayName, raw.fullName) ?? "Recharge Agent",
    phone: firstText(raw.phone, raw.mobile, raw.phoneNumber, raw.contactNumber, raw.whatsapp),
    whatsapp: firstText(raw.whatsapp, raw.whatsApp, raw.whatsAppNumber, raw.phone, raw.mobile),
    upiId: firstText(raw.upiId, raw.upi, raw.upiID, raw.paymentUpi),
    email: firstText(raw.email, raw.contactEmail),
    note: firstText(
      raw.note,
      raw.instructions,
      raw.message,
      raw.description,
      "Contact the agent below to complete your offline recharge in INR."
    ),
    isActive: raw.isActive !== false && raw.active !== false,
  };
};

export const loadOfflineRechargeAgent = async () => {
  const countryName = await resolveUserCountryName();
  if (!countryName) {
    throw new Error("Country name is required. Please set your country in profile first.");
  }

  const user = await getUser();
  await syncUserCountryToServer({
    country: countryName,
    countryCode: user?.countryCode,
  }).catch(() => {});

  const data = await getOfflineRechargeAgent({ countryName });
  return parseOfflineRechargeAgent(data);
};
