import { StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const IconButton = ({ onPress, icon, colors, accessibilityLabel }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
    accessibilityLabel={accessibilityLabel}
  >
    <MaterialCommunityIcons name={icon} size={20} color={colors.text} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
