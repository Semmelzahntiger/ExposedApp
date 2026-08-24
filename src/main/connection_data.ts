import {ConnectionState} from "@/main/connection_provider";
import {Dispatch, SetStateAction} from "react";
import {ConnectionHolder} from "@/main/connection";
import {getAccessToken} from "@/main/account_data";
import {IncomingMessages, AuthenticationMessage, MessageType} from "@/main/Messages";
import {WSS_BASE_URL} from "@/config/endpoints";


let connection: ConnectionHolder | null = null;
let errorClosure : boolean = false;


type MessageHandler<T extends IncomingMessages> = (msg: T) => void;
let listeners : Map<MessageType, Set<MessageHandler<IncomingMessages>>> = new Map();

type MessageOfType<T extends MessageType> = Extract<IncomingMessages, { type: T }>;


export function setConnection(newConnection : ConnectionHolder) {
    connection = newConnection;
    errorClosure = false;
}
export function getConnection() : ConnectionHolder | null {
    return connection;
}

function isCurrentSocket(candidate : WebSocket) : boolean {
    const holder : ConnectionHolder | null = getConnection()
    if(holder == null) {
        return false;
    }
    return holder.isCurrentConnection(candidate);
}
export function disconnect() {
    const holder : ConnectionHolder | null = getConnection();
    if(holder != null) {
        holder.close()
    }
    connection = null;
}
export function hasClosedWithError() : boolean {
    return errorClosure;
}
function setClosedWithError() {
    errorClosure = true;
}
export function addListener<T extends MessageType> (
    type: T,
    listener: (msg: MessageOfType<T>) => void): () => void {
    if (!listeners.has(type)) {
        listeners.set(type, new Set<MessageHandler<IncomingMessages>>());
    }
    listeners.get(type)!.add(listener as MessageHandler<IncomingMessages>);
    return () => listeners.get(type)?.delete(listener as MessageHandler<IncomingMessages>);
}


export async function establishConnection(connectionStateDispatcher : Dispatch<SetStateAction<ConnectionState>>) {
    const socket : WebSocket = new WebSocket(WSS_BASE_URL);
    const connection : ConnectionHolder = new ConnectionHolder(socket);
    setConnection(connection);

    socket.onopen = () =>  {
        console.log("Socket Connection opened");
        if(isCurrentSocket(socket)) {
            connectionStateDispatcher("connecting")
            if(socket.readyState === WebSocket.OPEN) {
                const token = getAccessToken();
                if(token) {
                    const authMessage : AuthenticationMessage = {
                        type : "send_authentication",
                        token: token
                    }
                    console.log("Sending Authentication Message...")
                    connection.sendMessage(authMessage);
                }
                else {
                    console.log("No authentication found for connection, unexpected connection state. Closing Socket.");
                    socket.close();
                }
            }
        }
    }
    socket.onerror = () => {
        if(isCurrentSocket(socket)) {
            setClosedWithError();
        }
    }
    socket.onclose = () => {
        if(isCurrentSocket(socket)) {
           connectionStateDispatcher("connection_closed");
        }
    }
    socket.onmessage = (event : MessageEvent) => {
        const msg = JSON.parse(event.data) as IncomingMessages;
        switch (msg.type) {
            case "confirm_authentication":
                connectionStateDispatcher("connected")
                break;
        }
    }
}
