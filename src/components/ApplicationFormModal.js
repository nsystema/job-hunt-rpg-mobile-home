import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { PLATFORMS, STATUSES } from '../data/appConstants';
import { palette } from '../constants/theme';

const defaultForm = {
  company: '',
  role: '',
  platform: PLATFORMS[0],
  status: STATUSES[0].key,
  type: 'Full',
  cvTailored: false,
  motivation: false,
  note: ''
};

export default function ApplicationFormModal({ visible, onClose, onSubmit, initialValues }) {
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (visible) {
      setForm({ ...defaultForm, ...initialValues });
    }
  }, [visible, initialValues]);

  const submit = () => {
    if (!form.company.trim() || !form.role.trim()) {
      return;
    }
    onSubmit?.(form);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.centered}
        >
          <View style={styles.sheet}>
            <View style={styles.header}>
              <Text style={styles.title}>{initialValues ? 'Edit application' : 'Log application'}</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.close}>Close</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Company</Text>
              <TextInput
                style={styles.input}
                placeholder="Company name"
                placeholderTextColor={palette.textMuted}
                value={form.company}
                onChangeText={(value) => setForm((prev) => ({ ...prev, company: value }))}
              />

              <Text style={styles.label}>Role</Text>
              <TextInput
                style={styles.input}
                placeholder="Role title"
                placeholderTextColor={palette.textMuted}
                value={form.role}
                onChangeText={(value) => setForm((prev) => ({ ...prev, role: value }))}
              />

              <Text style={styles.label}>Platform</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {PLATFORMS.map((platform) => {
                  const active = form.platform === platform;
                  return (
                    <TouchableOpacity
                      key={platform}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setForm((prev) => ({ ...prev, platform }))}
                    >
                      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{platform}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={styles.label}>Status</Text>
              <View style={styles.chipRow}>
                {STATUSES.map((status) => {
                  const active = form.status === status.key;
                  return (
                    <TouchableOpacity
                      key={status.key}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setForm((prev) => ({ ...prev, status: status.key }))}
                    >
                      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{status.key}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.label}>Application type</Text>
              <View style={styles.chipRow}>
                {['Full', 'Easy'].map((type) => {
                  const active = form.type === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setForm((prev) => ({ ...prev, type }))}
                    >
                      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{type}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>CV tailored</Text>
                <Switch
                  value={form.cvTailored}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, cvTailored: value }))}
                  thumbColor={form.cvTailored ? palette.accent : '#475569'}
                  trackColor={{ true: 'rgba(56, 189, 248, 0.4)', false: 'rgba(15,23,42,0.6)' }}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Motivation letter</Text>
                <Switch
                  value={form.motivation}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, motivation: value }))}
                  thumbColor={form.motivation ? palette.accent : '#475569'}
                  trackColor={{ true: 'rgba(56, 189, 248, 0.4)', false: 'rgba(15,23,42,0.6)' }}
                />
              </View>

              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Add any punchy notes"
                placeholderTextColor={palette.textMuted}
                multiline
                value={form.note}
                onChangeText={(value) => setForm((prev) => ({ ...prev, note: value }))}
              />
            </ScrollView>
            <TouchableOpacity style={styles.submit} onPress={submit} activeOpacity={0.85}>
              <Text style={styles.submitLabel}>{initialValues ? 'Save changes' : 'Add application'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2,6,23,0.78)',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40
  },
  centered: {
    flex: 1,
    justifyContent: 'center'
  },
  sheet: {
    backgroundColor: palette.background,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 20,
    maxHeight: '90%'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  title: {
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: '700'
  },
  close: {
    color: palette.textMuted,
    fontSize: 14
  },
  body: {
    flexGrow: 0
  },
  label: {
    marginTop: 14,
    marginBottom: 6,
    color: palette.textMuted,
    fontSize: 13,
    textTransform: 'uppercase'
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: palette.textPrimary,
    backgroundColor: 'rgba(15,23,42,0.92)'
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: 'top'
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border
  },
  chipActive: {
    backgroundColor: palette.accent,
    borderColor: palette.accent
  },
  chipLabel: {
    color: palette.textMuted,
    fontSize: 13
  },
  chipLabelActive: {
    color: '#041028',
    fontWeight: '600'
  },
  switchRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  switchLabel: {
    color: palette.textPrimary,
    fontSize: 14
  },
  submit: {
    marginTop: 18,
    borderRadius: 16,
    paddingVertical: 14,
    backgroundColor: palette.accent
  },
  submitLabel: {
    color: '#041028',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 16
  }
});
