import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, Button, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { addPersonalSplit, SplitParticipant, PersonalSplit } from '../services/splitService';
import { Expense } from '../services/expenseService'; // Assuming Expense type is available

type SplitMethod = 'equally' | 'specific' | 'percentage';

interface ParticipantInput {
  userId: string;
  name: string; // Assuming participant name is available
  amountOwed: string;
  percentage: string;
}

const SplitMethodScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { expense, participants: selectedParticipants } = route.params as { expense: Expense, participants: { userId: string; name: string }[] };

  const [selectedMethod, setSelectedMethod] = useState<SplitMethod>('equally');
  const [participantInputs, setParticipantInputs] = useState<ParticipantInput[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(expense.amount); // Assuming expense has an amount

  useEffect(() => {
    // Initialize participant inputs based on selected participants
    const initialInputs = selectedParticipants.map(p => ({
      userId: p.userId,
      name: p.name,
      amountOwed: '',
      percentage: '',
    }));
    setParticipantInputs(initialInputs);
  }, [selectedParticipants]);

  const handleAmountChange = (amount: string, index: number) => {
    const newInputs = [...participantInputs];
    newInputs[index].amountOwed = amount;
    setParticipantInputs(newInputs);
  };

  const handlePercentageChange = (percentage: string, index: number) => {
    const newInputs = [...participantInputs];
    newInputs[index].percentage = percentage;
    setParticipantInputs(newInputs);
  };

  const calculateSplit = () => {
    const splitDetails: SplitParticipant[] = [];
    let isValid = true;

    if (selectedMethod === 'equally') {
      const amountPerPerson = totalAmount / (selectedParticipants.length + 1); // +1 for the current user
      selectedParticipants.forEach(p => {
        splitDetails.push({ userId: p.userId, amountOwed: amountPerPerson, isSettled: false });
      });
      // Add current user's share if they are involved in owing
      // This logic might need refinement based on who paid the expense initially
      // For simplicity, assuming the expense initiator paid and others owe them
      splitDetails.push({ userId: expense.userId, amountOwed: amountPerPerson, isSettled: false });

    } else if (selectedMethod === 'specific') {
      let totalEnteredAmount = 0;
      participantInputs.forEach(input => {
        const amount = parseFloat(input.amountOwed || '0');
        if (isNaN(amount)) {
          isValid = false;
          Alert.alert('Invalid Input', 'Please enter valid numbers for specific amounts.');
          return;
        }
        splitDetails.push({ userId: input.userId, amountOwed: amount, isSettled: false });
        totalEnteredAmount += amount;
      });
      // Add current user's share (potentially the difference)
      // This logic needs careful consideration of who owes whom
      // For simplicity, assuming the expense initiator paid and others owe them,
      // the initiator might be owed the total amount minus what others owe.
       const initiatorOwed = totalAmount - totalEnteredAmount;
       splitDetails.push({ userId: expense.userId, amountOwed: initiatorOwed, isSettled: false });


      if (isValid && totalEnteredAmount > totalAmount + 0.01) { // Allow for minor floating point errors
         isValid = false;
         Alert.alert('Amount Mismatch', 'Total specific amounts exceed the expense amount.');
       }


    } else if (selectedMethod === 'percentage') {
      let totalPercentage = 0;
      participantInputs.forEach(input => {
        const percentage = parseFloat(input.percentage || '0');
        if (isNaN(percentage)) {
          isValid = false;
          Alert.alert('Invalid Input', 'Please enter valid percentages.');
          return;
        }
        splitDetails.push({ userId: input.userId, amountOwed: (percentage / 100) * totalAmount, isSettled: false });
        totalPercentage += percentage;
      });
       // Add current user's percentage
       // This logic needs careful consideration of who owes whom
        const remainingPercentage = 100 - totalPercentage;
        splitDetails.push({ userId: expense.userId, amountOwed: (remainingPercentage / 100) * totalAmount, isSettled: false });

       if (isValid && totalPercentage > 100) {
         isValid = false;
         Alert.alert('Percentage Mismatch', 'Total percentage exceeds 100%.');
       }
    }

    if (!isValid) {
      return null; // Indicate calculation failed due to invalid input
    }

    return splitDetails;
  };

  const handleCreateSplit = async () => {
    const splitDetails = calculateSplit();

    if (splitDetails) {
      const newPersonalSplit: PersonalSplit = {
        expenseId: expense.id, // Assuming expense object has an id
        initiatorId: expense.userId, // Assuming the expense creator is the initiator
        participants: splitDetails,
        createdAt: new Date(), // Add a timestamp
      };

      try {
        await addPersonalSplit(newPersonalSplit);
        Alert.alert('Success', 'Expense split created successfully!');
        navigation.goBack(); // Or navigate to PersonalSplitHistoryScreen
      } catch (error: any) {
        Alert.alert('Error', 'Failed to create expense split: ' + error.message);
        console.error('Error creating split:', error);
      }
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Split: {expense.description} ({expense.amount} {expense.currency})</Text>

      <View style={styles.methodContainer}>
        <TouchableOpacity
          style={[styles.methodButton, selectedMethod === 'equally' && styles.selectedMethod]}
          onPress={() => setSelectedMethod('equally')}
        >
          <Text style={[styles.methodButtonText, selectedMethod === 'equally' && styles.selectedMethodText]}>Equally</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.methodButton, selectedMethod === 'specific' && styles.selectedMethod]}
          onPress={() => setSelectedMethod('specific')}
        >
          <Text style={[styles.methodButtonText, selectedMethod === 'specific' && styles.selectedMethodText]}>By Specific Amounts</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.methodButton, selectedMethod === 'percentage' && styles.selectedMethod]}
          onPress={() => setSelectedMethod('percentage')}
        >
          <Text style={[styles.methodButtonText, selectedMethod === 'percentage' && styles.selectedMethodText]}>By Percentage</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Participants ({selectedParticipants.length + 1} total)</Text> {/* +1 for the current user */}

      {selectedMethod === 'equally' && (
        <View>
          <Text style={styles.splitAmount}>Amount per person: {(totalAmount / (selectedParticipants.length + 1)).toFixed(2)}</Text>
        </View>
      )}

      {(selectedMethod === 'specific' || selectedMethod === 'percentage') && (
        <>
          {selectedParticipants.map((participant, index) => (
            <View key={participant.userId} style={styles.participantInputRow}>
              <Text style={styles.participantName}>{participant.name}</Text>
              {selectedMethod === 'specific' && (
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="Amount"
                  value={participantInputs[index]?.amountOwed}
                  onChangeText={(text) => handleAmountChange(text, index)}
                />
              )}
              {selectedMethod === 'percentage' && (
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="Percentage"
                  value={participantInputs[index]?.percentage}
                  onChangeText={(text) => handlePercentageChange(text, index)}
                />
              )}
            </View>
          ))}
           {/* Input for the current user (expense initiator) */}
            <View style={styles.participantInputRow}>
                <Text style={styles.participantName}>You ({expense.userId})</Text>
                 {selectedMethod === 'specific' && (
                   <TextInput
                     style={styles.input}
                     keyboardType="numeric"
                     placeholder="Your Amount"
                     // Logic to display/input current user's amount if needed
                   />
                 )}
                 {selectedMethod === 'percentage' && (
                   <TextInput
                     style={styles.input}
                     keyboardType="numeric"
                     placeholder="Your Percentage"
                     // Logic to display/input current user's percentage if needed
                   />
                 )}
            </View>
        </>
      )}

      <Button title="Create Split" onPress={handleCreateSplit} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f4f4f4', // Light grey background
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  methodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  methodButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    backgroundColor: '#ddd', // Grey button
  },
  selectedMethod: {
    backgroundColor: '#ff9800', // Orange button
  },
  methodButtonText: {
    color: '#333', // Dark grey text
  },
  selectedMethodText: {
    color: '#fff', // White text
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  participantInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  participantName: {
    flex: 1,
    fontSize: 16,
  },
  input: {
    width: 100,
    height: 40,
    borderColor: '#ccc', // Light grey border
    borderWidth: 1,
    paddingHorizontal: 8,
    borderRadius: 5,
  },
  splitAmount: {
    fontSize: 16,
    marginBottom: 10,
  }
});

export default SplitMethodScreen;