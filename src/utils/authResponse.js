/** Normalize backend auth payloads ({ token } vs { access_token }). */
export const normalizeAuthResponse = (data) => {
  const payload = data?.data ?? data;
  const token =
    payload?.token ??
    payload?.access_token ??
    payload?.accessToken ??
    data?.token ??
    data?.access_token;
  const user = payload?.user ?? data?.user ?? {};
  return { token, user };
};
