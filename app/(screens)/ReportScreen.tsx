import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, GestureResponderEvent } from 'react-native';
import { getAuth } from '@react-native-firebase/auth';
import { collection, query, where, getDocs, getFirestore, Timestamp } from '@react-native-firebase/firestore';
import { LineChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { generateHTMLForReport } from '../../helpers/generateHTMLForReport';
import DateRangePicker from '../components/DateRangePicker';
import Ionicons from '@expo/vector-icons/Ionicons';
import CustomAlertModal from '../../components/CustomAlertModal';

type ReceiptItem = {
    id: string;
    name: string;
    quantity: number;
    price: number;
};

type Receipt = {
    id: string;
    receiptNumber: string;
    date: string;
    total: number;
    items: ReceiptItem[];
    timestamp: number;
    status: 'active' | 'complete';
};

type DateRange = {
    label: string;
    startDate: Date;
    endDate: Date;
    locked: boolean,
};

const dateRanges: DateRange[] = [
    {
        label: 'Last 7 Days',
        startDate: new Date(new Date().setDate(new Date().getDate() - 6)),
        endDate: new Date(new Date().setHours(23, 59, 59, 999)),
        locked: false,
    },
    {
        label: 'Last 30 Days',
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
        endDate: new Date(new Date().setHours(23, 59, 59, 999)),
        locked: false,
    },
    {
        label: 'Last 3 Months',
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 3)),
        endDate: new Date(new Date().setHours(23, 59, 59, 999)),
        locked: true,
    },
    {
        label: 'This Year',
        startDate: new Date(new Date().getFullYear(), 0, 1),
        endDate: new Date(new Date().setHours(23, 59, 59, 999)),
        locked: true,
    }
];

// Additional data we can extract from the receipts data
// 1. Category - wise Sales Breakdown Show total sales, number of items, and average price per category(e.g., Electronics, Clothing). Pie chart or bar chart for visual representation.

// 2. Customer Insights(if customer info is tracked) Most frequent customers. Highest spending customers. Average spend per customer.

// 3. Time - based Trends Sales by week / month / quarter / year(not just daily). Compare current period to previous period(e.g., “Sales up 12 % vs last month”).

// 4. Item Performance Fastest / slowest moving items(items sold most / least frequently). Items with increasing / decreasing sales trends.

// 5. Profit Analysis(if cost data is available) Gross profit per item / category. Overall profit margin.

// 6. Refunds / Returns(if tracked) Number and value of refunds / returns. Items most frequently returned.

// 7. Inventory Insights(if inventory is tracked) Stock - out alerts(items with low or zero stock). Days of inventory left(based on sales velocity).

// 8. Payment Method Analysis(if payment method is tracked) Sales by payment method(cash, card, UPI, etc.). Trends in payment method usage.

// 9. Customer Visit Frequency(if customer data is tracked) Average time between purchases for repeat customers.

// 10. Custom Period Comparisons Allow users to select any two periods and compare sales, items, etc.

// 11. Receipts Heatmap Visualize sales by day of week and hour of day(to find peak business times).

// 12. Discount / Promotion Effectiveness(if discounts are tracked) Sales uplift during promotions. Most effective discount types.

export default function Report() {
    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [loading, setLoading] = useState({ state: false, message: '' });
    const [selectedRange, setSelectedRange] = useState<DateRange>(dateRanges[0]); // Default to Last 30 Days
    const [totalSales, setTotalSales] = useState(0);
    const [averageTransaction, setAverageTransaction] = useState(0);
    const [topItems, setTopItems] = useState<{ name: string; quantity: number; revenue: number }[]>([]);
    const [dailySales, setDailySales] = useState<{ date: string; total: number }[]>([]);
    const [dailySalesCount, setDailySalesCount] = useState<{ date: string; count: number }[]>([]);
    const [exporting, setExporting] = useState(false);
    const [userData, setUserDate] = useState<any>();
    const [alert, setAlert] = useState<{ visible: boolean; title: string; message: string; actions?: any[] }>({ visible: false, title: '', message: '', actions: [] });

    const fetchReceipts = async () => {
        try {
            setLoading({ state: true, message: 'Loading receipts...' });

            // Set start of day
            const startOfDay = new Date(selectedRange.startDate);
            startOfDay.setHours(0, 0, 0, 0);

            // Set end of day
            const endOfDay = new Date(selectedRange.endDate);
            endOfDay.setHours(23, 59, 59, 999);

            const db = getFirestore();
            const receiptsRef = collection(db, 'Receipts');
            const q = query(
                receiptsRef,
                where('userId', '==', getAuth().currentUser?.uid),
                where('status', '==', 'complete'),
                where('createdAt', '>=', Timestamp.fromDate(startOfDay)),
                where('createdAt', '<=', Timestamp.fromDate(endOfDay))
            );

            // console.log(Timestamp.fromDate(startOfDay), Timestamp.fromDate(endOfDay));


            const querySnapshot = await getDocs(q);
            const receiptsData: Receipt[] = [];
            querySnapshot.forEach(doc => {
                const data = doc.data();
                receiptsData.push({
                    id: doc.id,
                    receiptNumber: data.receiptNumber,
                    date: new Date(data.timestamp).toISOString().split('T')[0],
                    total: data.total,
                    items: data.items,
                    timestamp: data.timestamp,
                    status: data.status,
                });
            });

            setReceipts(receiptsData);
            processData(receiptsData);
        } catch (error) {
            console.error('Error fetching receipts:', error);
        } finally {
            setLoading({ state: false, message: '' });
        }
    };

    const processData = (receiptsData: Receipt[]) => {
        // Calculate total sales
        const total = receiptsData.reduce((sum, receipt) => sum + receipt.total, 0);
        // console.log(total);

        setTotalSales(total);

        // Calculate average transaction
        setAverageTransaction(total / (receiptsData.length || 1));

        // Process top selling items
        const itemsMap = new Map<string, { quantity: number; revenue: number }>();
        receiptsData.forEach(receipt => {
            receipt.items.forEach(item => {
                const existing = itemsMap.get(item.name) || { quantity: 0, revenue: 0 };
                itemsMap.set(item.name, {
                    quantity: existing.quantity + item.quantity,
                    revenue: existing.revenue + (item.price * item.quantity)
                });
            });
        });

        const topItemsArray = Array.from(itemsMap.entries())
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        setTopItems(topItemsArray);

        // Process daily sales
        const salesByDate = new Map<string, number>();
        const salesCountByDate = new Map<string, number>();
        receiptsData.forEach(receipt => {
            const date = receipt.date;
            salesByDate.set(date, (salesByDate.get(date) || 0) + receipt.total);
            salesCountByDate.set(date, (salesCountByDate.get(date) || 0) + 1);
        });

        const dailySalesArray = Array.from(salesByDate.entries())
            .map(([date, total]) => ({ date, total }))
            .sort((a, b) => a.date.localeCompare(b.date));
        setDailySales(dailySalesArray);

        const dailySalesCountArray = Array.from(salesCountByDate.entries())
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));
        setDailySalesCount(dailySalesCountArray);
    };

    const fetchUserData = async () => {
        setLoading({ state: true, message: 'Loading user data...' });
        try {
            const db = getFirestore();
            const userRef = collection(db, 'Users');
            const q = query(userRef, where('userId', '==', getAuth().currentUser?.uid));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // Assuming you have a single user document
                const userData = querySnapshot.docs[0].data();
                setUserDate(userData);
                // You can use userData to set any additional state if needed
            } else {
                console.warn('No user data found for the current user.');
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            setAlert({ visible: true, title: 'Error', message: 'Failed to fetch user data', actions: [{ text: 'OK', onPress: () => setAlert({ ...alert, visible: false }) }] });
        } finally {
            setLoading({ state: false, message: '' });
        }
    }

    const generateHTML = () => {

        // Add a default businessInfo object for the report
        const businessInfo = {
            name: userData?.name || "Partnered with Receiptify",
            address: userData?.address || "",
            phone: userData?.phoneNumber || "",
            email: userData?.email || "",
            website: userData?.website || "",
            logo: userData?.businessLogo, // Use your logo asset here
        };

        return generateHTMLForReport({
            selectedRangeLabel: `From Date: ${selectedRange.startDate.toLocaleDateString()}<br> To Date: ${selectedRange.endDate.toLocaleDateString()}`,
            totalSales,
            averageTransaction,
            topItems,
            dailySales,
            dailySalesCount,
            businessInfo,
        });
    };

    const generatePDF = async () => {
        try {
            setExporting(true);
            const html = generateHTML();
            const { uri } = await Print.printToFileAsync({
                html,
                base64: false
            });
            return uri;
        } catch (error) {
            console.error('Error generating PDF:', error);
            setAlert({ visible: true, title: 'Error', message: 'Failed to generate PDF report', actions: [{ text: 'OK', onPress: () => setAlert({ ...alert, visible: false }) }] });
            return null;
        } finally {
            setExporting(false);
        }
    };

    // const handleEmailReport = async () => {
    //     try {
    //         const pdfPath = await generatePDF();
    //         if (!pdfPath) return;

    //         Mailer.mail({
    //             subject: `Sales Report - ${selectedRange.label}`,
    //             recipients: [],
    //             body: `Please find attached the sales report for ${selectedRange.label}.`,
    //             attachments: [{
    //                 path: pdfPath,
    //                 type: 'pdf',
    //             }],
    //         }, (error) => {
    //             if (error) {
    //                 Alert.alert('Error', 'Could not send email');
    //             }
    //         });
    //     } catch (error) {
    //         console.error('Error sending email:', error);
    //         Alert.alert('Error', 'Failed to send email');
    //     }
    // };

    const handleDownloadReport = async () => {
        setLoading({ state: true, message: 'Generating PDF...' });
        try {
            const pdfPath = await generatePDF();
            if (pdfPath) {
                if (Platform.OS === 'android' || Platform.OS === 'ios') {
                    await Sharing.shareAsync(pdfPath, {
                        mimeType: 'application/pdf',
                        dialogTitle: 'Save PDF Report'
                    });
                }
                setAlert({ visible: true, title: 'Success', message: 'Report generated successfully', actions: [{ text: 'OK', onPress: () => setAlert({ ...alert, visible: false }) }] });
            }
        } catch (error) {
            console.error('Error downloading report:', error);
            setAlert({ visible: true, title: 'Error', message: 'Failed to download report', actions: [{ text: 'OK', onPress: () => setAlert({ ...alert, visible: false }) }] });
        } finally {
            setLoading({ state: false, message: '' });
        }
    };

    useEffect(() => {
        fetchReceipts();
    }, [selectedRange]);

    useEffect(() => {
        fetchUserData();
    }, []);

    if (loading.state) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2196F3" />
                <Text style={{ marginTop: 10, color: '#666666' }}>{loading.message}</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.dateRangeContainer}>
                <DateRangePicker
                    startDate={selectedRange.startDate}
                    endDate={selectedRange.endDate}
                    onStartDateChange={date => {
                        setSelectedRange({ ...selectedRange, startDate: date });
                    }}
                    onEndDateChange={date => {
                        setSelectedRange({ ...selectedRange, endDate: date });
                    }}
                    disableFutureDates={true}
                    maxRangeNumberOfDays={30}
                    onError={msg => setAlert({ visible: true, title: 'Date Error', message: msg, actions: [{ text: 'OK', onPress: () => setAlert({ ...alert, visible: false }) }] })}
                />
            </View>

            <View style={styles.exportContainer}>
                <TouchableOpacity
                    style={[styles.exportButton, { backgroundColor: "rgb(240, 200, 0)" }, exporting ? styles.exportButtonDisabled : null]}
                    onPress={() => {
                        if (Platform.OS === 'android') {
                            // Use ToastAndroid for Android
                            // @ts-ignore
                            import('react-native').then(RN => RN.ToastAndroid.show('Email Report is currently unavailable.', RN.ToastAndroid.SHORT));
                        } else {
                            setAlert({ visible: true, title: 'Unavailable', message: 'Email Report is currently unavailable.', actions: [{ text: 'OK', onPress: () => setAlert({ ...alert, visible: false }) }] });
                        }
                    }}
                    disabled={false}
                >
                    <Ionicons name="lock-closed" size={18} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={styles.exportButtonText}>Email Report</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.exportButton}
                    onPress={handleDownloadReport}
                    disabled={exporting}
                >
                    <Text style={styles.exportButtonText}>Download PDF</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.summaryContainer}>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Total Sales</Text>
                    <Text style={styles.summaryValue}>₹{totalSales.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Avg. Transaction</Text>
                    <Text style={styles.summaryValue}>₹{averageTransaction.toFixed(2)}</Text>
                </View>
            </View>

            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Top Selling Items</Text>
                {topItems.map((item, index) => (
                    <View key={index} style={styles.topItemRow}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <View style={styles.itemDetails}>
                            <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                            <Text style={styles.itemRevenue}>₹{item.revenue.toFixed(2)}</Text>
                        </View>
                    </View>
                ))}
            </View>

            {(dailySales.length > 0 || dailySalesCount.length > 0) && <View style={styles.chartContainer}>
                {dailySales.length > 0 && (
                    <View>
                        <Text style={styles.sectionTitle}>Sales Trend</Text>
                        <ScrollView horizontal>
                            <LineChart
                                data={{
                                    labels: dailySales.map(sale => sale.date.slice(5)),
                                    datasets: [{
                                        data: dailySales.map(sale => {
                                            return sale.total
                                        })
                                    }]
                                }}
                                width={Math.max(Dimensions.get("window").width, dailySales.length * 50)}
                                height={220}
                                yAxisLabel="₹"
                                yAxisSuffix=""
                                chartConfig={{
                                    backgroundColor: "#ffffff",
                                    backgroundGradientFrom: "#ffffff",
                                    backgroundGradientTo: "#ffffff",
                                    decimalPlaces: 0,
                                    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                    style: {
                                        borderRadius: 16
                                    },
                                    propsForDots: {
                                        r: "6",
                                        strokeWidth: "2",
                                        stroke: "#2196F3"
                                    }
                                }}
                                bezier
                                style={{
                                    marginVertical: 8,
                                    borderRadius: 16
                                }}
                            />
                        </ScrollView>
                    </View>
                )}


                {dailySalesCount.length > 0 && (
                    <View>
                        <Text style={styles.sectionTitle}>Sales Count (Transactions per Day)</Text>
                        <ScrollView horizontal>
                            <LineChart
                                data={{
                                    labels: dailySalesCount.map(sale => sale.date.slice(5)),
                                    datasets: [{
                                        data: dailySalesCount.map(sale => sale.count)
                                    }]
                                }}
                                width={Math.max(Dimensions.get("window").width, dailySalesCount.length * 50)}
                                height={220}
                                yAxisLabel=""
                                yAxisSuffix=" receipts"
                                chartConfig={{
                                    backgroundColor: "#ffffff",
                                    backgroundGradientFrom: "#ffffff",
                                    backgroundGradientTo: "#ffffff",
                                    decimalPlaces: 0,
                                    color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`,
                                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                    style: {
                                        borderRadius: 16
                                    },
                                    propsForDots: {
                                        r: "6",
                                        strokeWidth: "2",
                                        stroke: "#FF9800"
                                    }
                                }}
                                bezier
                                style={{
                                    marginVertical: 8,
                                    borderRadius: 16
                                }}
                            />
                        </ScrollView>
                    </View>
                )}
            </View>}

            <CustomAlertModal
                visible={alert.visible}
                title={alert.title}
                message={alert.message}
                actions={alert.actions}
                onRequestClose={() => setAlert({ ...alert, visible: false })}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    dateRangeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    dateRangeButton: {
        backgroundColor: '#ffffff',
        padding: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        minWidth: '48%',
        alignItems: 'center',
    },
    dateRangeButtonActive: {
        backgroundColor: '#2196F3',
        borderColor: '#2196F3',
    },
    dateRangeText: {
        color: '#666666',
        fontSize: 14,
    },
    dateRangeTextActive: {
        color: '#ffffff',
        fontWeight: '600',
    },
    summaryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    summaryCard: {
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 8,
        flex: 0.48,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#666666',
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2196F3',
    },
    sectionContainer: {
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#333333',
    },
    topItemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    itemName: {
        flex: 1,
        fontSize: 16,
    },
    itemDetails: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemQuantity: {
        marginRight: 12,
        color: '#666666',
    },
    itemRevenue: {
        fontWeight: 'bold',
        color: '#2196F3',
    },
    chartContainer: {
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 8,
        marginBottom: 60,
        elevation: 2,
        gap: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    exportContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
    },
    exportButton: {
        backgroundColor: '#2196F3',
        padding: 12,
        borderRadius: 8,
        minWidth: 150,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    exportButtonDisabled: {
        backgroundColor: '#94a3b8',
    },
    exportButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});