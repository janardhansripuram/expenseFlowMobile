import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { addBudget } from '../services/budgetService'; // Import addBudget function
import { auth } from '../config/firebaseConfig'; // Import auth for userId
import { useNavigation } from '@react-navigation/native';

const AddBudgetScreen: React.FC = () => {
  const navigation = useNavigation();
  const [category, setCategory] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [currency, setCurrency] = useState('USD'); // Default currency
  const [monthYear, setMonthYear] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState('');

  const handleAddBudget = async () => {
    if (!category || !budgetAmount || !currency) {
      setError('Please fill in all required fields (Category, Amount, Currency)');
      return;
    }

    const userId = auth.currentUser?.uid;
    if (!userId) {
      setError('User not authenticated.');
      return;
    }

    try {
      setError('');
      const budgetData = {
        userId,
        category,
        budgetAmount: parseFloat(budgetAmount),
        currency,
        monthYear: `${monthYear.getFullYear()}-${(monthYear.getMonth() + 1).toString().padStart(2, '0')}`, // Format YYYY-MM
      };
      await addBudget(budgetData);
      console.log('Budget added successfully!');
      navigation.goBack(); // Navigate back to the budget list
    } catch (err: any) {
      setError(err.message);
      console.error('Error adding budget:', err);
    }
  };

  const onChangeMonthYear = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || monthYear;
    setShowDatePicker(Platform.OS === 'ios');
    setMonthYear(currentDate);
  };

  const showMode = () => {
    setShowDatePicker(true);
  };

  // Basic list of currencies, can be expanded
  const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add New Budget</Text>

      <TextInput
        style={styles.input}
        placeholder="Category"
        value={category}
        onChangeText={setCategory}
      />

      <TextInput
        style={styles.input}
        placeholder="Budget Amount"
        value={budgetAmount}
        onChangeText={setBudgetAmount}
        keyboardType="numeric"
      />

      <View style={styles.pickerContainer}>
        <Text>Currency:</Text>
        <Picker
          selectedValue={currency}
          style={styles.picker}
          onValueChange={(itemValue, itemIndex) => setCurrency(itemValue)}
        >
          {currencies.map((curr) => (
            <Picker.Item key={curr} label={curr} value={curr} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Month/Year:</Text>
      <Button onPress={showMode} title="Select Month/Year" />
      {showDatePicker && (
        <DateTimePicker
          testID="monthYearPicker"
          value={monthYear}
          mode="date"
          display="default"
          onChange={onChangeMonthYear}
          // For month/year picker, you might need a library like react-native-month-year-picker
          // The native DateTimePicker in 'date' mode might require adjusting to only show month/year
          // Or you can format the selected date to just show Month/Year
          // For simplicity here, it shows full date but we format it to YYYY-MM for storage
        />
      )}
       <Text style={styles.selectedDateText}>
        {monthYear.toLocaleString('default', { month: 'long' })} {monthYear.getFullYear()}
      </Text>


      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button title="Add Budget" onPress={handleAddBudget} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f8f8', // Light background color
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    height: 45,
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
    height: 45,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#555',
  },
   selectedDateText: {
    fontSize: 16,
    marginTop: 5,
    marginBottom: 15,
    textAlign: 'center',
    color: '#555',
  },
  error: {
    color: 'red',
    marginBottom: 12,
    textAlign: 'center',
  },
});

export default AddBudgetScreen;