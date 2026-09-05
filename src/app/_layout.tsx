import { Stack } from "expo-router";
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";
import {AuthProvider} from "@/main/auth_provider";
import {ConnectionProvider} from "@/main/connection_provider";

export default function RootLayout() {
  return(
      <SafeAreaProvider initialMetrics={initialWindowMetrics} style={{backgroundColor:"#000000"}}>
        <AuthProvider>
            <ConnectionProvider>
                <Stack screenOptions={ { headerShown: false, animation: "none"}}/>
            </ConnectionProvider>
        </AuthProvider>
      </SafeAreaProvider>
  );
}
