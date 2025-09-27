import { StyleSheet, Text, TextInput, View } from 'react-native';

export const TextField = ({
  label,
  value,
  onChangeText,
  placeholder,
  colors,
  multiline = false,
  numberOfLines = 1,
  containerStyle,
  ...inputProps
}) => (
  <View style={[styles.formGroup, containerStyle]}>
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
      {...inputProps}
    />
  </View>
);

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
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 13,
    height: 80,
    textAlignVertical: 'top',
  },
});
