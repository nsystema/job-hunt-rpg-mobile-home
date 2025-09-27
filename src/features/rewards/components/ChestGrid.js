import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { hexToRgba } from '../../../utils/color';
import ChestCard from './ChestCard';

const ChestGrid = ({
  rarityKeys,
  rarityCounts,
  chestFilter,
  onSelectFilter,
  colors,
  eff,
  visibleChests,
  focusedChestId,
  onFocus,
  onOpen,
}) => {
  return (
    <>
      <Text style={[styles.rewardsFilterLabel, { color: hexToRgba(colors.text, 0.6) }]}>Choose rarity</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rewardsFilterRow}>
        {rarityKeys.map((key) => {
          const active = chestFilter === key;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => onSelectFilter(key)}
              activeOpacity={0.9}
              style={[
                styles.rarityButton,
                {
                  borderColor: active
                    ? hexToRgba(colors.emerald, 0.45)
                    : hexToRgba('#0f172a', eff === 'light' ? 0.08 : 0.24),
                  backgroundColor: active
                    ? 'transparent'
                    : hexToRgba('#0f172a', eff === 'light' ? 0.04 : 0.32),
                },
              ]}
            >
              {active ? (
                <LinearGradient
                  colors={[colors.sky, colors.emerald]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.rarityButtonBackground}
                />
              ) : null}
              <View style={styles.rarityButtonContent}>
                <Text style={[styles.rarityButtonText, { color: active ? '#0f172a' : colors.text }]}>{key}</Text>
                <View
                  style={[
                    styles.rarityBadge,
                    {
                      backgroundColor: active
                        ? 'rgba(255,255,255,0.6)'
                        : hexToRgba('#0f172a', eff === 'light' ? 0.08 : 0.28),
                    },
                  ]}
                >
                  <Text style={[styles.rarityBadgeText, { color: active ? '#0f172a' : hexToRgba(colors.text, 0.7) }]}>
                    {rarityCounts[key] || 0}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.chestGrid}>
        {visibleChests.map((chest) => (
          <ChestCard
            key={chest.id}
            chest={chest}
            colors={colors}
            theme={eff}
            isFocused={focusedChestId === chest.id}
            onFocus={onFocus}
            onOpen={onOpen}
          />
        ))}
        {!visibleChests.length && (
          <LinearGradient
            colors={[hexToRgba(colors.sky, 0.18), hexToRgba(colors.emerald, 0.12)]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.chestEmpty, { borderColor: colors.surfaceBorder }]}
          >
            <MaterialCommunityIcons name="treasure-chest" size={18} color={hexToRgba(colors.text, 0.6)} />
            <Text style={[styles.chestEmptyText, { color: hexToRgba(colors.text, 0.7) }]}>No chests match this view.</Text>
          </LinearGradient>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  rewardsFilterLabel: {
    marginTop: 12,
    marginHorizontal: 4,
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  rewardsFilterRow: {
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  rarityButton: {
    position: 'relative',
    marginHorizontal: 4,
    borderRadius: 999,
    borderWidth: 1,
    overflow: 'hidden',
  },
  rarityButtonBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
  },
  rarityButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  rarityButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  rarityBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  rarityBadgeText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  chestGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 12,
    marginHorizontal: -6,
  },
  chestEmpty: {
    marginTop: 16,
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  chestEmptyText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    textAlign: 'center',
  },
});

export default ChestGrid;
