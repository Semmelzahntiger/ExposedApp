import {Pressable, Text, TextInput, View} from "react-native";
import {default_style} from "@/styles/basic_style";
import React, {useEffect, useState} from "react";
import {input_styles} from "@/styles/input_styles";
import {Redirect} from "expo-router";
import {AuthValue, useAuth} from "@/main/auth_provider";
import {RegistrationPayload} from "@/main/account_data";
import {ApiError} from "@/main/exceptions";


export default function register() {

    const [email, setMail] = useState("")
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [invisible, setInvisible] = useState(true)

    const [emailValid, setEmailValid] = useState("")
    const [usernameValid, setUsernameValid] = useState("")
    const [passwordValid, setPasswordValid] = useState("")
    const [confirmPasswordValid, setConfirmPasswordValid] = useState("")
    const [errorState, setErrorState] = useState<string>("")
    const authState: AuthValue = useAuth();

    if(authState.isLoggedIn) {
        return <Redirect href="/menu/main_menu" />;
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
            value={username}
            onChangeText={setUsername}
            placeholder={"Username..."}
            keyboardType={"default"}
            autoCapitalize={"none"}
            style={[default_style.basics, input_styles.textInput]}/>
        <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder={"Password..."}
            keyboardType={"default"}
            autoCapitalize={"none"}
            secureTextEntry={invisible}
            style={[default_style.basics, input_styles.textInput]}
        />
        <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder={"Confirm Password..."}
            keyboardType={"default"}
            autoCapitalize={"none"}
            secureTextEntry={invisible}
            style={[default_style.basics, input_styles.textInput]}
        />
        <Pressable onPress={() => setInvisible((invisible) => !invisible)}>
            <Text style={{color: "#FFFFFF", alignSelf: "flex-end"}}>{invisible ? "Show Password" : "Hide Password"}</Text>
        </Pressable>
        <Pressable onPress={async () => {
            console.log("Registering...");
            const credentials : RegistrationPayload = {email, username, password}
            try {
                await authState.register(credentials)
                setErrorState("")
            } catch(error) {
                if(error instanceof ApiError) {
                    setErrorState(error.errorMessage)
                    console.log("Couldn't register. ", error.errorMessage)
                }
            }
        }}>
            <Text style={[input_styles.button, {color: "#FFFFFF", alignSelf: "flex-end", padding: 10, borderRadius: 5}]}>
                Register</Text>
        </Pressable>
    </View>);
}