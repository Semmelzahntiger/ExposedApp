import {Pressable, Text, TextInput, View} from "react-native";
import {default_style} from "@/styles/basic_style";
import React, {useState} from "react";
import {input_styles} from "@/styles/input_styles";


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
        <Pressable onPress={() => {}}>
            <Text style={[input_styles.button, {color: "#FFFFFF", alignSelf: "flex-end", padding: 10, borderRadius: 5}]}>
                Register</Text>
        </Pressable>
    </View>);
}