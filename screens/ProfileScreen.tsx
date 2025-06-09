import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { auth, db } from '../config/firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { User, EmailAuthProvider, reauthenticateWithCredential, deleteUser } from 'firebase/auth';
import { useTheme } from '../../contexts/themeContext';
import { useNavigation, StackNavigationProp } from '@react-navigation/native';
const ProfileScreen: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [defaultCurrency, setDefaultCurrency] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const navigation = useNavigation<StackNavigationProp<any>>();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(authenticatedUser => {
      setUser(authenticatedUser);
      if (authenticatedUser) {
        fetchUserProfile(authenticatedUser.uid);
      } else {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const fetchUserProfile = async (uid: string) => {
    try {
      setLoading(true);
      const userDocRef = doc(db, 'users', uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setDisplayName(userData.displayName || '');
        setDefaultCurrency(userData.defaultCurrency || '');
      } else {
        // User profile document doesn't exist, might need to create it on sign up
        console.warn("User profile document not found in Firestore.");
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to fetch user profile.');
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    try {
      setSaving(true);
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        displayName: displayName,
        defaultCurrency: defaultCurrency,
      });
      Alert.alert('Success', 'Profile updated successfully!');
      setSaving(false);
    } catch (error) {
      console.error('Error updating user profile:', error);
      setSaving(false);
      Alert.alert('Error', 'Failed to update profile.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action is irreversible.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const currentPassword = await new Promise((resolve) => {
              Alert.prompt(
                'Verify Account',
                'Please enter your password to confirm account deletion.',
                [
                  { text: 'Cancel', onPress: () => resolve(null), style: 'cancel' },
                  { text: 'Confirm', onPress: (password) => resolve(password) },
                ],
                'secure-text'
              );
            });

            if (!currentPassword || typeof currentPassword !== 'string') return;

            try {
              const credential = EmailAuthProvider.credential(user.email!, currentPassword);
              await reauthenticateWithCredential(user, credential);
              await deleteUser(user);
              Alert.alert('Success', 'Your account has been deleted.');
            } catch (error: any) {
              Alert.alert('Error', `Failed to delete account: ${error.message}`);
            }
          },
        },
      ]
    );
  };
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6347" />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centeredContainer}>
        <Text>Please log in to view your profile.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Display Name:</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Enter your display name"
        />
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Default Currency:</Text>
        <TextInput
          // Consider replacing this with a Picker or Dropdown for currency selection
          style={styles.input}
          value={defaultCurrency}
          onChangeText={setDefaultCurrency}
          placeholder="e.g., USD, EUR"
          autoCapitalize="characters"
        />
      </View>
      <View style={styles.themeSwitcherContainer}>
        <Text style={styles.label}>Theme:</Text>
        <Button
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Theme`}
          onPress={toggleTheme}
        />

      </View>
      

      <Button
        title={saving ? 'Saving...' : 'Save Profile'}
        onPress={handleUpdateProfile}
        disabled={saving}
      />

      <Button
        title="Change Password"
        onPress={() => navigation.navigate('ChangePassword')} // Assuming the route name in navigator is 'ChangePassword'
      />

      <Button
        title="Delete Account"
        onPress={handleDeleteAccount}
        color="red" // Use a red color for destructive action
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f0f0', // Light gray background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  themeSwitcherContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  // Add button styling consistent with the theme if needed
  // Button component styling can be tricky with default Button,
  // often better to use TouchableOpacity for custom styling.
});

export default ProfileScreen;