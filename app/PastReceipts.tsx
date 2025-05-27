import Ionicons from '@expo/vector-icons/Ionicons';
import { getAuth } from '@react-native-firebase/auth';
import { collection, getDocs, getFirestore, query, where } from '@react-native-firebase/firestore';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
    items: ReceiptItem[]
    timestamp?: number | null
}

const PastReceipts = () => {
    const [modalVisible, setModalVisible] = useState(false)
    const [selectedReceipt, setSelectedReceipt] = useState<PastReceipt | null>(null)
    const [pastReceipts, setPastReceipts] = useState<PastReceipt[]>([])
    const router = useRouter()

    useEffect(() => {
        const fetchPastReceipts = async () => {
            try {
                const db = getFirestore()
                const receiptsRef = collection(db, 'Receipts')
                const q = query(
                    receiptsRef,
                    where('status', '==', 'complete'),
                    where('userId', '==', getAuth().currentUser?.uid)
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
                        items: data.items,
                        timestamp: data.timestamp || null,
                    })
                })
                // Sort by timestamp in descending order (newest first)
                receiptsData.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
                setPastReceipts(receiptsData)
            } catch (error) {
                Alert.alert('Error', 'Failed to fetch past receipts.')
                console.error('Error fetching past receipts:', error)
            }
        }
        fetchPastReceipts()
    }, [])

    const onReceiptPress = (receipt: PastReceipt) => {
        setSelectedReceipt(receipt)
        setModalVisible(true)
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    const renderItem = ({ item }: { item: PastReceipt }) => (
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
                <Text style={styles.receiptDate}>{formatDate(item.date)}</Text>
            </View>
            <View style={styles.receiptDetails}>
                <Text style={styles.itemsCount}>{item.items.length} items</Text>
                <Text style={styles.receiptTotal}>₹{item.total.toFixed(2)}</Text>
            </View>
        </TouchableOpacity>
    )

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                {/* <Text style={styles.headerTitle}>Past Receipts</Text> */}
                <Text style={styles.headerSubtitle}>View your completed transactions</Text>
            </View>

            {pastReceipts.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                    <Ionicons name="documents-outline" size={64} color="#94a3b8" />
                    <Text style={styles.emptyStateTitle}>No Past Receipts</Text>
                    <Text style={styles.emptyStateMessage}>
                        You don't have any completed receipts yet.{'\n'}
                        Create a new receipt to get started.
                    </Text>
                    <TouchableOpacity
                        style={styles.emptyStateButton}
                        onPress={() => router.push('/CreateReceipt')}
                    >
                        <Text style={styles.emptyStateButtonText}>Create New Receipt</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={pastReceipts}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
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
                            <>
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
                                            <Text style={styles.infoValue}>{formatDate(selectedReceipt.date)}</Text>
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
                                        <Text style={styles.totalLabel}>Total Amount</Text>
                                        <Text style={styles.totalAmount}>₹{selectedReceipt.total.toFixed(2)}</Text>
                                    </View>
                                </ScrollView>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
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
        paddingBottom: 20,
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
        maxHeight: '100%',
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
        marginBottom: 20,
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
        marginBlock: 8,
    },
    totalLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    totalAmount: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1a1a1a',
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
});

export default PastReceipts;
