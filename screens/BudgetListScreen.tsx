import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Button, TouchableOpacity } from 'react-native';
import { fetchBudgets, Budget } from '../services/budgetService';
import { fetchExpensesByBudgetPeriod, Expense } from '../services/expenseService';
import { auth, firestore } from '../config/firebaseConfig';
import { useNavigation } from '@react-navigation/native';

const BudgetListScreen: React.FC = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigation = useNavigation();
  const user = auth.currentUser;

  useEffect(() => {
    const loadBudgets = async () => {
      if (user) {
        try {
          setError('');
          const userBudgets = await fetchBudgets(user.uid);

          const budgetsWithProgress = await Promise.all(
            userBudgets.map(async (budget) => {
              // Assuming monthYear is in 'YYYY-MM' format
              const [year, month] = budget.monthYear.split('-');
              const startDate = new Date(parseInt(year), parseInt(month) - 1, 1); // Month is 0-indexed
              const endDate = new Date(parseInt(year), parseInt(month), 0); // Last day of the month

              // Fetch all expenses for the budget period and category, regardless of currency
              const allRelevantExpenses = await fetchExpensesByBudgetPeriod(
                user.uid,
                budget.category,
                startDate,
                endDate,
                null // Fetching all currencies
              );

              // Filter expenses that match the budget's currency for progress calculation
              const expensesInBudgetCurrency = allRelevantExpenses.filter(
                (expense) => expense.currency === budget.currency
              );
              const totalSpending = expensesInBudgetCurrency.reduce((sum, expense) => sum + expense.amount, 0);

              const hasMultiCurrencyExpenses = allRelevantExpenses.some(expense => expense.currency !== budget.currency);

              return { ...budget, totalSpending, hasMultiCurrencyExpenses };
            })
          );
          setBudgets(budgetsWithProgress);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
        setError('User not authenticated.');
      }
    };

    loadBudgets();
  }, [user]);

  const renderBudget = ({ item }: { item: Budget }) => (
 <TouchableOpacity style={styles.budgetItem} onPress={() => navigation.navigate('EditBudget', { budget: item } as any)}>
      <Text style={styles.category}>{item.category}</Text>
      <Text style={styles.amount}>Budget: {item.budgetAmount} {item.currency}</Text>
      <Text style={styles.amount}>Spent: {item.totalSpending !== undefined ? item.totalSpending.toFixed(2) : 'Loading...'} {item.currency}</Text>
      {item.totalSpending !== undefined && (
 <Text style={styles.progress}>{((item.totalSpending / item.budgetAmount) * 100).toFixed(2)}% Spent</Text>)}
      {item.hasMultiCurrencyExpenses && (
        <Text style={styles.multiCurrencyAlert}>Note: Expenses in other currencies exist and are not included in progress.</Text>)}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Add button to navigate to AddBudgetScreen */}
      <Button title="Add New Budget" onPress={() => navigation.navigate('AddBudget')} />

      <FlatList
        data={budgets}
        renderItem={renderBudget}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>No budgets found.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f8f8', // Light gray background
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  budgetItem: {
    backgroundColor: '#fff', // White background for cards
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Android shadow
  },
  category: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  amount: {
    fontSize: 16,
    color: '#555',
    marginTop: 4,
  },
  monthYear: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  progress: {
    fontSize: 14,
    color: '#007bff', // Blue color for progress
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#555',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
  multiCurrencyAlert: {
    fontSize: 12,
    color: '#ff9800', // Orange color for alert
    marginTop: 4,
  },
});

export default BudgetListScreen;