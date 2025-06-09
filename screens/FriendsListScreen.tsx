import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { fetchFriends, removeFriend } from '../services/friendService'; // Assuming fetchFriends is in friendService
import { useNavigation } from '@react-navigation/native';
import { auth } from '../config/firebaseConfig'; // Assuming auth is in firebaseConfig

interface Friend {
  id: string;
  email: string;
  // Add other relevant friend details if available in your data model
}

const FriendsListScreen: React.FC = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation();

  useEffect(() => {
    const loadFriends = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError('User not authenticated.');
        setLoading(false);
        return;
      }

      try {
        const friendsList = await fetchFriends(currentUser.uid);
        setFriends(friendsList);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching friends:', err);
 setError(err.message);
        setLoading(false);
      }
    };

    loadFriends();
  }, []);

  const handleRemoveFriend = async (friendId: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert('Error', 'User not authenticated.');
 return;
    }

    try {
 await removeFriend(currentUser.uid, friendId);
 setFriends(friends.filter(friend => friend.id !== friendId));
    } catch (err: any) {
        setError(err.message);
        setLoading(false);
        console.error('Error fetching friends:', err);
 return;
      }
    };

    loadFriends();
  }, []);

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
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Friends List</Text>
        <View style={styles.buttonContainer}>
 <TouchableOpacity onPress={() => navigation.navigate('FriendRequestManagement')}>
 <Text style={styles.headerButton}>Requests</Text>
 </TouchableOpacity>
 <TouchableOpacity onPress={() => navigation.navigate('SendFriendRequest')}>
 <Text style={styles.headerButton}>Add Friend</Text>
 </TouchableOpacity>
      </View>

    <View style={styles.container}>
      <Text style={styles.title}>Friends List</Text>
      {friends.length === 0 ? (
        <Text style={styles.noFriendsText}>No friends added yet.</Text>
      ) : (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.friendItem}>
              <Text style={styles.friendName}>{item.email}</Text>
              {/* Display other friend details here */}
            </View>
          )}
        />
      )}
      {/* Removed redundant title view here */}
    </View>




    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f4f4f4',
 },
  buttonContainer: {
 flexDirection: 'row',
 alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    // textAlign: 'center', // Removed as it's in the header now
    color: '#333', // Example text color
  },
  friendItem: {
    backgroundColor: '#fff', // Example item background
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  friendName: {
    fontSize: 18,
    color: '#555', // Example text color
  },
  noFriendsText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
    color: '#888',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  },
  addButton: {
    fontSize: 16,
    color: '#007BFF', // Example button color
    marginRight: 16, // Add some spacing
  },
});

export default FriendsListScreen;