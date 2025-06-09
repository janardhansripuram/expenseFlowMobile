import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { User } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import Toast from 'react-native-toast-message';
import { auth } from './config/firebaseConfig';
import { ThemeProvider } from './contexts/themeContext'; // Import ThemeProvider
import AddBudgetScreen from './screens/AddBudgetScreen';
import AddExpenseScreen from './screens/AddExpenseScreen';
import AddGroupScreen from './screens/AddGroupScreen';
import AddIncomeScreen from './screens/AddIncomeScreen';
import AddReminderScreen from './screens/AddReminderScreen';
import AuthScreen from './screens/AuthScreen';
import BudgetListScreen from './screens/BudgetListScreen';
import ChangePasswordScreen from './screens/ChangePasswordScreen';
import DashboardScreen from './screens/DashboardScreen'; // Import DashboardScreen
import FriendsListScreen from './screens/FriendsListScreen'; // Import FriendsListScreen
import DebtOverviewScreen from './screens/DebtOverviewScreen';
import EditBudgetScreen from './screens/EditBudgetScreen';
import EditExpenseScreen from './screens/EditExpenseScreen';
import EditPersonalSplitScreen from './screens/EditPersonalSplitScreen';
import EditReminderScreen from './screens/EditReminderScreen';
import ExpenseListScreen from './screens/ExpenseListScreen';
import GroupDetailScreen from './screens/GroupDetailScreen';
import GroupListScreen from './screens/GroupListScreen';
import IncomeListScreen from './screens/IncomeListScreen';
import PersonalSplitHistoryScreen from './screens/PersonalSplitHistoryScreen';
import ProfileScreen from './screens/ProfileScreen';
import ReminderListScreen from './screens/ReminderListScreen';
import SelectExpenseForSplitScreen from './screens/SelectExpenseForSplitScreen';
import SelectParticipantsScreen from './screens/SelectParticipantsScreen';
import SplitMethodScreen from './screens/SplitMethodScreen';

const Tab = createBottomTabNavigator();

const Stack = createNativeStackNavigator();

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const subscriber = auth.onAuthStateChanged((authenticatedUser) => {
      setUser(authenticatedUser);
      setLoading(false);
    });

    return subscriber;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const AuthenticatedTabs = () => {
    return (
      <Tab.Navigator>
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Expenses" component={ExpenseListScreen} />
        <Tab.Screen name="Groups" component={GroupListScreen} />
        <Tab.Screen name="Friends" component={FriendsListScreen} />
        <Tab.Screen name="Reminders" component={ReminderListScreen} />
        <Tab.Screen name="Debt Overview" component={DebtOverviewScreen} />
      </Tab.Navigator>
    );
  };

  return (
    <ThemeProvider> {/* Wrap with ThemeProvider */}
      <NavigationContainer>
        <Stack.Navigator initialRouteName={user ? 'Authenticated' : 'Auth'}>
          <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Authenticated" component={AuthenticatedTabs} options={{ headerShown: false }} />
          <Stack.Screen name="AddExpense" component={AddExpenseScreen} options={{ title: 'Add Expense' }} />
          <Stack.Screen name="EditExpense" component={EditExpenseScreen} options={{ title: 'Edit Expense' }} />
          <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
          <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'Change Password' }} />
          <Stack.Screen name="AddIncome" component={AddIncomeScreen} options={{ title: 'Add Income' }} />
          <Stack.Screen name="IncomeList" component={IncomeListScreen} options={{ title: 'Income' }} />
          <Stack.Screen name="AddGroup" component={AddGroupScreen} options={{ title: 'Add Group' }} />
          <Stack.Screen name="GroupDetail" component={GroupDetailScreen} options={{ title: 'Group Details' }} />
          <Stack.Screen name="DebtOverview" component={DebtOverviewScreen} options={{ title: 'Debt Overview' }} />
          <Stack.Screen name="ReminderList" component={ReminderListScreen} options={{ title: 'Reminders' }} />
          <Stack.Screen name="AddReminder" component={AddReminderScreen} options={{ title: 'Add Reminder' }} />
          <Stack.Screen name="EditReminder" component={EditReminderScreen} options={{ title: 'Edit Reminder' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider> // Close ThemeProvider
    <Toast />
  );
};

export default App;
