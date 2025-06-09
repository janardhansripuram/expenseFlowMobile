import { firestore } from '../firebaseConfig';
import { collection, addDoc, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth } from '../firebaseConfig';

interface Reminder {
  id?: string;
  userId: string;
  title: string;
  notes: string;
  dueDate: Date;
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  status: 'upcoming' | 'due_today' | 'overdue' | 'completed' | 'pending';
}

const remindersCollection = collection(firestore, 'reminders');

const addReminder = async (reminder: Omit<Reminder, 'id' | 'userId' | 'status'>): Promise<string> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated.');
    }

    const newReminder: Omit<Reminder, 'id'> = {
      ...reminder,
      userId: currentUser.uid,
      status: 'upcoming', // Initial status
    };

    const docRef = await addDoc(remindersCollection, newReminder);
    return docRef.id;
  } catch (error) {
    console.error('Error adding reminder:', error);
    throw error;
  }
};

const fetchReminders = async (userId: string): Promise<Reminder[]> => {
  try {
    const q = query(remindersCollection, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const reminders: Reminder[] = [];
    querySnapshot.forEach((doc) => {
      reminders.push({ id: doc.id, ...doc.data() } as Reminder);
    });
    return reminders;
  } catch (error) {
    console.error('Error fetching reminders:', error);
    throw error;
  }
};

const updateReminder = async (reminderId: string, updatedReminder: Partial<Omit<Reminder, 'id' | 'userId'>>): Promise<void> => {
  try {
    const reminderRef = doc(firestore, 'reminders', reminderId);
    await updateDoc(reminderRef, updatedReminder);
  } catch (error) {
    console.error('Error updating reminder:', error);
    throw error;
  }
};

const deleteReminder = async (reminderId: string): Promise<void> => {
  try {
    const reminderRef = doc(firestore, 'reminders', reminderId);
    await deleteDoc(reminderRef);
  } catch (error) {
    console.error('Error deleting reminder:', error);
    throw error;
  }
};

const updateReminderStatus = async (reminderId: string, status: 'upcoming' | 'due_today' | 'overdue' | 'completed' | 'pending'): Promise<void> => {
  try {
    const reminderRef = doc(firestore, 'reminders', reminderId);
    await updateDoc(reminderRef, { status });
  } catch (error) {
    console.error('Error updating reminder status:', error);
    throw error;
  }
};
