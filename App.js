import 'react-native-url-polyfill/auto';
import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  Modal,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { usePalette, cur } from './hooks/usePalette';
import { useTheme } from './hooks/useTheme';
import { xpl, lvl, FOCUS_BASELINE, focusCost, computeRewards } from './gameMechanics';
import { STATUSES } from './data';

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

const TYPE_OPTIONS = ['Full', 'Easy'];

const TextField = ({
  label,
  value,
  onChangeText,
  placeholder,
  colors,
  multiline = false,
  numberOfLines = 1,
}) => (
  <View style={styles.formGroup}>
    <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={`${colors.text}80`}
      multiline={multiline}
      numberOfLines={multiline ? numberOfLines : 1}
      style={[
        multiline ? styles.textArea : styles.textInput,
        {
          backgroundColor: colors.surface,
          borderColor: colors.surfaceBorder,
          color: colors.text,
        },
      ]}
    />
  </View>
);

const ToggleControl = ({ label, value, onValueChange, colors }) => (
  <View style={styles.toggleItem}>
    <Text style={[styles.toggleLabel, { color: colors.text }]}>{label}</Text>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: colors.chipBg, true: colors.sky }}
      thumbColor={value ? '#0f172a' : colors.text}
    />
  </View>
);

const TypeSelector = ({ value, onChange, colors }) => (
  <View style={styles.segmentedControl}>
    {TYPE_OPTIONS.map((option) => {
      const isActive = value === option;
      return (
        <TouchableOpacity
          key={option}
          onPress={() => onChange(option)}
          style={[
            styles.segmentButton,
            { borderColor: colors.surfaceBorder },
            isActive && { backgroundColor: colors.sky },
          ]}
        >
          <Text style={[styles.segmentText, { color: isActive ? '#0f172a' : colors.text }]}>{option}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

// Helper components
const StatBadge = ({ icon, count, colors }) => (
  <View style={[styles.statBadge, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
    <Ionicons name={icon} size={20} color={colors.text} />
    <View style={[styles.statBadgeCount, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
      <Text style={[styles.statBadgeCountText, { color: colors.text }]}>{count}</Text>
    </View>
  </View>
);

const IconButton = ({ onPress, icon, colors, accessibilityLabel }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
    accessibilityLabel={accessibilityLabel}
  >
    <Ionicons name={icon} size={20} color={colors.text} />
  </TouchableOpacity>
);

const ProgressBar = ({ value, max, fromColor, toColor, colors }) => {
  const percentage = max ? Math.min(100, (value / max) * 100) : 0;
  return (
    <View style={[styles.progressBarContainer, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: colors.surfaceBorder }]}>
      <LinearGradient
        colors={[fromColor, toColor]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.progressBarFill, { width: `${Math.max(8, percentage)}%` }]}
      />
    </View>
  );
};

const GoldPill = ({ children, colors }) => (
  <LinearGradient
    colors={['#fde68a', '#f59e0b']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.goldPill}
  >
    <Ionicons name="diamond" size={16} color="#1f2937" />
    <Text style={styles.goldPillText}>{children}</Text>
  </LinearGradient>
);

const Panel = ({ children, colors, style = {} }) => (
  <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }, style]}>
    {children}
  </View>
);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const month = MONTHS[date.getMonth()];
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month} ${day} at ${hours}:${minutes}`;
};

const truncate = (value, limit = 70) => {
  if (!value) return '';
  if (value.length <= limit) return value;
  return `${value.slice(0, limit - 3)}...`;
};

const MIN_FOCUS_FOR_LOG = 0.25;

// Application Form Modal
const AppFormModal = ({ visible, onClose, onSubmit, colors, effects = [] }) => {
  const [form, setForm] = useState(() => buildInitialFormValues());

  const setField = useCallback(
    (field) => (value) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const resetForm = useCallback(() => {
    setForm(buildInitialFormValues());
  }, []);

  const { company, role, type, note, cvTailored, motivation, favorite } = form;

  const { xp: xpReward, gold: goldReward } = useMemo(
    () => computeRewards({ type, cvTailored, motivation }, { effects }),
    [type, cvTailored, motivation, effects]
  );
  const cost = useMemo(() => focusCost(type), [type]);

  const handleSubmit = useCallback(() => {
    if (!company || !role) {
      Alert.alert('Error', 'Please fill in company and role');
      return;
    }

    const now = new Date();
    onSubmit({ ...form, date: now.toISOString() });
    resetForm();
  }, [company, role, form, onSubmit, resetForm]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.bg }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.surfaceBorder }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Log Application</Text>
          <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.chipBg }]}>
            <Ionicons name="close" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
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

          <TypeSelector value={type} onChange={setField('type')} colors={colors} />

          <TextField
            label="Notes (optional)"
            value={note}
            onChangeText={setField('note')}
            placeholder="Additional notes..."
            colors={colors}
            multiline
            numberOfLines={3}
          />

          <View style={styles.toggleRow}>
            <ToggleControl
              label="CV Tailored"
              value={cvTailored}
              onValueChange={setField('cvTailored')}
              colors={colors}
            />
            <ToggleControl
              label="Motivation Letter"
              value={motivation}
              onValueChange={setField('motivation')}
              colors={colors}
            />
          </View>

          <View style={styles.toggleRow}>
            <ToggleControl
              label="Favorite"
              value={favorite}
              onValueChange={setField('favorite')}
              colors={colors}
            />
          </View>

          <View style={styles.rewardInfo}>
            <Text style={[styles.rewardText, { color: colors.text }]}>
              Rewards: +{xpReward} XP, +{goldReward} Gold, -{cost} Focus
            </Text>
          </View>
        </ScrollView>

        <View style={[styles.modalFooter, { borderTopColor: colors.surfaceBorder }]}>
          <TouchableOpacity onPress={onClose} style={[styles.cancelButton, { backgroundColor: colors.chipBg }]}>
            <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSubmit}>
            <LinearGradient
              colors={[colors.sky, colors.emerald]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitButton}
            >
              <Text style={styles.submitButtonText}>Add Application</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

// Main App Component
export default function App() {
  const { mode, eff, cycle } = useTheme();
  const { cycle: cyclePal, pal } = usePalette();
  const colors = cur(eff, pal);

  // Game state
  const [xp, setXp] = useState(520);
  const [apps, setApps] = useState(48);
  const [weighted, setWeighted] = useState(46.5);
  const [gold, setGold] = useState(260);
  const [skillPoints, setSkillPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [activeEffects] = useState([]);
  const [focus, setFocus] = useState(FOCUS_BASELINE);
  const [applications, setApplications] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const { l, rem, need } = useMemo(() => lvl(xp), [xp]);
  const step = 25;
  const into = weighted % step;

  const gainXp = useCallback(
    (base, applyBuff = true) => {
      const hasBuff = applyBuff && activeEffects.some((effect) => effect.id === 1 || effect.id === 3);
      const multiplier = hasBuff ? 2 : 1;
      setXp((value) => value + base * multiplier);
    },
    [activeEffects]
  );

  const addApplication = useCallback(
    (fields) => {
      const cost = focusCost(fields.type);
      if (focus < cost) {
        Alert.alert('Out of Focus', 'You are out of focus! Recharge to log more applications.');
        return false;
      }

      const id = Math.random().toString(36).slice(2, 9);
      const { xp: xpReward, gold: goldReward, qs, au } = computeRewards(fields, { effects: activeEffects });
      const app = { id, ...fields, qs };

      setApplications((list) => [app, ...list]);
      setApps((value) => value + 1);
      setWeighted((value) => value + au);
      gainXp(xpReward, false);
      setGold((value) => value + goldReward);
      setFocus((value) => Math.max(0, value - cost));
      return true;
    },
    [focus, activeEffects, gainXp]
  );

  const handleLogPress = useCallback(() => {
    if (focus < MIN_FOCUS_FOR_LOG) {
      Alert.alert('Out of Focus', 'You are out of focus! Recharge to log more applications.');
      return;
    }
    setShowForm(true);
  }, [focus]);

  const handleEasyApply = useCallback(() => {
    const now = new Date();
    addApplication({
      company: 'New Company',
      role: 'Easy Apply',
      country: '',
      city: '',
      type: 'Easy',
      status: 'Applied',
      date: now.toISOString(),
      note: '',
      cvTailored: false,
      motivation: false,
      favorite: false,
      platform: 'Company website',
    });
  }, [addApplication]);

  const handleNetworking = useCallback(() => {
    setGold((value) => value + 8);
  }, []);

  const handleSkill = useCallback(() => {
    gainXp(14);
    setGold((value) => value + 3);
  }, [gainXp]);

  const handleInterview = useCallback(() => {
    gainXp(18);
    setGold((value) => value + 4);
  }, [gainXp]);

  const handlePrestige = useCallback(() => {}, []);

  const quickActions = useMemo(
    () => [
      { key: 'Log application', icon: 'flash', onPress: handleLogPress, hint: 'Open log form' },
      { key: 'Easy apply', icon: 'trending-up', onPress: handleEasyApply, hint: 'Log easy apply' },
      { key: 'Networking', icon: 'people', onPress: handleNetworking, hint: 'Add networking' },
      { key: 'Skill', icon: 'school', onPress: handleSkill, hint: 'Add skill block' },
      { key: 'Interview', icon: 'chatbubbles', onPress: handleInterview, hint: 'Add interview prep' },
      {
        key: 'Prestige',
        icon: 'trophy',
        onPress: handlePrestige,
        hint: 'Prestige (requires Level 100)',
        disabled: l < 100,
      },
    ],
    [handleLogPress, handleEasyApply, handleNetworking, handleSkill, handleInterview, handlePrestige, l]
  );

  const statusIcons = useMemo(
    () => ({
      Applied: { icon: 'document-text-outline', tint: colors.sky },
      Interview: { icon: 'chatbubble-ellipses-outline', tint: colors.emerald },
      Ghosted: { icon: 'skull-outline', tint: colors.rose },
      Rejected: { icon: 'close-circle-outline', tint: colors.rose },
    }),
    [colors]
  );

  const statusLookup = useMemo(
    () => Object.fromEntries(STATUSES.map((status) => [status.key, status])),
    []
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={eff === 'light' ? 'dark-content' : 'light-content'} backgroundColor={colors.bg} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconButton
            onPress={cycle}
            icon={mode === 'light' ? 'sunny' : mode === 'dark' ? 'moon' : 'desktop'}
            colors={colors}
            accessibilityLabel="Cycle theme"
          />
          <TouchableOpacity
            onPress={cyclePal}
            style={[styles.paletteButton, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
          >
            <Ionicons name="color-palette" size={20} color={colors.text} />
            <Text style={[styles.paletteText, { color: colors.text }]}>{pal.name}</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.headerRight}>
          <StatBadge icon="school" count={skillPoints} colors={colors} />
          <StatBadge icon="flame" count={streak} colors={colors} />
          <GoldPill colors={colors}>{gold}</GoldPill>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Level Panel */}
        <Panel colors={colors}>
          <View style={styles.levelHeader}>
            <View style={styles.levelInfo}>
              <Ionicons name="medal" size={16} color={colors.sky} />
              <Text style={[styles.levelText, { color: colors.text }]}>Level {l}</Text>
            </View>
            <View style={styles.appsCount}>
              <Ionicons name="briefcase" size={16} color={colors.text} />
              <Text style={[styles.appsCountText, { color: colors.text }]}>{apps}</Text>
            </View>
          </View>
          
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <View style={styles.progressLabel}>
                <Ionicons name="flash" size={14} color="rgba(148,163,184,.95)" />
                <Text style={styles.progressLabelText}>XP to next</Text>
              </View>
              <Text style={styles.progressValue}>{Math.floor(rem)} / {need}</Text>
            </View>
            <ProgressBar value={rem} max={need} fromColor={colors.rose} toColor={colors.amber} colors={colors} />
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <View style={styles.progressLabel}>
                <Ionicons name="bulb-outline" size={14} color="rgba(148,163,184,.95)" />
                <Text style={styles.progressLabelText}>Focus</Text>
              </View>
              <Text style={styles.progressValue}>{focus.toFixed(1)} / {FOCUS_BASELINE}</Text>
            </View>
            <ProgressBar value={focus} max={FOCUS_BASELINE} fromColor={colors.lilac} toColor={colors.sky} colors={colors} />
          </View>
        </Panel>

        {/* Milestone Panel */}
        <Panel colors={colors}>
          <View style={styles.progressHeader}>
            <View style={styles.progressLabel}>
              <Ionicons name="flag-outline" size={14} color="rgba(148,163,184,.95)" />
              <Text style={styles.progressLabelText}>Milestone</Text>
            </View>
            <Text style={styles.progressValue}>{into.toFixed(1)} / {step}</Text>
          </View>
          <ProgressBar value={into} max={step} fromColor={colors.sky} toColor={colors.emerald} colors={colors} />
        </Panel>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.key}
              onPress={action.onPress}
              disabled={action.disabled}
              style={[styles.quickAction, { opacity: action.disabled ? 0.5 : 1 }]}
              accessibilityLabel={action.hint}
            >
              <Ionicons name={action.icon} size={20} color="rgba(148,163,184,.95)" />
              <Text style={styles.quickActionText}>{action.key}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Panel colors={colors}>
          <View style={styles.panelHeader}>
            <Text style={[styles.panelTitle, { color: colors.text }]}>Applications</Text>
            {applications.length > 0 && (
              <Text style={styles.panelSubtitle}>{applications.length} logged</Text>
            )}
          </View>

          {applications.length ? (
            applications.map((app, index) => {
              const extras = [
                { key: 'cv', icon: 'document-text-outline', active: app.cvTailored },
                { key: 'motivation', icon: 'mail-outline', active: app.motivation },
                { key: 'favorite', icon: 'star-outline', active: app.favorite }
              ];
              const statusInfo = statusIcons[app.status] || {};
              const status = statusLookup[app.status];
              const dateLabel = formatDateTime(app.date);
              const notePreview = truncate(app.note);

              return (
                <View
                  key={app.id}
                  style={[
                    styles.appCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.surfaceBorder,
                      marginBottom: index === applications.length - 1 ? 0 : 12
                    }
                  ]}
                >
                  <View style={styles.appHeader}>
                    <View style={styles.appTitle}>
                      <Text style={[styles.appCompany, { color: colors.text }]}>{app.company}</Text>
                      <Text style={styles.appRole}>{app.role}</Text>
                      {notePreview ? <Text style={styles.appNote}>{notePreview}</Text> : null}
                    </View>
                    <View style={styles.appMeta}>
                      {dateLabel ? <Text style={styles.appMetaText}>{dateLabel}</Text> : null}
                    </View>
                  </View>

                  <View style={styles.appExtras}>
                    {extras.map((extra, extraIndex) => {
                      const marginStyle = { marginRight: extraIndex === extras.length - 1 ? 0 : 8 };
                      if (extra.active) {
                        return (
                          <LinearGradient
                            key={extra.key}
                            colors={[colors.sky, colors.emerald]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[styles.appExtraIcon, marginStyle]}
                          >
                            <Ionicons name={extra.icon} size={14} color="#0f172a" />
                          </LinearGradient>
                        );
                      }
                      return (
                        <View
                          key={extra.key}
                          style={[
                            styles.appExtraIcon,
                            marginStyle,
                            {
                              backgroundColor: colors.chipBg,
                              borderColor: colors.surfaceBorder,
                              borderWidth: 1
                            }
                          ]}
                        >
                          <Ionicons name={extra.icon} size={14} color="rgba(148,163,184,.95)" />
                        </View>
                      );
                    })}
                  </View>

                  <View style={[styles.appFooter, { borderTopColor: colors.surfaceBorder }]}>
                    <View style={styles.appChips}>
                      <View
                        style={[
                          styles.appChip,
                          {
                            backgroundColor: colors.chipBg,
                            borderColor: colors.surfaceBorder,
                            marginRight: 8
                          }
                        ]}
                      >
                        {statusInfo.icon ? (
                          <Ionicons
                            name={statusInfo.icon}
                            size={14}
                            color={statusInfo.tint || colors.text}
                            style={styles.appChipIcon}
                          />
                        ) : null}
                        <Text style={[styles.appChipText, { color: colors.text }]}>
                          {status?.key || app.status}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.appChip,
                          {
                            backgroundColor: colors.chipBg,
                            borderColor: colors.surfaceBorder
                          }
                        ]}
                      >
                        <Text style={[styles.appChipText, { color: colors.text }]}>{app.platform}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <View
              style={[
                styles.appEmpty,
                { backgroundColor: colors.chipBg, borderColor: colors.surfaceBorder }
              ]}
            >
              <Text style={[styles.appEmptyText, { color: colors.text }]}>No applications logged yet.</Text>
              <TouchableOpacity
                onPress={() => setShowForm(true)}
                style={[styles.appEmptyButton, { backgroundColor: colors.sky }]}
              >
                <Text style={styles.appEmptyButtonText}>Log application</Text>
              </TouchableOpacity>
            </View>
          )}
        </Panel>

        <Text style={styles.footerText}>
          Mobile build. Use "Log application" to open the form.
        </Text>
      </ScrollView>

      <AppFormModal
        visible={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={(fields) => {
          if (addApplication(fields)) {
            setShowForm(false);
          }
        }}
        colors={colors}
        effects={activeEffects}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paletteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  paletteText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  statBadgeCount: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  statBadgeCountText: {
    fontSize: 10,
    fontWeight: '600',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  goldPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1f2937',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  panel: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  panelSubtitle: {
    fontSize: 12,
    color: 'rgba(148,163,184,.95)',
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelText: {
    fontSize: 18,
    fontWeight: '800',
  },
  appsCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  appsCountText: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressSection: {
    marginTop: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressLabelText: {
    fontSize: 12,
    color: 'rgba(148,163,184,.95)',
  },
  progressValue: {
    fontSize: 12,
    color: 'rgba(148,163,184,.95)',
  },
  progressBarContainer: {
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 16,
  },
  quickAction: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 16,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(148,163,184,.95)',
    textAlign: 'center',
    marginTop: 6,
  },
  footerText: {
    fontSize: 11,
    color: 'rgba(148,163,184,.95)',
    textAlign: 'center',
    marginBottom: 20,
  },
  appCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  appTitle: {
    flex: 1,
    marginRight: 12,
  },
  appCompany: {
    fontSize: 15,
    fontWeight: '700',
  },
  appRole: {
    fontSize: 12,
    color: 'rgba(148,163,184,.95)',
    marginTop: 2,
  },
  appNote: {
    fontSize: 11,
    color: 'rgba(148,163,184,.95)',
    marginTop: 6,
  },
  appMeta: {
    alignItems: 'flex-end',
  },
  appMetaText: {
    fontSize: 11,
    color: 'rgba(148,163,184,.95)',
  },
  appExtras: {
    flexDirection: 'row',
    marginTop: 12,
  },
  appExtraIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  appChips: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  appChipIcon: {
    marginRight: 6,
  },
  appChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  appEmpty: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  appEmptyText: {
    fontSize: 12,
    opacity: 0.75,
    textAlign: 'center',
  },
  appEmptyButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  appEmptyButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  // Modal styles
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
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 13,
    height: 80,
    textAlignVertical: 'top',
  },
  segmentedControl: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  rewardInfo: {
    marginBottom: 20,
  },
  rewardText: {
    fontSize: 11,
    textAlign: 'center',
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
});
