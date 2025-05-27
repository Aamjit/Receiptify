import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import React, { useState } from 'react';
import 'react-native-reanimated';

import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';
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
        {/* <SafeAreaView style={styles.container} edges={['top']}> */}
        <Stack initialRouteName='index'>
          <Stack.Screen name="index" options={{ headerShown: false, }} />
          <Stack.Screen name="IntroScreen" options={{ headerShown: false, }} />
          <Stack.Screen name="AuthScreen1" options={{ headerShown: false }} />
          <Stack.Screen name="OTPScreen" options={{ headerShown: false }} />
          <Stack.Screen name="AccountSetupScreen" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="CreateReceipt" options={{
            headerShown: true,
            title: "Create Receipt",
            headerStyle: { backgroundColor: "#fff" },
            headerTitleStyle: {
              color: "#000",
            },
            headerTitleAlign: "center",
            headerTintColor: "#007AFF",
          }} />
          <Stack.Screen name="PastReceipts" options={{
            headerShown: true,
            title: "Past Receipts",
            headerStyle: { backgroundColor: "#fff" },
            headerTitleStyle: {
              color: "#000",
            },
            headerTitleAlign: "center",
            headerTintColor: "#007AFF", // Example: blue color for back button and other icons
          }} />
          <Stack.Screen name="ActiveReceipts" options={{
            headerShown: true,
            title: "Active Receipts",
            headerStyle: { backgroundColor: "#fff" },
            headerTitleStyle: {
              color: "#000",
            },
            headerTitleAlign: "center",
            headerTintColor: "#007AFF", // Example: blue color for back button and other icons
          }} />
          <Stack.Screen name="ManageInventory" options={{
            headerShown: true,
            title: "Manage Inventory",
            headerStyle: { backgroundColor: "#fff" },
            headerTitleStyle: {
              color: "#000",
            },
            headerTitleAlign: "center",
            headerTintColor: "#007AFF", // Example: blue color for back button and other icons
          }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        {/* </SafeAreaView> */}
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


