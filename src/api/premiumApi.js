import API, { authRequestConfig } from "./axios";

/** POST /api/app/premium/buy — buys a premium tier using the authenticated
 *  user's diamonds. Body: { premiumLevel }. */
export const buyPremiumTier = async (premiumLevel) => {
  const response = await API.post(
    "/api/app/premium/buy",
    { premiumLevel },
    await authRequestConfig()
  );
  return response.data;
};
