import { useEffect } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";

import { Text } from "@/components/ui/text";
import { useAuthStore } from "@/store/auth";

export default function LoadingScreen() {
  const router = useRouter();
  const initialize = useAuthStore((s) => s.initialize);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Logo pulse
  const scale = useSharedValue(1);

  // Three loading dots
  const dot1 = useSharedValue(0.3);
  const dot2 = useSharedValue(0.3);
  const dot3 = useSharedValue(0.3);

  useEffect(() => {
    // Gentle logo pulse
    scale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );

    // Cascading dot animation
    const dotAnim = (sv: typeof dot1, delay: number) => {
      sv.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 350, easing: Easing.out(Easing.ease) }),
            withTiming(0.3, { duration: 350, easing: Easing.in(Easing.ease) }),
            withDelay(700, withTiming(0.3, { duration: 0 })),
          ),
          -1,
          false,
        ),
      );
    };

    dotAnim(dot1, 0);
    dotAnim(dot2, 350);
    dotAnim(dot3, 700);
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isInitialized) {
      router.replace(isAuthenticated ? ("/(app)" as any) : ("/(auth)/login" as any));
    }
  }, [isInitialized, isAuthenticated]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const d1Style = useAnimatedStyle(() => ({ opacity: dot1.value }));
  const d2Style = useAnimatedStyle(() => ({ opacity: dot2.value }));
  const d3Style = useAnimatedStyle(() => ({ opacity: dot3.value }));

  return (
    <View className="flex-1 items-center justify-center bg-[#2D313F]">
      {/* Logo block */}
      <Animated.View
        entering={FadeInDown.duration(500).springify()}
        style={logoStyle}
        className="items-center mb-16"
      >
        {/* Icon badge */}
        <View className="w-24 h-24 rounded-3xl bg-[#00B25A] items-center justify-center mb-6 shadow-2xl">
          <Text className="text-5xl">🏪</Text>
        </View>

        {/* Wordmark */}
        <Text className="text-4xl font-bold text-white tracking-tight mb-1">
          EasyPOS
        </Text>
        <Text className="text-xs text-[#B4BEC5] tracking-[4px] uppercase">
          Point of Sale
        </Text>
      </Animated.View>

      {/* Loading dots */}
      <Animated.View entering={FadeIn.delay(300).duration(400)} className="flex-row gap-2">
        <Animated.View style={d1Style} className="w-2 h-2 rounded-full bg-[#00B25A]" />
        <Animated.View style={d2Style} className="w-2 h-2 rounded-full bg-[#00B25A]" />
        <Animated.View style={d3Style} className="w-2 h-2 rounded-full bg-[#00B25A]" />
      </Animated.View>
    </View>
  );
}
