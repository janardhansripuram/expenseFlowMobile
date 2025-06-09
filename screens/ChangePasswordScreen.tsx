import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert } from 'react-native';
import { getAuth, signInWithEmailAndPassword, updatePassword, User } from 'firebase/auth';
import { app } from '../config/firebaseConfig'; // Assuming you export 'app' from your config

const auth = getAuth(app);

const ChangePasswordScreen: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    const user = auth.currentUser;

    if (user) {
      setLoading(true);
      setError('');
      try {
        // Re-authenticate the user with their current password
        const credential = await signInWithEmailAndPassword(auth, user.email!, currentPassword);

        // Update the password
        await updatePassword(credential.user, newPassword);

        Alert.alert('Success', 'Your password has been changed successfully.');
        setCurrentPassword('');
        setNewPassword('');
      } catch (err: any) {
        setError(err.message);
        console.error('Password change error:', err);
      } finally {
        setLoading(false);
      }
    } else {
      setError('No user is currently logged in.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Change Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Current Password"
        value={currentPassword}
        onChangeText={setCurrentPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="New Password"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button
        title={loading ? 'Changing...' : 'Change Password'}
        onPress={handleChangePassword}
        disabled={loading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f8f8f8', // Light background
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  error: {
    color: '#e74c3c', // Red error color
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 14,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#ff7f50', // Your theme's orange
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default ChangePasswordScreen;