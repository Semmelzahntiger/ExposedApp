import { Stack } from "expo-router";
import {AuthProvider} from "@/main/auth";

export default function RootLayout() {
  return(
      <AuthProvider>
        <Stack screenOptions={ { headerShown: false}}/>
      </AuthProvider>
  );
}
