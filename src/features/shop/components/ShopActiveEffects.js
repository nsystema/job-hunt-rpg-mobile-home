import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EffectTimerRing } from '../../../components/feedback/EffectTimerRing';
import { formatTime } from '../../../utils/formatters';
import { hexToRgba } from '../../../utils/color';

const ShopActiveEffects = ({ effects, colors, eff, filledSurface, cardShadow, onBrowseEffects, now }) => {
  return (
    <View style={styles.shopSection}>
      <View style={styles.shopSectionHeader}>
        <Text style={[styles.shopSectionEyebrow, { color: hexToRgba(colors.text, 0.55) }]}>Active effects</Text>
        <Text style={[styles.shopSectionTitle, { color: colors.text }]}>Track your current boosts and penalties in real time.</Text>
      </View>
      {effects.length === 0 ? (
        <View
          style={[
            styles.shopEmptyCard,
            { backgroundColor: filledSurface, borderColor: colors.surfaceBorder },
            cardShadow,
          ]}
        >
          <View style={styles.shopEmptyHeader}>
            <MaterialCommunityIcons name="auto-fix" size={18} color={colors.sky} />
            <Text style={[styles.shopEmptyTitle, { color: colors.text }]}>No active effects yet</Text>
          </View>
          <Text style={[styles.shopEmptyDescription, { color: hexToRgba(colors.text, 0.65) }]}>Activate a boost to double down on XP or gold. Your effects — including any penalties — will appear here with live timers once purchased.</Text>
          <TouchableOpacity
            onPress={onBrowseEffects}
            activeOpacity={0.9}
            style={[styles.shopBrowseButton, { borderColor: colors.surfaceBorder }]}
          >
            <LinearGradient
              colors={[colors.sky, colors.emerald]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
            <Text style={styles.shopBrowseButtonText}>Browse boosts</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.shopActiveList}>
          {effects.map((effect) => {
            const remaining = effect.expiresAt ? Math.max(0, Math.floor((effect.expiresAt - now) / 1000)) : null;
            const progress = effect.duration && remaining != null ? Math.max(0, Math.min(1, remaining / effect.duration)) : null;
            const isDebuff = effect.type === 'debuff';
            const cardBackgroundColor = filledSurface;
            const cardBorderColor = colors.surfaceBorder;
            const iconShellStyle = {
              borderColor: colors.surfaceBorder,
              backgroundColor: colors.surface,
            };
            const iconGradient = [hexToRgba(colors.surface, 0.98), hexToRgba(colors.chipBg, 0.85)];
            const iconColor = '#0f172a';
            const timerColor = hexToRgba(colors.text, 0.6);
            const passiveColor = hexToRgba(colors.text, 0.6);
            const descriptionColor = hexToRgba(colors.text, 0.65);
            const nameColor = colors.text;

            return (
              <View
                key={effect.id}
                style={[
                  styles.shopActiveCard,
                  { backgroundColor: cardBackgroundColor, borderColor: cardBorderColor },
                  cardShadow,
                ]}
              >
                <EffectTimerRing
                  progress={progress}
                  colors={colors}
                  eff={eff}
                  gradientColors={isDebuff ? [colors.rose, colors.lilac] : undefined}
                >
                  <View style={[styles.shopActiveIconShell, iconShellStyle]}>
                    <LinearGradient
                      colors={iconGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.shopActiveIconInner}
                    >
                      <MaterialCommunityIcons
                        name={effect.icon || 'flash-outline'}
                        size={22}
                        color={iconColor}
                      />
                    </LinearGradient>
                  </View>
                </EffectTimerRing>
                <View style={styles.shopActiveInfo}>
                  <View style={styles.shopActiveNameRow}>
                    <Text style={[styles.shopActiveName, { color: nameColor }]}>{effect.name}</Text>
                  </View>
                  {remaining != null && effect.duration ? (
                    <View style={styles.shopActiveTimerRow}>
                      <MaterialCommunityIcons name="clock-time-four-outline" size={14} color={timerColor} />
                      <Text style={[styles.shopActiveTimerText, { color: timerColor }]}>{formatTime(remaining)}</Text>
                    </View>
                  ) : (
                    <Text style={[styles.shopActivePassive, { color: passiveColor }]}>
                      {isDebuff ? 'Active penalty' : 'Passive boost'}
                    </Text>
                  )}
                  <Text style={[styles.shopActiveDescription, { color: descriptionColor }]} numberOfLines={2}>
                    {effect.description}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  shopSection: {
    marginTop: 24,
  },
  shopSectionHeader: {
    marginBottom: 12,
  },
  shopSectionEyebrow: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  shopSectionTitle: {
    marginTop: 4,
    fontSize: 18,
    lineHeight: 26,
    fontFamily: 'Poppins_700Bold',
  },
  shopEmptyCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },
  shopEmptyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  shopEmptyTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  shopEmptyDescription: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    textAlign: 'center',
    lineHeight: 20,
  },
  shopBrowseButton: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  shopBrowseButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#0f172a',
  },
  shopActiveList: {
    gap: 16,
  },
  shopActiveCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  shopActiveIconShell: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  shopActiveIconInner: {
    width: '100%',
    height: '100%',
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopActiveInfo: {
    flex: 1,
    gap: 6,
  },
  shopActiveNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shopActiveName: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  shopActiveTimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shopActiveTimerText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
  shopActivePassive: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
  },
  shopActiveDescription: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    lineHeight: 19,
  },
});

export default ShopActiveEffects;
