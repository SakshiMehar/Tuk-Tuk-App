import { storage } from '@shared/storage/storage';
import { useAuthStore } from './auth/authStore';

const TERMS_ACCEPTED_KEY = '@terms_accepted';
const PENDING_INVITE_CODE_KEY = '@pending_invite_code';

let inMemoryInviteCode = '';

/**
 * Check if the user has previously accepted the terms
 */
export const hasAcceptedTerms = async (): Promise<boolean> => {
  try {
    const val = await storage.getItem(TERMS_ACCEPTED_KEY);
    return val === 'true' || val === true;
  } catch {
    return false;
  }
};

/**
 * Persist acceptance of Terms & Conditions
 */
export const setTermsAccepted = async (accepted: boolean): Promise<void> => {
  try {
    await storage.setItem(TERMS_ACCEPTED_KEY, accepted ? 'true' : 'false');
  } catch {
    // Storage silent fail
  }
};

/**
 * Save pending invite code to be attached to account registration
 */
export const setPendingInviteCode = async (code: string): Promise<void> => {
  inMemoryInviteCode = code.trim();
  try {
    await storage.setItem(PENDING_INVITE_CODE_KEY, inMemoryInviteCode);
  } catch {
    // Storage silent fail
  }
};

/**
 * Retrieve pending invite code
 */
export const getPendingInviteCode = async (): Promise<string> => {
  if (inMemoryInviteCode) return inMemoryInviteCode;
  try {
    const saved = await storage.getItem(PENDING_INVITE_CODE_KEY);
    return (saved as string) || '';
  } catch {
    return '';
  }
};

import { secureStorage } from '@shared/storage/secureStorage';
import { STORAGE_KEYS } from '@shared/storage/storageKeys';

/**
 * Retrieve saved auth token
 */
export const getToken = async (): Promise<string | null> => {
  const storeToken = useAuthStore.getState().token;
  if (storeToken) return storeToken;
  try {
    const saved = await secureStorage.getSecureItem(STORAGE_KEYS.AUTH_TOKEN);
    return saved || null;
  } catch {
    return null;
  }
};

export { useAuthStore };
export default {
  hasAcceptedTerms,
  setTermsAccepted,
  setPendingInviteCode,
  getPendingInviteCode,
  getToken,
  useAuthStore,
};
