import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { fetchExpenses, Expense } from '../services/expenseService'; // Assuming fetchExpenses is updated to filter out group expenses
import { auth } from '../config/firebaseConfig';

const SelectExpenseForSplitScreen: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigation = useNavigation();

  useEffect(() => {
    const fetchPersonalExpenses = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError('User not authenticated.');
        setLoading(false);
        return;
      }
      try {
        // Assuming fetchExpenses can filter out group expenses or we filter here
        const allExpenses = await fetchExpenses(currentUser.uid);
        const personalExpenses = allExpenses.filter(expense => !expense.groupId); // Assuming a groupId field for group expenses
        setExpenses(personalExpenses);
        setLoading(false);
      } catch (err: any) {
        setError('Error fetching expenses: ' + err.message);
        setLoading(false);
      }
    };

    fetchPersonalExpenses();
  }, []);

  const handleSelectExpense = (expense: Expense) => {
    // Navigate to the next screen in the split process (Participant Selection)
    // Pass the selected expense data as a parameter
    navigation.navigate('SelectParticipantsForSplit', { selectedExpense: expense }); // Navigate to the SelectParticipantsForSplitScreen
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading expenses...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Expense to Split</Text>
      {expenses.length === 0 ? (
        <Text>No personal expenses found.</Text>
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id!}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.expenseItem} onPress={() => handleSelectExpense(item)}>
              <Text>{item.description}</Text>
              <Text>{item.amount} {item.currency}</Text>
              <Text>{item.date ? new Date(item.date.seconds * 1000).toLocaleDateString() : 'N/A'}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  expenseItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
});

export default SelectExpenseForSplitScreen;