import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import React from 'react';
import 'react-native-reanimated';
import { Stack } from 'expo-router';
import { StatusBar, StyleSheet } from 'react-native';
import { useColorScheme } from '../hooks/useColorScheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppProvider } from '../hooks/useApp';
import { Colors } from '@/constants/Colors';
// import * as NavigationBar from 'expo-navigation-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { wakeUpServer } from '@/api/wakeUpCall';

// Set the animation options. This is optional.
SplashScreen.setOptions({
  duration: 100,
  fade: true,
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  React.useEffect(() => {
    // Set to your tab bar color, e.g. Colors.theme.primary
    SystemUI.setBackgroundColorAsync(colorScheme !== 'light' ? Colors.theme.secondary : Colors.theme.primary);
  }, [colorScheme]);

  React.useEffect(() => {
    wakeUpServer();
  }, []);

  return (
    <AppProvider>
      <ThemeProvider value={colorScheme === 'light' ? DarkTheme : DefaultTheme} >
        <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
          <StatusBar
            animated={true}
            barStyle={colorScheme === 'light' ? 'dark-content' : 'dark-content'}
            backgroundColor={colorScheme === 'light' ? Colors.theme.primary : Colors.theme.secondary} />

          <Stack initialRouteName='index'>
            <Stack.Screen name="index" options={{ headerShown: false, }} />
            <Stack.Screen name="(screens)/IntroScreen" options={{ headerShown: false, }} />
            <Stack.Screen name="(screens)/AuthScreen" options={{ headerShown: false }} />
            <Stack.Screen name="(screens)/AccountSetupScreen" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(screens)/CreateReceipt" options={{
              headerShown: true,
              title: "Create Receipt",
              headerStyle: {
                backgroundColor: "#fff",
              },
              headerTitleStyle: {
                color: "#000",
              },
              headerTitleAlign: "center",
              headerTintColor: "#007AFF",
            }} />
            <Stack.Screen name="(screens)/PastReceipts" options={{
              headerShown: true,
              title: "Completed Receipts",
              headerStyle: { backgroundColor: "#fff" },
              headerTitleStyle: {
                color: "#000",
              },
              headerTitleAlign: "center",
              headerTintColor: "#007AFF",
            }} />
            <Stack.Screen name="(screens)/ActiveReceipts" options={{
              headerShown: true,
              title: "Active Receipts",
              headerStyle: { backgroundColor: "#fff" },
              headerTitleStyle: {
                color: "#000",
              },
              headerTitleAlign: "center",
              headerTintColor: "#007AFF",
            }} />
            <Stack.Screen name="(screens)/ManageInventory" options={{
              headerShown: true,
              title: "Manage Inventory",
              headerStyle: { backgroundColor: "#fff" },
              headerTitleStyle: {
                color: "#000",
              },
              headerTitleAlign: "center",
              headerTintColor: "#007AFF",
            }} />
            <Stack.Screen name="(screens)/ReportScreen" options={{
              headerShown: true,
              title: "Sales Report",
              headerStyle: { backgroundColor: "#fff" },
              headerTitleStyle: {
                color: "#000",
              },
              headerTitleAlign: "center",
              headerTintColor: "#007AFF",
            }} />
            <Stack.Screen name="(screens)/HowItWorksScreen" options={{
              headerShown: true,
              title: "Learn How It Works",
              headerStyle: { backgroundColor: "#fff" },
              headerTitleStyle: {
                color: "#000",
              },
              headerTitleAlign: "center",
              headerTintColor: "#007AFF",
            }} />
            <Stack.Screen name="+not-found" />
          </Stack>
        </SafeAreaView>
      </ThemeProvider >
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
    margin: 0,
  }
})


