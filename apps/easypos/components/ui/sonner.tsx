import { Toaster as SonnerToaster } from "sonner-native";

export function Toaster() {
    return (
        <SonnerToaster
            position="bottom-center"
            theme="light"
            richColors
            toastOptions={{
                style: { borderRadius: 12 },
            }}
        />
    );
}
