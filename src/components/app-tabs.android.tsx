import { BlurTargetView, BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { Heart, House, ListMusic, Search, User } from 'lucide-react-native';
import {
  type ComponentRef,
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';

import { Colors, Fonts } from '@/constants/theme';

interface TabItemConfig {
  name: string;
  label: string;
  IconComponent: typeof House;
}

const TAB_CONFIGS: Record<string, TabItemConfig> = {
  home: {
    name: 'home',
    label: 'Início',
    IconComponent: House,
  },
  search: {
    name: 'search',
    label: 'Pesquisa',
    IconComponent: Search,
  },
  favorites: {
    name: 'favorites',
    label: 'Favoritos',
    IconComponent: Heart,
  },
  playlists: {
    name: 'playlists',
    label: 'Playlists',
    IconComponent: ListMusic,
  },
  profile: {
    name: 'profile',
    label: 'Perfil',
    IconComponent: User,
  },
};

interface TabBarPropsStore {
  getSnapshot: () => BottomTabBarProps | null;
  update: (nextProps: BottomTabBarProps) => void;
  subscribe: (listener: () => void) => () => void;
}

function createTabBarPropsStore(): TabBarPropsStore {
  let currentProps: BottomTabBarProps | null = null;
  const listeners = new Set<() => void>();

  return {
    getSnapshot: () => currentProps,
    update: (nextProps: BottomTabBarProps) => {
      currentProps = nextProps;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/**
 * Sincroniza as props do BottomTabBar para fora do BlurTargetView.
 * No Android (Dimezis BlurView), o BlurView NUNCA pode estar dentro do
 * BlurTargetView que ele próprio referencia, devendo ser um irmão (sibling)
 * renderizado após o BlurTargetView.
 */
function TabBarPropsBridge({
  store,
  state,
  descriptors,
  emitter,
  navigateToTab,
  insets,
}: BottomTabBarProps & { store: TabBarPropsStore }) {
  const { top, right, bottom, left } = insets;

  useLayoutEffect(() => {
    store.update({
      state,
      descriptors,
      emitter,
      navigateToTab,
      insets: { top, right, bottom, left },
    });
  }, [
    store,
    state,
    descriptors,
    emitter,
    navigateToTab,
    top,
    right,
    bottom,
    left,
  ]);

  return null;
}

interface CustomAndroidTabBarProps extends BottomTabBarProps {
  blurTarget: RefObject<ComponentRef<typeof View> | null>;
  isBlurReady: boolean;
}

function CustomAndroidTabBar({
  state,
  descriptors,
  emitter,
  navigateToTab,
  insets,
  blurTarget,
  isBlurReady,
}: CustomAndroidTabBarProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  // Espaçamento da base flutuante respeitando o safe area do Android
  const bottomMargin = (insets.bottom > 0 ? insets.bottom : 8) + 8;

  return (
    <View
      accessibilityRole="tablist"
      aria-label="Navegação principal"
      style={[
        styles.outerShadowWrapper,
        {
          bottom: bottomMargin,
          shadowColor: isDark ? '#000000' : 'rgba(10, 40, 25, 0.22)',
        },
      ]}>
      <BlurView
        blurTarget={blurTarget}
        blurMethod={isBlurReady ? 'dimezisBlurView' : 'none'}
        intensity={70}
        blurReductionFactor={10}
        tint={isDark ? 'systemUltraThinMaterialDark' : 'light'}
        style={[
          styles.navContainer,
          {
            backgroundColor: isDark
              ? 'rgba(18, 24, 20, 0.24)'
              : 'rgba(255, 255, 255, 0.20)',
            borderColor: isDark
              ? 'rgba(255, 255, 255, 0.16)'
              : 'rgba(255, 255, 255, 0.85)',
          },
        ]}>
        <View style={styles.itemsRow}>
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const descriptor = descriptors[route.key];
            const options = descriptor?.options;
            const config = TAB_CONFIGS[route.name] || {
              name: route.name,
              label: route.name,
              IconComponent: House,
            };

            const IconComponent = config.IconComponent;
            const label =
              typeof options?.title === 'string'
                ? options.title
                : config.label;

            const onPress = () => {
              const event = emitter.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigateToTab(route.key);
              }
            };

            const onLongPress = () => {
              emitter.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            const activeItemBg = isDark
              ? 'rgba(4, 211, 97, 0.24)'
              : 'rgba(4, 211, 97, 0.18)';
            const activeBorder = isDark
              ? 'rgba(4, 211, 97, 0.45)'
              : 'rgba(4, 211, 97, 0.34)';

            const iconColor = isFocused
              ? colors.accent
              : isDark
                ? 'rgba(255, 255, 255, 0.65)'
                : 'rgba(10, 40, 25, 0.65)';

            const textColor = isFocused
              ? colors.accent
              : isDark
                ? 'rgba(255, 255, 255, 0.70)'
                : 'rgba(10, 40, 25, 0.70)';

            return (
              <Pressable
                key={route.key}
                accessibilityRole="tab"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={label}
                testID={options?.tabBarButtonTestID}
                onPress={onPress}
                onLongPress={onLongPress}
                android_ripple={{
                  color: 'rgba(4, 211, 97, 0.2)',
                  borderless: false,
                  foreground: true,
                }}
                style={styles.navItemPressable}>
                <View
                  style={[
                    styles.navItem,
                    isFocused && {
                      backgroundColor: activeItemBg,
                      borderColor: activeBorder,
                    },
                  ]}>
                  <IconComponent
                    size={21}
                    color={iconColor}
                    strokeWidth={isFocused ? 2.3 : 1.9}
                  />
                  <Text
                    style={[
                      styles.itemLabel,
                      {
                        color: textColor,
                        fontFamily: isFocused ? Fonts.semiBold : Fonts.medium,
                      },
                    ]}
                    numberOfLines={1}>
                    {label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

function ExternalAndroidTabBar({
  store,
  blurTarget,
  isBlurReady,
}: {
  store: TabBarPropsStore;
  blurTarget: RefObject<ComponentRef<typeof View> | null>;
  isBlurReady: boolean;
}) {
  const tabBarProps = useSyncExternalStore(store.subscribe, store.getSnapshot);

  if (!tabBarProps) {
    return null;
  }

  return (
    <CustomAndroidTabBar
      {...tabBarProps}
      blurTarget={blurTarget}
      isBlurReady={isBlurReady}
    />
  );
}

export default function AppTabsAndroid() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const tabBarStore = useMemo(() => createTabBarPropsStore(), []);
  const [blurTarget, setBlurTarget] = useState<
    RefObject<ComponentRef<typeof View> | null>
  >({ current: null });
  const [isBlurReady, setIsBlurReady] = useState(false);

  const handleBlurTargetRef = useCallback(
    (node: ComponentRef<typeof View> | null) => {
      if (node) {
        setBlurTarget({ current: node });
      }
    },
    []
  );

  useEffect(() => {
    if (!blurTarget.current) {
      return;
    }
    const rafId = requestAnimationFrame(() => {
      setIsBlurReady(true);
    });
    return () => cancelAnimationFrame(rafId);
  }, [blurTarget]);

  return (
    <View style={[styles.rootContainer, { backgroundColor: colors.background }]}>
      <BlurTargetView
        ref={handleBlurTargetRef}
        style={[styles.blurTarget, { backgroundColor: colors.background }]}>
        <Tabs
          tabBar={(props) => (
            <TabBarPropsBridge {...props} store={tabBarStore} />
          )}
          screenOptions={{
            headerShown: false,
          }}>
          <Tabs.Screen name="home" options={{ title: 'Início' }} />
          <Tabs.Screen name="search" options={{ title: 'Pesquisa' }} />
          <Tabs.Screen name="favorites" options={{ title: 'Favoritos' }} />
          <Tabs.Screen name="playlists" options={{ title: 'Playlists' }} />
          <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
        </Tabs>
      </BlurTargetView>

      <ExternalAndroidTabBar
        store={tabBarStore}
        blurTarget={blurTarget}
        isBlurReady={isBlurReady}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  blurTarget: {
    flex: 1,
  },
  outerShadowWrapper: {
    position: 'absolute',
    left: 14,
    right: 14,
    height: 68,
    borderRadius: 34,
    elevation: 12,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    zIndex: 90,
  },
  navContainer: {
    flex: 1,
    height: 68,
    padding: 6,
    borderRadius: 34,
    borderWidth: 1,
    overflow: 'hidden',
  },
  itemsRow: {
    flex: 1,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    zIndex: 2,
  },
  navItemPressable: {
    flex: 1,
    height: 54,
    borderRadius: 27,
    overflow: 'hidden',
  },
  navItem: {
    flex: 1,
    width: '100%',
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  itemLabel: {
    fontSize: 10.5,
    textAlign: 'center',
    marginTop: 2,
  },
});
