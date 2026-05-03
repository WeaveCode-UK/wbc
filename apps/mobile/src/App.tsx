import { registerRootComponent } from "expo";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from "react-native";
import {
  useFonts,
  Sora_400Regular,
  Sora_500Medium,
  Sora_600SemiBold,
  Sora_700Bold,
} from "@expo-google-fonts/sora";
import {
  Epilogue_600SemiBold,
  Epilogue_700Bold,
  Epilogue_800ExtraBold,
} from "@expo-google-fonts/epilogue";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_700Bold,
} from "@expo-google-fonts/manrope";
import { NativeThemeProvider, useTheme } from "@wbc/ui-native";
import { BottomTabBar } from "./navigation/bottom-tab-bar";
import { MyDayScreen } from "./screens/my-day-screen";
import { ClientsListScreen } from "./screens/clients-list-screen";
import { ClientProfileScreen } from "./screens/client-profile-screen";
import { NewSaleScreen } from "./screens/new-sale-screen";
import { SalesListScreen } from "./screens/sales-list-screen";
import { ScheduleScreen } from "./screens/schedule-screen";
import { FinanceScreen } from "./screens/finance-screen";
import { CampaignsScreen } from "./screens/campaigns-screen";
import { MenuScreen } from "./screens/menu-screen";
import { SettingsThemeScreen } from "./screens/settings-theme-screen";
import { OnboardingScreen } from "./screens/onboarding-screen";
import { registerForPushNotifications } from "./lib/push-notifications";
import { useOnlineSync } from "./lib/use-online-sync";
import { useTenantId } from "./lib/tenant-context";
import {
  trpc as trpcClient,
  sendMutation,
  getStoredToken,
  clearToken,
} from "./lib/trpc-client";
import { useHydration } from "./lib/use-hydration";
import { LoginScreen } from "./screens/login-screen";

function TopAppBar() {
  const { md3: c } = useTheme();
  return (
    <View style={[styles.topBar, { backgroundColor: c.surface + "CC" }]}>
      <View style={styles.topBarLeft}>
        <View
          style={[styles.topBarAvatar, { backgroundColor: c.primaryContainer }]}
        >
          <Text style={styles.topBarAvatarText}>EV</Text>
        </View>
        <Text style={styles.topBarLogo}>WBC</Text>
      </View>
      <TouchableOpacity>
        <Text style={[styles.topBarIcon, { color: c.primaryContainer }]}>
          notifications
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function AppContent({ onSignOut }: { onSignOut: () => void }) {
  const { md3: c } = useTheme();
  const [activeTab, setActiveTab] = useState("myday");
  const [showOnboarding] = useState(false);
  const tenantId = useTenantId();

  // F11 follow-up: real Expo Push registration. The sink now hits
  // platform.registerPushToken so the worker's notification fan-out
  // (F11.E25) actually has tokens to push to.
  useEffect(() => {
    void registerForPushNotifications(async ({ token, platform }) => {
      try {
        await trpcClient.platform.registerPushToken.mutate({
          token,
          platform,
        });
      } catch (err) {
        if (typeof console !== "undefined") {
          console.warn("[wbc] push token register failed:", err);
        }
      }
    });
  }, []);

  // F11 follow-up: real SQLite mutation queue drain. `sendMutation`
  // routes operation strings through the typed tRPC client.
  useOnlineSync(tenantId, sendMutation);

  // F11 follow-up: warm SQLite cache from the server right after auth.
  // Subsequent renders read from offline-repos and ignore the mock
  // fallback because the cache now has rows.
  useHydration(tenantId);

  if (showOnboarding) {
    return <OnboardingScreen />;
  }

  const renderScreen = () => {
    switch (activeTab) {
      case "myday":
        return <MyDayScreen />;
      case "clients":
        return <ClientsListScreen />;
      case "sales":
        return <SalesListScreen />;
      case "menu":
        return <MenuScreen onSignOut={onSignOut} />;
      default:
        return <MyDayScreen />;
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.surface }]}>
      <TopAppBar />
      {renderScreen()}
      <BottomTabBar activeTab={activeTab} onTabPress={setActiveTab} />
    </SafeAreaView>
  );
}

function App() {
  const [fontsLoaded] = useFonts({
    Sora_400Regular,
    Sora_500Medium,
    Sora_600SemiBold,
    Sora_700Bold,
    Epilogue_600SemiBold,
    Epilogue_700Bold,
    Epilogue_800ExtraBold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_700Bold,
  });
  const [authState, setAuthState] = useState<"loading" | "in" | "out">(
    "loading",
  );

  // F11 follow-up: hydrate auth from secure-store on cold start. The
  // stored JWT is good for 30 days (auth.signInForMobile) so the user
  // only sees the LoginScreen on first launch / after explicit sign-out.
  useEffect(() => {
    void getStoredToken().then((t) => setAuthState(t ? "in" : "out"));
  }, []);

  const handleSignOut = async () => {
    await clearToken();
    setAuthState("out");
  };

  if (!fontsLoaded || authState === "loading") {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#8127E8" />
      </View>
    );
  }

  return (
    <NativeThemeProvider>
      {authState === "in" ? (
        <AppContent onSignOut={handleSignOut} />
      ) : (
        <LoginScreen onAuthenticated={() => setAuthState("in")} />
      )}
    </NativeThemeProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FB",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 12,
  },
  topBarLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  topBarAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  topBarAvatarText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Sora",
  },
  topBarLogo: {
    fontFamily: "Epilogue",
    fontSize: 20,
    fontWeight: "800",
    color: "#8127E8",
    letterSpacing: -0.5,
  },
  topBarIcon: { fontSize: 24, fontFamily: "Material Symbols Outlined" },
});

registerRootComponent(App);
