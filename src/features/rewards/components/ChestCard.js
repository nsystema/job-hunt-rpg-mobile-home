import React from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ensureOpaque, hexToRgba } from '../../../utils/color';
import { CHEST_ART, RARITY_DETAILS, formatRange } from '../utils/chests';

const overlayColorsForTheme = (theme) =>
  theme === 'light'
    ? ['rgba(255,255,255,0.96)', 'rgba(226,232,240,0.86)']
    : ['rgba(15,23,42,0.9)', 'rgba(15,23,42,0.78)'];

const ChestCard = ({ chest, colors, theme, isFocused, onFocus, onOpen }) => {
  const rarity = chest?.rarity || 'Common';
  const ChestArt = CHEST_ART[rarity] || CHEST_ART.Common;
  const detail = RARITY_DETAILS[rarity] || RARITY_DETAILS.Common;
  const goldRange = chest?.gold ? formatRange(chest.gold) : '?';
  const cardBackground = theme === 'light' ? ensureOpaque(colors.surface) : 'rgba(15,23,42,0.55)';
  const iconBackground = theme === 'light' ? ensureOpaque(colors.surface) : 'rgba(15,23,42,0.45)';
  const overlayColors = overlayColorsForTheme(theme);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onFocus?.(isFocused ? null : chest?.id)}
      style={[
        styles.chestCard,
        {
          backgroundColor: cardBackground,
          borderColor: colors.surfaceBorder,
        },
        theme === 'light' ? styles.chestCardShadowLight : styles.chestCardShadowDark,
      ]}
    >
      <View style={styles.chestCardInner}>
        <View
          style={[
            styles.chestIconWrapper,
            {
              backgroundColor: iconBackground,
              borderColor: colors.surfaceBorder,
            },
          ]}
        >
          <ChestArt size={54} />
        </View>
        <Text style={[styles.chestRarity, { color: hexToRgba(colors.text, 0.7) }]}>{rarity} chest</Text>
        <Text style={[styles.chestHeadline, { color: hexToRgba(colors.text, 0.82) }]}>{detail.headline}</Text>
      </View>
      {isFocused ? (
        <LinearGradient colors={overlayColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.chestOverlay}>
          <Text
            style={[
              styles.chestOverlayTitle,
              { color: theme === 'light' ? 'rgba(15,23,42,0.68)' : 'rgba(226,232,240,0.78)' },
            ]}
          >
            Gold stash
          </Text>
          <Text style={[styles.chestOverlayRange, { color: theme === 'light' ? '#0f172a' : colors.text }]}>
            {goldRange}g
          </Text>
          <Text
            style={[
              styles.chestOverlayHelper,
              { color: theme === 'light' ? 'rgba(15,23,42,0.65)' : 'rgba(226,232,240,0.78)' },
            ]}
          >
            {detail.helper}
          </Text>
          <TouchableOpacity
            onPress={() => {
              const reward = onOpen?.(chest);
              if (reward) {
                onFocus?.(null);
              }
            }}
            activeOpacity={0.9}
            style={[styles.chestOpenButton, { borderColor: colors.surfaceBorder }]}
          >
            <LinearGradient
              colors={[colors.sky, colors.emerald]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.chestOpenButtonBg}
            >
              <Text style={styles.chestOpenButtonText}>Open chest</Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chestCard: {
    position: 'relative',
    borderRadius: 16,
    borderWidth: 1,
    margin: 6,
    overflow: 'hidden',
  },
  chestCardInner: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  chestIconWrapper: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 12,
  },
  chestRarity: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  chestHeadline: {
    marginTop: 4,
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
  },
  chestOverlay: {
    position: 'absolute',
    inset: 0,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chestOverlayTitle: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  chestOverlayRange: {
    marginTop: 4,
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
  },
  chestOverlayHelper: {
    marginTop: 8,
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    textAlign: 'center',
  },
  chestOpenButton: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 999,
    overflow: 'hidden',
  },
  chestOpenButtonBg: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chestOpenButtonText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#0f172a',
  },
  chestCardShadowLight: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  chestCardShadowDark: {
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
});

export default ChestCard;
