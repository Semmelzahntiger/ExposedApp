import {Context, createContext, Dispatch, ReactNode, SetStateAction, useContext, useEffect, useState} from "react";
import {AppState} from "react-native";
import {useAuth} from "@/main/auth_provider";
import {establishConnection, disconnect as disconnectSocket} from "@/main/connection_data";

export type ConnectionState = "connecting" | "connected" | "disconnected" | "connection_closed";

export type ConnectionValue = {
    connectionState : ConnectionState
    connect: () => void;
    disconnect: () => void;
}
const ConnectionContext : Context<ConnectionValue | null> = createContext<ConnectionValue | null>(null);

export function ConnectionProvider({children}: {children : ReactNode}) {
    const { isInitialLogin , logOut} = useAuth();
    const [connectionState, setConnectionState] : [ConnectionState, Dispatch<SetStateAction<ConnectionState>>] = useState<ConnectionState>("disconnected");
    useEffect(() => {
        (async () => {
            if(isInitialLogin && connectionState === "disconnected") {
                console.log("Already logged in, establishing Connection");
                await establishConnection(setConnectionState, logOut);
            }
        })();
    }, [isInitialLogin]);
    // Close the socket when the app is backgrounded. React Native has no reliable
    // "app terminated" event, and "background" is the last signal delivered before
    // the OS suspends/kills the app — closing here prevents a server-side session
    // from lingering and blocking the next login (backend denies duplicate auth).
    useEffect(() => {
        const sub = AppState.addEventListener("change", (state) => {
            if (state === "background") {
                console.log("App backgrounded — closing websocket");
                disconnectSocket();
                setConnectionState("disconnected");
            }
        });
        return () => sub.remove();
    }, []);

    const connect = async () => {
        await establishConnection(setConnectionState, logOut);
    };
    const disconnect = async () => {
        disconnectSocket();
        setConnectionState("connection_closed");
    };
    return (
        <ConnectionContext.Provider
        value = {{connectionState, connect, disconnect}}>
        {children}
        </ConnectionContext.Provider>
    );
}
export function useConnection() : ConnectionValue {
    const ctx = useContext(ConnectionContext);
    if(!ctx) throw new Error("useConnection must be used inside ConnectionProvider")
    return ctx;
}