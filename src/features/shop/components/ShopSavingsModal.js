import React, { useCallback, useMemo, useState } from 'react';
import { Modal, PanResponder, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { hexToRgba } from '../../../utils/color';

const GoldSlider = ({ value, max, colors, eff, onChange }) => {
  const [trackWidth, setTrackWidth] = useState(0);
  const clampedMax = Math.max(0, max);
  const clampedValue = Math.max(0, Math.min(value, clampedMax));
  const percentage = clampedMax > 0 ? Math.min(100, (clampedValue / clampedMax) * 100) : 0;

  const handleGesture = useCallback(
    (evt) => {
      if (!trackWidth || clampedMax <= 0) {
        return;
      }
      const x = evt.nativeEvent.locationX;
      const ratio = Math.max(0, Math.min(1, x / trackWidth));
      const next = Math.round(clampedMax * ratio);
      onChange(next);
    },
    [trackWidth, clampedMax, onChange],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: handleGesture,
        onPanResponderMove: handleGesture,
        onPanResponderRelease: handleGesture,
      }),
    [handleGesture],
  );

  const thumbSize = 22;
  const thumbLeft = trackWidth ? (percentage / 100) * trackWidth : 0;

  return (
    <View
      style={[
        styles.shopSliderTrack,
        {
          borderColor: colors.surfaceBorder,
          backgroundColor: hexToRgba(colors.text, eff === 'light' ? 0.12 : 0.28),
        },
      ]}
      onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
      {...panResponder.panHandlers}
    >
      <LinearGradient
        colors={[colors.sky, colors.emerald]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.shopSliderFill, { width: `${percentage}%` }]}
      />
      <View
        style={[
          styles.shopSliderThumb,
          {
            left: Math.max(0, Math.min(trackWidth - thumbSize, thumbLeft - thumbSize / 2)),
            width: thumbSize,
            height: thumbSize,
            borderRadius: thumbSize / 2,
            backgroundColor: colors.surface,
            borderColor: colors.surfaceBorder,
          },
        ]}
      />
    </View>
  );
};

const ShopSavingsModal = ({
  visible,
  onClose,
  colors,
  eff,
  cardShadow,
  overlayBackground,
  savingItem,
  saveAmount,
  maxSavableNow,
  savingProgress,
  totalCost,
  onChangeAmount,
  onConfirm,
  formatGoldValue,
}) => {
  const disableConfirm = saveAmount <= 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.shopModalOverlay, { backgroundColor: overlayBackground }]}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View
              style={[
                styles.shopModalCard,
                { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
                cardShadow,
              ]}
            >
              <View style={styles.shopModalHeader}>
                <View
                  style={[
                    styles.shopModalIconShell,
                    { borderColor: colors.surfaceBorder, backgroundColor: colors.surface },
                  ]}
                >
                  <LinearGradient
                    colors={[colors.sky, colors.emerald]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.shopModalIconInner}
                  >
                    <MaterialCommunityIcons name="wallet-outline" size={20} color="#0f172a" />
                  </LinearGradient>
                </View>
                <View style={styles.shopModalHeaderText}>
                  <Text style={[styles.shopModalTitle, { color: colors.text }]}>Save gold for {savingItem?.name}</Text>
                  <Text style={[styles.shopModalDescription, { color: hexToRgba(colors.text, 0.65) }]}>Decide how much to stash away right now. You can come back later to add more.</Text>
                </View>
              </View>

              <GoldSlider value={saveAmount} max={maxSavableNow} colors={colors} eff={eff} onChange={onChangeAmount} />

              <View style={styles.shopModalLabelRow}>
                <Text style={[styles.shopModalLabel, { color: colors.text }]}>
                  {formatGoldValue(saveAmount)}
                </Text>
                <Text style={[styles.shopModalLabelValue, { color: hexToRgba(colors.text, 0.6) }]}> 
                  {formatGoldValue(maxSavableNow)} available now
                </Text>
              </View>
              <Text style={[styles.shopModalHint, { color: hexToRgba(colors.text, 0.6) }]}>Already saved {formatGoldValue(savingProgress)} / {formatGoldValue(totalCost)}</Text>

              <View style={styles.shopModalActions}>
                <TouchableOpacity
                  onPress={onClose}
                  activeOpacity={0.85}
                  style={[styles.shopModalButton, { borderColor: colors.surfaceBorder, backgroundColor: colors.surface }]}
                >
                  <Text style={[styles.shopModalButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={onConfirm}
                  activeOpacity={disableConfirm ? 1 : 0.85}
                  disabled={disableConfirm}
                  style={[
                    styles.shopModalButton,
                    styles.shopModalPrimary,
                    { borderColor: colors.surfaceBorder, opacity: disableConfirm ? 0.5 : 1 },
                  ]}
                >
                  <LinearGradient
                    colors={[colors.sky, colors.emerald]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <Text style={styles.shopModalPrimaryText}>Save amount</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  shopSliderTrack: {
    width: '100%',
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 8,
    marginTop: 16,
  },
  shopSliderFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 999,
  },
  shopSliderThumb: {
    position: 'absolute',
    top: 6,
    borderWidth: 1,
  },
  shopModalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  shopModalCard: {
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
  },
  shopModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  shopModalIconShell: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  shopModalIconInner: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopModalHeaderText: {
    flex: 1,
    gap: 6,
  },
  shopModalTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
  },
  shopModalDescription: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    lineHeight: 20,
  },
  shopModalLabelRow: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shopModalLabel: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
  },
  shopModalLabelValue: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
  },
  shopModalHint: {
    marginTop: 8,
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
  },
  shopModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
  },
  shopModalButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  shopModalButtonText: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
  },
  shopModalPrimary: {
    position: 'relative',
  },
  shopModalPrimaryText: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: '#0f172a',
  },
});

export default ShopSavingsModal;
