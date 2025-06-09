import firestore from '@react-native-firebase/firestore';

export interface Group {
  id?: string;
  name: string;
  creatorId: string;
  members: string[]; // Array of user IDs
}

export interface GroupActivityLogEntry {
  groupId: string;
 activityType: 'group_created' | 'group_name_changed' | 'member_added' | 'member_removed' | 'expense_added' | 'split_created' | 'settlement'; // Define specific types
  userId: string; // User who performed the action
  timestamp: Date;
  details?: any; // Optional details (e.g., oldName, newName, memberId)
}

const groupsCollection = firestore().collection('groups');

export const addGroup = async (groupData: Omit<Group, 'id'>): Promise<string> => {
  try {
    const docRef = await groupsCollection.add(groupData);
    // Also add activity log entry for group creation
    try {
 await addGroupActivityLogEntry(docRef.id, 'group_created', groupData.creatorId, { groupName: groupData.name });
    } catch (logError) {
 console.error("Error adding group creation activity log: ", logError);
    }
    return docRef.id;
  } catch (error) {
    console.error("Error adding group: ", error);
    throw error;
  }
};

export const fetchGroups = async (userId: string): Promise<Group[]> => {
  try {
    const snapshot = await groupsCollection.where('members', 'array-contains', userId).get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Omit<Group, 'id'>
    }));
  } catch (error) {
    console.error("Error fetching groups: ", error);
    throw error;
  }
};

export const updateGroup = async (groupId: string, groupData: Partial<Omit<Group, 'id'>>): Promise<void> => {
  try {
    const groupBeforeUpdate = (await groupsCollection.doc(groupId).get()).data() as Group;
    await groupsCollection.doc(groupId).update(groupData);

    // Add activity log entry for group name change
    if (groupData.name && groupBeforeUpdate.name !== groupData.name) {
      // Assuming the user performing the update is the current logged-in user
      // You would need to get the current user's ID here.
    }
  } catch (error) {
    console.error("Error updating group: ", error);
    throw error;
  }
};

export const deleteGroup = async (groupId: string): Promise<void> => {
  try {
    await groupsCollection.doc(groupId).delete();
  } catch (error) {
    console.error("Error deleting group: ", error);
    throw error;
  }
};

export const addMemberToGroup = async (groupId: string, userId: string): Promise<void> => {
  try {
    const groupRef = groupsCollection.doc(groupId);
    await groupRef.update({
      members: firestore.FieldValue.arrayUnion(userId)
    });
    // Add activity log entry for member added
    // You would need to get the current user's ID here (the one adding the member)
    // and potentially the name of the added member.
    // await addGroupActivityLogEntry(groupId, 'member_added', currentUserId, { memberId: userId });
  } catch (error) {
    console.error("Error adding member to group: ", error);
    throw error;
  }
};

export const removeMemberFromGroup = async (groupId: string, userId: string): Promise<void> => {
  try {
    const groupRef = groupsCollection.doc(groupId);
    await groupRef.update({
      members: firestore.FieldValue.arrayRemove(userId)
    });
    // Add activity log entry for member removed
    // You would need to get the current user's ID here (the one removing the member)
    // and potentially the name of the removed member.
    // await addGroupActivityLogEntry(groupId, 'member_removed', currentUserId, { memberId: userId });
  } catch (error) {
    console.error("Error removing member from group: ", error);
    throw error;
  }
};

const groupActivityLogsCollection = firestore().collection('groupActivityLogs');

export const addGroupActivityLogEntry = async (groupId: string, activityType: GroupActivityLogEntry['activityType'], userId: string, details?: any): Promise<void> => {
  try {
    await groupActivityLogsCollection.add({ groupId, activityType, userId, timestamp: new Date(), details });
  } catch (error) {
    console.error("Error adding group activity log entry: ", error);
  }
};

export const fetchGroupActivityLogs = async (groupId: string): Promise<GroupActivityLogEntry[]> => {
  try {
    const snapshot = await groupActivityLogsCollection
      .where('groupId', '==', groupId)
      .orderBy('timestamp', 'desc') // Order by timestamp descending
      .get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Omit<GroupActivityLogEntry, 'id'>
    }));
  } catch (error) {
    console.error("Error fetching group activity logs: ", error);
    throw error;
  }
};
// export const fetchGroupExpenses = async (groupId: string): Promise<Expense[]> => { ... };

// Assuming Expense type is imported or defined elsewhere if needed here.
// import { Expense } from './expenseService'; // Example import
