import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// F11.E18: Expo Push registration. The host app calls
// `registerForPushNotifications(register)` once after auth; `register`
// is the tRPC mutation `mobile.registerPushToken({token, platform})`
// supplied by the caller so this module stays free of a tRPC import.

export type PushTokenSink = (input: {
  token: string;
  platform: "ios" | "android";
}) => Promise<unknown>;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(
  sink: PushTokenSink,
): Promise<{ token: string } | { skipped: string }> {
  if (!Device.isDevice) {
    return { skipped: "simulator_or_emulator" };
  }

  const existing = await Notifications.getPermissionsAsync();
  let granted = existing.granted;
  if (!granted) {
    const requested = await Notifications.requestPermissionsAsync();
    granted = requested.granted;
  }
  if (!granted) {
    return { skipped: "permission_denied" };
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const result = await Notifications.getExpoPushTokenAsync();
  const platform = Platform.OS === "ios" ? "ios" : "android";
  await sink({ token: result.data, platform });
  return { token: result.data };
}
