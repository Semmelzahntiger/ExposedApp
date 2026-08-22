import {StyleSheet} from 'react-native';

export const default_style = StyleSheet.create({
    basics: {
        borderRadius: 12,
        borderWidth: 2
    },
    standard_bg: {
        backgroundColor : "#0084bd"
    },
    container: {
        backgroundColor: "#000000",
        flex: 1,
        alignItems: "stretch",
        justifyContent: "flex-end",
        padding: 20,
        gap:12
    },
    button: {
        height: 64,
        borderRadius: 20,
        backgroundColor : "#0084bd",
        justifyContent: "center",
        alignItems: "center"
    },
    genericText : {
        fontSize:20,
        color: "#000000"
    },
    maskWrapper: {
        borderColor : "transparent"
    },
    gradientBorder: {
        borderRadius: 12,
        padding: 2,              // ← this thickness IS the border
    },
    gradientInner: {
        backgroundColor: "#000000",
        borderRadius: 9,         // outer radius (12) minus padding (3) = clean nesting
        paddingVertical: 12,     // match your button's vertical padding
        alignItems: "center",    // center the text
    },
});