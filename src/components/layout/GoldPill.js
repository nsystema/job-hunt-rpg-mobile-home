import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { hexToRgba } from '../../utils/color';

export const GoldPill = ({ children, colors, onPress, dim = false, style = {}, icon = 'diamond-stone' }) => {
  const gradientColors = dim
    ? [hexToRgba('#94a3b8', 0.18), hexToRgba('#94a3b8', 0.12)]
    : ['#fde68a', '#f59e0b'];

  const content = (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.goldPill, dim && styles.goldPillDim]}
    >
      <MaterialCommunityIcons name={icon} size={16} color={dim ? hexToRgba('#0f172a', 0.55) : '#1f2937'} />
      <Text style={[styles.goldPillText, dim && styles.goldPillTextDim]}>{children}</Text>
    </LinearGradient>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={dim ? 1 : 0.85}
        disabled={dim}
        style={[styles.goldPillWrapper, style]}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={style}>{content}</View>;
};

const styles = StyleSheet.create({
  goldPillWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  goldPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.1)',
  },
  goldPillDim: {
    borderColor: 'rgba(15,23,42,0.12)',
  },
  goldPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1f2937',
  },
  goldPillTextDim: {
    color: 'rgba(15,23,42,0.6)',
  },
});
