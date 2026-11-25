/** Build an image source from a remote URL or local asset id. */
export const resolveImageSource = (uri: any) => {
  if (!uri) return null;
  if (typeof uri === 'number') return uri;
  if (typeof uri === 'object' && uri.uri) return uri;
  return { uri: String(uri) };
};

/** Build a video source from a remote URL or local asset id. */
export const resolveVideoSource = (uri: any) => {
  if (uri == null || uri === '') return null;
  if (typeof uri === 'number') return uri;
  return String(uri);
};

export const isGifMedia = (uri: any): boolean => {
  if (uri == null || uri === '') return false;
  const str =
    typeof uri === 'object'
      ? String(uri?.uri || uri?.url || uri?.videoUrl || uri?.videoPath || '')
      : String(uri);
  if (!str) return false;
  return /\.gif($|[?#])/i.test(str) || str.toLowerCase().includes('.gif');
};

export default { resolveImageSource, resolveVideoSource, isGifMedia };
