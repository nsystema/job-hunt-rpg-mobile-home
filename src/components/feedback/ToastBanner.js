import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { hexToRgba } from '../../utils/color';

export const ToastBanner = ({
  colors,
  eff,
  title,
  icon,
  value,
  gradientColors,
  iconColor,
  textColor,
  children,
}) => {
  const wrapperShadow = eff === 'light' ? styles.rewardsToastShadowLight : styles.rewardsToastShadowDark;
  const resolvedGradient =
    gradientColors ?? [hexToRgba(colors.sky, 0.24), hexToRgba(colors.emerald, 0.2)];
  const titleColor = eff === 'light' ? 'rgba(15,23,42,0.68)' : 'rgba(226,232,240,0.78)';
  const resolvedIconColor = iconColor ?? (eff === 'light' ? '#0f172a' : colors.emerald);
  const resolvedTextColor = textColor ?? (eff === 'light' ? '#0f172a' : colors.text);

  return (
    <View pointerEvents="none" style={[styles.rewardsToastWrapper, wrapperShadow]}>
      <LinearGradient
        colors={resolvedGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.rewardsToastContainer, { borderColor: colors.surfaceBorder }]}
      >
        {title ? (
          <Text style={[styles.rewardsToastTitle, { color: titleColor }]}>{title}</Text>
        ) : null}
        <View style={styles.rewardsToastValue}>
          {children || (
            <>
              {icon ? <MaterialCommunityIcons name={icon} size={18} color={resolvedIconColor} /> : null}
              {value ? (
                <Text style={[styles.rewardsToastText, { color: resolvedTextColor }]}>{value}</Text>
              ) : null}
            </>
          )}
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  rewardsToastWrapper: {
    position: 'absolute',
    bottom: 32,
    alignSelf: 'center',
    width: '86%',
    maxWidth: 340,
    borderRadius: 18,
  },
  rewardsToastContainer: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  rewardsToastTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  rewardsToastValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rewardsToastText: {
    fontSize: 16,
    fontWeight: '800',
  },
  rewardsToastShadowLight: {
    shadowColor: 'rgba(15,23,42,0.2)',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  rewardsToastShadowDark: {
    shadowColor: 'rgba(15,23,42,0.6)',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.38,
    shadowRadius: 36,
    elevation: 18,
  },
});
