/**
 * DateTimePickerWrapper - Componente multiplataforma para seleção de data/hora
 * Usa DateTimePicker nativo no mobile e inputs HTML no web
 */
import React from 'react';
import { Platform, View, TextInput, StyleSheet, Text, TouchableOpacity } from 'react-native';

interface DateTimePickerWrapperProps {
  value: Date;
  mode: 'date' | 'time' | 'datetime';
  onChange: (event: any, selectedDate?: Date) => void;
  display?: 'default' | 'spinner' | 'calendar' | 'clock';
  minimumDate?: Date;
  maximumDate?: Date;
}

// Componente para Web
const WebDateTimePicker: React.FC<DateTimePickerWrapperProps> = ({
  value,
  mode,
  onChange,
  minimumDate,
  maximumDate,
}) => {
  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTimeForInput = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleDateChange = (e: any) => {
    const [year, month, day] = e.target.value.split('-').map(Number);
    const newDate = new Date(value);
    newDate.setFullYear(year, month - 1, day);
    onChange({ type: 'set' }, newDate);
  };

  const handleTimeChange = (e: any) => {
    const [hours, minutes] = e.target.value.split(':').map(Number);
    const newDate = new Date(value);
    newDate.setHours(hours, minutes);
    onChange({ type: 'set' }, newDate);
  };

  const inputStyle = {
    backgroundColor: '#1A1A1D',
    color: '#FFFFFF',
    border: '1px solid #333',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    width: '100%',
  };

  if (mode === 'date') {
    return (
      <input
        type="date"
        value={formatDateForInput(value)}
        onChange={handleDateChange}
        min={minimumDate ? formatDateForInput(minimumDate) : undefined}
        max={maximumDate ? formatDateForInput(maximumDate) : undefined}
        style={inputStyle as any}
      />
    );
  }

  if (mode === 'time') {
    return (
      <input
        type="time"
        value={formatTimeForInput(value)}
        onChange={handleTimeChange}
        style={inputStyle as any}
      />
    );
  }

  // datetime mode - show both
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <View style={{ flex: 1 }}>
        <input
          type="date"
          value={formatDateForInput(value)}
          onChange={handleDateChange}
          min={minimumDate ? formatDateForInput(minimumDate) : undefined}
          max={maximumDate ? formatDateForInput(maximumDate) : undefined}
          style={inputStyle as any}
        />
      </View>
      <View style={{ flex: 1 }}>
        <input
          type="time"
          value={formatTimeForInput(value)}
          onChange={handleTimeChange}
          style={inputStyle as any}
        />
      </View>
    </View>
  );
};

// Export do componente correto baseado na plataforma
let DateTimePickerWrapper: React.FC<DateTimePickerWrapperProps>;

if (Platform.OS === 'web') {
  DateTimePickerWrapper = WebDateTimePicker;
} else {
  // No mobile, usar o componente nativo
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const NativeDateTimePicker = require('@react-native-community/datetimepicker').default;
  DateTimePickerWrapper = (props: DateTimePickerWrapperProps) => (
    <NativeDateTimePicker {...props} />
  );
}

export default DateTimePickerWrapper;
