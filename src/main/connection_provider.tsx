import {Context, createContext, Dispatch, ReactNode, SetStateAction, useContext, useEffect, useRef, useState} from "react";
import {AppState} from "react-native";
import {useAuth} from "@/main/auth_provider";
import {establishConnection, disconnect as disconnectSocket} from "@/main/connection_data";

export type ConnectionState = "connecting" | "connected" | "disconnected" | "connection_closed";

export type ConnectionValue = {
    connectionState : ConnectionState
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
}
const ConnectionContext : Context<ConnectionValue | null> = createContext<ConnectionValue | null>(null);

export function ConnectionProvider({children}: {children : ReactNode}) {
    const {isLoggedIn, logOut} = useAuth();
    const [connectionState, setConnectionState] : [ConnectionState, Dispatch<SetStateAction<ConnectionState>>] = useState<ConnectionState>("disconnected");

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