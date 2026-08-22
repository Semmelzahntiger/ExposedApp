import * as SecureStore from "expo-secure-store"

const accessTokenKey : string = "accessToken";
const refreshTokenKey : string = "refreshToken";
const apiPath : string = "http://localhost:8090/api";


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
    await SecureStore.setItemAsync(accessTokenKey, data.accessToken)
    await SecureStore.setItemAsync(refreshTokenKey, data.refreshToken)
}
export async function getAccessToken() : Promise<string | null> {
    return SecureStore.getItemAsync(accessTokenKey)
}
export async function getRefreshToken() : Promise<string | null> {
    return SecureStore.getItemAsync(refreshTokenKey)
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