import {StyleSheet} from "react-native";
import {ACCENT, MUTED, SURFACE} from "@/styles/room_style";

export const game_style = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: "#000000",
    },
    webview: {
        flex: 1,
        backgroundColor: "#000000",
    },
    // Fills the embed and swallows every touch so the video can't be paused/interacted with.
    touchLock: {
        position: "absolute",
        top: 0, left: 0, right: 0, bottom: 0,
    },
    // ---- text rounds (searched / commented): the resource shown as a centered quote ----
    quoteContainer: {
        position: "absolute",
        top: 0, left: 0, right: 0, bottom: 0,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 32,
        gap: 12,
    },
    quoteCaption: {
        color: "#8a90a0",
        fontSize: 13,
        fontWeight: "700",
        letterSpacing: 1,
        textTransform: "uppercase",
    },
    quoteText: {
        color: "#FFFFFF",
        fontSize: 26,
        fontStyle: "italic",
        fontWeight: "600",
        textAlign: "center",
    },
    // ---- leave button (top-left) ----
    leaveButton: {
        position: "absolute",
        height: 40,
        width: 40,
        borderRadius: 14,
        backgroundColor: SURFACE,
        borderWidth: 1,
        borderColor: MUTED,
        alignItems: "center",
        justifyContent: "center",
    },
    leaveIcon: {
        color: "#FFFFFF",
        fontSize: 20,
        fontWeight: "700",
    },
    // ---- timer box (top-center) ----
    timerBox: {
        position: "absolute",
        alignSelf: "center",
        minWidth: 96,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: SURFACE,
        borderWidth: 1,
        borderColor: ACCENT,
        alignItems: "center",
        justifyContent: "center",
    },
    timerText: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "700",
    },
    // ---- score chip (top-right) ----
    scoreChip: {
        position: "absolute",
        minWidth: 56,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: SURFACE,
        borderWidth: 1,
        borderColor: ACCENT,
        alignItems: "center",
        justifyContent: "center",
    },
    scoreText: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "700",
    },
    // ---- pull-up sheet ----
    sheetBackdrop: {
        position: "absolute",
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(0,0,0,0.4)",
    },
    sheetContainer: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: SURFACE,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderTopWidth: 2,
        borderTopColor: ACCENT,
        overflow: "hidden",
    },
    band: {
        height: 56,
        alignItems: "center",
        justifyContent: "center",
    },
    bandGrabber: {
        width: 44,
        height: 5,
        borderRadius: 999,
        backgroundColor: MUTED,
        marginBottom: 6,
    },
    bandLabel: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "600",
    },
    sheetBody: {
        flex: 1,
    },
    sheetBodyContent: {
        padding: 20,
        gap: 10,
    },
    placeholderRow: {
        height: 52,
        borderRadius: 12,
        backgroundColor: MUTED,
        justifyContent: "center",
        paddingHorizontal: 16,
    },
    placeholderText: {
        color: "#8a90a0",
        fontSize: 15,
    },
});
