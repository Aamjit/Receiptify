import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: () => (
          <BlurView
            tint={isDark ? 'dark' : 'light'}
            // intensity={isDark ? 40 : 80}
            style={[
              StyleSheet.absoluteFillObject,
              styles.tabBarBackground,
              { backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)' }
            ]}
          />
        ),
        tabBarVisibilityAnimationConfig: {
          show: {
            animation: 'spring',
          },
          hide: {
            animation: 'spring',
          },
        },
        tabBarStyle: {
          height: Platform.OS === 'android' ? 70 : 64,
          elevation: 0,
          borderTopWidth: 0,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          shadowColor: '#fff',
          shadowOffset: {
            width: 20,
            height: -4,
          },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        },
        tabBarItemStyle: {
          paddingVertical: 0,
          paddingHorizontal: 0,
          width: 'auto',
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          insetBlock: 4,
        },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={28}
              name={"house.fill"}
              color={color}
              style={focused ? styles.activeIcon : styles.icon}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={28}
              name={"person.crop.circle"}
              color={color}
              style={focused ? styles.activeIcon : styles.icon}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarBackground: {
    // overflow: 'hidden',
    padding: 0,
    margin: 0,
    backgroundColor: 'transparent',
    // borderTopLeftRadius: 24,
    // borderTopRightRadius: 24,
  },
  icon: {
    opacity: 0.8,
    transform: [{ scale: 1 }],
  },
  activeIcon: {
    opacity: 1,
    transform: [{ scale: 1.2 }],
  },
});
