import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";

export default function CatchAll() {
  useEffect(() => {
    // Redirect any unmatched route to the welcome screen.
    // Router may not be mounted yet; retry until ready to avoid errors.
    let mounted = true;
    const tryReplace = () => {
      try {
        router.replace("/(auth)/welcome");
      } catch (err) {
        if (!mounted) return;
        setTimeout(tryReplace, 50);
      }
    };

    tryReplace();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Redirecting...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  text: { fontSize: 16, color: "#444" },
});
