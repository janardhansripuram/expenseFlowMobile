import { firestore } from '../firebaseConfig';
import { collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { GroupActivityLogEntry } from './groupService'; // Assuming GroupActivityLogEntry is defined in groupServiceimport { expensesCollection } from './expenseService';
interface SplitParticipant {
  userId: string;
  amountOwed: number;
  isSettled: boolean;
}

interface PersonalSplit {
  id?: string; // Optional ID for fetched documents
  expenseId: string;
  initiatorId: string;
  participants: SplitParticipant[];
  groupId: string | null; // Added groupId field
  createdAt: Date;
}

const groupActivityLogsCollection = collection(firestore, 'groupActivityLogs');
const personalSplitsCollection = collection(firestore, 'personalSplits');

export const addPersonalSplit = async (splitData: Omit<PersonalSplit, 'id' | 'createdAt'>) => {
  try {
    const newSplit = {
      // Ensure participants array is structured correctly
      participants: splitData.participants.map(p => ({
        userId: p.userId,
        amountOwed: p.amountOwed,
        isSettled: p.isSettled || false, // Default isSettled to false if not provided
      })),
      ...splitData,
      createdAt: new Date(),
    };

    // Add group activity log entry if associated with a group
    if (newSplit.groupId) {
      const activity: Omit<GroupActivityLogEntry, 'id'> = {
        groupId: newSplit.groupId,
        activityType: 'split_created',
        userId: newSplit.initiatorId, // Assuming the initiator is the user performing the action
        timestamp: new Date(),
        details: {
          expenseId: newSplit.expenseId,
          participants: newSplit.participants.map(p => p.userId), // Log participant IDs
        },
      };
      await addDoc(groupActivityLogsCollection, activity);
    }
    const docRef = await addDoc(personalSplitsCollection, newSplit);
    return docRef.id;
  } catch (error) {
    console.error("Error adding personal split: ", error);
    throw error;
  }
};

export const fetchPersonalSplits = async (userId: string) => {
  try {
    const q = query(personalSplitsCollection, where("initiatorId", "==", userId));
    const querySnapshot = await getDocs(q);
    const splits: PersonalSplit[] = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Omit<PersonalSplit, 'id'>
    }));
    return splits;
  } catch (error) {
    console.error("Error fetching personal splits: ", error);
    throw error;
  }
};

export const updatePersonalSplit = async (splitId: string, updatedData: Partial<PersonalSplit>): Promise<void> => {
  const splitDocRef = doc(firestore, 'personalSplits', splitId);
  await updateDoc(splitDocRef, updatedData);
};

export const updateParticipantSettlementStatus = async (splitId: string, participantUserId: string, isSettled: boolean): Promise<void> => {
  try {
    const splitDocRef = doc(firestore, 'personalSplits', splitId);
    // Fetch the current split to update a specific participant
    const splitDoc = await getDoc(splitDocRef);
    if (splitDoc.exists()) {
      const splitData = splitDoc.data() as PersonalSplit;
      const updatedParticipants = splitData.participants.map(participant => {
        if (participant.userId === participantUserId) {
          return { ...participant, isSettled: isSettled };
        }
        return participant;
      });
      await updateDoc(splitDocRef, { participants: updatedParticipants });
    } else {
      // Add group activity log entry if associated with a group
      if (splitDoc.exists() && splitData.groupId) {
        const participant = splitData.participants.find(p => p.userId === participantUserId);
        if (participant) {
           const activity: Omit<GroupActivityLogEntry, 'id'> = {
            groupId: splitData.groupId,
            activityType: 'settlement',
            userId: splitData.initiatorId, // Assuming initiator marks as settled, might need adjustment
            timestamp: new Date(),
            details: {
              participantId: participantUserId,
              isSettled: isSettled,
            },
          };
          await addDoc(groupActivityLogsCollection, activity);
        }
      }
      console.error("Split document not found with ID: ", splitId);
    }
  } catch (error) {
    console.error("Error updating participant settlement status: ", error);
    throw error;
  }
};

export const deletePersonalSplit = async (splitId: string) => {
  const splitDocRef = doc(firestore, 'personalSplits', splitId);
  await deleteDoc(splitDocRef);
};

export const fetchPersonalSplitsForUser = async (userId: string) => {
  try {
    // Query for splits where the user is the initiator
    const initiatorQuery = query(personalSplitsCollection, where("initiatorId", "==", userId));
    const initiatorSnapshot = await getDocs(initiatorQuery);

    // Query for splits where the user is a participant (this requires a different query approach as Firestore can't directly query array elements efficiently for 'where' clauses without creating multiple queries or a denormalized field)
    // For simplicity and typical use cases, let's assume we might fetch all splits and filter locally for now, or use a denormalized field if performance is critical.
    // For this example, let's fetch all and filter locally. A more scalable solution would be needed for large numbers of splits.
    const allSplitsSnapshot = await getDocs(personalSplitsCollection);
    const splits: PersonalSplit[] = allSplitsSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() as Omit<PersonalSplit, 'id'> }))
      .filter(split => split.initiatorId === userId || split.participants.some(p => p.userId === userId));

    return splits;
  } catch (error) {
    console.error("Error fetching personal splits for user: ", error);
    throw error;
  }
};

export const fetchExpensesByGroupId = async (groupId: string) => {
  try {
    const q = query(expensesCollection, where("groupId", "==", groupId));
    const querySnapshot = await getDocs(q);
    const expenses: Expense[] = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Omit<Expense, 'id'>
    }));
    return expenses;
  } catch (error) {
    console.error("Error fetching expenses by group ID: ", error);
    throw error;
  }
};
