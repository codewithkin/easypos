import { Link, Stack } from "expo-router";
import { Text, View } from "react-native";

import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not Found" }} />
      <Container>
        <View className="flex-1 justify-center items-center p-4">
          <View className="items-center p-6 max-w-sm rounded-2xl bg-card border border-border">
            <Text className="text-4xl mb-3">🤔</Text>
            <Text className="text-foreground font-semibold text-lg mb-1">Page Not Found</Text>
            <Text className="text-muted-foreground text-sm text-center mb-5">
              The page you're looking for doesn't exist.
            </Text>
            <Link href="/" asChild>
              <Button>
                <Text className="text-primary-foreground font-medium">Go Home</Text>
              </Button>
            </Link>
          </View>
        </View>
      </Container>
    </>
  );
}
            </Link >
          </Surface >
        </View >
      </Container >
    </>
  );
}
