import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker'; // You'll need to install this library
import { BarChart, PieChart } from 'react-native-chart-kit';
import { Dimensions, Platform } from 'react-native';
import { getSpendingByCategory, getAllExpenses } from '../services/expenseService';
import { auth } from '../firebaseConfig'; // Import auth to get the current user
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';


const screenWidth = Dimensions.get('window').width;
const ReportsScreen: React.FC = () => {
  const [selectedTimePeriod, setSelectedTimePeriod] = useState('currentMonth');
  const [selectedCurrency, setSelectedCurrency] = useState('USD'); // Default currency, should ideally come from user preferences
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [pickingStartDate, setPickingStartDate] = useState(true); // To differentiate between start and end date picking

  const timePeriodPresets = [
    { label: 'Last 7 Days', value: 'last7Days' },
    { label: 'Last 30 Days', value: 'last30Days' },
    { label: 'Current Month', value: 'currentMonth' },
    { label: 'All Time', value: 'allTime' },
    { label: 'Custom Range', value: 'custom' },
  ];

  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [spendingData, setSpendingData] = useState<any>(null); // State to hold fetched spending data
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const currencies = ['USD', 'EUR', 'GBP']; // Example currencies, should ideally come from a list

  const showDatePicker = (isStartDate: boolean) => {
    setPickingStartDate(isStartDate);
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirmDate = (date: Date) => {
    if (pickingStartDate) {
      setCustomStartDate(date);
    } else {
      setCustomEndDate(date);
    }
    hideDatePicker();
  };

  const fetchSpendingData = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    let startDate: Date | null = null;
    let endDate: Date | null = null;

    const now = new Date();
    if (selectedTimePeriod === 'last7Days') {
      startDate = new Date(now.setDate(now.getDate() - 7));
      endDate = new Date();
    } else if (selectedTimePeriod === 'last30Days') {
      startDate = new Date(now.setDate(now.getDate() - 30));
      endDate = new Date();
    } else if (selectedTimePeriod === 'currentMonth') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (selectedTimePeriod === 'allTime') {
      startDate = null; // Fetch all data
      endDate = null;
    } else if (selectedTimePeriod === 'custom') {
      startDate = customStartDate;
      endDate = customEndDate;
    }

    if (!startDate && selectedTimePeriod === 'custom') {
       // Handle case where custom dates are not selected yet
       setSpendingData(null);
       return;
    }

    // Pass currency filter and date range to getSpendingByCategory
    const data = await getSpendingByCategory(userId, {
 currency: selectedCurrency,
      startDate: startDate,
      endDate: endDate
    });

    // Format data for react-native-chart-kit
    const chartData = {
      labels: Object.keys(data), // Assuming data keys are categories
      datasets: [
        {
          data: Object.values(data),
        },
      ],
    };
    setSpendingData(chartData);
  };

 useEffect(() => {
    fetchSpendingData();
  }, [selectedTimePeriod, selectedCurrency, customStartDate, customEndDate]); // Refetch data when filters change

  const generateAiSummary = async () => {
    setLoadingSummary(true);
    setAiSummary(null); // Clear previous summary
    const userId = auth.currentUser?.uid;
    if (!userId) {
      setLoadingSummary(false);
      return;
    }

    // Placeholder logic to prepare data for AI (send spendingData and filters)
    const dataForAI = {
      spendingData: spendingData,
      timePeriod: selectedTimePeriod,
      currency: selectedCurrency,
      customStartDate: customStartDate,
      customEndDate: customEndDate,
    };

    // Simulate API call to AI service
    setTimeout(() => {
      setAiSummary('This is a simulated AI-powered summary based on your spending.');
      setLoadingSummary(false);
    }, 2000); // Simulate network delay
  };

  const exportToCSV = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.error('User not authenticated');
      return;
    }

    try {
      // 1. Fetch filtered expense data
      const expenses = await getAllExpenses(userId, selectedCurrency, customStartDate || undefined, customEndDate || undefined);

      // 2. Format the fetched data into a CSV string
      let csvString = 'Description,Amount,Currency,Date,Category\n';
      expenses.forEach(expense => {
        const date = expense.date instanceof Date ? expense.date.toISOString().split('T')[0] : '';
        csvString += `${expense.description},${expense.amount},${expense.currency},${date},${expense.category}\n`;
      });

      // 3. Use expo-file-system to write the CSV string to a temporary file
      const fileName = `expenses_${selectedTimePeriod}_${selectedCurrency}.csv`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, csvString);

      // 4. Use expo-sharing to share the temporary file
      if (Platform.OS === 'android') {
        await Sharing.shareAsync(fileUri, { mimeType: 'text/csv' });
      } else {
        await Sharing.shareAsync(fileUri);
      }

    } catch (error) {
      console.error('Error exporting to CSV:', error);
    }
  };
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Financial Reports</Text>

      {/* Filter Section */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Time Period:</Text>
        <View style={styles.timePeriodFilter}>
          {timePeriodPresets.map((preset) => (
            <TouchableOpacity
              key={preset.value}
              style={[
                styles.filterButton,
                selectedTimePeriod === preset.value && styles.selectedFilterButton,
              ]}
              onPress={() => setSelectedTimePeriod(preset.value)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedTimePeriod === preset.value && styles.selectedFilterButtonText,
                ]}
              >
                {preset.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedTimePeriod === 'custom' && (
          <View style={styles.customDateRange}>
            <TouchableOpacity style={styles.datePickerButton} onPress={() => showDatePicker(true)}>
              <Text>{customStartDate ? customStartDate.toDateString() : 'Select Start Date'}</Text>
            </TouchableOpacity>
            <Text style={{ marginHorizontal: 5 }}>-</Text>
            <TouchableOpacity style={styles.datePickerButton} onPress={() => showDatePicker(false)}>
              <Text>{customEndDate ? customEndDate.toDateString() : 'Select End Date'}</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.filterLabel}>Currency:</Text>
        {/* Currency Dropdown/Picker would go here */}
        <View style={styles.currencyFilter}>
          {currencies.map((currency) => (
             <TouchableOpacity
             key={currency}
             style={[
               styles.filterButton,
               selectedCurrency === currency && styles.selectedFilterButton,
             ]}
             onPress={() => setSelectedCurrency(currency)}
           >
             <Text
               style={[
                 styles.filterButtonText,
                 selectedCurrency === currency && styles.selectedFilterButtonText,
               ]}
             >
               {currency}
             </Text>
           </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Chart Placeholder Section */}
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>Spending by Category (Bar Chart Placeholder)</Text>
        {spendingData && Object.keys(spendingData.labels).length > 0 ? (
           <BarChart
             data={spendingData}
             width={screenWidth - 32} // Adjust width as needed
             height={220}
             yAxisLabel="$" // Replace with selected currency symbol
             chartConfig={{
               backgroundColor: '#fff',
               backgroundGradientFrom: '#fff',
               backgroundGradientTo: '#fff',
               decimalPlaces: 2,
               color: (opacity = 1) => `rgba(255, 140, 0, ${opacity})`, // Orange color
               labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
               style: {
                 borderRadius: 16,
               },
               propsForDots: {
                 r: '6',
                 strokeWidth: '2',
                 stroke: '#ff8c00',
               },
             }}
             style={{
               marginVertical: 8,
               borderRadius: 16,
             }}
           />
        ) : (
          <View style={styles.placeholderView}><Text>No spending data available for selected filters.</Text></View>
        )}

        <Text style={styles.sectionTitle}>Category Distribution (Pie Chart Placeholder)</Text>
        <View style={styles.placeholderView}>
          <Text>Pie Chart Placeholder</Text>
        </View>
      </View>

      {/* AI Summary Placeholder Section */}
      <View style={styles.aiSummarySection}>
        <Text style={styles.sectionTitle}>AI-Powered Summary (Placeholder)</Text>
        <TouchableOpacity
          style={styles.generateSummaryButton}
          onPress={generateAiSummary}
          disabled={loadingSummary}
        >
          <Text style={styles.generateSummaryButtonText}>
            {loadingSummary ? 'Generating...' : 'Generate Summary'}
          </Text>
        </TouchableOpacity>
        {loadingSummary && <ActivityIndicator size="small" color="#ff8c00" style={{ marginTop: 10 }} />}
        {aiSummary && (
          <Text style={styles.aiSummaryText}>{aiSummary}</Text>
        )}










      </View>

      {/* CSV Export Button */}
      <TouchableOpacity
        style={styles.csvExportButton}
        onPress={exportToCSV}
      >
        <Text style={styles.csvExportButtonText}>Export to CSV</Text>
      </TouchableOpacity>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleConfirmDate}
        onCancel={hideDatePicker}
      />
    </ScrollView>
 );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f0f0f0', // Light gray background from design
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  filterSection: {
    marginBottom: 20,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#555',
  },
  timePeriodFilter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
   currencyFilter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 8,
    marginBottom: 8,
  },
  selectedFilterButton: {
    backgroundColor: '#ff8c00', // Orange color from design
    borderColor: '#ff8c00',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#555',
  },
  selectedFilterButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  customDateRange: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  datePickerButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  chartSection: {
    marginBottom: 20,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  aiSummarySection: {
    marginBottom: 20,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#555',
  },
  placeholderView: {
    height: 150, // Placeholder height for charts/summary
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  generateSummaryButton: {
    backgroundColor: '#007bff', // Example button color
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  generateSummaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  aiSummaryText: {
 fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginTop: 10,
  },

  csvExportButton: {
    backgroundColor: '#ff8c00', // Orange color from design
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  csvExportButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default ReportsScreen;