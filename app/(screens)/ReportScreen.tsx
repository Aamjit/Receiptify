import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform, GestureResponderEvent } from 'react-native';
import { getAuth } from '@react-native-firebase/auth';
import { collection, query, where, getDocs, getFirestore, Timestamp } from '@react-native-firebase/firestore';
import { LineChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { generateHTMLForReport } from '../../helpers/generateHTMLForReport';
import DateRangePicker from '../components/DateRangePicker';
import Ionicons from '@expo/vector-icons/Ionicons';

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

export default function Report() {
    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [loading, setLoading] = useState({ state: false, message: '' });
    const [selectedRange, setSelectedRange] = useState<DateRange>(dateRanges[0]); // Default to Last 30 Days
    const [totalSales, setTotalSales] = useState(0);
    const [averageTransaction, setAverageTransaction] = useState(0);
    const [topItems, setTopItems] = useState<{ name: string; quantity: number; revenue: number }[]>([]);
    const [dailySales, setDailySales] = useState<{ date: string; total: number }[]>([]);
    const [exporting, setExporting] = useState(false);
    const [userData, setUserDate] = useState<any>();

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
        receiptsData.forEach(receipt => {
            const date = receipt.date;
            salesByDate.set(date, (salesByDate.get(date) || 0) + receipt.total);
        });

        const dailySalesArray = Array.from(salesByDate.entries())
            .map(([date, total]) => ({ date, total }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // console.log('dailySalesArray:', dailySalesArray);
        setDailySales(dailySalesArray);
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
            Alert.alert('Error', 'Failed to fetch user data');
        } finally {
            setLoading({ state: false, message: '' });
        }
    }

    useEffect(() => {
        fetchReceipts();
    }, [selectedRange]);

    useEffect(() => {
        fetchUserData();
    }, []);

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
            selectedRangeLabel: selectedRange.label,
            totalSales,
            averageTransaction,
            topItems,
            dailySales,
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
            Alert.alert('Error', 'Failed to generate PDF report');
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
                Alert.alert('Success', 'Report generated successfully');
            }
        } catch (error) {
            console.error('Error downloading report:', error);
            Alert.alert('Error', 'Failed to download report');
        } finally {
            setLoading({ state: false, message: '' });
        }
    };

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
                    onError={msg => Alert.alert('Date Error', msg)}
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
                            Alert.alert('Unavailable', 'Email Report is currently unavailable.');
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

            {dailySales.length > 0 && (
                <View style={styles.chartContainer}>
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
        marginBottom: 16,
        elevation: 2,
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