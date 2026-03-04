import { Link, Stack } from "expo-router";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";

export default function NotFoundScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-[#2D313F] px-6">
      <Stack.Screen options={{ title: "Not Found", headerShown: false }} />

      {/* 404 badge */}
      <Animated.View
        entering={FadeInDown.duration(500).springify()}
        className="w-24 h-24 rounded-3xl bg-[#00B25A] items-center justify-center mb-8"
      >
        <Ionicons name="map-outline" size={52} color="white" />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).duration(500)} className="items-center mb-2">
        <Text className="text-[#00B25A] text-sm font-semibold tracking-[4px] uppercase mb-3">
          404
        </Text>
        <Text className="text-white text-3xl font-bold text-center mb-3">
          Page not found
        </Text>
        <Text className="text-[#B4BEC5] text-base text-center leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(200).duration(500)} className="mt-8 w-full max-w-xs">
        <Link href="/(app)" asChild replace>
          <Button>
            <Text>Go to Dashboard</Text>
          </Button>
        </Link>
      </Animated.View>
    </View>
  );
}
