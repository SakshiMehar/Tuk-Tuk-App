import { useState, useEffect } from 'react';
import { getUser, updateUser } from '../store/authStore';

export const resolveCountryFlag = (user: any): string | null => {
  if (!user) return null;
  if (user?.countryFlag && typeof user.countryFlag === 'string') {
    return user.countryFlag;
  }
  const code = user?.countryCode || user?.country || user?.region;
  if (!code) return null;
  const upper = String(code).toUpperCase().trim();
  if (upper === 'IN' || upper === 'INDIA') return '🇮🇳';
  if (upper === 'US' || upper === 'USA') return '🇺🇸';
  if (upper === 'GB' || upper === 'UK') return '🇬🇧';
  if (upper === 'CA') return '🇨🇦';
  if (upper === 'AU') return '🇦🇺';
  if (upper === 'AE' || upper === 'UAE') return '🇦🇪';
  if (upper === 'SA') return '🇸🇦';
  if (upper === 'PK') return '🇵🇰';
  if (upper === 'BD') return '🇧🇩';
  if (upper === 'NP') return '🇳🇵';
  if (upper === 'ID') return '🇮🇩';
  if (upper === 'PH') return '🇵🇭';
  if (upper.length === 2 && /^[A-Z]{2}$/.test(upper)) {
    try {
      const codePoints = [...upper].map((c) => 0x1f1a5 + c.charCodeAt(0));
      return String.fromCodePoint(...codePoints);
    } catch {
      return null;
    }
  }
  return null;
};

export const resolveUserCountryName = async (): Promise<string> => {
  try {
    const user = await getUser();
    const name = user?.country || user?.countryName;
    if (name && typeof name === 'string' && name.trim().length > 0) {
      return name.trim();
    }
  } catch {}
  return 'India';
};

export const syncUserCountryToServer = async ({
  country,
  countryCode,
}: {
  country?: string;
  countryCode?: string;
} = {}): Promise<any> => {
  const countryName = String(country ?? '').trim() || 'India';
  try {
    await updateUser({ country: countryName, countryName, countryCode });
  } catch {}
  return { countryName, countryCode };
};

export const useMyCountryFlag = (): string | null => {
  const [flag, setFlag] = useState<string | null>('🇮🇳');

  useEffect(() => {
    getUser()
      .then((user) => {
        if (user?.countryFlag) {
          setFlag(user.countryFlag);
        } else if (user?.country === 'India' || !user?.country) {
          setFlag('🇮🇳');
        }
      })
      .catch(() => {});
  }, []);

  return flag;
};

export default {
  resolveCountryFlag,
  resolveUserCountryName,
  syncUserCountryToServer,
  useMyCountryFlag,
};
