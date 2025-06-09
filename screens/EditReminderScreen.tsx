import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Reminder } from '../services/reminderService'; // Assuming Reminder type is exported from reminderService
import { updateReminder, deleteReminder } from '../services/reminderService'; // Assuming update and delete functions are exported

type RootStackParamList = {
  EditReminder: { reminder: Reminder };
};

type EditReminderScreenRouteProp = RouteProp<RootStackParamList, 'EditReminder'>;

const EditReminderScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<EditReminderScreenRouteProp>();
  const { reminder: initialReminder } = route.params;

  const [title, setTitle] = useState(initialReminder.title);
  const [notes, setNotes] = useState(initialReminder.notes);
  const [dueDate, setDueDate] = useState(new Date(initialReminder.dueDate));
  const [recurrence, setRecurrence] = useState(initialReminder.recurrence);
  const [status, setStatus] = useState(initialReminder.status);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const recurrenceOptions = ['none', 'daily', 'weekly', 'monthly', 'yearly'];
  const statusOptions = ['upcoming', 'due_today', 'overdue', 'completed', 'pending'];

  const onChangeDate = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || dueDate;
    setShowDatePicker(Platform.OS === 'ios');
    setDueDate(currentDate);
  };

  const showMode = () => {
    setShowDatePicker(true);
  };

  const handleSaveChanges = async () => {
    setLoading(true);
    try {
      const updatedReminder: Reminder = {
        ...initialReminder,
        title,
        notes,
        dueDate,
        recurrence,
        status,
      };
      await updateReminder(updatedReminder.id!, updatedReminder); // Assuming reminder has an id
      Alert.alert('Success', 'Reminder updated successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating reminder:', error);
      Alert.alert('Error', 'Failed to update reminder. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReminder = () => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this reminder?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await deleteReminder(initialReminder.id!); // Assuming reminder has an id
              Alert.alert('Success', 'Reminder deleted successfully!');
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting reminder:', error);
              Alert.alert('Error', 'Failed to delete reminder. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Reminder</Text>
      <TextInput
        style={styles.input}
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={styles.input}
        placeholder="Notes (Optional)"
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      <Text style={styles.label}>Due Date:</Text>
      <Button onPress={showMode} title={dueDate.toDateString()} />
      {showDatePicker && (
        <DateTimePicker
          testID="datePicker"
          value={dueDate}
          mode="date"
          display="default"
          onChange={onChangeDate}
        />
      )}

      <Text style={styles.label}>Recurrence:</Text>
      <Picker
        selectedValue={recurrence}
        onValueChange={(itemValue) => setRecurrence(itemValue as typeof recurrence)}
      >
        {recurrenceOptions.map((option) => (
          <Picker.Item key={option} label={option} value={option} />
        ))}
      </Picker>

      <Text style={styles.label}>Status:</Text>
      <Picker
        selectedValue={status}
        onValueChange={(itemValue) => setStatus(itemValue as typeof status)}
      >
        {statusOptions.map((option) => (
          <Picker.Item key={option} label={option} value={option} />
        ))}
      </Picker>

      <Button
        title={loading ? 'Saving...' : 'Save Changes'}
        onPress={handleSaveChanges}
        disabled={loading}
      />
      <Button
        title={loading ? 'Deleting...' : 'Delete Reminder'}
        onPress={handleDeleteReminder}
        color="red"
        disabled={loading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
});

export default EditReminderScreen;