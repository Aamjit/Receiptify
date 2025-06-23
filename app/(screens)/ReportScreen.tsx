import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Dimensions } from 'react-native';
import { LineChart } from "react-native-chart-kit";
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { generateHTMLForReport } from '../../utils/generateHTMLForReport';
import DateRangePicker from '../components/DateRangePicker';
import CustomAlertModal from '../../components/CustomAlertModal';
import { useAppContext } from '@/hooks/useApp';
import { sendEmail } from '@/api/sendEmail';
import minifier from '@/utils/minifier';
import { generateReportData } from '@/api/serverApis';

type ReceiptItem = {
    id: string;
    name: string;
    quantity: number;
    price: number;
};

type Receipt = {
    id: string
    receiptNumber: string
    date: string
    total: number
    subtotal?: number
    discount?: number // Add discount field
    items: ReceiptItem[]
    timestamp?: number | null
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
    // const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [loading, setLoading] = useState({ state: false, message: '' });
    const [selectedRange, setSelectedRange] = useState<DateRange>(dateRanges[0]); // Default to Last 30 Days
    const [totalSales, setTotalSales] = useState(0);
    const [averageTransaction, setAverageTransaction] = useState(0);
    const [topItems, setTopItems] = useState<{ name: string; quantity: number; revenue: number }[]>([]);
    const [dailySales, setDailySales] = useState<{ date: string; total: number }[]>([]);
    const [dailySalesCount, setDailySalesCount] = useState<{ date: string; count: number }[]>([]);
    const [exporting, setExporting] = useState(false);
    const { User } = useAppContext();
    const [alert, setAlert] = useState<{ visible: boolean; title: string; message: string; actions?: any[] }>({ visible: false, title: '', message: '', actions: [] });
    const [receiptsHeatmap, setReceiptsHeatmap] = useState<{ day: string; hour: number; count: number }[]>([]);


    useEffect(() => {
        fetchReceipts();
    }, [selectedRange]);

    const fetchReceipts = async () => {
        try {
            setLoading({ state: true, message: 'Fetching data...\nThis might take while if the server is sleeping.' });

            const report = await generateReportData(User?.userId, selectedRange.startDate, selectedRange.endDate);

            populateData(report);
        } catch (error) {
            console.error('Error fetching receipts:', error);
        } finally {
            setTimeout(() => {
                setLoading({ state: false, message: '' });
            }, 1000);
        }
    };

    const populateData = (report: any) => {
        // Calculate total sales
        setTotalSales(report?.totalSales);

        // Calculate average transaction
        setAverageTransaction(report?.averageTransaction);

        // Process top selling items
        setTopItems(report?.topItems);

        // Process daily sales
        setDailySales(report?.dailySales);
        setDailySalesCount(report?.dailySalesCountArray);

        // Receipts Heatmap: Count receipts by day of week and hour
        setReceiptsHeatmap(report?.heatMap);
    }

    const generateHTML = () => {

        // Add a default businessInfo object for the report
        const businessInfo = {
            name: User?.name || "Partnered with Receiptify",
            address: User?.address,
            phone: User?.phoneNumber,
            email: User?.email,
            website: User?.website,
            logo: User?.businessLogo, // Use your logo asset here
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

    const handleDownloadReport = async () => {

        // if (receipts?.length <= 0) {
        //     setAlert({ visible: true, title: 'Error', message: 'No receipt data available', actions: [{ text: 'OK', onPress: () => setAlert({ ...alert, visible: false }) }] });
        //     return
        // }

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

    const sendReportEmail = async () => {

        if (!User?.email) {
            setAlert({ visible: true, title: 'Error', message: 'No user email found.', actions: [{ text: 'OK', onPress: () => setAlert({ ...alert, visible: false }) }] });
            return;
        }

        try {
            setLoading({ state: true, message: 'Sending email...' });
            // 1. Generate the PDF file from HTML
            const html = generateHTML();

            const data = {
                name: User?.name,
                to: [User?.email],
                subject: "Receiptify: Sales Report generated as requested",
                text: `Hi ${User?.name}\n\nPlease find below attached PDF for your sales report.`,
                html: minifier.minifyHTML(html)
            }

            const emailResp = await sendEmail(data)

            setAlert({ visible: true, title: 'Success', message: 'Report sent to your email!', actions: [{ text: 'OK', onPress: () => setAlert({ ...alert, visible: false }) }] });
        } catch (error: any) {
            setAlert({ visible: true, title: 'Error', message: error.message || 'Failed to send email.', actions: [{ text: 'OK', onPress: () => setAlert({ ...alert, visible: false }) }] });
        } finally {
            setLoading({ state: false, message: '' });
        }
    };

    if (loading.state) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2196F3" />
                <Text style={{ marginTop: 10, color: '#666666', textAlign: 'center' }}>{loading.message}</Text>
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
                    style={[styles.exportButton, { backgroundColor: "rgb(234, 67, 53)" }, exporting ? styles.exportButtonDisabled : null]}
                    onPress={(e) => {
                        e.preventDefault()

                        setAlert({
                            visible: true, title: 'Note', message: 'Email Report is applicable for only once a day', actions: [
                                {
                                    style: 'cancel',
                                    text: 'Later', onPress: () => {
                                        setAlert({ ...alert, visible: false });
                                    }
                                }, {
                                    text: 'Send Email', onPress: () => {
                                        setAlert({ ...alert, visible: false });
                                        sendReportEmail()
                                    }
                                }]
                        });

                    }}
                    disabled={false}
                >
                    {/* <Ionicons name="lock-closed" size={18} color="#fff" style={{ marginRight: 6 }} /> */}
                    <Text style={styles.exportButtonText}>Email Report</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.exportButton}
                    onPress={(e) => {
                        e.preventDefault()
                        handleDownloadReport()
                    }}
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
                {topItems.length === 0 ? (
                    <Text style={{ color: '#888', textAlign: 'center', marginVertical: 12 }}>
                        No sales data for this period.
                    </Text>
                ) : (
                    topItems.map((item, index) => (
                        <View key={index} style={styles.topItemRow}>
                            <Text style={styles.itemName}>{item.name}</Text>
                            <View style={styles.itemDetails}>
                                <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                                <Text style={styles.itemRevenue}>₹{item.revenue.toFixed(2)}</Text>
                            </View>
                        </View>
                    ))
                )}
            </View>

            {(dailySales.length > 0 || dailySalesCount.length > 0 || receiptsHeatmap.length > 0)
                && <View style={styles.chartContainer}>
                    <Text style={[styles.sectionTitle, { fontSize: 28 }]}>Report Visualization</Text>
                    {dailySales.length > 0 && (
                        <View>
                            <Text style={[styles.sectionTitle]}>Sales Trend</Text>
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

                    {receiptsHeatmap.length > 0 && (
                        <View>
                            <Text style={styles.sectionTitle}>Receipts Heatmap (Day vs Hour)</Text>
                            <ScrollView horizontal>
                                <View>
                                    {/* Simple text-based heatmap for now */}
                                    <View style={{ flexDirection: 'row', marginBottom: 4, alignItems: 'flex-end', backgroundColor: '#f3f4f6', padding: 2, borderRadius: 4 }}>
                                        <Text style={{ width: 40 }}></Text>
                                        {[...Array(24).keys()].map(h => (
                                            <View key={h} style={{ width: 22, height: 22, alignItems: 'center', margin: 1, justifyContent: 'center' }}>
                                                <Text style={{ textAlign: 'center', fontSize: 10, lineHeight: 22 }}>{h}</Text>
                                            </View>
                                        ))}
                                    </View>
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                        <View key={day} style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Text style={{ width: 40, fontSize: 12, color: '#888' }}>{day}</Text>
                                            {[...Array(24).keys()].map(hour => {
                                                const cell = receiptsHeatmap.find(e => e.day === day && e.hour === hour);
                                                const count = cell ? cell.count : 0;
                                                const bg = count === 0 ? '#f3f4f6' : `rgba(33,150,243,${Math.min(0.15 + count * 0.15, 0.9)})`;
                                                return (
                                                    <View key={hour} style={{ width: 22, height: 22, backgroundColor: bg, margin: 1, borderRadius: 3, alignItems: 'center', justifyContent: 'center' }}>
                                                        {count > 0 && <Text style={{ fontSize: 10, color: '#fff', fontWeight: 'bold' }}>{count}</Text>}
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    ))}
                                </View>
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