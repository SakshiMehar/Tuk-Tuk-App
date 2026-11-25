export const fetchUserDecorations = async (_userId: string | null) => {
  return {
    badgeUrl: null,
    frameUrl: null,
  };
};

export default {
  fetchUserDecorations,
};
