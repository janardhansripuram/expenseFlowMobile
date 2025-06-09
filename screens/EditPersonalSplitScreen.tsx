import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { PersonalSplit, SplitParticipant, updatePersonalSplit, deletePersonalSplit } from '../services/splitService'; // Assume splitService exists

const EditPersonalSplitScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { split } = route.params as { split: PersonalSplit }; // Get split data from route params

  const [participants, setParticipants] = useState<SplitParticipant[]>(split.participants);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // You might want to fetch the latest split data here in case it changed elsewhere
    // For simplicity, we'll use the data passed via route params for now.
    setParticipants(split.participants);
  }, [split]);

  const handleAmountChange = (value: string, index: number) => {
    const newParticipants = [...participants];
    newParticipants[index].amountOwed = parseFloat(value) || 0;
    setParticipants(newParticipants);
  };

  const handleIsSettledChange = (index: number, isSettled: boolean) => {
    const newParticipants = [...participants];
    newParticipants[index].isSettled = isSettled;
    setParticipants(newParticipants);
  };

  const handleSaveChanges = async () => {
    setLoading(true);
    setError(null);
    try {
      // You might want to add validation here to ensure amounts/percentages are valid
      await updatePersonalSplit(split.id!, { participants }); // Assuming split.id is available
      Alert.alert('Success', 'Split updated successfully!');
      navigation.goBack(); // Navigate back to history screen
    } catch (err: any) {
      setError(err.message);
      console.error('Error updating split:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSplit = async () => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this split?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            setLoading(true);
            setError(null);
            try {
              await deletePersonalSplit(split.id!); // Assuming split.id is available
              Alert.alert('Success', 'Split deleted successfully!');
              navigation.goBack(); // Navigate back to history screen
            } catch (err: any) {
              setError(err.message);
              console.error('Error deleting split:', err);
            } finally {
              setLoading(false);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Split for Expense: {split.expenseId}</Text> {/* Display associated expense ID */}

      <Text style={styles.sectionTitle}>Participants:</Text>
      {participants.map((participant, index) => (
        <View key={participant.userId} style={styles.participantRow}>
          <Text>{`User ${participant.userId}:`}</Text> {/* Replace with actual user display name */}
          <TextInput
            style={styles.input}
            value={participant.amountOwed.toString()}
            onChangeText={(value) => handleAmountChange(value, index)}
            keyboardType="numeric"
            placeholder="Amount Owed"
          />
          {/* Add UI for percentage if needed based on split method */}
          <Text>{`Settled: ${participant.isSettled ? 'Yes' : 'No'}`}</Text>
          <Button
            title={participant.isSettled ? 'Mark as Unsettled' : 'Mark as Settled'}
            onPress={() => handleIsSettledChange(index, !participant.isSettled)}
          />
        </View>
      ))}

      {error && <Text style={styles.error}>{error}</Text>}

      <Button
        title={loading ? 'Saving...' : 'Save Changes'}
        onPress={handleSaveChanges}
        disabled={loading}
      />
      <Button
        title={loading ? 'Deleting...' : 'Delete Split'}
        onPress={handleDeleteSplit}
        disabled={loading}
        color="red"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 8,
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    paddingHorizontal: 8,
    marginRight: 8,
  },
  error: {
    color: 'red',
    marginBottom: 12,
    textAlign: 'center',
  },
});

export default EditPersonalSplitScreen;