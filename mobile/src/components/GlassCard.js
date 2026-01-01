import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '../constants/theme';

export default function GlassCard({ children, style, gradient = false }) {
    if (gradient) {
        return (
            <LinearGradient
                colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                style={[styles.card, style]}
            >
                {children}
            </LinearGradient>
        );
    }

    return (
        <View style={[styles.card, style]}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.bgGlass,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: theme.spacing.xl,
    },
});
