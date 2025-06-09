import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Button, Picker, TextInput } from 'react-native';
import { getExpensesByUserId, ExpenseSort } from '../services/expenseService';
import { useTheme } from '../../contexts/themeContext'; // Import useTheme
import { ExpenseFilter } from '../services/expenseService'; // Import ExpenseFilter type
import { auth } from '../config/firebaseConfig'; // Import auth

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
 date: Date; // Or Date type if you handle it as such
 isRecurring?: boolean;
 recurrenceInterval?: 'daily' | 'weekly' | 'monthly' | 'yearly';
 recurrenceEndDate?: Date | null;
 currency: string; // Add currency field
  id: string; // Ensure id is included for keyExtractor and editing
}
import { useNavigation } from '@react-navigation/native';

const ExpenseListScreen: React.FC = () => {
  // ... existing state variables
  const { theme } = useTheme(); // Use theme hook

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for filtering
  const [filters, setFilters] = useState<ExpenseFilter>({});
  const [isFilterVisible, setIsFilterVisible] = useState(false); // State to toggle filter UI visibility

  // Filter state variables (example) - you'll need more for all filter types
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterAmount, setFilterAmount] = useState(''); // Example, could be min/max or range

  // State for sorting
  const [sortBy, setSortBy] = useState<keyof Expense | ''>('');
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">('asc');
  const [isSortVisible, setIsSortVisible] = useState(false); // State to toggle sort UI visibility

  const user = auth.currentUser;

  const navigation = useNavigation();
  useEffect(() => {
    const fetchExpenses = async () => {
      if (!user) {
        setError('User not logged in.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const sort: ExpenseSort | undefined = sortBy ? { field: sortBy, order: sortOrder } : undefined;
        const userExpenses = await getExpensesByUserId(user.uid, filters, sort); // Pass filters and sort
        // If sorting is applied client-side in the service, you might not need to do it here.
        // If not, you would sort the fetched 'userExpenses' array here before setting the state.
        // Example client-side sort (if not done in service):
        // userExpenses.sort((a, b) => { /* sorting logic */ });
        setExpenses(userExpenses);
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching expenses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, [user, filters, sortBy, sortOrder]); // Re-run effect if user, filters, or sort changes

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{ color: theme.text }}>Loading Expenses...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (expenses.length === 0) {
    return ( // You might want to keep the filter UI visible even if no expenses are found
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Text>No expenses recorded yet.</Text>
      </View>
    );
  }

  const handleEditExpense = (expense: Expense) => {
 navigation.navigate('EditExpense', { expense }); // Navigate to EditExpenseScreen with expense data
  };

  const renderItem = ({ item }: { item: Expense }) => (
    <TouchableOpacity style={[styles.expenseItem, { backgroundColor: theme.cardBackground, borderColor: theme.borderColor }]} onPress={() => handleEditExpense(item)}>
 <View style={styles.itemDetails}>
 <Text style={[styles.description, { color: theme.text }]}>{item.description}</Text>
 <Text style={[styles.category, { color: theme.text }]}>{item.category}</Text>
 {item.isRecurring && (
 <Text style={[styles.recurringText, { color: theme.primary }]}>Recurring: {item.recurrenceInterval}</Text>
 )}
 </View>
 <Text style={[styles.amount, { color: theme.text }]}>{item.amount.toFixed(2)}</Text>
    </View>
  );

  // Access the navigation object to set options
  React.useLayoutEffect(() => {
    navigation.setOptions(
 {
 headerRight: () => (
 <View style={{ flexDirection: 'row', marginRight: 10 }}>
 <TouchableOpacity onPress={() => navigation.navigate('AddExpense')} style={{ marginRight: 15 }}>
 <Text style={{ fontSize: 30, color: theme.headerText }}>+</Text>
 </TouchableOpacity>
 <TouchableOpacity onPress={() => navigation.navigate('AddIncome')} style={{ marginRight: 15 }}>
 <Text style={{ fontSize: 30, color: theme.headerText }}>$</Text>
 </TouchableOpacity>
 <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
 <Text style={{ fontSize: 20, color: theme.headerText }}>👤</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('IncomeList')} style={{ marginLeft: 15 }}>
                    <Text style={{ fontSize: 20, color: theme.headerText }}>💰</Text>
 </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('BudgetList')} style={{ marginLeft: 15 }}>
                    <Text style={{ fontSize: 20, color: theme.headerText }}>📊</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('GroupList')} style={{ marginLeft: 15 }}>
                    <Text style={{ fontSize: 20, color: theme.headerText }}>👥</Text>
                </TouchableOpacity>
 <TouchableOpacity onPress={() => navigation.navigate('FriendsList')} style={{ marginLeft: 15 }}>
 <Text style={{ fontSize: 20, color: theme.headerText }}>🤝</Text>
 </TouchableOpacity>
 <TouchableOpacity onPress={() => {
 navigation.navigate('SelectExpenseForSplit');
          }} style={{ marginLeft: 15 }}>
 <Text style={{ fontSize: 20, color: theme.headerText }}>✂️</Text>
 </TouchableOpacity>
 <TouchableOpacity onPress={() => {
 navigation.navigate('PersonalSplitHistory');
          }} style={{ marginLeft: 15 }}>
 <Text style={{ fontSize: 20, color: theme.headerText }}>📝</Text>
 </TouchableOpacity>
 <TouchableOpacity onPress={() => navigation.navigate('DebtOverview')} style={{ marginLeft: 15 }}>
 <Text style={{ fontSize: 20, color: theme.headerText }}>👥</Text>
 </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('ReminderList')} style={{ marginLeft: 15 }}>
 <Text style={{ fontSize: 20, color: '#fff' }}>⏰</Text>
 </TouchableOpacity>
 <TouchableOpacity onPress={() => {
 setIsFilterVisible(!isFilterVisible);
 setIsSortVisible(false); // Hide sort UI if filter is shown
 }} style={{ marginLeft: 15 }}>
 <Text style={{ fontSize: 20, color: theme.headerText }}>🔍</Text>
 </TouchableOpacity>
 <TouchableOpacity onPress={() => {
 setIsSortVisible(!isSortVisible);
 setIsFilterVisible(false); // Hide filter UI if sort is shown
 }} style={{ marginLeft: 15 }}>
 <Text style={{ fontSize: 20, color: theme.headerText }}>⇅</Text>
 </TouchableOpacity>
 </View>
 ),
    });
  }, [navigation]);

  const handleApplyFilters = () => {
    // Construct the filters object based on the filter state variables
    const newFilters: ExpenseFilter = {};
    if (filterCategory) newFilters.category = filterCategory;
    if (filterStartDate) newFilters.startDate = new Date(filterStartDate); // Convert to Date
    if (filterEndDate) newFilters.endDate = new Date(filterEndDate);     // Convert to Date
    if (filterAmount) newFilters.amount = parseFloat(filterAmount);    // Convert to number
    // Add logic for other filter types (amount range, currency, group etc.)

    setFilters(newFilters); // Update the filters state, which will trigger the useEffect to refetch expenses
    setIsFilterVisible(false); // Hide the filter UI after applying
  };

  return (
    // Keep the container for consistent padding and background
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {isFilterVisible && (
        <View style={[styles.filterContainer, { backgroundColor: theme.cardBackground, borderColor: theme.borderColor }]}>
          <Text style={styles.filterTitle}>Filter Expenses</Text>
          {/* Example Filter Inputs - You'll need to add more for all filter types */}
          <TextInput
            style={styles.filterInput}
            placeholder="Filter by Category"
            value={filterCategory}
            onChangeText={setFilterCategory}
          />
          {/* You'll need a date picker component for start/end dates */}
          <TextInput
            style={styles.filterInput}
            placeholder="Start Date (YYYY-MM-DD)"
            value={filterStartDate}
            onChangeText={setFilterStartDate}
            keyboardType="numbers-and-punctuation"
          />
          <TextInput
            style={styles.filterInput}
            placeholder="End Date (YYYY-MM-DD)"
            value={filterEndDate}
            onChangeText={setFilterEndDate}
            keyboardType="numbers-and-punctuation"
          />
           <TextInput
            style={styles.filterInput}
            placeholder="Filter by Amount"
            value={filterAmount}
            onChangeText={setFilterAmount}
             keyboardType="numeric"
          />
          {/* Add dropdowns/pickers for currency, group, etc. */}

          <Button title="Apply Filters" onPress={handleApplyFilters} />
           <Button title="Clear Filters" onPress={() => {
            setFilters({});
            setFilterCategory('');
            setFilterStartDate('');
            setFilterEndDate('');
            setFilterAmount('');
             setIsFilterVisible(false);
          }} />
        </View>
      )}

      {/* Render sort UI */}
      {isSortVisible && (
        <View style={[styles.filterContainer, { backgroundColor: theme.cardBackground, borderColor: theme.borderColor }]}>
          <Text style={styles.filterTitle}>Sort Expenses</Text>
          <Picker
            selectedValue={sortBy}
            style={styles.filterInput}
            onValueChange={(itemValue) => setSortBy(itemValue)}
          >
            <Picker.Item label="Select field to sort by" value="" />
            <Picker.Item label="Date" value="date" />
            <Picker.Item label="Amount" value="amount" />
            {/* Add other sortable fields here */}
          </Picker>
          <Picker
            selectedValue={sortOrder}
            style={styles.filterInput}
            onValueChange={(itemValue) => setSortOrder(itemValue)}
          >
            <Picker.Item label="Ascending" value="asc" />
            <Picker.Item label="Descending" value="desc" />
          </Picker>
          <Button title="Apply Sort" onPress={() => setIsSortVisible(false)} />
          <Button title="Clear Sort" onPress={() => {
            setSortBy('');
            setSortOrder('asc');
            setIsSortVisible(false);
          }} />
        </View>
      )}

      {/* Main expense list */}
      <FlatList
        data={expenses}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ flexGrow: 1 }} // Allow content to grow and be scrollable below filters
      />
    </View>
  );
};
// Move styles outside the component to avoid re-creation
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f8f8',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expenseItem: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    elevation: 2, // Add shadow for Android
    shadowColor: '#000', // Add shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
 flexDirection: 'row', // Arrange children horizontally
 justifyContent: 'space-between', // Distribute space between children
 alignItems: 'center', // Align children vertically
  },
 itemDetails: {
 flex: 1, // Allow details to take up available space
 marginRight: 10, // Add some space between details and amount
 },
  description: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  amount: {
    fontSize: 18, // Match description font size for balance
    fontWeight: 'bold',
    color: 'green',
  },
 recurringText: {
    color: 'purple', // Or any color to indicate recurring
    marginTop: 4,
  },
  category: {
    fontSize: 12,
    color: '#555',
    marginTop: 4,
  },
  date: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  filterContainer: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  filterInput: {
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
});

export default ExpenseListScreen;