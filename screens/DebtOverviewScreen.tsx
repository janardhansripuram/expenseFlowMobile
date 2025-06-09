import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { fetchPersonalSplitsForUser, PersonalSplit, SplitParticipant } from '../services/splitService';
import { auth } from '../config/firebaseConfig';

interface DebtSummary {
  [currency: string]: {
    [friendId: string]: number;
  };
}

interface NetBalance {
  friendId: string;
  currency: string;
  amount: number;
}

const DebtOverviewScreen: React.FC = () => {
  const [splits, setSplits] = useState<PersonalSplit[]>([]);
  const [loading, setLoading] = useState(true);
  const [netBalances, setNetBalances] = useState<NetBalance[]>([]);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const fetchSplits = async () => {
      try {
        const userSplits = await fetchPersonalSplitsForUser(currentUser.uid);
        setSplits(userSplits);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching personal splits:', error);
        setLoading(false);
      }
    };

    fetchSplits();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || splits.length === 0) {
      setNetBalances([]);
      return;
    }

    const calculateNetBalances = () => {
      const summary: DebtSummary = {};

      splits.forEach(split => {
        const expenseCurrency = split.currency; // Assuming currency is part of the split or expense data

        if (!summary[expenseCurrency]) {
          summary[expenseCurrency] = {};
        }

        split.participants.forEach(participant => {
          if (participant.userId !== currentUser.uid) {
            // If the current user initiated the split, others owe them
            if (split.initiatorId === currentUser.uid) {
              summary[expenseCurrency][participant.userId] = (summary[expenseCurrency][participant.userId] || 0) + participant.amountOwed;
            } else if (participant.userId === currentUser.uid) {
              // If another user initiated, and the current user is a participant, the current user owes
               // Find the initiator's ID. In a personal split, there's one initiator and multiple participants
               const initiator = split.participants.find(p => p.userId === split.initiatorId);
               if (initiator && initiator.userId !== currentUser.uid) {
                 summary[expenseCurrency][split.initiatorId] = (summary[expenseCurrency][split.initiatorId] || 0) - participant.amountOwed;
               }
            }
          }
        });
         // Handle the case where the initiator is not a participant in the participants array, but paid the full amount initially
         if (split.initiatorId === currentUser.uid && !split.participants.some(p => p.userId === currentUser.uid)) {
            // The initiator paid the full amount and is owed by all participants
             split.participants.forEach(participant => {
                 summary[expenseCurrency][participant.userId] = (summary[expenseCurrency][participant.userId] || 0) + participant.amountOwed;
             });
         } else if (split.initiatorId !== currentUser.uid && split.participants.some(p => p.userId === currentUser.uid)) {
             // The current user is a participant and owes the initiator
             const currentUserParticipant = split.participants.find(p => p.userId === currentUser.uid);
             if(currentUserParticipant) {
                  summary[expenseCurrency][split.initiatorId] = (summary[expenseCurrency][split.initiatorId] || 0) - currentUserParticipant.amountOwed;
             }
         }


      });

      const calculatedNetBalances: NetBalance[] = [];
      for (const currency in summary) {
        for (const friendId in summary[currency]) {
          if (summary[currency][friendId] !== 0) {
            calculatedNetBalances.push({
              friendId: friendId,
              currency: currency,
              amount: summary[currency][friendId],
            });
          }
        }
      }
      setNetBalances(calculatedNetBalances);
    };

    calculateNetBalances();
  }, [splits, currentUser]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading debt overview...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Debt Overview</Text>
      {netBalances.length === 0 ? (
        <Text>No outstanding debts.</Text>
      ) : (
        <FlatList
          data={netBalances}
          keyExtractor={(item, index) => `${item.friendId}-${item.currency}-${index}`}
          renderItem={({ item }) => (
            <View style={styles.debtItem}>
              <Text>
                {item.amount > 0 ? `You are owed ${item.amount.toFixed(2)} ${item.currency}` : `You owe ${Math.abs(item.amount).toFixed(2)} ${item.currency}`} by {item.friendId} {/* Display friendId, would ideally be friend's display name */}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  debtItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
});

export default DebtOverviewScreen;