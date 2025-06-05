import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import React from 'react';
import 'react-native-reanimated';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar, StyleSheet } from 'react-native';
import { useColorScheme } from '../hooks/useColorScheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppProvider } from '../hooks/useApp';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <AppProvider>
      <ThemeProvider value={colorScheme === 'light' ? DarkTheme : DefaultTheme} >
        <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
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


