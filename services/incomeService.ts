import { firebase } from '../firebaseConfig';
import { Income } from '../types'; // Assuming a types file for shared types

const firestore = firebase.firestore();

export const addIncome = async (income: Omit<Income, 'id'>) => {
  try {
    const docRef = await firestore.collection('income').add({
      ...income,
      date: firebase.firestore.Timestamp.fromDate(income.date),
 currency: income.currency, // Ensure currency is saved
    });
    console.log('Income added with ID: ', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding income: ', error);
    throw error;
  }
};

export const updateIncome = async (id: string, income: Omit<Income, 'id'>) => {
  try {
    await firestore.collection('income').doc(id).update({
      ...income,
      date: firebase.firestore.Timestamp.fromDate(income.date),
    });
    console.log('Income updated with ID: ', id);
  } catch (error) {
    console.error('Error updating income: ', error);
  }
};

export const deleteIncome = async (id: string) => {
  try {
    await firestore.collection('income').doc(id).delete();
    console.log('Income deleted with ID: ', id);
  } catch (error) {
    console.error('Error deleting income: ', error);
    throw error;
  }
};

// Define Income type - ideally this would be in a shared types file
export interface Income {
  id: string;
  userId: string;
  source: string;
  amount: number;
  currency: string;
  date: Date;
  notes?: string;
}
