import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { PLATFORMS, STATUSES, COUNTRIES, getCitiesForCountry } from '..';
import { computeRewards, focusCost } from '../../progression';
import { getGlassBorderColor, getGlassGradientColors, hexToRgba } from '../../../utils/color';
import { TextField } from '../../../components/forms/TextField';
import { AutoCompleteField } from '../../../components/forms/AutoCompleteField';
import { SegmentedControl } from '../../../components/forms/SegmentedControl';
import { IconToggle } from '../../../components/forms/IconToggle';

const TYPE_OPTIONS = ['Full', 'Easy'];

const buildInitialFormValues = () => ({
  company: '',
  role: '',
  type: 'Full',
  status: 'Applied',
  platform: 'Company website',
  cvTailored: false,
  motivation: false,
  favorite: false,
  note: '',
  country: '',
  city: '',
});

const RewardPreview = ({ xp, gold, focus, colors }) => {
  const glassColors = getGlassGradientColors(colors);
  const glassBorder = getGlassBorderColor(colors);
  const chipTextColor = colors.text;
  const chips = [
    { key: 'xp', icon: 'flash-outline', label: `+${xp}` },
    { key: 'gold', icon: 'diamond-stone', label: `+${gold}` },
    { key: 'focus', icon: 'brain', label: `-${focus}` },
  ];

  return (
    <View style={styles.rewardPreview}>
      {chips.map((chip) => (
        <LinearGradient
          key={chip.key}
          colors={glassColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.rewardChip, { borderColor: glassBorder }]}
        >
          <MaterialCommunityIcons name={chip.icon} size={14} color={chipTextColor} />
          <Text style={[styles.rewardChipText, { color: chipTextColor }]}>{chip.label}</Text>
        </LinearGradient>
      ))}
    </View>
  );
};

const StatusSelector = ({ value, onChange, colors, options = STATUSES, statusMeta = {} }) => (
  <View>
    {options.map((status) => {
      const isActive = value === status.key;
      const meta = statusMeta[status.key] || {};
      const tintColor = meta.tint ? colors[meta.tint] : colors.sky;
      return (
        <TouchableOpacity
          key={status.key}
          onPress={() => onChange(status.key)}
          activeOpacity={0.85}
          style={[
            styles.statusOption,
            {
              backgroundColor: colors.surface,
              borderColor: colors.surfaceBorder,
            },
            isActive && {
              backgroundColor: hexToRgba(tintColor, 0.18),
              borderColor: tintColor,
            },
          ]}
        >
          <View style={styles.statusOptionContent}>
            {meta.icon ? (
              <View
                style={[
                  styles.statusOptionIcon,
                  {
                    backgroundColor: isActive ? tintColor : colors.chipBg,
                    borderColor: isActive ? tintColor : colors.surfaceBorder,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={meta.icon}
                  size={14}
                  color={isActive ? '#0f172a' : 'rgba(148,163,184,.95)'}
                />
              </View>
            ) : null}
            <View style={styles.statusOptionTextGroup}>
              <Text style={[styles.statusOptionTitle, { color: colors.text }]}>{status.key}</Text>
              {status.hint ? (
                <Text style={[styles.statusOptionHint, { color: hexToRgba(colors.text, 0.55) }]}> 
                  {status.hint}
                </Text>
              ) : null}
            </View>
          </View>
          {isActive ? <MaterialCommunityIcons name="check-circle" size={18} color={tintColor} /> : null}
        </TouchableOpacity>
      );
    })}
  </View>
);

const PlatformSelector = ({ value, onChange, colors }) => {
  const glassColors = getGlassGradientColors(colors);
  const glassBorder = getGlassBorderColor(colors);
  const activeLabelColor = colors.text;
  const inactiveLabelColor = hexToRgba(colors.text, 0.75);

  return (
    <View style={styles.platformOptions}>
      {PLATFORMS.map((platform) => {
        const isActive = value === platform;
        return (
          <TouchableOpacity
            key={platform}
            onPress={() => onChange(platform)}
            activeOpacity={0.85}
            style={styles.platformChip}
          >
            {isActive ? (
              <LinearGradient
                colors={glassColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.platformChipInner, { borderColor: glassBorder }]}
              >
                <Text style={[styles.platformChipText, { color: activeLabelColor }]}>{platform}</Text>
              </LinearGradient>
            ) : (
              <View
                style={[
                  styles.platformChipInner,
                  { backgroundColor: colors.chipBg, borderColor: colors.surfaceBorder },
                ]}
              >
                <Text style={[styles.platformChipText, { color: inactiveLabelColor }]}>{platform}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const ApplicationFormModal = ({
  visible,
  onClose,
  onSubmit,
  colors,
  effects = [],
  spray = 1,
  defaults,
  title = 'Log Application',
  submitLabel = 'Add Application',
  statusOptions = STATUSES,
  statusMeta = {},
}) => {
  const initialValues = useMemo(() => {
    const base = { ...buildInitialFormValues(), ...defaults };
    if (statusOptions.length && !statusOptions.some((option) => option.key === base.status)) {
      base.status = statusOptions[0].key;
    }
    return base;
  }, [defaults, statusOptions]);
  const [form, setForm] = useState(initialValues);

  useEffect(() => {
    if (visible) {
      setForm(initialValues);
    }
  }, [visible, initialValues]);

  const setField = useCallback(
    (field) => (value) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const { company, role, type, note, cvTailored, motivation, favorite, status, platform, country, city } = form;

  const { xp: xpReward, gold: goldReward } = useMemo(
    () => computeRewards({ type, cvTailored, motivation }, { effects, spray }),
    [type, cvTailored, motivation, effects, spray],
  );
  const cost = useMemo(() => focusCost(type), [type]);
  const cityOptions = useMemo(() => (country ? getCitiesForCountry(country) : []), [country]);

  const handleCountrySelect = useCallback((selected) => {
    setForm((prev) => {
      const nextCountry = selected;
      const shouldResetCity = nextCountry !== prev.country;
      return {
        ...prev,
        country: nextCountry,
        city: shouldResetCity ? '' : prev.city,
      };
    });
  }, []);

  const handleCitySelect = useCallback((selected) => {
    setForm((prev) => ({ ...prev, city: selected }));
  }, []);

  const handleCancel = useCallback(() => {
    setForm(initialValues);
    onClose?.();
  }, [initialValues, onClose]);

  const handleSubmit = useCallback(() => {
    if (!company || !role) {
      Alert.alert('Error', 'Please fill in company and role');
      return;
    }

    if (country && !COUNTRIES.includes(country)) {
      Alert.alert('Invalid Country', 'Please select a country from the list.');
      return;
    }

    if (city) {
      if (!country) {
        Alert.alert('Invalid City', 'Please select a country before choosing a city.');
        return;
      }
      const validCities = getCitiesForCountry(country);
      if (!validCities.includes(city)) {
        Alert.alert('Invalid City', 'Please select a city from the list.');
        return;
      }
    }

    const payload = { ...form };
    if (!payload.date) {
      payload.date = new Date().toISOString();
    }
    const result = onSubmit?.(payload);
    if (result !== false) {
      setForm(initialValues);
      onClose?.();
    }
  }, [company, role, form, onSubmit, initialValues, onClose, country, city]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.bg }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.surfaceBorder }]}> 
          <View style={styles.modalTitleRow}> 
            <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text> 
            <RewardPreview xp={xpReward} gold={goldReward} focus={cost} colors={colors} /> 
          </View> 
          <TouchableOpacity onPress={handleCancel} style={[styles.closeButton, { backgroundColor: colors.chipBg }]}> 
            <MaterialCommunityIcons name="close" size={20} color={colors.text} /> 
          </TouchableOpacity> 
        </View> 

        <ScrollView
          style={styles.modalContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TextField
            label="Company"
            value={company}
            onChangeText={setField('company')}
            placeholder="Acme Inc."
            colors={colors}
          />

          <TextField
            label="Role"
            value={role}
            onChangeText={setField('role')}
            placeholder="Data Analyst"
            colors={colors}
          />

          <SegmentedControl
            options={TYPE_OPTIONS}
            value={type}
            onChange={setField('type')}
            colors={colors}
          />

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Status</Text>
            <StatusSelector
              value={status}
              onChange={setField('status')}
              colors={colors}
              options={statusOptions}
              statusMeta={statusMeta}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Platform</Text>
            <PlatformSelector value={platform} onChange={setField('platform')} colors={colors} />
          </View>

          <View style={styles.inlineFieldRow}>
            <AutoCompleteField
              label="Country"
              value={country}
              onSelect={handleCountrySelect}
              placeholder="Start typing..."
              colors={colors}
              options={COUNTRIES}
              minChars={2}
              containerStyle={styles.inlineField}
            />
            <AutoCompleteField
              label="City"
              value={city}
              onSelect={handleCitySelect}
              placeholder={country ? 'Start typing...' : 'Select country first'}
              colors={colors}
              options={cityOptions}
              minChars={1}
              containerStyle={styles.inlineField}
              disabled={!country}
            />
          </View>

          <TextField
            label="Notes (optional)"
            value={note}
            onChangeText={setField('note')}
            placeholder="Additional notes..."
            colors={colors}
            multiline
            numberOfLines={3}
          />

          <View style={styles.iconToggleRow}>
            <IconToggle
              label="CV"
              icon="file-document-edit-outline"
              activeIcon="file-check"
              value={cvTailored}
              onToggle={setField('cvTailored')}
              colors={colors}
            />
            <IconToggle
              label="Motivation"
              icon="email-edit-outline"
              activeIcon="email-check-outline"
              value={motivation}
              onToggle={setField('motivation')}
              colors={colors}
            />
            <IconToggle
              label="Fav"
              icon="star-outline"
              activeIcon="star"
              value={favorite}
              onToggle={setField('favorite')}
              colors={colors}
            />
          </View>
        </ScrollView>

        <View style={[styles.modalFooter, { borderTopColor: colors.surfaceBorder }]}> 
          <TouchableOpacity onPress={handleCancel} style={[styles.cancelButton, { backgroundColor: colors.chipBg }]}> 
            <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text> 
          </TouchableOpacity> 
          <TouchableOpacity onPress={handleSubmit} style={styles.submitButtonWrapper}> 
            <LinearGradient
              colors={[colors.sky, colors.emerald]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitButton}
            >
              <Text style={styles.submitButtonText}>{submitLabel}</Text>
            </LinearGradient>
          </TouchableOpacity> 
        </View> 
      </SafeAreaView>
    </Modal>
  );
};

export default ApplicationFormModal;

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  iconToggleRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  inlineFieldRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  inlineField: {
    flex: 1,
    marginHorizontal: 6,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
  },
  statusOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  statusOptionIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statusOptionTextGroup: {
    flex: 1,
  },
  statusOptionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusOptionHint: {
    fontSize: 12,
  },
  platformOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  platformChip: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  platformChipInner: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  platformChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  submitButtonWrapper: {
    flex: 1,
    borderRadius: 12,
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  rewardPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  rewardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  rewardChipText: {
    marginLeft: 4,
    fontSize: 11,
    fontWeight: '600',
  },
});
