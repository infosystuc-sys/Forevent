import React, { memo } from 'react';
import { ActivityIndicator, Pressable, PressableProps, StyleSheet, useColorScheme } from 'react-native';

interface ButtonProps extends PressableProps {
    loading?: boolean,
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "help" | "questions" | "glow"
}

const Button = (props: ButtonProps) => {

    return (
        <Pressable {...props}>
            {props.loading ?
                <ActivityIndicator size={20} color={"#ffffff"} />
                :
                props.children
            }
        </Pressable>
    );
};


export default memo(Button);