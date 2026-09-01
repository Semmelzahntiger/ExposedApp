import {LinearGradient} from "expo-linear-gradient";
import {ColorValue, DimensionValue, StyleProp, StyleSheet, View, ViewStyle} from "react-native";
import React from "react";

export type GradientBorderBoxProps = {
    children?: React.ReactNode;
    colors: readonly [ColorValue, ColorValue, ...ColorValue[]];
    backgroundColor?: string;
    borderWidth?: number;
    borderRadius?: number;
    start?: { x: number; y: number };
    end?: { x: number; y: number };
    generalStyle?: StyleProp<ViewStyle>;
    gradientBorderStyle?: StyleProp<ViewStyle>;
    innerBoxStyle?: StyleProp<ViewStyle>;
}
export function GradientBorderBox({
                                      children,
                                      colors,
                                      backgroundColor = "#FFFFFF",
                                      borderWidth = 5,
                                      borderRadius = 25,
                                      start = {x : 0, y: 0},
                                      end = {x: 1, y :1},
                                      generalStyle = {},
                                      gradientBorderStyle = {},
                                      innerBoxStyle = {},
}: GradientBorderBoxProps) {
    return (
        <LinearGradient colors={colors}
                        start={start}
                        end={end}
                        style={[{
                            borderRadius: borderRadius,
                            padding: borderWidth,
                        }, gradientBorderStyle, generalStyle]
        }>
            <View style={[
                {
                    flex: 1,
                    justifyContent: "center",
                    alignItems:"center",
                    borderRadius: borderRadius - borderWidth,
                    backgroundColor: backgroundColor,
                },
                innerBoxStyle, generalStyle,
            ]}>
                {children}
            </View>
        </LinearGradient>
    )
}