import { memo } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { PLATFORMS, STATUSES } from '..';
import { IconButton } from '../../../components/layout/IconButton';

const SORT_OPTIONS = ['Newest', 'Oldest', 'Company A-Z', 'Favorites first'];

const ApplicationFilters = ({
  colors,
  appsQuery,
  onChangeQuery,
  onOpenFilter,
  onOpenSort,
  onExport,
  filterModalVisible,
  onCloseFilter,
  filterStatuses,
  toggleFilterStatus,
  filterPlatforms,
  toggleFilterPlatform,
  clearFilters,
  sortModalVisible,
  onCloseSort,
  sortKey,
  onSelectSortKey,
}) => {
  return (
    <>
      <View style={styles.toolbar}> 
        <View
          style={[
            styles.searchInput,
            { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
          ]}
        >
          <MaterialCommunityIcons name="magnify" size={16} color="rgba(148,163,184,.95)" />
          <TextInput
            value={appsQuery}
            onChangeText={onChangeQuery}
            placeholder="Search applications"
            placeholderTextColor="rgba(148,163,184,.65)"
            style={[styles.searchInputField, { color: colors.text }]}
          />
        </View>
        <IconButton
          onPress={onOpenFilter}
          icon="tune-variant"
          colors={colors}
          accessibilityLabel="Filter applications"
        />
        <IconButton
          onPress={onOpenSort}
          icon="swap-vertical"
          colors={colors}
          accessibilityLabel="Sort applications"
        />
        <IconButton
          onPress={onExport}
          icon="download-outline"
          colors={colors}
          accessibilityLabel="Export applications"
        />
      </View>

      <Modal visible={filterModalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={onCloseFilter} accessible={false}>
          <View style={styles.sheetOverlay}>
            <TouchableWithoutFeedback onPress={() => {}} accessible={false}>
              <View
                style={[styles.sheetBody, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
              >
                <View style={[styles.sheetHeader, { borderBottomColor: colors.surfaceBorder }]}> 
                  <Text style={[styles.sheetTitle, { color: colors.text }]}>Filters</Text> 
                  <TouchableOpacity
                    onPress={onCloseFilter}
                    style={[styles.closeButton, { backgroundColor: colors.chipBg }]}
                  >
                    <MaterialCommunityIcons name="close" size={20} color={colors.text} />
                  </TouchableOpacity> 
                </View> 
                <ScrollView
                  style={styles.sheetContent}
                  contentContainerStyle={styles.sheetContentContainer}
                  showsVerticalScrollIndicator={false}
                >
                  <View>
                    <Text style={[styles.sheetSubtitle, { color: colors.text }]}>Status</Text>
                    <View style={styles.sheetOptionRow}>
                      {STATUSES.map((status) => {
                        const active = filterStatuses.includes(status.key);
                        return (
                          <TouchableOpacity
                            key={status.key}
                            onPress={() => toggleFilterStatus(status.key)}
                            style={[
                              styles.sheetOption,
                              {
                                backgroundColor: active ? colors.sky : colors.chipBg,
                                borderColor: colors.surfaceBorder,
                              },
                            ]}
                          >
                            <Text style={[styles.sheetOptionText, { color: active ? '#0f172a' : colors.text }]}>
                              {status.key}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                  <View>
                    <Text style={[styles.sheetSubtitle, { color: colors.text }]}>Platform</Text>
                    <View style={styles.sheetOptionWrap}>
                      {PLATFORMS.map((platform) => {
                        const active = filterPlatforms.includes(platform);
                        return (
                          <TouchableOpacity
                            key={platform}
                            onPress={() => toggleFilterPlatform(platform)}
                            style={[
                              styles.sheetOption,
                              {
                                backgroundColor: active ? colors.emerald : colors.chipBg,
                                borderColor: colors.surfaceBorder,
                              },
                            ]}
                          >
                            <Text style={[styles.sheetOptionText, { color: active ? '#0f172a' : colors.text }]}>
                              {platform}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </ScrollView>
                <View style={[styles.sheetFooter, { borderTopColor: colors.surfaceBorder }]}> 
                  <TouchableOpacity
                    onPress={clearFilters}
                    style={[
                      styles.sheetSecondaryButton,
                      { backgroundColor: colors.chipBg, borderColor: colors.surfaceBorder },
                    ]}
                  >
                    <Text style={[styles.sheetSecondaryButtonText, { color: colors.text }]}>Reset</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={onCloseFilter} style={styles.sheetPrimaryButton}> 
                    <LinearGradient
                      colors={[colors.sky, colors.emerald]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.sheetPrimaryButtonGradient}
                    >
                      <Text style={styles.sheetPrimaryButtonText}>Done</Text>
                    </LinearGradient>
                  </TouchableOpacity> 
                </View> 
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal visible={sortModalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={onCloseSort} accessible={false}>
          <View style={styles.sheetOverlay}>
            <TouchableWithoutFeedback onPress={() => {}} accessible={false}>
              <View
                style={[styles.sheetBody, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
              >
                <View style={[styles.sheetHeader, { borderBottomColor: colors.surfaceBorder }]}> 
                  <Text style={[styles.sheetTitle, { color: colors.text }]}>Sort by</Text> 
                  <TouchableOpacity
                    onPress={onCloseSort}
                    style={[styles.closeButton, { backgroundColor: colors.chipBg }]}
                  >
                    <MaterialCommunityIcons name="close" size={20} color={colors.text} />
                  </TouchableOpacity> 
                </View> 
                <View style={styles.sheetContent}>
                  <View style={styles.sheetOptionList}>
                    {SORT_OPTIONS.map((option) => {
                      const active = sortKey === option;
                      return (
                        <TouchableOpacity
                          key={option}
                          onPress={() => {
                            onSelectSortKey(option);
                            onCloseSort();
                          }}
                          style={[
                            styles.sheetOption,
                            {
                              backgroundColor: active ? colors.sky : colors.chipBg,
                              borderColor: colors.surfaceBorder,
                            },
                          ]}
                        >
                          <Text style={[styles.sheetOptionText, { color: active ? '#0f172a' : colors.text }]}>
                            {option}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

export default memo(ApplicationFilters);

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    height: 38,
    paddingHorizontal: 12,
    paddingVertical: 0,
    gap: 8,
  },
  searchInputField: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    justifyContent: 'center',
    padding: 24,
  },
  sheetBody: {
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  sheetTitle: {
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
  sheetContent: {
    flexGrow: 0,
  },
  sheetContentContainer: {
    gap: 20,
    paddingBottom: 8,
  },
  sheetSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  sheetOptionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sheetOptionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sheetOptionList: {
    gap: 12,
  },
  sheetOption: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sheetOptionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sheetFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    marginTop: 16,
  },
  sheetSecondaryButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  sheetSecondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sheetPrimaryButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sheetPrimaryButtonGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  sheetPrimaryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
});
