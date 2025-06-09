import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Button } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

// Placeholder data for friends (replace with actual data fetching later)
const placeholderFriends = [
  { id: '1', name: 'John Doe' },
  { id: '2', name: 'Jane Smith' },
  { id: '3', name: 'Peter Jones' },
  { id: '4', name: 'Mary Williams' },
];

interface Friend {
  id: string;
  name: string;
}

const SelectParticipantsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { expense } = route.params as { expense: any }; // Assuming expense data is passed

  const [selectedParticipants, setSelectedParticipants] = useState<Friend[]>([]);

  const toggleParticipantSelection = (friend: Friend) => {
    if (selectedParticipants.find((p) => p.id === friend.id)) {
      setSelectedParticipants(selectedParticipants.filter((p) => p.id !== friend.id));
    } else {
      setSelectedParticipants([...selectedParticipants, friend]);
    }
  };

  const handleConfirmSelection = () => {
    // Navigate to the SplitMethodScreen and pass selected expense and participants
    navigation.navigate('SplitMethod' as never, { expense, participants: selectedParticipants } as never);
  };

  const renderFriendItem = ({ item }: { item: Friend }) => {
    const isSelected = selectedParticipants.find((p) => p.id === item.id);
    return (
      <TouchableOpacity
        style={[styles.friendItem, isSelected ? styles.selectedFriendItem : null]}
        onPress={() => toggleParticipantSelection(item)}
      >
        <Text style={styles.friendName}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Participants</Text>
      {/* Display the selected expense details here if needed */}
      {expense && (
        <View style={styles.expenseDetails}>
          <Text>Splitting Expense: {expense.description} - {expense.amount} {expense.currency}</Text>
        </View>
      )}
      <FlatList
        data={placeholderFriends}
        renderItem={renderFriendItem}
        keyExtractor={(item) => item.id}
      />
      <Button
        title={`Confirm Selection (${selectedParticipants.length})`}
        onPress={handleConfirmSelection}
        disabled={selectedParticipants.length === 0}
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  expenseDetails: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  friendItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedFriendItem: {
    backgroundColor: '#ffede0', // Light orange for selected
    borderColor: '#ff6600', // Orange border
  },
  friendName: {
    fontSize: 18,
    color: '#333',
  },
});

export default SelectParticipantsScreen;