import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

export function ThemeToggle() {
  // Light mode only - theme toggle not needed
  return (
    <View>
      <Ionicons name="sunny" size={20} className="text-foreground" />
    </View>
  );
}
