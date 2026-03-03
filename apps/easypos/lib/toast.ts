import { toast as sonner } from "sonner-native";

// Typed toast helpers that match the app's brand palette
// Always pass a short title; description is optional detail
export const toast = {
    success: (message: string, description?: string) =>
        sonner.success(message, { description }),
    error: (message: string, description?: string) =>
        sonner.error(message, { description }),
    info: (message: string, description?: string) =>
        sonner(message, { description }),
    warning: (message: string, description?: string) =>
        sonner.warning(message, { description }),
};
