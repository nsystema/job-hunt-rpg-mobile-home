import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { getGlassBorderColor, getGlassGradientColors, hexToRgba } from '../../utils/color';

export const SegmentedControl = ({ options = [], value, onChange, colors }) => {
  const glassColors = getGlassGradientColors(colors);
  const glassBorder = getGlassBorderColor(colors);
  const activeTextColor = colors.text;
  const inactiveTextColor = hexToRgba(colors.text, 0.75);

  return (
    <View style={styles.segmentedControl}>
      {options.map((option) => {
        const optionValue =
          typeof option === 'string'
            ? option
            : option?.value ?? option?.key ?? option?.label;
        const label = typeof option === 'string' ? option : option?.label ?? optionValue;
        const isActive = value === optionValue;

        return (
          <TouchableOpacity
            key={optionValue}
            onPress={() => onChange?.(optionValue)}
            activeOpacity={0.85}
            style={styles.segmentButton}
          >
            {isActive ? (
              <LinearGradient
                colors={glassColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.segmentButtonInner, { borderColor: glassBorder }]}
              >
                <Text style={[styles.segmentText, { color: activeTextColor }]}>{label}</Text>
              </LinearGradient>
            ) : (
              <View
                style={[
                  styles.segmentButtonInner,
                  { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
                ]}
              >
                <Text style={[styles.segmentText, { color: inactiveTextColor }]}>{label}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  segmentedControl: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  segmentButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  segmentButtonInner: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
