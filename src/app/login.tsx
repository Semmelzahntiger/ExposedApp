import {ActivityIndicator, Pressable, Text, TextInput, View} from "react-native";
import {default_style} from "@/styles/basic_style";
import React, {useEffect, useState} from "react";
import {input_styles} from "@/styles/input_styles";
import {useAuth} from "@/main/auth_provider";
import {LoginPayload} from "@/main/account_data";
import {ApiError} from "@/main/exceptions";
import {Redirect, router} from "expo-router";


export default function login() {
    const [email, setMail] = useState("")
    const [password, setPassword] = useState("")
    const [invisible, setInvisible] = useState(true)

    const [errorState, setErrorState] = useState<string>("")

    const authState = useAuth();

    if(authState.isLoggedIn) {
        return <Redirect href="/menu/main_menu"/>
    }


    return (<View style={[default_style.container, {justifyContent: "center", paddingTop: 40}]}>
        <TextInput
        value={email}
        onChangeText={setMail}
        placeholder={"E-Mail..."}
        keyboardType={"email-address"}
        autoCapitalize={"none"}
        style={[default_style.basics, input_styles.textInput]}
        />
        <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder={"Password..."}
            keyboardType={"default"}
            autoCapitalize={"none"}
            secureTextEntry={invisible}
            style={[default_style.basics, input_styles.textInput]}
            />
        <Pressable onPress={() => setInvisible((invisible) => !invisible)}>
            <Text style={{color: "#FFFFFF", alignSelf: "flex-end"}}>{invisible ? "Show Password" : "Hide Password"}</Text>
        </Pressable>
        <Pressable onPress={ async () => {
            console.log("Logging in...");
            const credentials : LoginPayload = {
                email : email,
                password : password
            }
            try {
                await authState.logIn(credentials)
                setErrorState("")
            } catch(error) {
                if(error instanceof ApiError) {
                    setErrorState(error.errorMessage)
                    console.log("Couldn't log in", error.errorMessage)
                }
            }
        }}>
            <Text style={[input_styles.button, {color: "#FFFFFF", alignSelf: "flex-end", padding: 10, borderRadius: 5}]}>
                Login</Text>
        </Pressable>
        { (authState.isLoading || authState.isLoggingIn) && (
            <View style={default_style.overlay}>
                <ActivityIndicator size="large" color="white"/>
            </View>
        )}
    </View>);
}