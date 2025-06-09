import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { Reminder } from '../services/reminderService';
import { fetchReminders, updateReminderStatus } from '../services/reminderService';
import { useAuth } from '../hooks/useAuth'; // Assuming you have an auth hook to get the current user
import { useNavigation } from '@react-navigation/native';

const ReminderListScreen: React.FC = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth(); // Get the logged-in user
  const navigation = useNavigation();

  useEffect(() => {
    const loadReminders = async () => {
      if (!user) {
        setLoading(false);
        setError('User not logged in');
        return;
      }
      try {
        setLoading(true);
        const userReminders = await fetchReminders(user.uid);

        // Sort reminders by status: overdue, due today, upcoming, completed, pending
        const sortedReminders = userReminders.sort((a, b) => {
          const statusOrder = ['overdue', 'due_today', 'upcoming', 'completed', 'pending'];
          return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
        });

        setReminders(sortedReminders);
      } catch (err: any) {
        console.error('Error fetching reminders:', err);
        setError('Failed to fetch reminders.');
      } finally {
        setLoading(false);
      }
    };

    loadReminders();
  }, [user]); // Reload reminders when user changes

  const handleStatusToggle = async (reminder: Reminder) => {
    if (!user || !reminder.id) return;

    const newStatus = reminder.status === 'completed' ? 'upcoming' : 'completed'; // Simple toggle for now
    try {
      await updateReminderStatus(reminder.id, newStatus);
      // Update the local state to reflect the change
      setReminders(reminders.map(r =>
        r.id === reminder.id ? { ...r, status: newStatus } : r
      ).sort((a, b) => {
        const statusOrder = ['overdue', 'due_today', 'upcoming', 'completed', 'pending'];
        return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
      }));
    } catch (err) {
      console.error('Error updating reminder status:', err);
      Alert.alert('Error', 'Failed to update reminder status.');
    }
  };

  const renderItem = ({ item }: { item: Reminder }) => (
    <TouchableOpacity
      style={styles.reminderItem}
      onPress={() => navigation.navigate('EditReminder', { reminder: item })} // Navigate to EditReminder screen
    >
      <View style={styles.reminderDetails}>
        <Text style={styles.title}>{item.title}</Text>
        {item.notes && <Text style={styles.notes}>{item.notes}</Text>}
        {item.dueDate && (
          <Text
            style={[
              styles.dueDate,
              item.status === 'overdue' && styles.overdue,
              item.status === 'due_today' && styles.dueToday,
            ]}
          >
            Due Date: {new Date(item.dueDate.toDate()).toLocaleDateString()}
          </Text>
        )}

        {item.dueDate && <Text>Due Date: {new Date(item.dueDate.toDate()).toLocaleDateString()}</Text>}
        <Text>Recurrence: {item.recurrence}</Text>
        <Text>Status: {item.status}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
      <TouchableOpacity onPress={() => handleStatusToggle(item)} style={styles.statusButton}>
 <Text style={styles.statusText}>{item.status === 'completed' ? 'Mark Pending' : 'Mark Complete'}</Text>
      </TouchableOpacity>
 </View>
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
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddReminder')} // Navigate to AddReminder screen
 >
        <Text style={styles.addButtonText}>Add New Reminder</Text>
 </TouchableOpacity>
    <View style={styles.container}>
      <FlatList
        data={reminders}
        renderItem={renderItem}
        keyExtractor={(item) => item.id} // Assuming Reminder has an 'id' field
        ListEmptyComponent={<Text style={styles.emptyText}>No reminders found.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f4f4f4',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reminderDetails: {
 flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  notes: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  dueDate: {
    fontSize: 14,
    color: '#333',
  },
  overdue: {
    color: 'red',
    fontWeight: 'bold',
  },
  dueToday: {
    color: 'orange',
    fontWeight: 'bold',
  },
  statusButton: {
    marginTop: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#007bff',
    borderRadius: 5,
    marginBottom: 5,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  addButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ReminderListScreen;