import {GradientBorderBox, GradientBorderBoxProps} from "@/components/GradientBorderBox";
import {Pressable, StyleProp, ViewStyle} from "react-native";

export type GradientBorderBoxButtonProps = GradientBorderBoxProps & {
    onPress: () => void;
    pressableStyle?: StyleProp<ViewStyle>;
}
export function GradientBorderBoxButton({
                                            onPress,
                                            pressableStyle = {},
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
                                        }: GradientBorderBoxButtonProps) {
    return (
        <Pressable onPress={onPress} style={[generalStyle, pressableStyle]}>
            <GradientBorderBox
                colors={colors}
                backgroundColor={backgroundColor}
                borderRadius={borderRadius}
                start={start}
                end={end}
                borderWidth={borderWidth}
                gradientBorderStyle={[gradientBorderStyle, {flex: 1}]}
                generalStyle={generalStyle}
                innerBoxStyle={innerBoxStyle}
            >
                {children}
            </GradientBorderBox>
        </Pressable>
    );
}