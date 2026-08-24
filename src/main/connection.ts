import {OutgoingMessages} from "@/main/Messages";

export class ConnectionHolder {
    public readonly _connection : WebSocket;

    constructor(connection : WebSocket) {
        this._connection = connection;
    }
    public getConnection() : WebSocket {
        return this._connection;
    }
    public close() : void {
        this._connection.close();
    }
    public isCurrentConnection(socket : WebSocket) : boolean {
        return socket === this._connection;
    }

    public sendMessage(message : OutgoingMessages) : void {
        this._connection.send(JSON.stringify(message));
    }
}