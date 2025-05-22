import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import React from 'react';
import 'react-native-reanimated';

import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useColorScheme } from '../hooks/useColorScheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });


  // const [hasSeenIntro, setHasSeenIntro] = useState<boolean | null>(null);

  // useEffect(() => {
  //   const checkIntro = async () => {
  //     try {
  //       const value = await AsyncStorage.getItem('hasSeenIntro');
  //       setHasSeenIntro(value === 'true');
  //     } catch (e) {
  //       setHasSeenIntro(false);
  //     }
  //   };
  //   checkIntro();
  // }, []);

  // if (!loaded || hasSeenIntro === null) {
  //   // Async font loading or AsyncStorage check only occurs in development.
  //   return null;
  // }

  // return (
  //   <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme} >
  //     <Stack>
  //       {/* {!hasSeenIntro ? (
  //         <Stack.Screen name="intro" options={{ headerShown: false }} />
  //       ) : (
  //         <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
  //       )} */}
  //       <Stack.Screen name="intro" options={{ headerShown: false }} />
  //       {/* <Stack.Screen name="(tabs)" options={{ headerShown: false }} /> */}
  //       {/* <Stack.Screen name="+not-found" /> */}
  //     </Stack>
  //     <StatusBar style="auto" />
  //   </ThemeProvider>
  // );

  return (
    <ThemeProvider value={colorScheme === 'light' ? DarkTheme : DefaultTheme} >
      {/* <SafeAreaView style={styles.container} edges={['top']}> */}
      <Stack>

        <Stack.Screen name="(screens)/intro" options={{ headerShown: false }} />
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
          title: "Past Receipts",
          headerStyle: { backgroundColor: "#fff" },
          headerTitleStyle: {
            color: "#000",
          },
          headerTitleAlign: "center",
          headerTintColor: "#007AFF", // Example: blue color for back button and other icons
        }} />
        <Stack.Screen name="(screens)/ActiveReceipts" options={{
          headerShown: true,
          title: "Active Receipts",
          headerStyle: { backgroundColor: "#fff" },
          headerTitleStyle: {
            color: "#000",
          },
          headerTitleAlign: "center",
          headerTintColor: "#007AFF", // Example: blue color for back button and other icons
        }} />
        <Stack.Screen name="(screens)/ManageInventory" options={{
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
