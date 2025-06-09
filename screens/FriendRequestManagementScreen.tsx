import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Button, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../hooks/useAuth'; // Assuming you have an auth hook
import { fetchFriendRequests, acceptFriendRequest, rejectFriendRequest, FriendRequest } from '../services/friendService';

const FriendRequestManagementScreen: React.FC = () => {
  const { user } = useAuth(); // Get the current user
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRequests = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        setError(null);
        setLoading(true);
        const requests = await fetchFriendRequests(user.uid);
        setIncomingRequests(requests.filter(req => req.receiverEmail === user.email && req.status === 'pending'));
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching friend requests:', err);
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, [user]);

  const handleAcceptRequest = async (requestId: string) => {
    try {
      setError(null);
      await acceptFriendRequest(requestId);
      // Remove accepted request from the list
      setIncomingRequests(incomingRequests.filter(req => req.id !== requestId));
    } catch (err: any) {
      setError(err.message);
      console.error('Error accepting friend request:', err);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      setError(null);
      await rejectFriendRequest(requestId);
      // Remove rejected request from the list
      setIncomingRequests(incomingRequests.filter(req => req.id !== requestId));
    } catch (err: any) {
      setError(err.message);
      console.error('Error rejecting friend request:', err);
    }
  };

  const renderRequest = ({ item }: { item: FriendRequest }) => (
    <View style={styles.requestItem}>
      {/* You might need to fetch sender's display name based on item.senderId */}
      <Text>{`Request from: ${item.senderId}`}</Text> {/* Display sender ID for now */}
      <View style={styles.buttonContainer}>
        <Button title="Accept" onPress={() => handleAcceptRequest(item.id!)} />
        <Button title="Reject" onPress={() => handleRejectRequest(item.id!)} color="red" />
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading requests...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Incoming Friend Requests</Text>
      {incomingRequests.length === 0 ? (
        <Text style={styles.noRequests}>No incoming friend requests.</Text>
      ) : (
        <FlatList
          data={incomingRequests}
          renderItem={renderRequest}
          keyExtractor={(item) => item.id!}
        />
      )}
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  requestItem: {
    backgroundColor: '#fff', // White background for request items
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 3,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  error: {
    color: 'red',
    textAlign: 'center',
  },
  noRequests: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#555',
  },
});

export default FriendRequestManagementScreen;