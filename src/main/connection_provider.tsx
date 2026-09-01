import {Context, createContext, Dispatch, ReactNode, SetStateAction, useContext, useEffect, useRef, useState} from "react";
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
    const { isLoggedIn, isInitialLogin , logOut} = useAuth();
    const [connectionState, setConnectionState] : [ConnectionState, Dispatch<SetStateAction<ConnectionState>>] = useState<ConnectionState>("disconnected");
    useEffect(() => {
        (async () => {
            if(isInitialLogin && connectionState === "disconnected") {
                console.log("Already logged in, establishing Connection");
                await establishConnection(setConnectionState, logOut);
            }
        })();
    }, [isInitialLogin]);

    // Android backgrounds the app while the native file picker (or any external
    // activity) is open, which can drop the websocket ("Connection Reset"). We
    // can't keep a backgrounded socket alive from JS, so reconnect on return to
    // the foreground if the connection was lost while we were logged in.
    const stateRef = useRef(connectionState);
    stateRef.current = connectionState;
    useEffect(() => {
        const sub = AppState.addEventListener("change", (state) => {
            const lost = stateRef.current !== "connected" && stateRef.current !== "connecting";
            if (state === "active" && isLoggedIn && lost) {
                console.log("Returned to foreground with a dropped socket — reconnecting");
                establishConnection(setConnectionState, logOut);
            }
        });
        return () => sub.remove();
    }, [isLoggedIn]);

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