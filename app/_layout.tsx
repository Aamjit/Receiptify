import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import React, { useState } from 'react';
import 'react-native-reanimated';

import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar, StyleSheet } from 'react-native';
import { AppContext } from '../hooks/useApp';
import { useColorScheme } from '../hooks/useColorScheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [User, setUser] = useState<FirebaseAuthTypes.User | null>(null);

  // if (!loaded || hasSeenIntro === null) {
  //   // Async font loading or AsyncStorage check only occurs in development.
  //   return null;
  // }

  return (
    <AppContext.Provider value={{ User, setUser }}>
      <ThemeProvider value={colorScheme === 'light' ? DarkTheme : DefaultTheme} >
        <StatusBar
          barStyle={colorScheme === 'light' ? 'dark-content' : 'light-content'}
          backgroundColor={colorScheme === 'light' ? '#f8f9fa' : 'rgba(0,0,0,0.5)'} />

        <Stack initialRouteName='index'>
          <Stack.Screen name="index" options={{ headerShown: false, }} />
          <Stack.Screen name="(screens)/IntroScreen" options={{ headerShown: false, }} />
          <Stack.Screen name="(screens)/AuthScreen" options={{ headerShown: false }} />
          <Stack.Screen name="(screens)/OTPScreen" options={{ headerShown: false }} />
          <Stack.Screen name="(screens)/AccountSetupScreen" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(screens)/CreateReceipt" options={{
            headerShown: true,
            title: "Create Receipt",
            headerStyle: { backgroundColor: "#fff" },
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
      </ThemeProvider >
    </AppContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
    margin: 0,
    backgroundColor: '#fff',
  }
})


