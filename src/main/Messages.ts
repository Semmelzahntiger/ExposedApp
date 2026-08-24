export type MessageType = "send_authentication" | "confirm_authentication";

export type Message<T extends MessageType> = {
    type : T;
}

export type OutgoingMessages = AuthenticationMessage;
export type IncomingMessages = ConfirmAuthenticationMessage;

export type AuthenticationMessage = Message<"send_authentication"> & {
    token: string;
}
export type ConfirmAuthenticationMessage = Message<"confirm_authentication"> & {
}