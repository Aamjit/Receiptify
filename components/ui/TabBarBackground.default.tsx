import { BlurView } from "expo-blur";
import { StyleSheet } from "react-native";

// This is a shim for web and Android where the tab bar is generally opaque.
export default undefined;

export function useBottomTabOverflow() {
  // return <BlurView style={styles.container}></BlurView>;
  return <BlurView
    // System chrome material automatically adapts to the system's theme
    // and matches the native tab bar appearance on iOS.
    tint="systemChromeMaterial"
    intensity={100}
    style={StyleSheet.absoluteFill}
  />
}
