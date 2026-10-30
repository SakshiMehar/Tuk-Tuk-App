/**
 * Deep Linking Configuration
 * Handles universal links, schema routes, and notification deep navigation.
 */
import { ROUTES } from './navigationConstants';

export const linking = {
  prefixes: ['tuktuk://', 'https://tuktukapp.com'],
  config: {
    screens: {
      [ROUTES.MAIN_STACK]: {
        screens: {
          [ROUTES.SCREENS.VOICE_PARTY]: 'room/:roomId',
          [ROUTES.SCREENS.CHAT_BOX]: 'chat/:chatId',
          [ROUTES.SCREENS.CALL]: 'call/:callId',
          [ROUTES.SCREENS.WALLET]: 'wallet',
          [ROUTES.TABS.ROOT]: {
            screens: {
              [ROUTES.TABS.HOME]: 'home',
              [ROUTES.TABS.DISCOVERY]: 'discovery',
              [ROUTES.TABS.CHAT]: 'chats',
              [ROUTES.TABS.PROFILE]: 'profile',
            },
          },
        },
      },
    },
  },
};

export default linking;
