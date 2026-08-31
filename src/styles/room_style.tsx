import {StyleSheet} from "react-native";

// Shared accent colors, kept in sync with index.tsx / basic_style.tsx
export const ACCENT = "#0084bd";
export const ACCENT_ALT = "#8e2de2";
export const SURFACE = "#111318";
export const MUTED = "#2a2f3a";

export const room_style = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: "#000000",
    },
    // ---- future content region (top of the lobby) ----
    content: {
        flex: 1,
    },
    // ---- corner buttons ----
    cornerButton: {
        position: "absolute",
        height: 56,
        minWidth: 120,
        borderRadius: 16,
        backgroundColor: ACCENT,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },
    cornerButtonText: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "600",
    },
    leaveButton: {
        backgroundColor: MUTED,
    },
    startButtonDisabled: {
        opacity: 0.4,
        backgroundColor: MUTED,
    },
    settingsButton: {
        position: "absolute",
        height: 48,
        width: 48,
        borderRadius: 14,
        backgroundColor: SURFACE,
        borderWidth: 1,
        borderColor: MUTED,
        justifyContent: "center",
        alignItems: "center",
    },
    settingsIcon: {
        color: "#FFFFFF",
        fontSize: 22,
    },
    // ---- room code (top-left) ----
    codeContainer: {
        position: "absolute",
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    codeBox: {
        height: 48,
        paddingHorizontal: 16,
        borderRadius: 14,
        backgroundColor: SURFACE,
        borderWidth: 1,
        borderColor: MUTED,
        justifyContent: "center",
    },
    codeText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
        letterSpacing: 3,
    },
    codeRevealButton: {
        height: 48,
        width: 48,
        borderRadius: 14,
        backgroundColor: SURFACE,
        borderWidth: 1,
        borderColor: MUTED,
        justifyContent: "center",
        alignItems: "center",
    },
    codeRevealIcon: {
        fontSize: 20,
    },
    // ---- player list ----
    playerList: {
        paddingHorizontal: 16,
        gap: 12,
    },
    playerRowBorder: {
        borderRadius: 14,
        padding: 2, // gradient border thickness
    },
    playerRowInner: {
        height: 64,
        borderRadius: 12,
        backgroundColor: "#000000",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 18,
    },
    playerName: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "600",
        flexShrink: 1,
    },
    hostBadge: {
        marginLeft: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: "#b3384a",
    },
    hostBadgeText: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "800",
        letterSpacing: 1,
    },
    // ---- player action menu ----
    playerMenuBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    playerMenuCard: {
        width: "100%",
        maxWidth: 340,
        backgroundColor: SURFACE,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: ACCENT,
        padding: 20,
        gap: 14,
    },
    playerMenuTitle: {
        color: "#FFFFFF",
        fontSize: 20,
        fontWeight: "700",
    },
    playerMenuButton: {
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: ACCENT,
        alignItems: "center",
    },
    playerMenuButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
    playerMenuCancel: {
        paddingVertical: 10,
        alignItems: "center",
    },
    playerMenuCancelText: {
        color: "#8a90a0",
        fontSize: 16,
    },
    // ---- sidebar ----
    backdrop: {
        position: "absolute",
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    sidebar: {
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        width: "78%",
        backgroundColor: SURFACE,
        borderLeftWidth: 2,
        borderLeftColor: ACCENT,
    },
    sidebarScroll: {
        padding: 20,
        gap: 8,
    },
    sidebarHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    sidebarTitle: {
        color: "#FFFFFF",
        fontSize: 22,
        fontWeight: "700",
    },
    closeButton: {
        height: 36,
        width: 36,
        borderRadius: 10,
        backgroundColor: MUTED,
        justifyContent: "center",
        alignItems: "center",
    },
    closeIcon: {
        color: "#FFFFFF",
        fontSize: 18,
    },
    section: {
        marginTop: 18,
        gap: 10,
    },
    sectionTitle: {
        color: ACCENT,
        fontSize: 13,
        fontWeight: "700",
        letterSpacing: 1,
        textTransform: "uppercase",
    },
    // ---- slider ----
    sliderRow: {
        gap: 6,
    },
    sliderLabelRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    sliderLabel: {
        color: "#FFFFFF",
        fontSize: 16,
    },
    sliderValue: {
        color: ACCENT,
        fontSize: 16,
        fontWeight: "700",
    },
    sliderTrack: {
        height: 28,
        justifyContent: "center",
    },
    sliderTrackBg: {
        height: 6,
        borderRadius: 999,
        backgroundColor: MUTED,
        overflow: "hidden",
    },
    sliderTrackFill: {
        height: 6,
        borderRadius: 999,
        backgroundColor: ACCENT,
    },
    sliderThumb: {
        position: "absolute",
        height: 22,
        width: 22,
        borderRadius: 11,
        backgroundColor: "#FFFFFF",
        borderWidth: 2,
        borderColor: ACCENT,
        marginLeft: -11, // center the thumb on its position
    },
    // ---- checkbox ----
    checkboxRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 6,
    },
    checkboxBox: {
        height: 24,
        width: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: ACCENT,
        justifyContent: "center",
        alignItems: "center",
    },
    checkboxBoxChecked: {
        backgroundColor: ACCENT,
    },
    checkboxTick: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "900",
    },
    checkboxLabel: {
        color: "#FFFFFF",
        fontSize: 16,
    },
});
