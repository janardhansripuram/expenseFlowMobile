import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Text, Platform, TouchableOpacity, Switch, Picker, FlatList } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker'; // Keep for OCR feature if needed later
import { useNavigation, useRoute, useToast } from '@react-navigation/native'; // Import useNavigation and useRoute, useToast
import Toast from 'react-native-toast-message'; // Import Toast
import { addExpense, expenseSchema } from '../services/expenseService'; // Import the addExpense function and schema
import { auth } from '../config/firebaseConfig'; // Import auth to get the current user
import { addPersonalSplit, PersonalSplitParticipant } from '../services/splitService'; // Import addPersonalSplit and PersonalSplitParticipant

import { getUserProfile } from '../services/userService'; // Import the getUserProfile function
import { ZodError } from 'zod'; // Import ZodError

// Define types for clarity
const AddExpenseScreen: React.FC = () => {
  const route = useRoute();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({}); // State to manage validation errors
  const [successMessage, setSuccessMessage] = useState('');
  const navigation = useNavigation<any>(); // Get the navigation object
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceInterval, setRecurrenceInterval] = useState('monthly'); // Default to monthly
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | null>(null);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false); // State for recurrence end date picker visibility
  const [currency, setCurrency] = useState('USD'); // Default currency
  const [imageUri, setImageUri] = useState<string | null>(null); // State to hold image URI (Keep for OCR feature if needed later)
  const [groupId, setGroupId] = useState<string | null>(null);
  // Placeholder for user's groups. Replace with actual fetch from Firestore.
  const [userGroups, setUserGroups] = useState<{ id: string; name: string }[]>([
    { id: 'group1', name: 'Travel Buddies' },
    { id: 'group2', name: 'Roommates' },
    { id: 'group3', name: 'Work Team' },
    { id: 'group4', name: 'Family' },
  ]);

  const [splitEqually, setSplitEqually] = useState(false);
  const [splitParticipants, setSplitParticipants] = useState<PersonalSplitParticipant[]>([]);

  // Effect to fetch user profile and set default currency
  React.useEffect(() => {
    const fetchUserProfile = async () => {
      const userId = auth.currentUser?.uid;
      if (userId) {
        const userProfile = await getUserProfile(userId);
        if (userProfile?.defaultCurrency) {
          setCurrency(userProfile.defaultCurrency);
        }
      }
    };
    fetchUserProfile();
  }, []); // Run only once on component mount

  // Get groupId from route params if available
  const { groupId: routeGroupId } = route.params as { groupId?: string };

  const handleAddExpense = async () => {
    setLoading(true);
    setErrors({}); // Clear previous errors
    setError('');
    setSuccessMessage('');

    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        setError('User not authenticated.');
        Toast.show({ type: 'error', text1: 'Error', text2: 'User not authenticated.' });
        return;
      }

      if (!description || !amount || !category) {
        setError('Please fill in all required fields.');
        Toast.show({ type: 'error', text1: 'Missing Information', text2: 'Please fill in description, amount, and category.' });
      }

      const expenseData = {
        userId,
        description,
        amount: parseFloat(amount),
        category,
        currency: currency,
        date: date.toISOString(),
        isRecurring: isRecurring,
        recurrenceInterval: isRecurring ? recurrenceInterval : undefined,
        recurrenceEndDate: isRecurring && recurrenceEndDate ? recurrenceEndDate.toISOString() : undefined,
        groupId: routeGroupId || groupId,
      };

      // Validate data using Zod schema
      const validationResult = expenseSchema.safeParse(expenseData);

      if (!validationResult.success) {
        const fieldErrors: { [key: string]: string } = {};
        validationResult.error.errors.forEach((err: ZodError['errors'][0]) => {
          if (err.path.length > 0) {
            fieldErrors[err.path[0]] = err.message;
          }
        });
        setErrors(fieldErrors);
        Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please check your input.' });
        return; // Stop execution if validation fails
      }

      const addedExpenseRef = await addExpense(expenseData);
      const expenseId = addedExpenseRef.id;

      // If splitting equally among group members, create a split record
      if ((routeGroupId || groupId) && splitEqually && splitParticipants.length > 0) {
        const splitData = {
          expenseId: expenseId,
          groupId: routeGroupId || groupId,
          initiatorId: userId,
          participants: splitParticipants,
          createdAt: new Date().toISOString(),
        };
        await addPersonalSplit(splitData);
      }

      Toast.show({ type: 'success', text1: 'Success', text2: 'Expense added successfully!' });
      navigation.goBack(); // Navigate back to the previous screen (ExpenseListScreen)

    } catch (err: any) {
      // Handle other potential errors during the addExpense process
      const errorMessage = err.message || 'Failed to add expense.';
      Toast.show({ type: 'error', text1: 'Error', text2: errorMessage });
      setGroupId(null); // Clear selected group
      setSplitEqually(false); // Reset split equal option
      setDate(new Date());
      navigation.goBack(); // Navigate back to the previous screen (ExpenseListScreen)

      Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Failed to add expense.' });
      console.error('Error adding expense:', err);
    } finally {
      setLoading(false); // Always stop loading
  };

  // Effect to calculate split amounts when splitting equally
  React.useEffect(() => {
    const currentGroupId = routeGroupId || groupId;
    if (splitEqually && parseFloat(amount) > 0 && currentGroupId) {
      // In a real app, fetch actual group members from Firestore using currentGroupId
      // For now, use placeholder data and filter by selected group
      const group = userGroups.find(g => g.id === currentGroupId);
      if (group) {
        // Let's use placeholder user IDs for participants for now
        const placeholderMembers = ['user1', 'user2', 'user3']; // Replace with actual fetching
        const amountPerPerson = parseFloat(amount) / placeholderMembers.length;
        setSplitParticipants(placeholderMembers.map(memberId => ({
          userId: memberId,
          amountOwed: parseFloat(amountPerPerson.toFixed(2)), // Keep track of the owed amount
          isSettled: false,
        })));
    }
    } else {
      // If not splitting equally or amount is not valid, clear split participants
      setSplitParticipants([]);
    }
  }, [groupId, routeGroupId, splitEqually, amount, userGroups]); // Add amount and userGroups to dependencies
  const onChangeDate = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const pickImage = async () => {
  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  const showEndDatepicker = () => {
    setShowEndDatePicker(true);
  };

  const onChangeEndDate = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || recurrenceEndDate;
    setShowEndDatePicker(Platform.OS === 'ios');
    setRecurrenceEndDate(currentDate);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePicture = async () => {
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const processImageWithOCR = async () => {
    if (!imageUri) {
      setError('Please select or take a photo of a receipt first.');
      return;
    }

    try {
      // Commenting out OCR processing as it requires Firebase ML Kit setup not covered
      const result = await ml().textRecognition().processImage(imageUri);
      // Process the OCR result to extract details
      extractExpenseDetailsFromOCR(result.text);
    } catch (error: any) {
      setError(`Error processing image: ${error.message}`);
      console.error('OCR Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractExpenseDetailsFromOCR = (ocrText: string) => {
    // Simple example of extracting data.
    // This will need to be more sophisticated to handle various receipt formats.
    const lines = ocrText.split('\n');
    let extractedAmount = '';
    let extractedDate = '';
    let extractedMerchant = '';

    // Example: Look for lines that might contain an amount (basic pattern)
    const amountMatch = ocrText.match(/(\d+\.\d{2})/);
    if (amountMatch && amountMatch[1]) {
      extractedAmount = amountMatch[1];
    }

    // Example: Look for a date pattern (basic pattern like MM/DD/YYYY or DD/MM/YYYY)
    const dateMatch = ocrText.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
     if (dateMatch && dateMatch[1]) {
       extractedDate = dateMatch[1];
       // Attempt to parse the date
       const parsedDate = new Date(extractedDate);
       if (!isNaN(parsedDate.getTime())) {
         setDate(parsedDate);
       }
     }

    // For merchant and category, this is highly dependent on receipt format
    // and might require more advanced techniques or AI. For this example,
    // we'll just set the description to the first few lines as a placeholder.
     if (lines.length > 0) {
       extractedMerchant = lines.slice(0, Math.min(lines.length, 2)).join(' '); // Take first two lines as potential merchant
     }

    // Update state with extracted data
    if (extractedAmount) setAmount(extractedAmount);
    if (extractedMerchant) setDescription(extractedMerchant);
    // Category is hard to extract reliably without advanced AI

    // You would likely want to give the user an opportunity to review and edit
    // the extracted data before saving the expense.
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
      <Text style={styles.title}>Add New Expense</Text>
 <TextInput
        style={[styles.input, styles.card]}
        placeholder="Description"
 placeholderTextColor="#A0A0A0"
        value={description}
        onChangeText={setDescription} />
      {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}

      <TextInput
        style={[styles.input, styles.card]}
        placeholder="Amount"
 placeholderTextColor="#A0A0A0"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric" />
      {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}

      <TextInput
        style={[styles.input, styles.card]}
        placeholder="Category"
 placeholderTextColor="#A0A0A0"
        value={category}
        onChangeText={setCategory} />
      {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}

      {/* Date Picker */}
      <TouchableOpacity onPress={showDatepicker} style={[styles.dateButton, styles.card]}>
        <Text style={styles.dateButtonText}>{`Select Date: ${date.toLocaleDateString()}`}</Text>
      </TouchableOpacity>
      {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
      {showDatePicker && (
        <DateTimePicker testID="datePicker" value={date} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={onChangeDate} style={styles.datePicker} />
      )}

      {/* Group Selector */}
      {(userGroups.length > 0 && !routeGroupId) && ( // Only show if user has groups and not navigated from a group detail
        <View style={[styles.input, styles.card, styles.groupPickerContainer]}>
          <Text style={styles.groupLabel}>Group:</Text>
          <Picker
            selectedValue={groupId}
            style={styles.groupPicker}
            onValueChange={(itemValue) => setGroupId(itemValue === 'none' ? null : itemValue)}
          >
            <Picker.Item label="None" value="none" />
            {userGroups.map(group => (
              <Picker.Item key={group.id} label={group.name} value={group.id} />
            ))}
          </Picker>
        </View>
      )}

      {routeGroupId && <Text style={[styles.input, styles.card]}>Adding to Group: {userGroups.find(g => g.id === routeGroupId)?.name || routeGroupId}</Text>}
      {/* End Group Selector */}

      {/* Split Equally Option for Group Expenses */}
      {(routeGroupId || groupId) && ( // Only show if a group is selected
        <View style={styles.splitEquallyContainer}>
          <Text style={styles.splitEquallyLabel}>Split Equally Among Group Members:</Text>
          <Switch
            value={splitEqually}
            onValueChange={setSplitEqually}
          />
        </View>
      )}
      {/* End Split Equally Option */}

      {/* Display Calculated Split Amounts (if splitting equally) */}
      {splitEqually && splitParticipants.length > 0 && (
        <View style={styles.splitDetailsContainer}>
          <Text style={styles.splitDetailsTitle}>Split Details:</Text>
          {splitParticipants.map((participant, index) => (
            <View key={index} style={styles.splitParticipantRow}>
              {/* In a real app, display participant's name instead of ID */}
              <Text>{`User ${participant.userId}:`}</Text>
              <Text>{`${currency} ${participant.amountOwed.toFixed(2)}`}</Text>
            </View>
          ))}
        </View>
      )}
      {errors.splitParticipants && <Text style={styles.errorText}>{errors.splitParticipants}</Text>} {/* Display error if any */}

      <View style={[styles.input, styles.card, styles.currencyPickerContainer]}>
        <Text style={styles.currencyLabel}>Currency:</Text>
        <Picker
          selectedValue={currency}
          style={styles.currencyPicker}
          onValueChange={(itemValue, itemIndex) => setCurrency(itemValue)}
        >
          <Picker.Item label="USD - United States Dollar" value="USD" />
          <Picker.Item label="EUR - Euro" value="EUR" />
          <Picker.Item label="GBP - British Pound" value="GBP" />
          {/* Add more currency options as needed */}
        </Picker>
      </View>


      )}

      <View style={styles.recurringContainer}>
        <Text style={styles.recurringLabel}>Recurring Expense:</Text>
        <Switch
          value={isRecurring}
          onValueChange={setIsRecurring}
        />
      </View>

      {isRecurring && (
        <>
          <View style={styles.input}>
            <Text>Recurrence Interval:</Text>
            {/* Simple text for now, replace with dropdown */}
            <TextInput
              value={recurrenceInterval}
              onChangeText={setRecurrenceInterval}
            />
          </View>

          <TouchableOpacity onPress={showEndDatepicker} style={[styles.dateButton, styles.card]}><Text style={styles.dateButtonText}>{`Recurrence End Date: ${recurrenceEndDate ? recurrenceEndDate.toLocaleDateString() : 'Never'}`}</Text></TouchableOpacity>
          {showEndDatePicker && (
            <DateTimePicker
              testID="endDatePicker"
              value={recurrenceEndDate || new Date()}
              mode="date"
              onChange={onChangeEndDate}
            />
          )}
        </>
      )}
      {/* End Recurring Options */}

      <TouchableOpacity style={[styles.imageButton, styles.card]} onPress={takePicture}><Text style={styles.imageButtonText}>Take Photo of Receipt</Text></TouchableOpacity>
      <TouchableOpacity style={[styles.imageButton, styles.card]} onPress={pickImage}><Text style={styles.imageButtonText}>Select Receipt from Gallery</Text>
      </TouchableOpacity>

 {imageUri && <Text style={styles.imageStatusText}>Image Selected: {imageUri.substring(imageUri.lastIndexOf('/') + 1)}</Text>}

      <TouchableOpacity
        style={[styles.ocrButton, styles.card]}
        onPress={processImageWithOCR}
        disabled={!imageUri || loading}
      >
        <Text style={styles.ocrButtonText}>{loading ? 'Processing...' : 'Process Receipt with OCR'}</Text>
      </TouchableOpacity>
      {/* End OCR Feature */}

      <TouchableOpacity style={styles.addButton} onPress={handleAddExpense} disabled={loading}><Text style={styles.addButtonText}>{loading ? 'Adding...' : 'Add Expense'}</Text>
 </TouchableOpacity>

 {loading && (
 <View style={styles.loadingContainer}>
 {/* You can add an ActivityIndicator here if you want */}
 <Text style={styles.loadingText}>Adding Expense...</Text>
 </View>
 )}

      {successMessage ? <Text style={styles.success}>{successMessage}</Text> : null}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F7F7F7', // Light grey background
  },
  scrollContainer: {
    flexGrow: 1, // Allow the content to grow and be scrollable
  },
  title: {
    fontSize: 24,
 fontWeight: 'bold',
 color: '#333', // Darker text for title
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    height: 50,
 backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
 color: '#333',
  },
  dateButton: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 15,
  },
  dateButtonText: {
    fontSize: 16,
 color: '#333',
  },
  currencyPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10, // Add some padding on the right for the picker arrow
  },
  currencyLabel: {
    fontSize: 16,
    color: '#333',
    marginRight: 10,
  },
  groupPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
    marginBottom: 15,
  },
  groupLabel: {
    fontSize: 16,
    color: '#333',
    marginRight: 10,
  },
  groupPicker: {
    flex: 1,
  },
  currencyPicker: {
    flex: 1, // Allow the picker to take up available space
  },
  datePicker: {
    marginBottom: 15,
  },
  recurringContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    ...Platform.select({
      ios: styles.card, // Apply shadow for iOS
      android: { elevation: 5 }, // Apply elevation for Android
    }),
  },
  recurringLabel: {
    fontSize: 16,
 color: '#333',
    marginRight: 10,
  },
  addButton: {
    backgroundColor: '#FF6347', // Orange color from the design
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
 fontWeight: 'bold',
  },
  card: {
    borderRadius: 10,
 shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  error: {
    color: 'red',
    marginTop: 10,
    textAlign: 'center',
  },
  success: {
    color: 'green',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 5,
  },
  imageButton: {
 height: 50,
    justifyContent: 'center',
    alignItems: 'center',
 backgroundColor: '#E0E0E0', // Light grey for image buttons
    borderRadius: 10,
    marginBottom: 15,
  },
  imageButtonText: {
    fontSize: 16,
 color: '#333',
  },
  imageStatusText: {
    textAlign: 'center',
    marginBottom: 15,
    color: '#555',
  },
});

export default AddExpenseScreen;