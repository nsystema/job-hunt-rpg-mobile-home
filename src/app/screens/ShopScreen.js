import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAppState } from '../../state';
import { useColors } from '../../theme';

const ShopScreen = () => {
  const { activeEffects, sprayDebuff, shop } = useAppState();
  const colors = useColors();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <View style={[styles.card, { borderColor: colors.surfaceBorder }]}>
        <Text style={[styles.title, { color: colors.text }]}>Active effects</Text>
        <Text style={[styles.value, { color: colors.sky }]}>{activeEffects.length}</Text>
      </View>
      <View style={[styles.card, { borderColor: colors.surfaceBorder }]}>
        <Text style={[styles.title, { color: colors.text }]}>Spray debuff</Text>
        <Text style={[styles.value, { color: colors.emerald }]}>{sprayDebuff ? 'Active' : 'None'}</Text>
      </View>
      <View style={[styles.card, { borderColor: colors.surfaceBorder }]}>
        <Text style={[styles.title, { color: colors.text }]}>Shop filters</Text>
        <Text style={[styles.caption, { color: colors.text }]}>Main tab: {shop?.mainTab}</Text>
        <Text style={[styles.caption, { color: colors.text }]}>Category: {shop?.categoryTab}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    gap: 16,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  value: {
    fontSize: 20,
    fontWeight: '600',
  },
  caption: {
    fontSize: 14,
  },
});

export default ShopScreen;
