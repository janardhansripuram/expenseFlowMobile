import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { sendFriendRequest } from '../services/friendService';
import { auth } from '../config/firebaseConfig'; // Assuming auth is exported from your firebase config

const SendFriendRequestScreen: React.FC = () => {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const currentUser = auth.currentUser;

  const handleSendRequest = async () => {
    if (!currentUser) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }
    if (!recipientEmail) {
      Alert.alert('Error', 'Please enter recipient email.');
      return;
    }

    setLoading(true);
    try {
      // In a real app, you would likely need to find the recipient's userId by email
      // This might involve a Cloud Function to prevent exposing other users' data.
      // For this basic implementation, we'll just save the request with the email.
      // The recipient's app will need to fetch requests where receiverEmail matches their email.

      await sendFriendRequest(currentUser.uid, recipientEmail);

      Alert.alert('Success', 'Friend request sent!');
      setRecipientEmail('');
      navigation.goBack();
    } catch (error: any) {
      console.error('Error sending friend request:', error);
      Alert.alert('Error', `Failed to send friend request: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Send Friend Request</Text>
      <TextInput
        style={styles.input}
        placeholder="Recipient Email"
        value={recipientEmail}
        onChangeText={setRecipientEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Button
        title={loading ? 'Sending...' : 'Send Request'}
        onPress={handleSendRequest}
        disabled={loading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
});

export default SendFriendRequestScreen;