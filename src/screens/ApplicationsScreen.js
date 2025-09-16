import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { palette } from '../constants/theme';
import { STATUSES } from '../data/appConstants';
import { useGame } from '../context/GameContext';
import ApplicationCard from '../components/ApplicationCard';
import ApplicationFormModal from '../components/ApplicationFormModal';
import SectionHeader from '../components/SectionHeader';
import { getIconComponent } from '../constants/icons';

const SearchIcon = getIconComponent('Search');
const FilterIcon = getIconComponent('Filter');
const StarIcon = getIconComponent('Star');

export default function ApplicationsScreen() {
  const {
    state,
    logApplication,
    updateApplication,
    deleteApplication,
    toggleFavorite
  } = useGame();
  const [query, setQuery] = useState('');
  const [statusFilters, setStatusFilters] = useState([]);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.applications
      .filter((app) => {
        if (q && !`${app.company} ${app.role} ${app.platform}`.toLowerCase().includes(q)) {
          return false;
        }
        if (onlyFavorites && !app.favorite) return false;
        if (statusFilters.length && !statusFilters.includes(app.status)) return false;
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.applications, query, statusFilters, onlyFavorites]);

  const toggleStatus = (status) => {
    setStatusFilters((current) =>
      current.includes(status)
        ? current.filter((value) => value !== status)
        : [...current, status]
    );
  };

  const handleSubmit = (payload) => {
    if (editing) {
      updateApplication(editing.id, payload);
    } else {
      logApplication(payload);
    }
    setFormVisible(false);
    setEditing(null);
  };

  const openCreate = () => {
    setEditing(null);
    setFormVisible(true);
  };

  const openEdit = (application) => {
    setEditing(application);
    setFormVisible(true);
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionHeader
          title="Applications"
          subtitle={`${filtered.length} tracked entries`}
          actionLabel="New"
          onAction={openCreate}
        />
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <SearchIcon size={18} color={palette.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by company, role or platform"
              placeholderTextColor={palette.textMuted}
              value={query}
              onChangeText={setQuery}
            />
          </View>
          <TouchableOpacity
            style={[styles.filterButton, onlyFavorites && styles.filterActive]}
            onPress={() => setOnlyFavorites((value) => !value)}
          >
            <StarIcon
              size={18}
              color={onlyFavorites ? '#041028' : palette.textMuted}
              fill={onlyFavorites ? '#facc15' : 'transparent'}
            />
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {STATUSES.map((status) => {
            const active = statusFilters.includes(status.key);
            return (
              <TouchableOpacity
                key={status.key}
                style={[styles.statusChip, active && styles.statusChipActive]}
                onPress={() => toggleStatus(status.key)}
              >
                <Text style={[styles.statusLabel, active && styles.statusLabelActive]}>
                  {status.key}
                </Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={[styles.statusChip, statusFilters.length === 0 && styles.statusChipActive]}
            onPress={() => setStatusFilters([])}
          >
            <FilterIcon size={16} color={statusFilters.length === 0 ? '#041028' : palette.textMuted} />
            <Text
              style={[
                styles.statusLabel,
                statusFilters.length === 0 && styles.statusLabelActive
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
        </ScrollView>
        {filtered.map((application) => (
          <ApplicationCard
            key={application.id}
            application={application}
            onPress={openEdit}
            onToggleFavorite={(app) => toggleFavorite(app.id)}
            onDelete={(app) => deleteApplication(app.id)}
          />
        ))}
        {!filtered.length && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyLabel}>No applications match the filters.</Text>
            <TouchableOpacity onPress={openCreate} style={styles.emptyButton}>
              <Text style={styles.emptyButtonLabel}>Log a new one</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.bottomSpace} />
      </ScrollView>
      <ApplicationFormModal
        visible={formVisible}
        onClose={() => {
          setFormVisible(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
        initialValues={editing}
      />
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: palette.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  searchInput: {
    flex: 1,
    color: palette.textPrimary
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center'
  },
  filterActive: {
    backgroundColor: palette.accent,
    borderColor: palette.accent
  },
  filterRow: {
    gap: 10,
    paddingVertical: 6,
    marginBottom: 18
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface
  },
  statusChipActive: {
    backgroundColor: palette.accent,
    borderColor: palette.accent
  },
  statusLabel: {
    color: palette.textMuted,
    fontSize: 13
  },
  statusLabelActive: {
    color: '#041028',
    fontWeight: '600'
  },
  emptyBox: {
    marginTop: 40,
    alignItems: 'center',
    gap: 12
  },
  emptyLabel: {
    color: palette.textMuted
  },
  emptyButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: palette.accent
  },
  emptyButtonLabel: {
    color: '#041028',
    fontWeight: '700'
  },
  bottomSpace: {
    height: 60
  }
});
