import Ionicons from '@expo/vector-icons/Ionicons';
import { getAuth } from '@react-native-firebase/auth';
import { collection, getDocs, getFirestore, query, where, Timestamp } from '@react-native-firebase/firestore';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DatePicker from '../components/DatePicker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { generateHTMLForReceipt } from '../../helpers/generateHTMLForReceipt';
import CustomAlertModal from '../../components/CustomAlertModal';

type ReceiptItem = {
    name: string
    quantity: number
    price: number
}

type PastReceipt = {
    id: string
    receiptNumber: string
    date: string
    total: number
    totalAfterDiscount: number
    discount?: number // Add discount field
    items: ReceiptItem[]
    timestamp?: number | null
}

const PastReceipts = () => {
    const [modalVisible, setModalVisible] = useState(false)
    const [selectedReceipt, setSelectedReceipt] = useState<PastReceipt | null>(null)
    const [pastReceipts, setPastReceipts] = useState<PastReceipt[]>([])
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [isLoading, setIsLoading] = useState({ state: false, message: '' })
    const [userData, setUserData] = useState<any>(null)
    const [alert, setAlert] = useState<{ visible: boolean; title: string; message: string; actions?: any[] }>({ visible: false, title: '', message: '', actions: [] });
    const router = useRouter()

    useEffect(() => {
        const fetchUserData = async () => {
            const user = getAuth().currentUser;
            if (user) {
                const db = getFirestore();
                const userDoc = await getDocs(query(collection(db, 'Users'), where('userId', '==', user.uid)));
                if (!userDoc.empty) {
                    setUserData(userDoc.docs[0].data());
                }
            }
        }
        fetchUserData()
    }, [])

    useEffect(() => {
        const fetchPastReceipts = async () => {
            setIsLoading({ state: true, message: 'Loading past receipts...' })
            try {
                const db = getFirestore()
                const receiptsRef = collection(db, 'Receipts')

                // Set start of day
                const startOfDay = new Date(selectedDate);
                startOfDay.setHours(0, 0, 0, 0);

                // Set end of day
                const endOfDay = new Date(selectedDate);
                endOfDay.setHours(23, 59, 59, 999);

                const q = query(
                    receiptsRef,
                    where('status', '==', 'complete'),
                    where('userId', '==', getAuth().currentUser?.uid),
                    where('createdAt', '>=', Timestamp.fromDate(startOfDay)),
                    where('createdAt', '<=', Timestamp.fromDate(endOfDay))
                )
                const querySnapshot = await getDocs(q)
                const receiptsData: PastReceipt[] = []
                querySnapshot.forEach(doc => {
                    const data = doc.data()
                    receiptsData.push({
                        id: doc.id,
                        receiptNumber: data.receiptNumber,
                        date: data.createdAt?.toDate ? data.createdAt.toDate().toISOString().split('T')[0] : '',
                        total: data.total,
                        totalAfterDiscount: data.totalAfterDiscount,
                        discount: data.discount || 0, // Add discount
                        items: data.items,
                        timestamp: data.timestamp || null,
                    })
                })
                // Sort by timestamp in descending order (newest first)
                receiptsData.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
                setPastReceipts(receiptsData)
            } catch (error) {
                setAlert({ visible: true, title: 'Error', message: 'Failed to fetch past receipts.', actions: [{ text: 'OK', onPress: () => setAlert({ ...alert, visible: false }) }] });
                console.error('Error fetching past receipts:', error)
            } finally {
                setTimeout(() => {
                    setIsLoading({ state: false, message: '' })
                }, 500); // Simulate network delay
            }
        }
        fetchPastReceipts()
        // Get user data from firestore

    }, [selectedDate])

    const onReceiptPress = (receipt: PastReceipt) => {
        setSelectedReceipt(receipt)
        setModalVisible(true)
    }

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    const generatePDF = async () => {
        setIsLoading({ state: true, message: 'Generating PDF...' });
        if (!selectedReceipt) return;
        try {
            const html = generateHTMLForReceipt({
                receiptNumber: selectedReceipt.receiptNumber,
                date: selectedReceipt.date,
                time: selectedReceipt.timestamp ? new Date(selectedReceipt.timestamp).toLocaleTimeString() : '',
                items: selectedReceipt.items,
                total: selectedReceipt.total,
                discount: selectedReceipt.discount || 0, // Pass discount to HTML generator
                totalAfterDiscount: selectedReceipt.totalAfterDiscount, // Pass totalAfterDiscount to HTML generator
                businessInfo: {
                    name: userData?.name || "Your Business Name",
                    address: userData?.address || "Area, City, Country",
                    phone: userData?.phoneNumber || "",
                    email: userData?.email || "contact@business.com",
                    website: userData?.website || "www.business.com",
                    // logo: userData?.businessLogo || "", // Optional logo URL
                }
            });
            const { uri } = await Print.printToFileAsync({ html });
            return uri;
        } catch (error) {
            setAlert({ visible: true, title: 'Error', message: 'Failed to generate PDF.', actions: [{ text: 'OK', onPress: () => setAlert({ ...alert, visible: false }) }] });
            console.error('PDF generation error:', error);
            return null;
        } finally {
            setIsLoading({ state: false, message: '' });
        }
    };

    const handleSharePDF = async () => {
        setIsLoading({ state: true, message: 'Preparing PDF for sharing...' });
        try {
            const pdfUri = await generatePDF();
            if (pdfUri) {
                try {
                    await Sharing.shareAsync(pdfUri, {
                        mimeType: 'application/pdf',
                        dialogTitle: 'Share Receipt PDF',
                    });
                    setAlert({ visible: true, title: 'Success', message: 'Report generated successfully', actions: [{ text: 'OK', onPress: () => setAlert({ ...alert, visible: false }) }] });
                } catch (error) {
                    setAlert({ visible: true, title: 'Error', message: 'Failed to share PDF.', actions: [{ text: 'OK', onPress: () => setAlert({ ...alert, visible: false }) }] });
                    console.error('PDF sharing error:', error);
                }
            }
        } catch (error) {
            setAlert({ visible: true, title: 'Error', message: 'Failed to prepare PDF for sharing.', actions: [{ text: 'OK', onPress: () => setAlert({ ...alert, visible: false }) }] });
            console.error('PDF preparation error:', error);
        } finally {
            setIsLoading({ state: false, message: '' });
        }
    };

    // Calculate total amount for all receipts
    const totalForDay = pastReceipts.reduce((sum, r) => sum + (r.total || 0), 0);

    if (isLoading.state) {
        return <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.loadingText}>{isLoading.message}</Text>
        </View>
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                {/* <Text style={styles.headerTitle}>Past Receipts</Text> */}
                <Text style={styles.headerSubtitle}>Pick a date to view</Text>

                <DatePicker
                    selectedDate={selectedDate}
                    onDateChange={setSelectedDate}
                    disableFutureDates={true}
                />
            </View>

            {/* Show total only if there are receipts */}
            {pastReceipts.length > 0 && (
                <View style={styles.totalForDayContainer}>
                    <Text style={styles.totalForDayLabel}>Total for {selectedDate.toLocaleDateString()}:</Text>
                    <Text style={styles.totalForDayAmount}>₹{totalForDay.toFixed(2)}</Text>
                </View>
            )}

            {isLoading.state ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2196F3" />
                    <Text style={styles.loadingText}>{isLoading.message}</Text>
                </View>
            ) : pastReceipts.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                    <Ionicons name="documents-outline" size={64} color="#94a3b8" />
                    <Text style={styles.emptyStateTitle}>No Receipts</Text>
                    <Text style={styles.emptyStateMessage}>
                        {selectedDate.toDateString() === new Date().toDateString()
                            ? "You don't have any completed receipts yet.\nCreate a new receipt to get started."
                            : `There are no completed receipts on \n${selectedDate.toDateString().slice(4)}.`}
                    </Text>
                    {selectedDate.toDateString() === new Date().toDateString() && (
                        <TouchableOpacity
                            style={styles.emptyStateButton}
                            onPress={() => router.push('/CreateReceipt')}
                        >
                            <Text style={styles.emptyStateButtonText}>Create New Receipt</Text>
                        </TouchableOpacity>
                    )}
                </View>
            ) : (
                <FlatList
                    data={pastReceipts}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.receiptCard}
                            onPress={() => onReceiptPress(item)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.receiptHeader}>
                                <View style={styles.receiptNumberContainer}>
                                    <Ionicons name="receipt-outline" size={20} color="#2196F3" />
                                    <Text style={styles.receiptNumber}>{item.receiptNumber}</Text>
                                </View>
                                <Text style={styles.receiptDate}>{formatDate(new Date(item.date))}</Text>
                            </View>
                            <View style={styles.receiptDetails}>
                                <Text style={styles.itemsCount}>{item.items.length} items</Text>
                                <Text style={styles.receiptTotal}>₹{item.total.toFixed(2)}</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Receipt Details</Text>
                            <TouchableOpacity
                                style={styles.modalCloseButton}
                                onPress={() => setModalVisible(false)}
                            >
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>
                        {selectedReceipt && (
                            <ScrollView
                                style={styles.modalScrollView}
                                showsVerticalScrollIndicator={false}
                            >
                                <View style={styles.receiptInfo}>
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Receipt Number</Text>
                                        <Text style={styles.infoValue}>{selectedReceipt.receiptNumber}</Text>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Date</Text>
                                        <Text style={styles.infoValue}>{formatDate(new Date(selectedReceipt.date))}</Text>
                                    </View>
                                    {selectedReceipt.timestamp && (
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Time</Text>
                                            <Text style={styles.infoValue}>
                                                {new Date(selectedReceipt.timestamp).toLocaleTimeString()}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                <View style={styles.itemsSection}>
                                    <Text style={styles.itemsSectionTitle}>Items</Text>
                                    {selectedReceipt.items.map((item, index) => (
                                        <View key={index} style={styles.itemCard}>
                                            <View style={styles.itemInfo}>
                                                <Text style={styles.itemName}>{item.name}</Text>
                                                <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                                            </View>
                                            <Text style={styles.itemPrice}>₹{(item.price * item.quantity).toFixed(2)}</Text>
                                        </View>
                                    ))}
                                </View>

                                <View style={styles.totalSection}>
                                    <View style={{ marginBottom: 6 }}>
                                        <Text style={styles.totalLabel}>Subtotal</Text>
                                        <Text style={styles.subtotalAmount}>₹{selectedReceipt.total ? selectedReceipt.total.toFixed(2) : '0.00'}</Text>
                                    </View>
                                    <View style={{ marginBottom: 6 }}>
                                        <Text style={styles.discountLabel}>Discount</Text>
                                        <Text style={styles.discountAmount}>{typeof selectedReceipt.discount === 'number' ? selectedReceipt.discount : 0}%</Text>
                                    </View>
                                    <View style={{ borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 8, marginTop: 2 }}>
                                        <Text style={styles.totalLabel}>Total Amount</Text>
                                        <Text style={styles.finalTotalAmount}>₹{selectedReceipt.totalAfterDiscount ? selectedReceipt.totalAfterDiscount.toFixed(2) : selectedReceipt.total.toFixed(2)}</Text>
                                    </View>
                                </View>
                            </ScrollView>
                        )}
                        <TouchableOpacity
                            style={styles.shareButton}
                            onPress={handleSharePDF}
                        >
                            <Text style={styles.shareButtonText}>Download / Share PDF</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <CustomAlertModal
                visible={alert.visible}
                title={alert.title}
                message={alert.message}
                actions={alert.actions}
                onRequestClose={() => setAlert({ ...alert, visible: false })}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        // paddingBottom: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 15,
        color: '#666',
    },
    listContent: {
        padding: 20,
        gap: 16,
    },
    receiptCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
    },
    receiptHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    receiptNumberContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    receiptNumber: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    receiptDate: {
        fontSize: 14,
        color: '#666',
    },
    receiptDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemsCount: {
        fontSize: 14,
        color: '#666',
    },
    receiptTotal: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2196F3',
    },
    modalOverlay: {
        flex: 1,
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        maxHeight: '90%',
        backgroundColor: '#fff',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    modalCloseButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
    },
    modalScrollView: {
        padding: 20,
    },
    receiptInfo: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    infoLabel: {
        fontSize: 14,
        color: '#666',
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1a1a1a',
    },
    itemsSection: {
        marginBottom: 10,
    },
    itemsSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 12,
    },
    itemCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        gap: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#eee',
    },
    itemInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    itemName: {
        fontSize: 15,
        color: '#1a1a1a',
        flex: 1,
    },
    itemQuantity: {
        fontSize: 14,
        color: '#666',
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    itemPrice: {
        fontSize: 15,
        fontWeight: '500',
        color: '#2196F3',
    },
    totalSection: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 16,
        marginBottom: 30,
    },
    subtotalAmount: {
        fontSize: 20,
        fontWeight: '600',
        color: '#334155',
    },
    discountLabel: {
        fontSize: 13,
        color: '#64748b',
        marginBottom: 2,
    },
    discountAmount: {
        fontSize: 18,
        color: '#f59e42',
        fontWeight: '600',
    },
    totalLabel: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '500',
        marginBottom: 2,
        letterSpacing: 0.1,
    },
    finalTotalAmount: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#0ea5e9',
        marginTop: 2,
    },
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    emptyStateTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1e293b',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyStateMessage: {
        fontSize: 15,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    emptyStateButton: {
        backgroundColor: '#2196F3',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    emptyStateButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    shareButton: {
        backgroundColor: '#2196F3',
        paddingVertical: 14,
        borderRadius: 12,
        margin: 20,
        alignItems: 'center',
    },
    shareButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    totalForDayContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#e0f2fe',
        borderRadius: 10,
        marginHorizontal: 20,
        marginTop: 16,
        marginBottom: 4,
        paddingVertical: 12,
        paddingHorizontal: 18,
    },
    totalForDayLabel: {
        fontSize: 16,
        color: '#1e293b',
        fontWeight: '600',
    },
    totalForDayAmount: {
        fontSize: 20,
        color: '#0ea5e9',
        fontWeight: '700',
    },
});

export default PastReceipts;
