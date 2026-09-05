import * as SecureStore from "expo-secure-store"
import {loginUrl, refreshUrl, registerUrl} from "@/config/endpoints";

const refreshTokenKey : string = "refreshToken";


let accessToken : string | null = null;
let inMemoryRefreshToken: string | null = null;


export type AuthResponseWrapper = {
    status: number;
    authResponse: AuthResponse
}
export type AuthResponse = {
    success: boolean
    authToken: string;     // /login delivers the access token under this name
    refreshToken: string;
    error: string | null
}
export type RefreshResponse = {
    token : string
}
export type LoginPayload = {
    email: string;
    password: string;
}
export type RegistrationPayload = {
    email: string;
    username: string;
    password: string;
}

export async function setLoginData(data: AuthResponse) {
    if (!data.authToken) {
        console.warn("Login response contained no auth token. Keys:", Object.keys(data));
    }
    await SecureStore.setItemAsync(refreshTokenKey, data.refreshToken)
    accessToken = data.authToken;
    inMemoryRefreshToken = data.refreshToken;
}
export function getAccessToken() : string | null {
    return accessToken;
}
export function getRefreshToken() : string | null {
    return inMemoryRefreshToken
}
export async function loadDataFromStore() {
    inMemoryRefreshToken = await SecureStore.getItemAsync(refreshTokenKey);
}
export async function login(loginPayload : LoginPayload) : Promise<AuthResponseWrapper | null> {
    try {
        const response = await fetch(loginUrl(), {
            method: "POST",
            headers: { "Content-Type": "application/json"},
            body: JSON.stringify(loginPayload)
        })
        const code = response.status;
        const json = (await response.json()) as AuthResponse;
        return {
            status : code,
            authResponse : json
        }
    } catch (err) {
        return null;
    }
}
export async function registerUser(registerPayload : RegistrationPayload) : Promise<AuthResponseWrapper | null> {
    try {
        const response = await fetch(registerUrl(), {
            method: "POST",
            headers: { "Content-Type": "application/json"},
            body: JSON.stringify(registerPayload)
        })
        const code = response.status;
        const json = (await response.json()) as AuthResponse;
        return {
            status : code,
            authResponse : json
        }
    } catch (err) {
        return null;
    }
}
export async function getNewAccessToken(refreshToken : string, signal? : AbortSignal) : Promise<RefreshResponse | null> {
    try {
        const request = {
            refreshToken : refreshToken,
        }
        const response = await fetch(refreshUrl(), {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(request),
            signal
        })
        const code = response.status;
        if(code != 200) {
            return null;
        }
        const json = (await response.json()) as RefreshResponse;
        return {
            token : json.token
        }
    }
    catch(err) {
        return null;
    }
}
export function setAccessToken(newAccessToken : string) {
    accessToken = newAccessToken;
}
export async function logoutFromAccount() {
    accessToken = null;
    inMemoryRefreshToken = null;
    await SecureStore.deleteItemAsync(refreshTokenKey)
}
export async function register(registerPayload : RegistrationPayload) : Promise<AuthResponse> {
    const response = await fetch(registerUrl(),
        {
            method: "POST",
            headers : { "Content-Type": "application/json"},
            body: JSON.stringify(registerPayload)
        })
    if(!response.ok) {
        console.log("Register denied or error occurred (Placeholder)")
    }
    return (await response.json()) as AuthResponse
}