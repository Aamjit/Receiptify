import { StyleSheet } from "react-native";

// This is a shim for web and Android where the tab bar is generally opaque.
export default undefined;

export function useBottomTabOverflow() {
  // return <BlurView style={styles.container}></BlurView>;
  return 0
}


const styles = StyleSheet.create({
  container: {
    // flex: 1,
    backgroundColor: '#fff',
  }
})