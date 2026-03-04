import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { File } from "expo-file-system";
import { api, http } from "@/lib/api";
import { toast } from "@/lib/toast";

export type UploadFolder = "logos" | "products" | "avatars";

/**
 * Pick a square (1:1) image, resize it, and upload it to R2.
 * Returns the public URL of the uploaded image, or null if the user cancelled
 * or an error occurred.
 */
export async function pickAndUploadSquareImage(
    folder: UploadFolder,
    options?: { size?: number },
): Promise<string | null> {
    const size = options?.size ?? 512;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
        toast.error("Allow photo library access to upload an image.");
        return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
    });

    if (result.canceled || !result.assets[0]) return null;

    // Resize to square
    const manipulated = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: size, height: size } }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG },
    );

    // Get presigned URL
    const { uploadUrl, publicUrl } = await api.post<{ uploadUrl: string; publicUrl: string }>(
        "/uploads/presign",
        { folder, contentType: "image/jpeg" },
    );

    // Read as base64 and upload
    const file = new File(manipulated.uri);
    const base64Data = await file.base64();
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    const uploadResponse = await http.put(uploadUrl, bytes, {
        headers: { "Content-Type": "image/jpeg" },
        withCredentials: false,
    });

    if (uploadResponse.status < 200 || uploadResponse.status >= 300) {
        throw new Error("Image upload failed with status " + uploadResponse.status);
    }

    return publicUrl;
}
