import * as SecureStore from "expo-secure-store"

const refreshTokenKey : string = "refreshToken";

const apiPath : string = "http://localhost:8090/api";

let accessToken : string | null = null;
let inMemoryRefreshToken: string | null = null;


export type AuthResponseWrapper = {
    status: number;
    authResponse: AuthResponse
}
export type AuthResponse = {
    success: boolean
    accessToken : string;
    refreshToken: string;
    error: string
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
    await SecureStore.setItemAsync(refreshTokenKey, data.refreshToken)
    accessToken = data.accessToken;
    inMemoryRefreshToken = data.refreshToken;
}
export async function getAccessToken() : Promise<string | null> {
    return accessToken;
}
export async function getRefreshToken() : Promise<string | null> {
    return inMemoryRefreshToken
}
export async function loadDataFromStore() {
    inMemoryRefreshToken = await SecureStore.getItemAsync(refreshTokenKey);
}
export async function login(loginPayload : LoginPayload) : Promise<AuthResponseWrapper | null> {
    try {
        const response = await fetch(apiPath.concat("/auth/login"), {
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
export async function getNewAccessToken(refreshToken : string) : Promise<RefreshResponse | null> {
    try {
        const response = await fetch(apiPath.concat("/auth/refresh-token"), {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(refreshToken)
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
    const response = await fetch(apiPath.concat("/auth/register"),
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