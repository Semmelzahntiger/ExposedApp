import {Context, createContext, ReactNode, useContext, useEffect, useState} from "react";
import {
    AuthResponseWrapper, getNewAccessToken,
    getRefreshToken, loadDataFromStore,
    login,
    LoginPayload, logoutFromAccount, setAccessToken,
    setLoginData
} from "@/main/account_data";
import {ApiError} from "@/main/exceptions";

export type AuthValue = {
    isLoggedIn : boolean;
    isLoggingIn: boolean
    isLoading : boolean
    logIn: (payload: LoginPayload) => Promise<void>;
    logOut: () => void;
};
const AuthContext : Context<AuthValue | null> = createContext<AuthValue | null>(null);

export function AuthProvider({ children}: {children: ReactNode}) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    console.debug(`Current State of AuthProvider: isLoggedIn :${isLoggedIn}; Loading: ${isLoading}; isLoggingIn: ${isLoggingIn}`);
    useEffect(() => {
        (async () => {
            console.log("Initializing Login")
            try {
                console.log("Loading Token from Store...")
                await loadDataFromStore();
                const token = getRefreshToken();
                if (token) {
                    console.log("Refresh Token found")
                    console.log("Fetching new access token...");
                    const newAccessToken = await getNewAccessToken(token);
                    if(newAccessToken != null && newAccessToken.token) {
                        console.log("Received new Access Token")
                        setAccessToken(newAccessToken.token)
                        setIsLoggedIn(true);
                    }
                    else {
                        console.log("Couldn't fetch new Access Token")
                    }
                }
            } catch (err) {
                console.error("Startup auth check failed:", err);
            } finally {
                setIsLoading(false);
                setIsLoggingIn(false);
            }
        })();
    }, []);

    const logIn = async (payload: LoginPayload) => {
        setIsLoggingIn(true)
        const responseWrapper : AuthResponseWrapper | null = await login(payload);
        if(responseWrapper != null) {
            if(responseWrapper.status === 200) {
                await setLoginData(responseWrapper.authResponse);
                setIsLoggedIn(true);
                setIsLoggingIn(false);
            }
            else {
                setIsLoggingIn(false)
                throw new ApiError(responseWrapper.status)
            }
        }
        else {
            setIsLoggingIn(false)
            throw new ApiError(-1)
        }
    }
    const logOut = async () => {
        await logoutFromAccount()
        setIsLoggedIn(false);
    }

    return (
        <AuthContext.Provider value = {{isLoggedIn, isLoggingIn, isLoading, logIn, logOut}}>
            {children}
        </AuthContext.Provider>
    )
}
export function useAuth() : AuthValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}