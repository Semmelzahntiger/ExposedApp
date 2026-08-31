import {Context, createContext, ReactNode, useContext, useEffect, useState} from "react";
import {
    AuthResponseWrapper, getNewAccessToken,
    getRefreshToken, loadDataFromStore,
    login,
    LoginPayload, logoutFromAccount, registerUser, RegistrationPayload, setAccessToken,
    setLoginData
} from "@/main/account_data";
import {ApiError} from "@/main/exceptions";

export type AuthValue = {
    isLoggedIn : boolean;
    isLoggingIn: boolean
    isLoading : boolean
    isInitialLogin : boolean
    logIn: (payload: LoginPayload) => Promise<void>;
    register: (payload : RegistrationPayload) => Promise<void>;
    logOut: () => void;
};
const AuthContext : Context<AuthValue | null> = createContext<AuthValue | null>(null);

export function AuthProvider({ children}: {children: ReactNode}) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [isInitialLogin, setIsInitialLogin] = useState(false);
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
                        setIsInitialLogin(true);
                    }
                    else {
                        console.log("Couldn't fetch new Access Token")
                    }
                }
                else {
                    console.log("No Token in Store")
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
        setIsLoggedIn(false);
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
                setIsLoggedIn(false);
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
    const register : (payload : RegistrationPayload) => Promise<void> = async (payload: RegistrationPayload) => {
        setIsLoggedIn(false);
        setIsLoggingIn(true);
        const responseWrapper : AuthResponseWrapper | null = await registerUser(payload);
        if(responseWrapper != null) {
            if(responseWrapper.status === 200) {
                await setLoginData(responseWrapper.authResponse);
                setIsLoggedIn(true);
                setIsLoggingIn(false);
            }
            else {
                setIsLoggingIn(false)
                setIsLoggedIn(false);
                throw new ApiError(responseWrapper.status)
            }
        }
        else {
            setIsLoggingIn(false)
            throw new ApiError(-1)
        }
    }

    return (
        <AuthContext.Provider value = {{isLoggedIn, isLoggingIn, isLoading,isInitialLogin, logIn, register, logOut}}>
            {children}
        </AuthContext.Provider>
    )
}
export function useAuth() : AuthValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}