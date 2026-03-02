import { View } from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/Container";

export default function PaymentFailureScreen() {
  const { reason } = useLocalSearchParams<{ reason?: string }>();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Container isScrollable={false}>
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-20 h-20 rounded-full bg-destructive/10 items-center justify-center mb-6">
            <Ionicons name="close-circle" size={50} color="hsl(0 84.2% 60.2%)" />
          </View>

          <Text className="text-foreground text-xl font-bold text-center">
            Payment Failed
          </Text>
          <Text className="text-muted-foreground text-sm text-center mt-2">
            {reason ?? "Your payment could not be processed. Please try again."}
          </Text>

          <Button
            className="mt-8 w-full"
            size="lg"
            onPress={() => router.replace("/(app)/billing/plans" as any)}
          >
            <Text className="text-primary-foreground font-semibold">
              Try Again
            </Text>
          </Button>
          <Button
            variant="outline"
            className="mt-3 w-full"
            size="lg"
            onPress={() => router.replace("/(app)/(tabs)" as any)}
          >
            <Text className="text-foreground font-semibold">
              Back to App
            </Text>
          </Button>
        </View>
      </Container>
    </>
  );
}
