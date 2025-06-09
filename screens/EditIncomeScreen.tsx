import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute, StackActions } from '@react-navigation/native';
import { updateIncome } from '../services/incomeService'; // Assuming you have updateIncome in incomeService

interface IncomeRecord {
  id: string;
  userId: string;
  source: string;
  amount: number;
  currency: string;
  date: string; // Or Date, depending on your data model
  notes?: string;
}

const EditIncomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { income } = route.params as { income: IncomeRecord }; // Get income data from route params

  const [source, setSource] = useState(income.source);
  const [amount, setAmount] = useState(income.amount.toString());
  const [currency, setCurrency] = useState(income.currency);
  const [date, setDate] = useState(income.date); // You might use a Date picker component
  const [notes, setNotes] = useState(income.notes || '');
  const [loading, setLoading] = useState(false);

  const handleDeleteIncome = () => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this income record?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            // Implement delete logic here
            console.log('Deleting income with ID:', income.id);
            // Call deleteIncome function from incomeService
            // After successful deletion, navigate back to IncomeListScreen
          },
          style: 'destructive',
        },
      ]
    );
  const handleUpdateIncome = async () => {
    if (!source || !amount || !currency || !date) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const updatedIncome = {
        ...income, // Keep original userId, etc.
        source,
        currency,
        date,
        notes,
      };
      await updateIncome(income.id, updatedIncome);
      Alert.alert('Success', 'Income updated successfully!');
      navigation.goBack(); // Go back to the income list
    } catch (error) {
      console.error('Error updating income:', error);
      Alert.alert('Error', 'Failed to update income. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Use effect to update state if income prop changes (e.g., if navigated back to this screen with different data)
  useEffect(() => {
    setSource(income.source);
    setAmount(income.amount.toString());
    setCurrency(income.currency);
    setDate(income.date);
    setNotes(income.notes || '');
  }, [income]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Income</Text>
      <TextInput
        style={styles.input}
        placeholder="Source"
        value={source}
        onChangeText={setSource}
      />
      <TextInput
        style={styles.input}
        placeholder="Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad" // Changed to decimal-pad for better currency input
      />
       <TextInput
        style={styles.input}
        placeholder="Currency"
        value={currency}
        onChangeText={setCurrency}
      />
      <TextInput
        style={styles.input}
        placeholder="Date (YYYY-MM-DD)" // Suggest using a Date picker
        value={date}
        onChangeText={setDate}
      />
       <TextInput
        style={styles.input}
        placeholder="Notes (Optional)"
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      <Button
        title={loading ? 'Updating...' : 'Save Changes'}
        onPress={handleUpdateIncome}
        disabled={loading}
      />
      <View style={styles.deleteButtonContainer}>
        <Button title="Delete Income" onPress={handleDeleteIncome} color="red" />
      </View>
    </View>
  );
};

export default EditIncomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f8f8', // Example background color
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#333', // Example text color
  },
  input: {
    height: 40,
    borderColor: '#ddd', // Example border color
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    backgroundColor: '#fff', // Example input background
  },
  button: {
    marginTop: 16,
  },
});

export default EditIncomeScreen;