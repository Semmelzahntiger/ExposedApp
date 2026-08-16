import {Context, createContext, ReactNode, useContext, useState} from "react";
import {ctx} from "expo-router/_ctx";

type AuthValue = {
    isLoggedIn : boolean;
    logIn: () => void;
    logOut: () => void;
};
const AuthContext : Context<AuthValue | null> = createContext<AuthValue | null>(null);

export function AuthProvider({ children}: {children: ReactNode}) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const logIn = () => setIsLoggedIn(true);
    const logOut = () => setIsLoggedIn(false);

    return (
        <AuthContext.Provider value = {{isLoggedIn, logIn, logOut}}>
            {children}
        </AuthContext.Provider>
    )
}
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}