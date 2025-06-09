import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export interface FriendRequest {
  id?: string;
  senderId: string;
  receiverEmail: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: Date;
}

export interface FriendConnection {
  id?: string;
  userId1: string; // Store user IDs in a consistent order (e.g., alphabetical)
  userId2: string;
  connectedAt: Date;
}

const friendRequestsCollection = firestore().collection('friendRequests');
const friendConnectionsCollection = firestore().collection('friendConnections');
const usersCollection = firestore().collection('users'); // Assuming a users collection exists for email lookup

export const sendFriendRequest = async (receiverEmail: string): Promise<void> => {
  const currentUser = auth().currentUser;
  if (!currentUser) {
    throw new Error('User not authenticated.');
  }

  const senderId = currentUser.uid;

  // Optional: Check if a user with this email exists
  const receiverQuery = await usersCollection.where('email', '==', receiverEmail).limit(1).get();
  if (receiverQuery.empty) {
    throw new Error('User with this email not found.');
  }

  // Optional: Check if a request already exists or they are already friends

  const newRequest: FriendRequest = {
    senderId,
    receiverEmail,
    status: 'pending',
    timestamp: new Date(),
  };

  await friendRequestsCollection.add(newRequest);
};

export const fetchFriendRequests = async (userId: string): Promise<FriendRequest[]> => {
  const incomingRequests = await friendRequestsCollection.where('receiverEmail', '==', auth().currentUser?.email).get();
  const outgoingRequests = await friendRequestsCollection.where('senderId', '==', userId).get();

  const requests: FriendRequest[] = [];
  incomingRequests.forEach(doc => requests.push({ id: doc.id, ...doc.data() as FriendRequest }));
  outgoingRequests.forEach(doc => requests.push({ id: doc.id, ...doc.data() as FriendRequest }));

  return requests;
};

export const acceptFriendRequest = async (requestId: string): Promise<void> => {
  const requestRef = friendRequestsCollection.doc(requestId);
  const requestDoc = await requestRef.get();

  if (!requestDoc.exists) {
    throw new Error('Friend request not found.');
  }

  const requestData = requestDoc.data() as FriendRequest;

  // Assuming the receiver's UID can be retrieved or is known
  const currentUser = auth().currentUser;
  if (!currentUser || currentUser.email !== requestData.receiverEmail) {
      throw new Error('Unauthorized to accept this request.');
  }

  const senderId = requestData.senderId;
  const receiverId = currentUser.uid;

  // Create friend connection (store IDs alphabetically to ensure uniqueness)
  const [userId1, userId2] = senderId < receiverId ? [senderId, receiverId] : [receiverId, senderId];

  const newConnection: FriendConnection = {
    userId1,
    userId2,
    connectedAt: new Date(),
  };

  await friendConnectionsCollection.add(newConnection);
  await requestRef.update({ status: 'accepted' });
};

export const rejectFriendRequest = async (requestId: string): Promise<void> => {
  const requestRef = friendRequestsCollection.doc(requestId);
  await requestRef.update({ status: 'rejected' });
};

export const fetchFriends = async (userId: string): Promise<FriendConnection[]> => {
    const connections1 = await friendConnectionsCollection.where('userId1', '==', userId).get();
    const connections2 = await friendConnectionsCollection.where('userId2', '==', userId).get();
    return [...connections1.docs, ...connections2.docs].map(doc => ({ id: doc.id, ...doc.data() as FriendConnection }));
};

export const removeFriend = async (connectionId: string): Promise<void> => {
    await friendConnectionsCollection.doc(connectionId).delete();
};
