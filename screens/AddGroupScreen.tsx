import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../config/firebaseConfig'; // Assuming auth is needed to get the current user ID
import { addGroup } from '../services/groupService'; // Assuming addGroup is in groupService

// Placeholder data for friends (replace with actual fetching later)
const placeholderFriends = [
  { id: 'friend1', name: 'Alice' },
  { id: 'friend2', name: 'Bob' },
  { id: 'friend3', name: 'Charlie' },
];

const AddGroupScreen: React.FC = () => {
  const navigation = useNavigation();
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddGroup = async () => {
    if (!groupName.trim()) {
      setError('Group name cannot be empty');
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const newGroup = {
        name: groupName,
        creatorId: currentUser.uid,
        members: [currentUser.uid, ...selectedMembers], // Include the creator as a member
      };

      await addGroup(newGroup);
      console.log('Group added successfully!');
      setLoading(false);
      navigation.goBack(); // Navigate back to GroupListScreen
    } catch (err: any) {
      setError(err.message);
      console.error('Error adding group:', err);
      setLoading(false);
    }
  };

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers((prevSelected) =>
      prevSelected.includes(memberId)
        ? prevSelected.filter((id) => id !== memberId)
        : [...prevSelected, memberId]
    );
  };

  const renderFriendItem = ({ item }: { item: { id: string; name: string } }) => {
    const isSelected = selectedMembers.includes(item.id);
    return (
      <TouchableOpacity
        style={[styles.friendItem, isSelected && styles.selectedFriendItem]}
        onPress={() => toggleMemberSelection(item.id)}
      >
        <Text style={[styles.friendName, isSelected && styles.selectedFriendName]}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create New Group</Text>
      <TextInput
        style={styles.input}
        placeholder="Group Name"
        value={groupName}
        onChangeText={setGroupName}
      />

      <Text style={styles.sectionTitle}>Select Members (Placeholder)</Text>
      <FlatList
        data={placeholderFriends}
        renderItem={renderFriendItem}
        keyExtractor={(item) => item.id}
        style={styles.friendList}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        title={loading ? 'Creating...' : 'Create Group'}
        onPress={handleAddGroup}
        disabled={loading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f8f8', // Light background color
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
    paddingHorizontal: 15,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#555',
  },
  friendList: {
    flexGrow: 0, // Important for FlatList inside a ScrollView or View
    marginBottom: 15,
  },
  friendItem: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  selectedFriendItem: {
    backgroundColor: '#e0f7fa', // Light blue background for selected
  },
  friendName: {
    fontSize: 16,
    color: '#333',
  },
  selectedFriendName: {
    fontWeight: 'bold',
    color: '#007bff', // Blue text for selected
  },
  error: {
    color: 'red',
    marginBottom: 15,
    textAlign: 'center',
  },
});

export default AddGroupScreen;