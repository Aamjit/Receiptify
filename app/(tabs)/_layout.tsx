import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useAppContext } from '@/hooks/useApp';
import { useColorScheme } from '@/hooks/useColorScheme';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import React from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { User } = useAppContext()
  const isDark = colorScheme === 'dark';
  const tabBarHeight = Platform.OS === 'android' ? 54 : 64;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tabIconSelected,
        tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: () => (
          <View
            // tint={isDark ? 'dark' : 'light'}
            style={[
              StyleSheet.absoluteFillObject,
              styles.tabBarBackground,
              { backgroundColor: isDark ? Colors.theme.secondary : Colors.theme.primary }
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
          height: tabBarHeight,
          position: 'absolute',
          backgroundColor: isDark ? Colors.theme.secondary : Colors.theme.primary,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          borderTopWidth: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 0,
          paddingHorizontal: 0,
          width: 'auto',
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarShowLabel: false,
          tabBarLabel: ({ children, focused }) => {
            return <Text style={[styles.tabBarLabelStyle, focused ? styles.activeIcon : styles.icon]}>{children}</Text>
          },
          tabBarIcon: ({ focused }) => (
            <IconSymbol
              size={30}
              name={"house.fill"}
              color={"#fbfbfb"}
              style={[focused ? styles.activeIcon : styles.icon]}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="account"
        options={{
          title: 'Profile',
          tabBarShowLabel: false,
          tabBarLabel: ({ children, focused }) => {
            return <Text style={[styles.tabBarLabelStyle, focused ? styles.activeIcon : styles.icon]}>{children}</Text>
          },
          tabBarIcon: ({ color, focused }) => {
            return User?.businessLogo.length > 0 ? <Image
              source={{ uri: User?.businessLogo }}
              width={30}
              height={30}
              style={[focused ? styles.activeIcon : styles.icon, { borderRadius: 60, borderWidth: 1, borderColor: '#555' }]}
            /> :
              <IconSymbol
                size={30}
                name={"person.crop.circle"}
                color={"#fbfbfb"}
                style={[focused ? styles.activeIcon : styles.icon]}
              />
          },
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarBackground: {
    borderTopWidth: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  icon: {
    opacity: 0.5,
    transform: [{ scale: 1 }],
  },
  activeIcon: {
    opacity: 1,
    transform: [{ scale: 1.2 }],
  },
  tabBarLabelStyle: {
    fontSize: 12,
    fontWeight: '500',
    insetBlock: 2,
    color: "#fbfbfb",
  }
});
