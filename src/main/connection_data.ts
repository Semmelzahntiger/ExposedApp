import {ConnectionState} from "@/main/connection_provider";
import {Dispatch, SetStateAction} from "react";

const wssUrl : string = "wss:localhost:8090/game";

let connection: WebSocket | null = null;
let errorClosure : boolean = false;


export function setConnection(newConnection : WebSocket) {
    connection = newConnection
    errorClosure = false;
}
export function getConnection() : WebSocket | null {
    return connection;
}
function isCurrentSocket(candidate : WebSocket) : boolean {
    return candidate === getConnection();
}
export function disconnect() {
    connection = null;
}
export function hasClosedWithError() : boolean {
    return errorClosure;
}
function setClosedWithError() {
    errorClosure = true;
}
export async function establishConnection(connectionStateDispatcher : Dispatch<SetStateAction<ConnectionState>>) {
    const socket = new WebSocket(wssUrl);
    setConnection(socket);

    socket.onopen = () =>  {
        if(isCurrentSocket(socket)) {
            connectionStateDispatcher("connected")
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
}