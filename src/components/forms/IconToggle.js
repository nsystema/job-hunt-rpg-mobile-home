import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { getGlassBorderColor, getGlassGradientColors, hexToRgba } from '../../utils/color';

export const IconToggle = ({ label, icon, activeIcon, value, onToggle, colors }) => {
  const iconName = value && activeIcon ? activeIcon : icon;
  const glassColors = getGlassGradientColors(colors);
  const glassBorder = getGlassBorderColor(colors);
  const inactiveBorder = colors.surfaceBorder;
  const inactiveBackground = colors.chipBg;
  const activeContentColor = '#0f172a';
  const inactiveContentColor = hexToRgba(colors.text, 0.75);
  const contentColor = value ? activeContentColor : inactiveContentColor;

  return (
    <TouchableOpacity onPress={() => onToggle?.(!value)} activeOpacity={0.9} style={styles.iconToggle}>
      <View
        style={[
          styles.iconToggleInner,
          { borderColor: 'transparent', backgroundColor: 'transparent', borderWidth: 0 },
        ]}
      >
        {value ? (
          <LinearGradient
            colors={glassColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.iconToggleIconWrap, { borderColor: glassBorder }]}
          >
            <MaterialCommunityIcons name={iconName} size={20} color={contentColor} />
          </LinearGradient>
        ) : (
          <View
            style={[
              styles.iconToggleIconWrap,
              { backgroundColor: inactiveBackground, borderColor: inactiveBorder },
            ]}
          >
            <MaterialCommunityIcons name={iconName} size={20} color={contentColor} />
          </View>
        )}
        <Text style={[styles.iconToggleLabel, { color: contentColor }]}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  iconToggle: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  iconToggleInner: {
    flex: 1,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 8,
  },
  iconToggleIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconToggleLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
});
