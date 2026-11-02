import React, { memo, useRef, useCallback } from 'react';
import { TouchableOpacity, ScrollView, Animated, Easing, StyleSheet } from 'react-native';
import { ms } from '@shared/utils/responsive';

export const TABS = ['For You', 'Online', 'Following', 'New'];

export const FeedTabs = memo(function FeedTabs({ selectedTab = 'For You', onTabPress }) {
  const tabScales = useRef(
    TABS.reduce((acc, t) => {
      acc[t] = new Animated.Value(1);
      return acc;
    }, {})
  ).current;

  const tabUnderlineScales = useRef(
    TABS.reduce((acc, t) => {
      acc[t] = new Animated.Value(t === selectedTab ? 1 : 0);
      return acc;
    }, {})
  ).current;

  const handlePress = useCallback(
    (tab) => {
      const prev = selectedTab;
      if (tab === prev) return;

      Animated.timing(tabUnderlineScales[prev], {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();

      Animated.sequence([
        Animated.timing(tabScales[tab], {
          toValue: 0.82,
          duration: 80,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.spring(tabScales[tab], {
          toValue: 1,
          tension: 260,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      Animated.timing(tabUnderlineScales[tab], {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5)),
      }).start();

      if (onTabPress) onTabPress(tab);
    },
    [selectedTab, tabScales, tabUnderlineScales, onTabPress]
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.tabsScroll}
      style={styles.tabsBar}
    >
      {TABS.map((tab) => (
        <TouchableOpacity
          key={tab}
          onPress={() => handlePress(tab)}
          style={styles.tabItem}
          activeOpacity={1}
        >
          <Animated.Text
            style={[
              styles.tabText,
              selectedTab === tab && styles.tabActive,
              { transform: [{ scale: tabScales[tab] }] },
            ]}
          >
            {tab}
          </Animated.Text>
          <Animated.View
            style={[
              styles.tabUnderline,
              {
                transform: [{ scaleX: tabUnderlineScales[tab] }],
                opacity: tabUnderlineScales[tab],
              },
            ]}
          />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  tabsBar: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    marginHorizontal: 20,
    marginTop: 8,
  },
  tabsScroll: {
    gap: 20,
  },
  tabItem: {
    alignItems: 'center',
    paddingBottom: 2,
  },
  tabText: {
    color: 'rgba(0,0,0,0.45)',
    fontSize: ms(15),
    fontWeight: '500',
  },
  tabActive: {
    color: 'black',
    fontWeight: '800',
    fontSize: ms(16),
  },
  tabUnderline: {
    width: '100%',
    height: 2.5,
    backgroundColor: '#7c4dff',
    borderRadius: 3,
    marginTop: 8,
  },
});

export default FeedTabs;
