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
    } else if (pathname.includes('voice-party')) {
      (navigator as any).navigate(ROUTES.SCREENS.VOICE_PARTY, params);
    } else if (pathname === '/(tabs)/home' || pathname.includes('home')) {
      try {
        (navigator as any).navigate(ROUTES.MAIN_STACK, {
          screen: ROUTES.TABS.ROOT,
          params: { screen: ROUTES.TABS.HOME },
        });
      } catch {
        (navigator as any).navigate(ROUTES.TABS.ROOT);
      }
    } else if (pathname.includes('terms') || pathname.includes('privacy')) {
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
  };
}

export default { useRouter };
