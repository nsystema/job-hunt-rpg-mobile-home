import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import SectionHeader from '../components/SectionHeader';
import EffectCard from '../components/EffectCard';
import SurfaceCard from '../components/SurfaceCard';
import { palette } from '../constants/theme';
import { useGame } from '../context/GameContext';

export default function ShopScreen() {
  const { state, gameEffects, buyEffect } = useGame();
  const owned = useMemo(() => new Set(state.effects.map((effect) => effect.id)), [state.effects]);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionHeader title="Shop" subtitle="Temporary boosts" />
        {gameEffects.map((effect) => (
          <EffectCard
            key={effect.id}
            effect={effect}
            owned={owned.has(effect.id)}
            onPress={buyEffect}
          />
        ))}

        <SectionHeader title="Active boosts" subtitle="Timers run in real-time" />
        {state.effects.length ? (
          state.effects.map((effect) => <EffectCard key={`owned-${effect.id}`} effect={effect} owned />)
        ) : (
          <SurfaceCard>
            <Text style={styles.empty}>No boosts active. Buy one to accelerate rewards.</Text>
          </SurfaceCard>
        )}

        <SurfaceCard style={styles.tipBox}>
          <Text style={styles.tipTitle}>Tip</Text>
          <Text style={styles.tip}>Effects stack with streak bonuses and chest drops. Use them before intense application sprints.</Text>
        </SurfaceCard>
        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.background
  },
  content: {
    padding: 20,
    paddingBottom: 32
  },
  empty: {
    color: palette.textMuted
  },
  tipBox: {
    marginTop: 18
  },
  tipTitle: {
    color: palette.textMuted,
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 6
  },
  tip: {
    color: palette.textPrimary,
    lineHeight: 18
  },
  bottomSpace: {
    height: 60
  }
});
