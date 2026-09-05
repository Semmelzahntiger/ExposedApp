import {Pressable, Text, View} from "react-native";
import {settings_style} from "@/styles/settings_style";

export type ThemedRadioProps = {
    label: string;
    selected: boolean;
    onSelect: () => void;
};

// RN has no native radio — a simple ring + filled dot, mirroring the checkbox pattern.
export function ThemedRadio({label, selected, onSelect}: ThemedRadioProps) {
    return (
        <Pressable style={settings_style.radioRow} onPress={onSelect}>
            <View style={settings_style.radioRing}>
                {selected && <View style={settings_style.radioDot}/>}
            </View>
            <Text style={settings_style.radioLabel}>{label}</Text>
        </Pressable>
    );
}
