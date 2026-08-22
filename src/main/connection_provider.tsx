import {Context, createContext, Dispatch, ReactNode, SetStateAction, useContext, useEffect, useState} from "react";
import {useAuth} from "@/main/auth_provider";
import {establishConnection, disconnect as disconnectSocket} from "@/main/connection_data";

export type ConnectionState = "connected" | "disconnected" | "connection_closed";

export type ConnectionValue = {
    connectionState : ConnectionState
    connect: () => void;
    disconnect: () => void;
}
const ConnectionContext : Context<ConnectionValue | null> = createContext<ConnectionValue | null>(null);

export function ConnectionProvider({children}: {children : ReactNode}) {
    const { isLoggedIn } = useAuth();
    const [connectionState, setConnectionState] : [ConnectionState, Dispatch<SetStateAction<ConnectionState>>] = useState<ConnectionState>("disconnected");

    useEffect(() => {
        (async () => {
            if(isLoggedIn && connectionState === "disconnected") {
                await establishConnection(setConnectionState)
            }
        })();
    }, []);
    const connect = async () => {
        await establishConnection(setConnectionState)
    };
    const disconnect = async () => {
        disconnectSocket();
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