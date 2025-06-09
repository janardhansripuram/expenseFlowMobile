import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { Reminder, addReminder } from '../services/reminderService';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../config/firebaseConfig'; // Assuming auth is needed to get userId

const AddReminderScreen: React.FC = () => {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [recurrence, setRecurrence] = useState<Reminder['recurrence']>('none');
  const [status, setStatus] = useState<Reminder['status']>('upcoming');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const navigation = useNavigation();
  const currentUser = auth.currentUser;

  const handleSaveReminder = async () => {
    if (!currentUser) {
      // Handle not logged in state
      console.error("User not logged in");
      return;
    }

    const newReminder: Omit<Reminder, 'id'> = {
      userId: currentUser.uid,
      title,
      notes,
      dueDate,
      recurrence,
      status,
    };

    try {
      await addReminder(newReminder);
      console.log('Reminder added successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Error adding reminder:', error);
      // Handle error (e.g., show an error message)
    }
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || dueDate;
    setShowDatePicker(Platform.OS === 'ios');
    setDueDate(currentDate);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add New Reminder</Text>
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
      <Button onPress={() => setShowDatePicker(true)} title="Select Date" />
      {showDatePicker && (
        <DateTimePicker
          testID="datePicker"
          value={dueDate}
          mode="date"
          display="default"
          onChange={onChangeDate}
        />
      )}
      <Text>{dueDate.toDateString()}</Text>

      <Text style={styles.label}>Recurrence:</Text>
      <Picker
        selectedValue={recurrence}
        onValueChange={(itemValue) => setRecurrence(itemValue as Reminder['recurrence'])}
        style={styles.picker}
      >
        <Picker.Item label="None" value="none" />
        <Picker.Item label="Daily" value="daily" />
        <Picker.Item label="Weekly" value="weekly" />
        <Picker.Item label="Monthly" value="monthly" />
        <Picker.Item label="Yearly" value="yearly" />
      </Picker>

      <Text style={styles.label}>Status:</Text>
      <Picker
        selectedValue={status}
        onValueChange={(itemValue) => setStatus(itemValue as Reminder['status'])}
        style={styles.picker}
      >
         <Picker.Item label="Upcoming" value="upcoming" />
        <Picker.Item label="Due Today" value="due_today" />
        <Picker.Item label="Overdue" value="overdue" />
        <Picker.Item label="Completed" value="completed" />
        <Picker.Item label="Pending" value="pending" />
      </Picker>


      <Button title="Save Reminder" onPress={handleSaveReminder} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff', // Basic background
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
    borderRadius: 4,
  },
  label: {
      fontSize: 16,
      marginBottom: 8,
      marginTop: 12,
  },
  picker: {
    height: 50,
    width: '100%',
    marginBottom: 12,
  },
});

export default AddReminderScreen;