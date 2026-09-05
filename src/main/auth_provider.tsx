import {Context, createContext, ReactNode, useContext, useEffect, useRef, useState} from "react";
import {
    AuthResponseWrapper, getNewAccessToken,
    getRefreshToken, loadDataFromStore,
    login,
    LoginPayload, logoutFromAccount, registerUser, RegistrationPayload, setAccessToken,
    setLoginData
} from "@/main/account_data";
import {loadServerConfig} from "@/config/endpoints";
import {ApiError} from "@/main/exceptions";

// If a server is unreachable the refresh fetch would otherwise hang indefinitely,
// freezing the start screen. Bound it so the UI always frees itself.
const AUTO_LOGIN_TIMEOUT_MS = 8000;

export type AuthValue = {
    isLoggedIn : boolean;
    isLoggingIn: boolean
    isLoading : boolean
    isInitialLogin : boolean
    logIn: (payload: LoginPayload) => Promise<void>;
    register: (payload : RegistrationPayload) => Promise<void>;
    logOut: () => void;
    cancelAutoLogin: () => void;
};
const AuthContext : Context<AuthValue | null> = createContext<AuthValue | null>(null);

export function AuthProvider({ children}: {children: ReactNode}) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [isInitialLogin, setIsInitialLogin] = useState(false);
    // Aborts the in-flight startup refresh so the user can cancel a hanging auto-login.
    const autoLoginController = useRef<AbortController | null>(null);
    console.debug(`Current State of AuthProvider: isLoggedIn :${isLoggedIn}; Loading: ${isLoading}; isLoggingIn: ${isLoggingIn}`);

    const cancelAutoLogin = () => {
        autoLoginController.current?.abort();
        setIsLoading(false);
        setIsLoggingIn(false);
    };

    useEffect(() => {
        const controller = new AbortController();
        autoLoginController.current = controller;
        const timeout = setTimeout(() => controller.abort(), AUTO_LOGIN_TIMEOUT_MS);
        (async () => {
            console.log("Initializing Login")
            try {
                // Point at the persisted server before anything hits the network.
                await loadServerConfig();
                console.log("Loading Token from Store...")
                await loadDataFromStore();
                const token = getRefreshToken();
                if (token) {
                    console.log("Refresh Token found")
                    console.log("Fetching new access token...");
                    const newAccessToken = await getNewAccessToken(token, controller.signal);
                    if(newAccessToken != null && newAccessToken.token) {
                        console.log("Received new Access Token")
                        setAccessToken(newAccessToken.token)
                        setIsLoggedIn(true);
                        setIsInitialLogin(true);
                    }
                    else {
                        console.log("Couldn't fetch new Access Token")
                        setIsLoading(false);
                        setIsLoggedIn(false);
                    }
                }
                else {
                    console.log("No Token in Store")
                }
            } catch (err) {
                console.error("Startup auth check failed:", err);
            } finally {
                clearTimeout(timeout);
                autoLoginController.current = null;
                setIsLoading(false);
                setIsLoggingIn(false);
            }
        })();
        return () => {
            clearTimeout(timeout);
            controller.abort();
        };
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
        <AuthContext.Provider value = {{isLoggedIn, isLoggingIn, isLoading,isInitialLogin, logIn, register, logOut, cancelAutoLogin}}>
            {children}
        </AuthContext.Provider>
    )
}
export function useAuth() : AuthValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}