import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Platform, Pressable } from "react-native";
import Animated, { FadeOut, ZoomIn } from "react-native-reanimated";
import { useColorScheme } from "nativewind";

export function ThemeToggle() {
  const { colorScheme, toggleColorScheme } = useColorScheme();

  return (
    <Pressable
      onPress={() => {
        if (Platform.OS === "ios") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        toggleColorScheme();
      }}
      className="px-2.5"
    >
      {colorScheme === "light" ? (
        <Animated.View key="moon" entering={ZoomIn} exiting={FadeOut}>
          <Ionicons name="moon" size={20} className="text-foreground" />
        </Animated.View>
      ) : (
        <Animated.View key="sun" entering={ZoomIn} exiting={FadeOut}>
          <Ionicons name="sunny" size={20} className="text-foreground" />
        </Animated.View>
      )}
    </Pressable>
  );
}
