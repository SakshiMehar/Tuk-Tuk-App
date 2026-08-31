/** Lazy-load expo-location so routes don't crash when native module isn't in the dev build yet. */
const loadLocationModule = async () => {
  try {
    return await import("expo-location");
  } catch {
    return null;
  }
};

/**
 * Returns device coordinates when location services are on and permission is granted.
 * @returns {Promise<{ ok: true, latitude: number, longitude: number } | { ok: false, reason: string }>}
 */
export const getDeviceCoordinates = async () => {
  const Location = await loadLocationModule();
  if (!Location) {
    return { ok: false, reason: "module_unavailable" };
  }

  try {
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      return { ok: false, reason: "services_disabled" };
    }

    let permission = await Location.getForegroundPermissionsAsync();
    if (permission.status !== "granted") {
      permission = await Location.requestForegroundPermissionsAsync();
    }
    if (permission.status !== "granted") {
      return { ok: false, reason: "permission_denied" };
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const { latitude, longitude } = position.coords ?? {};
    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      Number.isNaN(latitude) ||
      Number.isNaN(longitude)
    ) {
      return { ok: false, reason: "invalid_coords" };
    }

    return { ok: true, latitude, longitude };
  } catch {
    return { ok: false, reason: "module_unavailable" };
  }
};
