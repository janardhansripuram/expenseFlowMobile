import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { fetchIncome } from '../services/incomeService'; // Assuming you have a fetchIncome function
import { auth } from '../config/firebaseConfig';
import { IncomeRecord } from '../services/incomeService'; // Assuming you have an IncomeRecord type
import { useNavigation, StackNavigationProp } from '@react-navigation/native';

const IncomeListScreen: React.FC = () => {
  const [income, setIncome] = useState<IncomeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const navigation = useNavigation<StackNavigationProp<any>>();
    const loadIncome = async () => {
      setLoading(true);
      setError(null);
      try {
        const userId = auth.currentUser?.uid;
        if (userId) {
          const incomeList = await fetchIncome(userId);
          setIncome(incomeList);
        } else { 
          setError('User not authenticated.');
        .catch((err: any) => {
          setError(err.message);
          console.error('Error fetching income:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    };

    loadIncome();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading Income...</Text>
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

  if (income.length === 0) {
    return (
      <View style={styles.centered}>
        <Text>No income records found.</Text>
      </View>
    );
  }

  const navigation = useNavigation<StackNavigationProp<any>>();

  const handleIncomePress = (item: IncomeRecord) => {
    navigation.navigate('EditIncome', { income: item });
  };

  const renderItem = ({ item }: { item: IncomeRecord }) => (
    <TouchableOpacity style={styles.incomeItem} onPress={() => handleIncomePress(item)}>
      <Text style={styles.sourceText}>{item.source}</Text>
      <Text style={styles.amountText}>{item.amount} {item.currency}</Text>
      {item.date && <Text style={styles.dateText}>{new Date(item.date.seconds * 1000).toLocaleDateString()}</Text>}
      {item.notes && <Text style={styles.notesText}>{item.notes}</Text>}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Income Records</Text>
      <FlatList
        data={income}
        renderItem={renderItem}
        keyExtractor={(item) => item.id} // Assuming income records have an 'id' field
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f4f4f4', // Light background
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  incomeItem: {
    backgroundColor: '#fff', // White background for items
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
    elevation: 2, // For Android shadow
  },
  sourceText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  amountText: {
    fontSize: 16,
    color: '#28a745', // Green for income
    marginTop: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#777',
    marginTop: 4,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
});

export default IncomeListScreen;