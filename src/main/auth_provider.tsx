import {Context, createContext, ReactNode, useContext, useEffect, useState} from "react";
import {
    AuthResponse,
    AuthResponseWrapper, getNewAccessToken,
    getRefreshToken, loadDataFromStore,
    login,
    LoginPayload, logoutFromAccount, setAccessToken,
    setLoginData
} from "@/main/account_data";
import {ApiError, ErrorMessages} from "@/main/exceptions";

type AuthValue = {
    isLoggedIn : boolean;
    isLoading : boolean
    logIn: (payload: LoginPayload) => Promise<void>;
    logOut: () => void;
};
const AuthContext : Context<AuthValue | null> = createContext<AuthValue | null>(null);

export function AuthProvider({ children}: {children: ReactNode}) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        (async () => {
            try {
                await loadDataFromStore();
                const token = await getRefreshToken();
                if (token) {
                    const newAccessToken = await getNewAccessToken(token);
                    if(newAccessToken != null && newAccessToken.token) {
                        setAccessToken(newAccessToken.token)
                        setIsLoggedIn(true);
                    }
                }
            } catch (err) {
                console.error("Startup auth check failed:", err);
            } finally {
                setIsLoading(false);
            }
        })();
    }, []);

    const logIn = async (payload: LoginPayload) => {
        const responseWrapper : AuthResponseWrapper | null = await login(payload);
        if(responseWrapper != null) {
            if(responseWrapper.status === 200) {
                await setLoginData(responseWrapper.authResponse);
                setIsLoggedIn(true);
            }
            else {
                throw new ApiError(responseWrapper.status)
            }
        }
        else {
            throw new ApiError(-1)
        }
    }
    const logOut = async () => {
        await logoutFromAccount()
        setIsLoggedIn(false);
    }

    return (
        <AuthContext.Provider value = {{isLoggedIn, isLoading, logIn, logOut}}>
            {children}
        </AuthContext.Provider>
    )
}
export function useAuth() : AuthValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}