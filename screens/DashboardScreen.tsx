import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Assuming you are using Expo icons

import { fetchExpenses } from "../services/expenseService";
import { fetchReminders } from "../services/reminderService";
import { auth } from "../firebaseConfig";
import { useTheme } from '../../contexts/themeContext'; // Import useTheme
import { getAuth } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';

const DashboardScreen: React.FC = () => {
  const [upcomingReminders, setUpcomingReminders] = useState([
  ]);
  const [recentExpenses, setRecentExpenses] = useState([
  ]);
  const [spendingByCategory, setSpendingByCategory] = useState<{ category: string; total: number }[]>([]);
  const navigation = useNavigation();
  const { theme } = useTheme(); // Use the useTheme hook to get the current theme


  // Fetch data on component mount
  useEffect(() => {
    // Implement data fetching from your services here
    const auth = getAuth();
    const fetchDashboardData = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      // Fetch recent expenses (e.g., last 5)
      const expenses = await fetchExpenses(currentUser?.uid, 5); // Assuming fetchExpenses can take a limit
      setRecentExpenses(expenses);

      // Fetch upcoming reminders (e.g., next 5)
      const reminders = await fetchReminders(currentUser.uid);
      // Filter and get upcoming reminders (you might need to define what "upcoming" means, e.g., due in the next 7 days)
      const now = new Date();
      const upcoming = reminders.filter(r => r.status === 'upcoming' && r.dueDate && r.dueDate.toDate() > now).slice(0, 5); // Example filtering

      // Fetch expenses for spending chart (e.g., current month)
      const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      const allExpenses = await fetchExpenses(currentUser?.uid); // Fetch all or filtered by date range if possible
      const currentMonthExpenses = allExpenses.filter(exp => {
         const expenseDate = exp.date ? new Date(exp.date) : null;
         return expenseDate && expenseDate >= startOfCurrentMonth && expenseDate <= endOfCurrentMonth;
      });

      // Calculate spending by category
      const categoryTotals: { [key: string]: number } = {};
      currentMonthExpenses.forEach(exp => {
         categoryTotals[exp.category || 'Uncategorized'] = (categoryTotals[exp.category || 'Uncategorized'] || 0) + exp.amount;
      });
      setSpendingByCategory(Object.keys(categoryTotals).map(cat => ({ category: cat, total: categoryTotals[cat] })));
      setUpcomingReminders(upcoming);
    };

    fetchDashboardData();
  }, []);

  // Placeholder for navigating to different screens
  // NOTE: Replace 'as any' with proper type checking once navigation types are defined
  const navigateTo = (screenName: string) => {
    navigation.navigate(screenName as any); // Use 'as any' for now if types are not fully set up
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Splitty</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => navigateTo('Reports')}>
            <Ionicons name="stats-chart-outline" size={28} color={theme.text} style={{ marginRight: 15 }} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigateTo('FriendsList')}>
            <Ionicons name="people-outline" size={28} color={theme.text} style={{ marginRight: 15 }} />
          </TouchableOpacity>
           <TouchableOpacity onPress={() => navigateTo('ReminderList')}>
             <Ionicons name="alarm-outline" size={28} color={theme.text} style={{ marginRight: 15 }} />
           </TouchableOpacity>
          <TouchableOpacity onPress={() => navigateTo('DebtOverview')}>
             <Ionicons name="wallet-outline" size={28} color={theme.text} style={{ marginRight: 15 }} />
           </TouchableOpacity>
           <TouchableOpacity onPress={() => navigateTo('UserProfile')}>
             <Ionicons name="person-circle-outline" size={30} color={theme.text} />
           </TouchableOpacity>
        </View>
      </View>

      <View style={styles.balanceSection}>
        <View style={styles.balanceCard}>
          {/* Placeholder for actual You Owe balance */}
          <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>You Owe</Text>
          <Text style={[styles.balanceAmount, { color: theme.text }]}>{youOwe}</Text>
        </View>
        <View style={styles.balanceCard}>
          <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>Owes You</Text>
          <Text style={[styles.balanceAmount, { color: theme.text }]}>{owesYou}</Text>
        </View>
      </View>

      {/* Placeholder for Pending Bills section - uncomment and implement when pending bills logic is ready */}
      {/* <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pending Bills</Text>
        <TouchableOpacity onPress={() => navigateTo('PendingBills')}>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View> */}


      <View style={styles.section}>
        {/* Placeholder for Friends section - uncomment and implement when friend list display logic is ready */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Friends</Text>
      </View>
      {/* {friends.map(friend => (
        <View key={friend.id} style={styles.listItem}>
          <Text>{friend.name}</Text>
          <Text>{friend.status}</Text>
        </View>
      ))} */}


      {/* Placeholder for Spending by Category Bar Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Spending by Category</Text>
        <View style={[styles.chartPlaceholder, { padding: 16 }]}>
          {spendingByCategory.map((item, index) => (
            <Text key={index}>{item.category}: {item.total.toFixed(2)}</Text>
          ))}

          <Text>Bar Chart Placeholder</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Upcoming Reminders</Text>
        <TouchableOpacity onPress={() => navigateTo('ReminderList')}>
           <Text style={[styles.viewAll, { color: theme.primary }]}>View All</Text>
         </TouchableOpacity>
      </View>
      {upcomingReminders.map(reminder => (
        // Display relevant reminder details
        <View key={reminder.id} style={styles.listItem}>
          <Text style={{ color: theme.text }}>{reminder.title}</Text>
          {/* Assuming dueDate is a Date object, format it */}
          <Text>{reminder.dueDate?.toDateString()}</Text>
        </View>
      ))}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Expenses</Text>
         <TouchableOpacity onPress={() => navigateTo('ExpenseList')}>
           <Text style={[styles.viewAll, { color: theme.primary }]}>View All</Text>
        </TouchableOpacity>
      </View>
      {recentExpenses.map((expense) => (
        <View key={expense.id} style={styles.listItem}>
          <Text style={{ color: theme.text }}>{expense.description}</Text>
          <Text style={{ color: theme.text }}>{expense.amount}</Text>
          <Text style={{ color: theme.text }}>{expense.date ? new Date(expense.date).toDateString() : 'No Date'}</Text>
        </View>
      ))}

      {/* Quick Action Buttons - styled to be at the bottom */}
       <View style={[styles.quickActionsContainer, { backgroundColor: theme.primary }]}>
        <TouchableOpacity style={styles.quickActionButton} onPress={() => navigateTo('AddExpense')}>
          <Ionicons name="add-circle-outline" size={30} color={theme.text} />
          <Text style={[styles.quickActionButtonText, { color: theme.text }]}>Add Expense</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionButton} onPress={() => navigateTo('AddIncome')}>
           <Ionicons name="wallet-outline" size={30} color={theme.text} />
           <Text style={[styles.quickActionButtonText, { color: theme.text }]}>Add Income</Text>
         </TouchableOpacity>
        {/* Add other quick action buttons here */}
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, // Background color will be set dynamically
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: { // Color will be set dynamically
    fontSize: 24,
  },
  headerIcons: {
    color: 'white',
  },
  balanceSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
  },
  balanceCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceLabel: {
    fontSize: 16, // Color will be set dynamically
  },
  balanceAmount: { // Color will be set dynamically
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  section: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18, // Color will be set dynamically
    fontWeight: 'bold',
  },
  viewAll: { // Color will be set dynamically
  },
  listItem: {
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  chartPlaceholder: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickActionsContainer: {
     flexDirection: 'row',
     justifyContent: 'space-around',
     paddingVertical: 16,
     borderTopLeftRadius: 20,
     borderTopRightRadius: 20,
     marginTop: 20, // Space above buttons
  },
  quickActionButton: {
     alignItems: 'center',
  },
  quickActionButtonText: { // Color will be set dynamically
     fontSize: 12,
  },
});

export default DashboardScreen;