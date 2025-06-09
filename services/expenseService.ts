import { collection, addDoc, query, where, orderBy, getDocs, QueryConstraint, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { z } from 'zod';
import { auth } from '../config/firebaseConfig'; // Import auth to get current user id
import { GroupActivityLogEntry } from './groupService'; // Import GroupActivityLogEntry

interface Expense {
  userId: string;
  description: string;
  amount: number; // Ensure amount is a number
  date: string; // or Date, depending on how you want to store/handle dates
  currency: string; // Added for multi-currency support
 groupId?: string | null; // Added for linking expenses to groups
  category: string; // Assuming category is a string
  isRecurring?: boolean; // Added for recurring expenses
  recurrenceInterval?: 'daily' | 'weekly' | 'monthly' | 'yearly'; // Added for recurring expenses
  recurrenceEndDate?: string | null; // Changed to string | null for consistency with date storage
}

const ExpenseSchema = z.object({
 userId: z.string().optional(), // User ID is set internally
 description: z.string().min(1, "Description is required"),
 amount: z.number().positive("Amount must be a positive number"),
 date: z.string().min(1, "Date is required"), // Basic validation for string date
 currency: z.string().min(1, "Currency is required"),
 groupId: z.string().nullable().optional(),
 category: z.string().min(1, "Category is required"),
});

interface ExpenseFilter {
  startDate?: string; // Assuming dates are stored as strings in 'YYYY-MM-DD' format
  endDate?: string;
  category?: string;
  minAmount?: number;
  maxAmount?: number;
  currency?: string; // Assuming currency is a string field in expense documents
  group?: string; // Assuming group is a string field in expense documents
  search?: string; // For searching description or notes
}

interface ExpenseSort {
  field: 'date' | 'amount'; // Define possible sortable fields
  order: 'asc' | 'desc';
}





const addExpense = async (expenseData: Omit<Expense, 'userId'>) => {
  try {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error('User not authenticated.');
    }

    // Validate the expense data using Zod
    ExpenseSchema.parse(expenseData);

    const expenseWithUserId: Expense = {
      ...expenseData,
      userId: currentUser.uid,
      // Ensure optional fields are explicitly set or default to null/false if not provided
      isRecurring: expenseData.isRecurring ?? false,
      recurrenceEndDate: expenseData.recurrenceEndDate ?? null,
      groupId: expenseData.groupId ?? null, // Ensure groupId is saved, default to null if not provided
    };


    const docRef = await addDoc(collection(db, 'expenses'), expenseWithUserId);
    console.log('Expense added with ID: ', docRef.id);

    // Add activity log entry if the expense is associated with a group
    if (expenseWithUserId.groupId) {
 try {
        const activityLogEntry: GroupActivityLogEntry = {
 groupId: expenseWithUserId.groupId,
 activityType: 'expense_added',
 userId: currentUser.uid,
 timestamp: new Date(),
 details: {
 description: expenseWithUserId.description,
 amount: expenseWithUserId.amount,
 currency: expenseWithUserId.currency,
 },
        };
 await addDoc(collection(db, 'groupActivityLogs'), activityLogEntry);
 } catch (logError) {
 console.error('Error adding group activity log for expense: ', logError);
 // Continue even if logging fails, main expense save is more critical
      }
    }
    return docRef.id; // Return the ID of the newly added document
  } catch (e) {
    console.error('Error adding expense: ', e);
    throw e; // Re-throw the error for handling in the UI
  }
};

const getExpenses = async (filters: ExpenseFilter = {}, sortBy: ExpenseSort = { field: 'date', order: 'desc' }): Promise<Expense[]> => {
  try {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error('User not authenticated.');
    }

    const expenseCollectionRef = collection(db, 'expenses');
    const qConstraints: QueryConstraint[] = [
      where('userId', '==', currentUser.uid),
    ];

    // Add filter conditions based on the provided filters
    if (filters.startDate) {
      qConstraints.push(where('date', '>=', filters.startDate));
    }
    if (filters.endDate) {
      qConstraints.push(where('date', '<=', filters.endDate));
    }
    if (filters.category) {
      qConstraints.push(where('category', '==', filters.category));
    }
    if (filters.minAmount !== undefined) {
      qConstraints.push(where('amount', '>=', filters.minAmount));
    }
    if (filters.maxAmount !== undefined) {
      qConstraints.push(where('amount', '<=', filters.maxAmount));
    }
    if (filters.currency) {
      qConstraints.push(where('currency', '==', filters.currency));
    }
    // Note: Filtering by group and search might require different strategies (e.g., separate queries or client-side filtering for search)

    // Add sorting to the query
    qConstraints.push(orderBy(sortBy.field, sortBy.order));


    const q = query(expenseCollectionRef, ...qConstraints);

    const querySnapshot = await getDocs(q);
    const expenses = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
    return expenses;
  } catch (e) {
    console.error('Error fetching expenses: ', e);
    throw e;
  }
};

const getExpensesByGroupId = async (groupId: string): Promise<Expense[]> => {
  try {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error('User not authenticated.');
    }

    const expenseCollectionRef = collection(db, 'expenses');
    const qConstraints: QueryConstraint[] = [
      where('userId', '==', currentUser.uid), // Assuming user can only see expenses they are part of, even in a group
      where('groupId', '==', groupId),
      orderBy('date', 'desc'), // Default sort by date for group expenses
    ];

    const q = query(expenseCollectionRef, ...qConstraints);

    const querySnapshot = await getDocs(q);
    const expenses = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
    return expenses;
  } catch (e) {
    console.error('Error fetching expenses by group ID: ', e);
    throw e;
  }
};
const updateExpense = async (expenseId: string, updatedExpenseData: Partial<Omit<Expense, 'userId'>>) => {
  try {
    // Explicitly set to undefined or null if they are intended to be removed or not present
    // Ensure recurring fields are handled correctly during update
    const updatedDataWithDefaults = {
      ...updatedExpenseData, // Include all provided updated data
      recurrenceEndDate: updatedExpenseData.recurrenceEndDate !== undefined ? updatedExpenseData.recurrenceEndDate : null, // Preserve or set to null
    };

    // Remove undefined values before updating to avoid issues with Firestore
    Object.keys(updatedDataWithDefaults).forEach(key => updatedDataWithDefaults[key] === undefined && delete updatedDataWithDefaults[key]);

    const expenseDocRef = doc(db, 'expenses', expenseId);
    await updateDoc(expenseDocRef, updatedDataWithDefaults);
    console.log('Expense updated with ID: ', expenseId);
  } catch (e) {
    console.error('Error updating expense: ', e);
    throw e;
  }
};




export { addExpense, getExpenses, updateExpense, getExpensesByGroupId };