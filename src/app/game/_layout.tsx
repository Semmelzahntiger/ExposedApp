import {useConnection} from "@/main/connection_provider";
import {Redirect, Stack} from "expo-router";

export default function RootLayout() {
    const connection = useConnection();
    if(connection.connectionState != "connected") {
        return <Redirect href='/' />;
    }
    return <Stack/>
}