import {Stack} from "expo-router";
import {initialWindowMetrics, SafeAreaProvider} from "react-native-safe-area-context";

export default function RootLayout() {
    return (<SafeAreaProvider initialMetrics={initialWindowMetrics} style={{backgroundColor:"#000000"}}>
        <Stack screenOptions={ { headerShown: false, animation: "slide_from_bottom", animationDuration: 100}}/>
    </SafeAreaProvider>)
}