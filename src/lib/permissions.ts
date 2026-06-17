import { Camera } from "expo-camera";
import { Platform, PermissionsAndroid } from "react-native";

export async function requestAudioPermission(): Promise<boolean> {
  try {
    if (Platform.OS === "android") {
      const result = await PermissionsAndroid.request(
        "android.permission.RECORD_AUDIO"
      );
      return result === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  } catch {
    return false;
  }
}

export async function requestCameraPermission(): Promise<boolean> {
  try {
    const current = await Camera.getCameraPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    const result = await Camera.requestCameraPermissionsAsync();
    return result.granted;
  } catch {
    return false;
  }
}

export async function ensurePermissions(
  types: Array<"audio" | "camera">
): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {};

  if (types.includes("audio")) {
    results.audio = await requestAudioPermission();
  }
  if (types.includes("camera")) {
    results.camera = await requestCameraPermission();
  }

  return results;
}
