import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { addIncome } from '../services/incomeService'; // Import the addIncome function
import Toast from 'react-native-toast-message'; // Import Toast
import { auth } from '/Users/kingcode/Documents/ExpenseFlowMobile/config/firebaseConfig';
import { fetchUserProfile } from '/Users/kingcode/Documents/ExpenseFlowMobile/services/userService'; // Assuming this is the correct path

const AddIncomeScreen: React.FC = () => {
  const [source, setSource] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD'); // Default currency
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const fetchDefaultCurrency = async () => {
      if (auth.currentUser) {
        const userProfile = await fetchUserProfile(auth.currentUser.uid);
        if (userProfile && userProfile.defaultCurrency) {
 setCurrency(userProfile.defaultCurrency);
        // }
      }
    };
    fetchDefaultCurrency();
  }, []);

  const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD']; // Example currencies

  const handleAddIncome = async () => {
    if (!auth.currentUser) {
      // Handle case where user is not logged in
      console.error('No user logged in.');
      return;
    }

    const newIncome = {
      userId: auth.currentUser.uid,
      source,
      amount: parseFloat(amount), // Convert amount to number
      currency,
      date: date.toISOString(), // Save date as ISO string
      notes,
    };

    try {
      await addIncome(newIncome);
      // Navigate back or clear form
      setSource('');
      setAmount('');
      setCurrency('USD');
      setDate(new Date());
      setNotes('');
    } catch (error) {
 Toast.show({
 type: 'success',
 text1: 'Income Added',
 text2: 'Your income record has been added successfully.',
 });
    } catch (error: any) {
 Toast.show({
 type: 'error',
 text1: 'Error Adding Income',
 text2: error.message || 'An error occurred while adding income.',
      });
    }
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add New Income</Text>
      <TextInput
        style={styles.input}
        placeholder="Source (e.g., Salary, Freelance)"
        value={source}
        onChangeText={setSource}
      />
      <TextInput
        style={styles.input}
        placeholder="Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />
      <View style={styles.pickerContainer}>
        <Text>Currency:</Text>
        <Picker
          selectedValue={currency}
          style={styles.picker}
          onValueChange={(itemValue) => setCurrency(itemValue as string)}
        >
          {currencies.map((curr) => (
            <Picker.Item key={curr} label={curr} value={curr} />
          ))}
        </Picker>
      </View>

      <Button onPress={() => setShowDatePicker(true)} title="Select Date" />
      {showDatePicker && (
        <DateTimePicker
          testID="datePicker"
          value={date}
          mode="date"
          display="default"
          onChange={onChangeDate}
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Notes (Optional)"
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      <Button title="Add Income" onPress={handleAddIncome} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f4f4f4', // Light gray background
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
  },
  picker: {
    flex: 1,
    height: 50,
  },
});

export default AddIncomeScreen;