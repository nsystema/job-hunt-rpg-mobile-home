import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { hexToRgba } from '../../utils/color';

export const AutoCompleteField = ({
  label,
  value,
  onSelect,
  colors,
  placeholder,
  options = [],
  minChars = 0,
  containerStyle,
  disabled = false,
}) => {
  const [query, setQuery] = useState(value ?? '');
  const [focused, setFocused] = useState(false);
  const blurTimeout = useRef(null);

  useEffect(() => {
    if (!focused) {
      setQuery(value ?? '');
    }
  }, [value, focused]);

  useEffect(
    () => () => {
      if (blurTimeout.current) {
        clearTimeout(blurTimeout.current);
      }
    },
    [],
  );

  const trimmedQuery = query.trim();

  const normalizedOptions = useMemo(() => options.filter(Boolean), [options]);

  const suggestions = useMemo(() => {
    if (!focused || disabled) {
      return [];
    }
    if (!trimmedQuery.length) {
      return normalizedOptions;
    }
    if (trimmedQuery.length < minChars) {
      return normalizedOptions;
    }
    const lower = trimmedQuery.toLowerCase();
    return normalizedOptions.filter((option) => option.toLowerCase().includes(lower));
  }, [focused, disabled, trimmedQuery, normalizedOptions, minChars]);

  const shouldShowList = focused && !disabled && normalizedOptions.length > 0;

  const handleChange = (text) => {
    if (disabled) {
      return;
    }
    setQuery(text);
    setFocused(true);
  };

  const handleSelect = (option) => {
    setQuery(option);
    onSelect?.(option);
    setFocused(false);
    Keyboard.dismiss();
  };

  const handleFocus = () => {
    if (disabled) {
      return;
    }
    setFocused(true);
    if (!query && value) {
      setQuery(value);
    }
  };

  const handleBlur = () => {
    if (blurTimeout.current) {
      clearTimeout(blurTimeout.current);
    }
    blurTimeout.current = setTimeout(() => {
      setFocused(false);
      if ((value ?? '') !== query) {
        setQuery(value ?? '');
      }
    }, 120);
  };

  const handleClear = () => {
    setQuery('');
    onSelect?.('');
    setFocused(false);
    Keyboard.dismiss();
  };

  const hasMatches = suggestions.length > 0;

  return (
    <View style={[styles.formGroup, containerStyle]}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <View
        style={[
          styles.autoCompleteInputWrapper,
          { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
          disabled && styles.disabledInput,
        ]}
      >
        <TextInput
          value={query}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor={`${colors.text}80`}
          style={[
            styles.textInput,
            styles.autoCompleteInput,
            { color: colors.text, borderColor: 'transparent', backgroundColor: 'transparent' },
          ]}
          editable={!disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoCapitalize="words"
          autoCorrect={false}
          selectTextOnFocus
        />
        {!!(query || value) && !disabled && (
          <TouchableOpacity onPress={handleClear} style={styles.autoCompleteClear} hitSlop={8}>
            <MaterialCommunityIcons name="close-circle" size={18} color={hexToRgba(colors.text, 0.5)} />
          </TouchableOpacity>
        )}
      </View>
      {shouldShowList && (
        <View
          style={[
            styles.autoCompleteSuggestions,
            { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
          ]}
        >
          <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
            {hasMatches ? (
              suggestions.map((option) => (
                <TouchableOpacity
                  key={option}
                  onPress={() => handleSelect(option)}
                  style={styles.autoCompleteOption}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.autoCompleteOptionText, { color: colors.text }]}>{option}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.autoCompleteEmpty}>
                <Text style={[styles.autoCompleteEmptyText, { color: hexToRgba(colors.text, 0.6) }]}>No matches</Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
  autoCompleteInputWrapper: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 4,
    paddingVertical: 4,
    position: 'relative',
  },
  autoCompleteInput: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  autoCompleteClear: {
    position: 'absolute',
    right: 10,
    top: 10,
  },
  autoCompleteSuggestions: {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: 160,
    overflow: 'hidden',
  },
  autoCompleteOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  autoCompleteOptionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  autoCompleteEmpty: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoCompleteEmptyText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  disabledInput: {
    opacity: 0.55,
  },
});
