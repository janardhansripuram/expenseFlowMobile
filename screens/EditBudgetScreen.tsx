import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { updateBudget } from '../services/budgetService'; // Assuming updateBudget exists in budgetService

interface Budget {
  id: string;
  userId: string;
  category: string;
  budgetAmount: number;
  currency: string;
  monthYear: string;
}

interface EditBudgetRouteParams {
  budget: Budget;
}

const EditBudgetScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { budget } = route.params as { budget: Budget }; // Explicitly cast route.params

  const [category, setCategory] = useState(budget.category);
  const [budgetAmount, setBudgetAmount] = useState(budget.budgetAmount.toString());
  const [currency, setCurrency] = useState(budget.currency);
  const [monthYear, setMonthYear] = useState(budget.monthYear);
  const [loading, setLoading] = useState(false);

  const handleUpdateBudget = async () => {
    if (!category || !budgetAmount || !currency || !monthYear) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const updatedBudgetData = {
        ...budget, // Keep existing fields like userId
        category,
        budgetAmount: parseFloat(budgetAmount),
        currency,
        monthYear,
      };
      await updateBudget(budget.id, updatedBudgetData); // Assuming updateBudget takes ID and data
      Alert.alert('Success', 'Budget updated successfully!');
      navigation.goBack(); // Navigate back to the budget list
    } catch (error: any) {
      Alert.alert('Error', `Failed to update budget: ${error.message}`);
      console.error('Error updating budget:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Budget</Text>
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
       <TextInput
        style={styles.input}
        placeholder="Currency (e.g., USD)"
        value={currency}
        onChangeText={setCurrency}
        autoCapitalize="characters"
      />
      <TextInput
        style={styles.input}
        placeholder="Month/Year (YYYY-MM)"
        value={monthYear}
        onChangeText={setMonthYear}
      />
      <Button
        title={loading ? 'Saving...' : 'Save Changes'}
        onPress={handleUpdateBudget}
        disabled={loading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f8f8', // Consistent with the light theme background
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
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  button: {
    marginTop: 10,
    borderRadius: 8,
  },
});

export default EditBudgetScreen;