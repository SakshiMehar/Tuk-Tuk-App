/** Build an expo-video source from a remote URL or local asset id. */
export const resolveVideoSource = (uri) => {
  if (uri == null || uri === "") return null;
  if (typeof uri === "number") return uri;

  return String(uri);
};

/** Image source for remote URLs. Passes local require() asset
 *  ids (numbers) straight through — only remote URLs get wrapped/stringified. */
export const resolveImageSource = (uri) => {
  if (!uri) return null;
  if (typeof uri === "number") return uri;
  return { uri: String(uri) };
};

/** Helper to detect whether a media URL or file is an animated GIF */
export const isGifMedia = (uri) => {
  if (uri == null || uri === "") return false;
  const str =
    typeof uri === "object"
      ? String(uri?.uri || uri?.url || uri?.videoUrl || uri?.videoPath || "")
      : String(uri);
  if (!str) return false;
  return /\.gif($|[?#])/i.test(str) || str.toLowerCase().includes(".gif");
};
