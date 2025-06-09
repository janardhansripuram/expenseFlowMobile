import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

// Define the data structure for a budget record
interface Budget {
  id?: string; // Optional ID for fetched budgets
  userId: string;
  category: string;
  budgetAmount: number;
  currency: string;
  monthYear: string; // Format: 'YYYY-MM'
}

const budgetsCollection = firestore().collection('budgets');

// Function to add a new budget
export const addBudget = async (budget: Omit<Budget, 'id'>): Promise<string> => {
  try {
    const docRef = await budgetsCollection.add(budget);
    return docRef.id;
  } catch (error) {
    console.error("Error adding budget: ", error);
    throw error;
  }
};

// Function to fetch budgets for the logged-in user
export const fetchBudgets = async (): Promise<Budget[]> => {
  try {
    const user = auth().currentUser;
    if (!user) {
      throw new Error("User not logged in");
    }
    const snapshot = await budgetsCollection.where('userId', '==', user.uid).get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Budget[];
  } catch (error) {
    console.error("Error fetching budgets: ", error);
    throw error;
  }
};

// Function to update an existing budget
export const updateBudget = async (id: string, updatedBudget: Partial<Omit<Budget, 'id'>>): Promise<void> => {
  try {
    await budgetsCollection.doc(id).update(updatedBudget);
  } catch (error) {
    console.error("Error updating budget: ", error);
    throw error;
  }
};

// Function to delete a budget
export const deleteBudget = async (id: string): Promise<void> => {
  try {
    await budgetsCollection.doc(id).delete();
  } catch (error) {
    console.error("Error deleting budget: ", error);
    throw error;
  }
};

export type { Budget };

