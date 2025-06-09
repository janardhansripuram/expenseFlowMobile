import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert, Switch, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { z } from 'zod'; // Import z for error handling types
import { expenseSchema } from '../services/expenseService'; // Import the expense schema
import { updateExpense, deleteExpense } from '../services/expenseService'; // Assuming you have an updateExpense and deleteExpense function
import { Expense } from '../types'; // Assuming you have a type definition for Expense

const EditExpenseScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { expense } = route.params as { expense: Expense }; // Get expense data from route params

  const [description, setDescription] = useState(expense.description);
  const [amount, setAmount] = useState(expense.amount.toString());
  const [category, setCategory] = useState(expense.category);
  const [date, setDate] = useState(expense.date); // Assuming date is stored as a string or a compatible format
  const [currency, setCurrency] = useState(expense.currency || 'USD'); // Add state for currency, default to USD
  const [isRecurring, setIsRecurring] = useState(expense.isRecurring || false);
  const [recurrenceInterval, setRecurrenceInterval] = useState(expense.recurrenceInterval || '');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(expense.recurrenceEndDate || null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({}); // State to hold validation errors
  const [loading, setLoading] = useState(false);

  const handleUpdateExpense = async () => {
    setErrors({}); // Clear previous errors
    setLoading(true);
    try {
      const updatedExpenseData: Expense = {
        ...expense, // Keep existing fields like userId
        id: expense.id, // Ensure id is included for update
        description,
        amount: parseFloat(amount),
        category,
        date,
        currency, // Include currency in updated data
        isRecurring,
        recurrenceInterval: isRecurring ? recurrenceInterval : '',
        recurrenceEndDate: isRecurring ? recurrenceEndDate : null,
      };

      // Validate data using Zod schema
      const validationResult = expenseSchema.safeParse(updatedExpenseData);

      if (!validationResult.success) { // Use !validationResult.success to check for errors
        const fieldErrors: { [key: string]: string } = {};
        validationResult.error.errors.forEach((err) => {
          if (err.path.length > 0) {
            fieldErrors[err.path[0]] = err.message;
          }
        });
        setErrors(fieldErrors);
        setLoading(false);
        return;
      }

      await updateExpense(updatedExpenseData); // Call the update function from expenseService with validated data
      Alert.alert('Success', 'Expense updated successfully!');
      navigation.goBack(); // Navigate back to the expense list
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update expense: ' + error.message);
      console.error('Error updating expense:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = () => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this expense?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await deleteExpense(expense.id); // Assuming expense.id holds the document ID
              Alert.alert('Success', 'Expense deleted successfully!');
              navigation.goBack(); // Navigate back to the expense list
            } catch (error: any) {
              Alert.alert('Error', 'Failed to delete expense: ' + error.message);
              console.error('Error deleting expense:', error);
            }
          },
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Expense</Text>
      <TextInput
        style={styles.input}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
      />
      {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
      <TextInput
        style={styles.input}
        placeholder="Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />
      {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
      <TextInput
        style={styles.input}
        placeholder="Category"
        value={category}
        onChangeText={setCategory}
      />

      {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
      {/* Currency Selector - Basic Implementation */}
      <View style={styles.inputRow}>
        <Text>Currency:</Text>
        {/* This is a basic TextInput. Consider using a Picker or Dropdown for better UX */}
        <TextInput
          style={[styles.input, { flex: 1, marginBottom: 0, marginLeft: 8 }]}
          placeholder="Currency (e.g., USD, EUR)"
          value={currency}
          onChangeText={setCurrency}
          autoCapitalize="characters"
        />
      </View>
      {errors.currency && <Text style={styles.errorText}>{errors.currency}</Text>}

      {/* You might want to use a DatePicker component here */}
      <TextInput
        style={styles.input}
        placeholder="Date (YYYY-MM-DD)"
        value={date}
        onChangeText={setDate}
      />
      {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}

      <View style={styles.recurringContainer}>
        <Text>Recurring Expense:</Text>
        <Switch
          value={isRecurring}
          onValueChange={setIsRecurring}
        />
      </View>

      {isRecurring && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Recurrence Interval (daily, weekly, monthly, yearly)"
            value={recurrenceInterval}
            onChangeText={setRecurrenceInterval}
          />
          {/* You might want to use a DatePicker component here for recurrence end date */}
          <TextInput
            style={styles.input}
            placeholder="Recurrence End Date (YYYY-MM-DD or leave empty)"
            value={recurrenceEndDate ? (recurrenceEndDate as Date).toISOString().split('T')[0] : ''} // Display date in YYYY-MM-DD format
            onChangeText={(text) => {
              // Basic date string parsing - consider a more robust date picker
              const parsedDate = text ? new Date(text) : null;
              setRecurrenceEndDate(parsedDate);
            }}
          />
        </>
      )}

      <Button
        title={loading ? 'Updating...' : 'Save Changes'}
        onPress={handleUpdateExpense}
        disabled={loading}
      />
      <Button
        title="Delete Expense"
        onPress={handleDeleteExpense}
        color="red" // Style the delete button differently
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff', // Basic white background
  },
  title: {
    fontSize: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  recurringContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorText: { // Correctly placed errorText style
    color: 'red',
    fontSize: 12,
    marginBottom: 8,
  },
});

export default EditExpenseScreen;