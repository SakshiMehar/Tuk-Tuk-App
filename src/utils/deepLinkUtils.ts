/**
 * Deep Link Utilities for Universal Links & Custom URI Schemes
 */

let pendingDeepLinkUrl: string | null = null;

export const setPendingDeepLink = (url: string | null) => {
  pendingDeepLinkUrl = url;
};

export const consumePendingDeepLink = async (): Promise<string | null> => {
  const url = pendingDeepLinkUrl;
  pendingDeepLinkUrl = null;
  return url;
};

export const extractRoomIdFromUrl = (url: string | null): string | null => {
  if (!url) return null;

  try {
    // Check roomId query param: ?roomId=123
    const queryMatch = url.match(/[?&]roomId=([^&]+)/i);
    if (queryMatch && queryMatch[1]) {
      return decodeURIComponent(queryMatch[1]);
    }

    // Check path: /room/123 or /voice-party/123
    const pathMatch = url.match(/\/(?:room|voice-party)\/([a-zA-Z0-9_-]+)/i);
    if (pathMatch && pathMatch[1]) {
      return decodeURIComponent(pathMatch[1]);
    }
  } catch {
    return null;
  }

  return null;
};

export default {
  setPendingDeepLink,
  consumePendingDeepLink,
  extractRoomIdFromUrl,
};
