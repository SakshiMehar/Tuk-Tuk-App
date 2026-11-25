import React from 'react';
import { NavigationContext, NavigationContainerRefContext } from '@react-navigation/native';
import { ROUTES } from '@navigation/navigationConstants';
import { navigationRef } from '@navigation/navigationRef';

type RouteTarget =
  | string
  | {
      pathname: string;
      params?: Record<string, any>;
    };

export function useRouter() {
  const navContext = React.useContext(NavigationContext);
  const rootContext = React.useContext(NavigationContainerRefContext);
  const nav = navContext ?? rootContext;

  const getNavigator = () => {
    if (nav) return nav;
    if (navigationRef.isReady?.()) return navigationRef;
    return null;
  };

  const navigateInternal = (target: RouteTarget, isReplace = false) => {
    const pathname = typeof target === 'string' ? target : target.pathname;
    const params = typeof target === 'object' ? target.params : undefined;

    const navigator = getNavigator();

    if (!navigator) return;

    // Map common legacy Expo paths to React Navigation route names
    if (pathname === '/enter-mobile' || pathname.includes('mobile')) {
      if (isReplace && (navigator as any).replace) {
        (navigator as any).replace(ROUTES.AUTH.MOBILE, params);
      } else {
        (navigator as any).navigate(ROUTES.AUTH.MOBILE, params);
      }
    } else if (pathname === '/login') {
      (navigator as any).navigate(ROUTES.AUTH.LOGIN, params);
    } else if (pathname === '/verify-otp') {
      (navigator as any).navigate(ROUTES.AUTH.OTP, params);
    } else if (pathname.includes('voice-party') || pathname === '/party' || pathname === '/(tabs)/party') {
      (navigator as any).navigate(ROUTES.SCREENS.VOICE_PARTY, params);
    } else if (pathname === '/(tabs)/chat' || pathname === '/chat') {
      try {
        (navigator as any).navigate(ROUTES.MAIN_STACK, {
          screen: ROUTES.TABS.ROOT,
          params: { screen: ROUTES.TABS.CHAT },
        });
      } catch {
        (navigator as any).navigate(ROUTES.TABS.CHAT);
      }
    } else if (pathname.includes('chat-box')) {
      (navigator as any).navigate(ROUTES.SCREENS.CHAT_BOX, params);
    } else if (pathname === '/(tabs)/profile' || pathname === '/profile' || pathname === '/account') {
      try {
        (navigator as any).navigate(ROUTES.MAIN_STACK, {
          screen: ROUTES.TABS.ROOT,
          params: { screen: ROUTES.TABS.PROFILE },
        });
      } catch {
        (navigator as any).navigate(ROUTES.TABS.PROFILE);
      }
    } else if (
      pathname.includes('discovery') ||
      pathname.includes('find-friends') ||
      pathname.includes('nearby') ||
      pathname.includes('blind-pick')
    ) {
      try {
        (navigator as any).navigate(ROUTES.MAIN_STACK, {
          screen: ROUTES.TABS.ROOT,
          params: { screen: ROUTES.TABS.DISCOVERY },
        });
      } catch {
        (navigator as any).navigate(ROUTES.TABS.DISCOVERY);
      }
    } else if (pathname === '/message-notification') {
      (navigator as any).navigate(ROUTES.SCREENS.MESSAGE_NOTIFICATION, params);
    } else if (pathname === '/notifications') {
      (navigator as any).navigate(ROUTES.SCREENS.NOTIFICATIONS, params);
    } else if (pathname === '/settings') {
      (navigator as any).navigate(ROUTES.SCREENS.SETTINGS, params);
    } else if (pathname === '/personality-test' || pathname.includes('personality')) {
      (navigator as any).navigate(ROUTES.SCREENS.PERSONALITY_TEST, params);
    } else if (pathname === '/wallet') {
      (navigator as any).navigate(ROUTES.SCREENS.WALLET, params);
    } else if (pathname === '/(tabs)/home' || pathname.includes('home')) {
      try {
        (navigator as any).navigate(ROUTES.MAIN_STACK, {
          screen: ROUTES.TABS.ROOT,
          params: { screen: ROUTES.TABS.HOME },
        });
      } catch {
        (navigator as any).navigate(ROUTES.TABS.ROOT);
      }
    } else if (pathname === '/terms-of-use' || pathname === 'terms-of-use' || pathname.includes('terms')) {
      (navigator as any).navigate(ROUTES.SCREENS.TERMS_OF_USE, params);
    } else if (pathname.includes('privacy')) {
      (navigator as any).navigate(ROUTES.AUTH.LOGIN);
    } else {
      (navigator as any).navigate(pathname, params);
    }
  };

  return {
    push: (target: RouteTarget) => navigateInternal(target, false),
    replace: (target: RouteTarget) => navigateInternal(target, true),
    back: () => {
      const navigator = getNavigator();
      if (navigator?.goBack) navigator.goBack();
    },
    canGoBack: () => {
      const navigator = getNavigator();
      return navigator?.canGoBack ? navigator.canGoBack() : false;
    },
    dismissAll: () => {
      const navigator = getNavigator();
      if ((navigator as any)?.popToTop) {
        (navigator as any).popToTop();
      }
    },
  };
}

export default { useRouter };
