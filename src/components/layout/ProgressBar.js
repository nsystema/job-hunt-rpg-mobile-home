import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export const ProgressBar = ({ value, max, fromColor, toColor, colors }) => {
  const percentage = max ? Math.min(100, (value / max) * 100) : 0;
  return (
    <View
      style={[styles.progressBarContainer, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: colors.surfaceBorder }]}
    >
      <LinearGradient
        colors={[fromColor, toColor]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.progressBarFill, { width: `${percentage}%` }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  progressBarContainer: {
    height: 12,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
  },
  progressBarFill: {
    flex: 1,
    borderRadius: 999,
  },
});
