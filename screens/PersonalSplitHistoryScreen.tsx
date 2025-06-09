import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { fetchPersonalSplits, PersonalSplit, updatePersonalSplit, SplitParticipant } from '../services/splitService';
import { auth } from '../config/firebaseConfig';
import { useNavigation } from '@react-navigation/native';

const PersonalSplitHistoryScreen: React.FC = () => {
  const [splits, setSplits] = useState<PersonalSplit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // This effect should ideally use a real-time listener for splits
    const fetchSplits = async () => {
      const user = auth.currentUser;
      if (!user) {
        setError('User not logged in.');
        setLoading(false);
        return;
      }
      try {
        const personalSplits = await fetchPersonalSplits(user.uid);
        setSplits(personalSplits);
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching personal splits:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSplits();
  }, []);

  const navigation = useNavigation();

  const handleSettleToggle = async (splitId: string, participantUserId: string, currentSettledStatus: boolean) => {
    const user = auth.currentUser;
    if (!user) {
      setError('User not logged in.');
      return;
    }

    try {
      // Find the split and update the participant's settlement status locally first for a snappier UI
      const updatedSplits = splits.map(split => {
        if (split.id === splitId) {
          return { ...split, participants: split.participants.map(p => p.userId === participantUserId ? { ...p, isSettled: !currentSettledStatus } : p) };
        }
        return split;
      });
      setSplits(updatedSplits);

      // Find the updated split to pass the entire updated participants array
      const splitToUpdate = updatedSplits.find(split => split.id === splitId);

      if (splitToUpdate) {
        await updatePersonalSplit(splitId, { participants: splitToUpdate.participants });
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error updating settlement status:', err);
      // Optionally revert local state if update fails
      const revertedSplits = splits.map(split => {
        if (split.id === splitId) {
          return { ...split, participants: split.participants.map(p => p.userId === participantUserId ? { ...p, isSettled: currentSettledStatus } : p) };
        }
        return split;
      });
      setSplits(revertedSplits);
    }
  };

  const renderParticipantItem = (participant: SplitParticipant, splitId: string) => {
    return (
      <View key={participant.userId} style={styles.participantItem}>
        <Text>User ID: {participant.userId}</Text>
        <Text>Owed: {participant.amountOwed}</Text>
        <View style={styles.settlementContainer}>
          <Text>Settled: </Text>
          <TouchableOpacity onPress={() => handleSettleToggle(splitId, participant.userId, participant.isSettled)}>
            <Text style={participant.isSettled ? styles.settledStatus : styles.unsettledStatus}>
              {participant.isSettled ? 'Yes' : 'No'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

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

  if (splits.length === 0) {
    return (
      <View style={styles.centered}>
        <Text>No personal splits found.</Text>
      </View>
    );
  }

  const renderSplitItem = ({ item }: { item: PersonalSplit }) => {
    const handleSplitPress = () => {
      navigation.navigate('EditPersonalSplit', { split: item });
    };

    return (
    <TouchableOpacity onPress={handleSplitPress} style={styles.splitItem}>
      {item.participants.map(participant => renderParticipantItem(participant, item.id))}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Personal Split History</Text>
      <FlatList
        data={splits}
        keyExtractor={(item) => item.id} // Assuming split has an ID
        renderItem={renderSplitItem}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5', // Light gray background
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  splitItem: {
    backgroundColor: '#ffffff', // White background for cards
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  expenseInfo: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  initiatorInfo: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  participantsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  participantItem: {
    marginLeft: 8,
    marginBottom: 4,
  },
  settlementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settledStatus: {
    color: 'green',
    fontWeight: 'bold',
  },
  unsettledStatus: {
    color: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
});

export default PersonalSplitHistoryScreen;