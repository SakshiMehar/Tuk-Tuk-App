import { getUser } from '../store/authStore';

const NEW_USER_FRAME_URL =
  'https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/assets/frames/newuser_frame.png';

export const syncNewUserFrameForSession = async () => {
  const user = await getUser();
  if (user?.hasNewUserFrame || user?.isNewUser) {
    return { uri: user?.newUserFrameUrl || NEW_USER_FRAME_URL };
  }
  return null;
};

export default {
  syncNewUserFrameForSession,
};
