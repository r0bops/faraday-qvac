import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { colors, spacing } from "../theme";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
}

export function Button({ title, onPress, variant = "primary", disabled, loading }: ButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, styles[`button_${variant}`], disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={variant === "ghost" ? colors.accent : colors.bg} size="small" />
      ) : (
        <Text style={[styles.buttonText, styles[`text_${variant}`]]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

interface CardProps {
  children: React.ReactNode;
  style?: object;
  onPress?: () => void;
}

export function Card({ children, style, onPress }: CardProps) {
  const content = <View style={[styles.card, style]}>{children}</View>;
  if (onPress) {
    return <TouchableOpacity onPress={onPress}>{content}</TouchableOpacity>;
  }
  return content;
}

interface BadgeProps {
  text: string;
  variant?: "accent" | "danger" | "success" | "muted";
}

export function Badge({ text, variant = "muted" }: BadgeProps) {
  return (
    <View style={[styles.badge, styles[`badge_${variant}`]]}>
      <Text style={[styles.badgeText, styles[`badgeText_${variant}`]]}>{text}</Text>
    </View>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  button_primary: {
    backgroundColor: colors.accent,
  },
  button_secondary: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button_danger: {
    backgroundColor: colors.dangerMuted,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  button_ghost: {
    backgroundColor: "transparent",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  text_primary: {
    color: colors.bg,
  },
  text_secondary: {
    color: colors.text,
  },
  text_danger: {
    color: colors.danger,
  },
  text_ghost: {
    color: colors.accent,
  },
  disabled: {
    opacity: 0.5,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badge_accent: {
    backgroundColor: colors.accentMuted,
  },
  badge_danger: {
    backgroundColor: colors.dangerMuted,
  },
  badge_success: {
    backgroundColor: colors.successMuted,
  },
  badge_muted: {
    backgroundColor: colors.surfaceAlt,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  badgeText_accent: {
    color: colors.accent,
  },
  badgeText_danger: {
    color: colors.danger,
  },
  badgeText_success: {
    color: colors.success,
  },
  badgeText_muted: {
    color: colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
});
