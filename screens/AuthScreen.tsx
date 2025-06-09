import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { auth } from '../config/firebaseConfig'; // Import auth from your firebase config
import Toast from 'react-native-toast-message'; // Import Toast
import { useTheme } from '../../contexts/themeContext'; // Import useTheme
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, FirebaseError } from 'firebase/auth';

const AuthScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true); // Toggle between login and sign up
  const [error, setError] = useState('');
  const { theme } = useTheme(); // Use the theme context

  const handleAuthentication = async () => {
    try {
      setError(''); // Clear previous errors
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        console.log('User logged in successfully!');
 Toast.show({
 type: 'success',
 text1: 'Login Successful',
 text2: 'Welcome back to ExpenseFlow!',
 });
        // TODO: Implement navigation to the main app screen
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        console.log('User signed up successfully!');
 Toast.show({
 type: 'success',
 text1: 'Sign Up Successful',
 text2: 'Welcome to ExpenseFlow!',
 });
        // TODO: Implement navigation to the main app screen
      }
    } catch (err: any) {
      if (err instanceof FirebaseError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
 Toast.show({
 type: 'error',
 text1: 'Authentication Error',
 text2: err.message || 'An unexpected error occurred. Please try again.',
 });
      console.error('Authentication error:', err);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.authContainer, { backgroundColor: theme.surface }]}>
      <Text style={[styles.title, { color: theme.text }]}>{isLogin ? 'Login' : 'Sign Up'}</Text>
      <TextInput
        style={[styles.input, {
 borderColor: theme.border,
 color: theme.text,
 backgroundColor: theme.background
 }]}
        placeholder="Email"
        placeholderTextColor={theme.textMuted}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.background }]}
        placeholder="Password"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]}
        onPress={handleAuthentication}
      >
        <Text style={styles.buttonText}>{isLogin ? 'Login' : 'Sign Up'}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.switchButton}
        onPress={() => {
 setError(''); // Clear error when switching form
 setIsLogin(!isLogin);
        }}      >
        <Text style={[styles.switchButtonText, { color: theme.primary }]}>{isLogin ? 'New here? Create an account' : 'Already have an account? Login'}</Text>
      </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
 flex: 1,
 alignItems: 'center',
 justifyContent: 'center',
  },
  authContainer: {
 width: '90%',
 borderRadius: 10,
    padding: 16,
 alignItems: 'center',
 // Shadow properties - these might need adjustment based on theme or platform
 shadowColor: '#000', 
    shadowOffset: {
      width: 0,
      height: 2,
 },
 shadowOpacity: 0.25, 
 shadowRadius: 3.84, 
 elevation: 5, 
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
 marginBottom: 20,
    textAlign: 'center',
  },
  input: {
 height: 45,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  error: {
 color: 'red', // Error color can remain constant
    marginBottom: 10,
    textAlign: 'center',
    fontSize: 14,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
 color: '#fff', // Button text color can remain constant for now, assuming white text on colored button
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchButton: {
    marginTop: 15,
  },
  switchButtonText: {
  },
});

export default AuthScreen;