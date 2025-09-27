import { StyleSheet, View } from 'react-native';

export const Panel = ({ children, colors, style = {} }) => (
  <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }, style]}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  panel: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
});
