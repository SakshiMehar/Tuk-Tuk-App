/** Lazy-load expo-location so routes don't crash when native module isn't in the dev build yet. */
const loadLocationModule = async () => {
  try {
    return await import("expo-location");
  } catch (err) {
    console.warn(
      "[deviceLocation] expo-location unavailable — run: npx expo run:android",
      err?.message ?? err
    );
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
      console.log("[deviceLocation] location services disabled on device");
      return { ok: false, reason: "services_disabled" };
    }

    let permission = await Location.getForegroundPermissionsAsync();
    if (permission.status !== "granted") {
      permission = await Location.requestForegroundPermissionsAsync();
    }
    if (permission.status !== "granted") {
      console.log("[deviceLocation] location permission denied:", permission.status);
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
      console.log("[deviceLocation] invalid coordinates:", position.coords);
      return { ok: false, reason: "invalid_coords" };
    }

    console.log("[deviceLocation] coords:", { latitude, longitude });
    return { ok: true, latitude, longitude };
  } catch (err) {
    console.warn("[deviceLocation] getDeviceCoordinates failed:", err?.message ?? err);
    return { ok: false, reason: "module_unavailable" };
  }
};
