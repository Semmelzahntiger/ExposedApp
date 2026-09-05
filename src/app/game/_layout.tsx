import {useConnection} from "@/main/connection_provider";
import {Redirect, router, Stack, Tabs} from "expo-router";
import {useEffect} from "react";
import {addListener} from "@/main/connection_data";
import {initialWindowMetrics, SafeAreaProvider} from "react-native-safe-area-context";
import {logger} from "react-native-reanimated/src/common";

export default function RootLayout() {
    useEffect(() => {
        const listeners = [
            addListener("confirm_create_room", (msg) => {
                console.log("Room creation successful")
                router.replace("/game/room");
            }),
            addListener("denied_create_room", (msg) => {
                console.log("Room creation denied. " + msg.reason)
                // Todo: Pop Up Error Logic
            }),
            addListener("confirm_join_room", (msg) => {
                console.log("Joined room.")
                router.replace("/game/room");
            }),
            addListener("denied_join_room", (msg) => {
                console.log("Couldn't join Room. " + msg.error)
                // Todo: Pop Up Error Logic
            }),
            addListener("room_not_found", (msg) => {
                console.log("Room not found")
                // Todo: Pop Up Error Logic
            }),
            addListener("confirm_leave_room",(msg) => {
                console.log("Left Room")
                router.replace("/game/game_menu")
            })
        ]
        return () => listeners.forEach(close => close());
    })
    const connection = useConnection();

    if(connection.connectionState != "connected") {
        return <Redirect href='/' />;
    }
    return  (<SafeAreaProvider initialMetrics={initialWindowMetrics} style={{backgroundColor:"#000000"}}>
        <Stack screenOptions={ { headerShown: false, animation: "none"}}/>
    </SafeAreaProvider>)
}