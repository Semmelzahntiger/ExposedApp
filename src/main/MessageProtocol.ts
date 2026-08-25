export type MessageType = "send_authentication" | "confirm_authentication" | "deny_authentication";

export type Message<T extends MessageType> = {
    type : T;
}

export type OutboundMessages = AuthenticationMessage;
export type InboundMessages = ConfirmAuthenticationMessage | DenyAuthenticationMessage;

export type AuthenticationMessage = Message<"send_authentication"> & {
    token: string;
}
export type ConfirmAuthenticationMessage = Message<"confirm_authentication"> & {}
export type DenyAuthenticationMessage = Message<"deny_authentication"> & {}
