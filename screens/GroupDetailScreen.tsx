import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, Modal, TextInput, Button, ScrollView, SectionList } from 'react-native';
import { useRoute, useNavigation, ParamListBase } from '@react-navigation/native';
import { getAuth } from 'firebase/auth'; // Assuming firebase auth is used to get current user ID
import { fetchGroupById, addMemberToGroup, removeMemberFromGroup, updateGroup } from '../services/groupService'; // Assuming fetchGroupById function in groupService
import { fetchExpensesByGroupId, Expense } from '../services/expenseService'; // Import the function to fetch group expenses and Expense type
import { Expense } from '../services/expenseService'; // Import Expense type
import { fetchPersonalSplitsByGroupId } from '../services/splitService'; // Import the function to fetch group splits
import { PersonalSplit } from '../services/splitService'; // Import PersonalSplit type
// Placeholder for fetching friends - replace with actual logic later
const placeholderFriends = [
  { id: 'friend1', name: 'Alice' },
  { id: 'friend2', name: 'Bob' },
 { id: 'friend0', name: 'Current User' }, // Added placeholder for current user
  { id: 'friend3', name: 'Charlie' },
];
import { fetchGroupActivityLog, GroupActivityLogEntry } from '../services/groupService'; // Import function to fetch activity log
import moment from 'moment'; // Import moment for date formatting

interface RouteParams {
 groupId: string;
 initialGroup: any; // Adjust this type based on what's actually passed
  groupId: string;
}

const GroupDetailScreen: React.FC = () => {
  const route = useRoute() as any; // Use 'any' for now to access params correctly
  const { group: initialGroup } = route.params;
  const [group, setGroup] = useState<any>(null); // Replace 'any' with your Group data structure
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groupExpenses, setGroupExpenses] = useState<Expense[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(true); // Loading state for expenses
  const [groupSplits, setGroupSplits] = useState<PersonalSplit[]>([]);
  const [activityLog, setActivityLog] = useState<GroupActivityLogEntry[]>([]);
  const [activityLogLoading, setActivityLogLoading] = useState(true);
  const [splitsLoading, setSplitsLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
 const navigation = useNavigation<any>(); // Use 'any' for now

  useEffect(() => {
    const fetchGroupDetails = async () => {
      try {
        setLoading(true);
        const groupData = await fetchGroupById(initialGroup.id); // Use initialGroup.id
        setGroup(groupData);
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching group details:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchExpenses = async () => {
      try {
        setExpensesLoading(true);
        const expensesData = await fetchExpensesByGroupId(initialGroup.id);
        setGroupExpenses(expensesData);
      } catch (err: any) {
        console.error('Error fetching group expenses:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchSplits = async () => {
      try {
        setSplitsLoading(true);
        const splitsData = await fetchPersonalSplitsByGroupId(initialGroup.id);
        setGroupSplits(splitsData);
      } catch (err: any) {
        console.error('Error fetching group splits:', err);
      } finally {
        setSplitsLoading(false);
      }
    };

    const fetchActivityLog = async () => {
      try {
        setActivityLogLoading(true);
        const logEntries = await fetchGroupActivityLog(initialGroup.id);
        setActivityLog(logEntries);
      } catch (err: any) {
        console.error('Error fetching activity log:', err);
      } finally {
        setActivityLogLoading(false);
      }
    };

    if (initialGroup) {
      fetchExpenses(); // Fetch expenses when group details are fetched
      fetchSplits(); // Fetch splits for the group
      fetchGroupDetails();
      fetchActivityLog(); // Fetch activity log
    }

    // Clean up function if needed
    return () => { };
  }, [initialGroup]); // Added initialGroup to dependency array

  const currentUserId = getAuth().currentUser?.uid; // Get current user ID
  const isCreator = group?.creatorId === currentUserId; // Check if current user is creator
  const groupMembers = group?.members || [];

  const [isAddMemberModalVisible, setAddMemberModalVisible] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  const handleAddMemberPress = () => {
    setAddMemberModalVisible(true);
  };

  const handleFriendSelection = (friendId: string) => {
    setSelectedFriends((prevSelected) =>
      prevSelected.includes(friendId)
        ? prevSelected.filter((id) => id !== friendId)
        : [...prevSelected, friendId]
    );
  };

  const handleAddSelectedMembers = async () => {
    if (selectedFriends.length === 0) {
      Alert.alert('No members selected', 'Please select friends to add.');
      return;
    }
    try {
      setLoading(true);
      // Assuming addMemberToGroup takes group ID and array of user IDs
      await addMemberToGroup(group.id, selectedFriends);
      setAddMemberModalVisible(false);
      setSelectedFriends([]);
      // Re-fetch group details to update the member list
      const updatedGroup = await fetchGroupById(group.id);
      setGroup(updatedGroup);
      Alert.alert('Success', 'Members added successfully.');
    } catch (err: any) {
      console.error('Error adding members:', err);
      Alert.alert('Error', 'Failed to add members.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGroupName = async () => {
    if (!group || !group.name.trim()) {
      Alert.alert('Invalid Name', 'Group name cannot be empty.');
      return;
    }
    try {
      setLoading(true);
      await updateGroup(group.id, { name: group.name }); // Assuming updateGroup takes group ID and updated fields
      setIsEditingName(false);
    } catch (err: any) {
      console.error('Error updating group name:', err);
      Alert.alert('Error', 'Failed to update group name.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberIdToRemove: string) => {
    const leaving = memberIdToRemove === currentUserId;
    const action = leaving ? 'leave the group' : 'remove this member';

    Alert.alert(
      `Confirm ${leaving ? 'Leaving' : 'Removal'}`,
      `Are you sure you want to ${action}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: leaving ? 'Leave' : 'Remove',
          style: leaving ? 'destructive' : 'default',
          onPress: async () => {
            try {
              setLoading(true);
              await removeMemberFromGroup(group.id, memberIdToRemove);

              // If the current user left, navigate back to the group list
              if (leaving) {
                navigation.goBack(); // Or navigate to GroupList specifically
              } else {
                // Re-fetch group details to update the member list
                const updatedGroup = await fetchGroupById(group.id);
                setGroup(updatedGroup);
              }
              Alert.alert('Success', leaving ? 'You have left the group.' : 'Member removed successfully.');
            } catch (err: any) {
              console.error('Error removing member:', err);
              Alert.alert('Error', `Failed to ${action}.`);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleMarkSettled = async (splitId: string, participantId: string, isSettled: boolean) => {
    try {
      // This function is not implemented yet, but it would call your splitService
      // to update the settlement status of a participant in a split.
      // For now, we'll just log the action.
      console.log(`Attempting to mark split ${splitId} for participant ${participantId} as settled: ${isSettled}`);
      // You would typically call a service function here:
      // await splitService.updateParticipantSettlementStatus(splitId, participantId, isSettled);

      // Optimistically update the UI
      setGroupSplits(prevSplits =>
        prevSplits.map(split =>
          split.id === splitId
            ? {
                ...split,
                participants: split.participants.map(p =>
                  p.userId === participantId ? { ...p, isSettled: isSettled } : p
                ),
              }
            : split)
      );
    } catch (err: any) {
      console.error('Error removing member:', err);
    }
  };

  const handleAddGroupExpensePress = () => {
    // Navigate to AddExpenseScreen and pass the current group ID
 navigation.navigate('AddExpense', { groupId: group.id });
  };

  // --- Balance Calculation Logic ---
  const calculateBalances = () => {
    const memberBalances: { [userId: string]: { [currency: string]: number } } = {};

    // Initialize balances for all group members
    groupMembers.forEach(memberId => {
      memberBalances[memberId] = {};
    });

    // Process Group Expenses
    groupExpenses.forEach(expense => {
      const payerId = expense.userId; // Assuming expense has a userId for the payer
      const amount = expense.amount;
      const currency = expense.currency;

      if (!memberBalances[payerId][currency]) {
        memberBalances[payerId][currency] = 0;
      }
      // Payer paid this amount for the group
      memberBalances[payerId][currency] += amount;
    });

    // Process Group Splits
    groupSplits.forEach(split => {
      const initiatorId = split.initiatorId;
      const currency = split.currency;

      split.participants.forEach(participant => {
        const participantId = participant.userId;
        const owedAmount = participant.amount;

        if (!memberBalances[initiatorId][currency]) {
          memberBalances[initiatorId][currency] = 0;
        }
        if (!memberBalances[participantId][currency]) {
          memberBalances[participantId][currency] = 0;
        }

        // Initiator is owed by the participant, so add to initiator's balance and subtract from participant's balance
        memberBalances[initiatorId][currency] += owedAmount;
        memberBalances[participantId][currency] -= owedAmount;
      });
    });

    // Simplify "Who Owes Whom"
    const simplifiedDebts: { from: string; to: string; amount: number; currency: string }[] = [];
    const netBalances = { ...memberBalances }; // Copy balances for simplification

    // Sort members to ensure consistent settlement order (optional but good practice)
    const sortedMemberIds = groupMembers.sort();

    // This is a simplified approach; a real settlement algorithm would be more complex
    // This just finds pairs where one owes the other in a specific currency
    for (const currency in netBalances[sortedMemberIds[0]]) { // Check currencies present for at least one member
      for (let i = 0; i < sortedMemberIds.length; i++) {
        for (let j = i + 1; j < sortedMemberIds.length; j++) {
          const person1 = sortedMemberIds[i];
          const person2 = sortedMemberIds[j];
          const balance1 = netBalances[person1][currency] || 0;
          const balance2 = netBalances[person2][currency] || 0;

          if (balance1 > 0 && balance2 < 0) {
            const amount = Math.min(balance1, Math.abs(balance2));
            simplifiedDebts.push({ from: person2, to: person1, amount, currency });
          } else if (balance1 < 0 && balance2 > 0) {
            const amount = Math.min(Math.abs(balance1), balance2);
            simplifiedDebts.push({ from: person1, to: person2, amount, currency });
          }
        }
      }
    }
    return { memberBalances, simplifiedDebts };
  };

  const { memberBalances, simplifiedDebts } = calculateBalances();


  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading group details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.centered}>
        <Text>Group not found.</Text>
      </View>
    );
  }

  // Placeholder for displaying member details - assuming members are user IDs
 // TODO: Fetch actual user details based on member IDs
  // You'll need to fetch user details based on member IDs if you want to show names/emails
  const renderMemberItem = ({ item: memberId }: { item: string }) => (
    <View style={styles.memberItem}>
      {/* Displaying user ID for now - replace with fetching and displaying user name */}
      <Text>{memberId}</Text>
      {isCreator && memberId !== currentUserId && groupMembers.length > 1 && ( // Allow creator to remove members (excluding themselves) if more than one member
        <TouchableOpacity onPress={() => handleRemoveMember(memberId)}>
          <Text style={styles.removeButton}>Remove</Text>
        </TouchableOpacity>
      )}
      {memberId === currentUserId && groupMembers.length > 1 && ( // Allow current user to leave the group if more than one member
        <TouchableOpacity onPress={() => handleRemoveMember(currentUserId)}>
 <Text style={[styles.removeButton, { color: 'orange' }]}>Leave Group</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View>
        {isEditingName ? (
          <View style={styles.editNameContainer}>
            <TextInput
              style={styles.editNameInput}
              value={group.name}
              onChangeText={(text) => setGroup({ ...group, name: text })}
            />
            <Button title="Save" onPress={handleSaveGroupName} />
            <Button title="Cancel" onPress={() => setIsEditingName(false)} color="red" />
          </View>
        ) : (
          <Text style={styles.groupName} onLongPress={() => isCreator && setIsEditingName(true)}>{group.name}</Text>
        )}
        <Text style={styles.sectionTitle}>Members:</Text>
        {group.members && group.members.length > 0 ? (
          <FlatList // Use SectionList later if we group members by balance status
            style={styles.list}
            data={groupMembers}
            renderItem={renderMemberItem}
            keyExtractor={(item) => item} // Assuming user ID is a string
            scrollEnabled={false} // Disable scrolling for nested FlatList
          />
        ) : (
          <Text style={styles.noMembersText}>No members in this group yet.</Text>
        )}

        {isCreator && ( // Only show add member button for the creator
          <TouchableOpacity style={styles.addButton} onPress={handleAddMemberPress}>
            <Text style={styles.addButtonText}>Add Members</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.sectionTitle}>Group Expenses:</Text>

        {/* Add UI for group expense splitting, balance tracking here */}

        <Text style={styles.sectionTitle}>Balances:</Text>
        {groupMembers.length > 1 ? (
          <>
            {groupMembers.map(memberId => (
              <View key={memberId} style={styles.balanceItem}>
                {/* TODO: Replace memberId with actual user name */}
                <Text style={styles.balanceUserName}>{memberId}:</Text>
                {Object.entries(memberBalances[memberId] || {}).map(([currency, balance]) => (
                  balance !== 0 && ( // Only display currencies with non-zero balances
                    <Text
                      key={currency}
                      style={[
                        styles.balanceAmount,
                        balance > 0 ? styles.balancePositive : styles.balanceNegative,
                      ]}
                    >
                      {balance.toFixed(2)} {currency}
                    </Text>
                  )
                ))}
                {Object.keys(memberBalances[memberId] || {}).every(currency => memberBalances[memberId][currency] === 0) && (
                  <Text style={styles.balanceAmount}>0.00 {groupExpenses[0]?.currency || 'USD'}</Text> // Display 0 if no balance in any currency
                )}
              </View>
            ))}

            <Text style={styles.sectionTitle}>Simplified Debts:</Text>
            {simplifiedDebts.length > 0 ? (
              simplifiedDebts.map((debt, index) => (
                <View key={index} style={styles.debtItem}>
                  {/* TODO: Replace user IDs with actual user names */}
                  <Text style={styles.debtText}>{debt.from} owes {debt.to}:</Text>
                  <Text style={styles.debtAmount}>{debt.amount.toFixed(2)} {debt.currency}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noDebtsText}>No outstanding debts in this group.</Text>
            )}
          </>
        ) : (
          <Text style={styles.noMembersText}>Add more members to see balances.</Text>
        )}

        <Text style={styles.sectionTitle}>Group Expenses:</Text>


      {expensesLoading ? (
        <ActivityIndicator size="small" color="#0000ff" />
      ) : groupExpenses.length > 0 ? (
        <FlatList
          data={groupExpenses}
          renderItem={({ item }) => (
            <View style={styles.expenseItem}>
              {/* Display expense details */}
              <Text style={styles.expenseDescription}>{item.description || 'No Description'}</Text>
              <Text style={styles.expenseAmount}>{item.amount} {item.currency}</Text>
              <Text style={styles.expenseDate}>{new Date(item.date).toLocaleDateString()}</Text>
              {/* Add options to view/edit expense here */}
            </View>
          )}
          keyExtractor={(item) => item.id}
        />
      ) : (
        <Text style={styles.noExpensesText}>No expenses in this group yet.</Text>
        )}

        {/* Button to add a new expense to this group */}
        <TouchableOpacity style={styles.addButton} onPress={handleAddGroupExpensePress}>
          <Text style={styles.addButtonText}>Add Group Expense</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Group Splits:</Text>
        {splitsLoading ? (
          <ActivityIndicator size="small" color="#0000ff" />
        ) : groupSplits.length > 0 ? (
          <FlatList
            data={groupSplits}
            renderItem={({ item: split }) => (
              <View style={styles.splitItem}>
                {/* TODO: Replace IDs with actual user names */}
                <Text style={styles.splitDescription}>Split for: {split.expenseId}</Text> {/* Link to expense description? */}
                <Text style={styles.splitInitiator}>Initiated by: {split.initiatorId}</Text>
                {split.participants.map(participant => (
                  <View key={participant.userId} style={styles.splitParticipant}>
                    <Text>{participant.userId} owes {split.initiatorId}: {participant.amount.toFixed(2)} {split.currency}</Text>
                    {/* TODO: Add settlement UI */}
                  </View>
                ))}
              </View>
            )}
            keyExtractor={(item) => item.id}
          />
        ) : (
          <Text style={styles.noExpensesText}>No splits for this group yet.</Text>
        )}

      </View>

      <Text style={styles.sectionTitle}>Activity Log:</Text>
      {activityLogLoading ? (
        <ActivityIndicator size="small" color="#0000ff" />
      ) : activityLog.length > 0 ? (
        <FlatList
          data={activityLog}
          renderItem={({ item: logEntry }) => (
            <View style={styles.logEntryItem}>
              <Text style={styles.logEntryText}>
                {/* TODO: Replace logEntry.userId with actual user name */}
                <Text style={{ fontWeight: 'bold' }}>{logEntry.userId}</Text> {logEntry.activityType.replace(/_/g, ' ')}
                {logEntry.details?.name && ` "${logEntry.details.name}"`}
                {logEntry.details?.description && ` "${logEntry.details.description}"`}
                {logEntry.details?.amount && ` ${logEntry.details.amount.toFixed(2)} ${logEntry.details.currency}`}
                {logEntry.details?.participantId && ` for ${logEntry.details.participantId}`} {/* TODO: Replace participantId */}
                {logEntry.details?.isSettled !== undefined && ` marked as ${logEntry.details.isSettled ? 'settled' : 'unsettled'}`}
              </Text>
              <Text style={styles.logEntryTimestamp}>
                {moment(logEntry.timestamp.toDate()).fromNow()}
              </Text>
            </View>
          )}
          keyExtractor={(item) => item.id} // Assuming activity log entries have an ID
        />
      ) : (
        <Text style={styles.noActivitiesText}>No recent activity in this group.</Text>
      )}
      {/* Add Member Modal */}
      <Modal
        visible={isAddMemberModalVisible}
        animationType="slide"
        onRequestClose={() => setAddMemberModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Add Members</Text>
          <FlatList
            data={placeholderFriends} // Use placeholder friends for now
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.friendItem} onPress={() => handleFriendSelection(item.id)}>
                <Text style={{ fontWeight: selectedFriends.includes(item.id) ? 'bold' : 'normal' }}>{item.name}</Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
          />
          <Button title="Add Selected Members" onPress={handleAddSelectedMembers} />
          <Button title="Cancel" onPress={() => setAddMemberModalVisible(false)} color="red" />
        </View>
      </Modal>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f8f8', // Light background color
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  groupName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  editNameContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  editNameInput: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginRight: 10,
    fontSize: 20,
    paddingVertical: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 8,
    color: '#555',
  },
  list: { // Generic list style for members, expenses, splits
    marginBottom: 10,
  },
  memberItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  removeButton: {
    color: 'red',
    marginLeft: 10,
  },
  addButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noMembersText: {
    textAlign: 'center',
    color: '#777',
    fontStyle: 'italic',
  },
  expenseItem: {
    backgroundColor: '#e9e9eb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  expenseAmount: {
    fontSize: 14,
    color: '#333',
  },
  expenseDate: {
    fontSize: 12,
    color: '#777',
  },
  noExpensesText: {
    textAlign: 'center',
    color: '#777',
    fontStyle: 'italic',
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  friendItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
});

export default GroupDetailScreen;