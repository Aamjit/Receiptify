import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useAppContext } from '@/hooks/useApp';
import { useColorScheme } from '@/hooks/useColorScheme';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import React from 'react';
import { Image, Platform, StyleSheet } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { User } = useAppContext()
  const isDark = colorScheme === 'dark';
  const tabBarHeight = Platform.OS === 'android' ? 70 : 64;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tabIconSelected,
        tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: () => (
          <BlurView
            tint={isDark ? 'dark' : 'light'}
            style={[
              StyleSheet.absoluteFillObject,
              styles.tabBarBackground,
              { backgroundColor: isDark ? 'rgba(43, 43, 43, 0.5)' : 'rgba(255,255,255,0.7)' }
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
          elevation: 0,
          backgroundColor: 'transparent',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          borderTopColor: 'transparent',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          shadowColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.1)',
          shadowRadius: 20,
          shadowOpacity: 0.1,
          borderTopWidth: 0,
          shadowOffset: {
            width: 20,
            height: -4,
          },
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
          insetBlock: 2,
        },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={30}
              name={"house.fill"}
              color={color}
              style={[focused ? styles.activeIcon : styles.icon]}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="account"
        options={{
          title: 'Profile',
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
                color={color}
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
    padding: 0,
    margin: 0,
    backgroundColor: 'transparent',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    shadowColor: 'rgba(53, 53, 53, 0.1)',
    shadowRadius: 20,
    shadowOpacity: 0.1,
    shadowOffset: {
      width: 0,
      height: -4,
    },
    elevation: 0,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000, // Ensure it appears above other content
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
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
