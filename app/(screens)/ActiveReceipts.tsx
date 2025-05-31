import Ionicons from '@expo/vector-icons/Ionicons';
import { getAuth } from '@react-native-firebase/auth';
import { collection, doc, getDocs, getFirestore, query, updateDoc, where } from '@react-native-firebase/firestore';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Alert, FlatList, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, ToastAndroid, TouchableOpacity, View } from 'react-native';
import CustomDropdown from '../components/CustomDropdown';
import CustomAlertModal from '../../components/CustomAlertModal';

type ReceiptItem = {
    id: string
    name: string
    quantity: number
    price: number
}

type ActiveReceipt = {
    id: string
    receiptNumber: string
    date: string
    total: number
    items: ReceiptItem[]
    timestamp?: number | null
}

const ActiveReceipts = () => {
    const [modalVisible, setModalVisible] = useState(false)
    const [selectedReceipt, setSelectedReceipt] = useState<ActiveReceipt | null>(null)
    const [items, setItems] = useState<ReceiptItem[]>([])
    const [activeReceipts, setActiveReceipts] = useState<ActiveReceipt[]>([])
    const [newItemName, setNewItemName] = useState('')
    const [newItemPrice, setNewItemPrice] = useState('')

    // New state for inventory items
    const [inventoryItems, setInventoryItems] = useState<{ id: string; name: string; price: number }[]>([])
    const [selectedInventoryItemId, setSelectedInventoryItemId] = useState<string>('')

    // State for custom dropdown visibility
    const [dropdownVisible, setDropdownVisible] = useState(false)

    const [alert, setAlert] = useState<{ visible: boolean; title: string; message: string; actions?: any[] }>({ visible: false, title: '', message: '', actions: [] });
    const [pendingDelete, setPendingDelete] = useState<{ id: string; receiptNumber: string } | null>(null);

    const router = useRouter()

    const fetchActiveReceipts = async () => {
        try {
            const db = getFirestore()
            const receiptsRef = collection(db, 'Receipts')
            const q = query(
                receiptsRef,
                where('status', '==', 'active'),
                where('userId', '==', getAuth().currentUser?.uid)
            )
            const querySnapshot = await getDocs(q)
            const receiptsData: ActiveReceipt[] = []
            querySnapshot.forEach(doc => {
                const data = doc.data()
                receiptsData.push({
                    id: doc.id,
                    receiptNumber: data.receiptNumber,
                    date: data.createdAt?.toDate ? data.createdAt.toDate().toISOString().split('T')[0] : '',
                    total: data.total,
                    items: data.items,
                    timestamp: data.timestamp,
                })
            })
            // Sort receipts by timestamp in ascending order (older first)
            receiptsData.sort((a, b) => {
                const timestampA = a.timestamp || 0
                const timestampB = b.timestamp || 0
                return timestampA - timestampB
            })
            setActiveReceipts(receiptsData)
        } catch (error) {
            setAlert({ visible: true, title: 'Error', message: 'Failed to fetch active receipts.', actions: [{ text: 'OK' }] });
            console.error('Error fetching active receipts:', error)
        }
    }

    const deleteReceipt = async (receiptId: string, receiptNumber: string) => {
        setPendingDelete({ id: receiptId, receiptNumber });
    };

    // Use useFocusEffect to reload data when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            fetchActiveReceipts()
            fetchInventoryItems()
        }, [])
    )

    // Fetch inventory items for the user
    const fetchInventoryItems = async () => {
        try {
            const db = getFirestore()
            const userId = getAuth().currentUser?.uid
            if (!userId) return
            const usersRef = collection(db, 'Users')
            const q = query(usersRef, where('userId', '==', userId))
            const querySnapshot = await getDocs(q)
            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0]
                const userData = userDoc.data()
                const inventoryArray = userData.inventory || []
                // Map inventory array to expected format with id, name, price
                const itemsData = inventoryArray.map((item: any, index: number) => ({
                    id: item.id || index.toString(),
                    name: item.name,
                    price: item.price,
                }))
                setInventoryItems(itemsData)
                if (itemsData.length > 0) {
                    setSelectedInventoryItemId(itemsData[0].id)
                    setNewItemName(itemsData[0].name)
                    setNewItemPrice(itemsData[0].price.toString())
                }
            }
        } catch (error) {
            console.error('Error fetching inventory items:', error)
        }
    }

    const onReceiptPress = (receipt: ActiveReceipt) => {
        setSelectedReceipt(receipt)
        setItems(receipt.items)
        setModalVisible(true)
    }

    const updateQuantity = (itemId: string, newQuantity: string) => {
        const qty = parseInt(newQuantity, 10)
        if (isNaN(qty) || qty < 0) return
        setItems(prevItems =>
            prevItems.map(item =>
                item.id === itemId ? { ...item, quantity: qty } : item
            )
        )
    }

    const addItem = (name: string, price: number) => {
        const newItem: ReceiptItem = {
            id: (Math.random() * 1000000).toFixed(0),
            name,
            quantity: 1,
            price,
        }
        setItems(prevItems => [...prevItems, newItem])
    }

    const removeItem = (itemId: string) => {
        setItems(prevItems => prevItems.filter(item => item.id !== itemId))
    }

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    }

    const saveChanges = async () => {
        if (selectedReceipt) {
            const db = getFirestore()
            const receiptRef = doc(db, 'Receipts', selectedReceipt.id)
            const updatedTotal = calculateTotal()
            try {
                await updateDoc(receiptRef, {
                    items: items,
                    total: updatedTotal,
                })
                // Update local state to reflect changes
                setActiveReceipts(prevReceipts =>
                    prevReceipts.map(r =>
                        r.id === selectedReceipt.id ? { ...r, items: items, total: updatedTotal } : r
                    )
                )
                setModalVisible(false)
                await showToast(`Receipt ${selectedReceipt.receiptNumber} has been updated`)
            } catch (error) {
                setAlert({ visible: true, title: 'Error', message: 'Failed to update receipt. Please try again.', actions: [{ text: 'OK' }] });
                console.error('Error updating receipt:', error)
            }
        }
    }

    const showToast = async (message: string) => {
        if (Platform.OS === 'android') {
            ToastAndroid.showWithGravity(
                `${message}`,
                ToastAndroid.SHORT,
                ToastAndroid.BOTTOM,
            );
        } else {
            setAlert({ visible: true, title: 'Receiptify', message, actions: [{ text: 'OK' }] });
        }
    };

    const finalizeReceipt = async () => {
        if (selectedReceipt) {
            const db = getFirestore()
            const receiptRef = doc(db, 'Receipts', selectedReceipt.id)
            try {
                await updateDoc(receiptRef, {
                    status: 'complete',
                })
                // Remove the finalized receipt from activeReceipts list
                setActiveReceipts(prevReceipts =>
                    prevReceipts.filter(r => r.id !== selectedReceipt.id)
                )
                setModalVisible(false)
                await showToast(`Receipt ${selectedReceipt.receiptNumber} has been finalized`)
            } catch (error) {
                setAlert({ visible: true, title: 'Error', message: 'Failed to finalize receipt. Please try again.', actions: [{ text: 'OK' }] });
                console.error('Error finalizing receipt:', error)
            }
        }
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    const renderItem = ({ item }: { item: ActiveReceipt }) => (
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
                <View style={styles.receiptHeaderRight}>
                    <Text style={styles.receiptDate}>{formatDate(item.date)}</Text>
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={(e) => {
                            e.stopPropagation();
                            deleteReceipt(item.id, item.receiptNumber);
                        }}
                    >
                        <Ionicons name="trash-outline" size={20} color="#FF5252" />
                    </TouchableOpacity>
                </View>
            </View>
            <View style={styles.receiptDetails}>
                <Text style={styles.itemsCount}>{item.items.length} items</Text>
                <Text style={styles.receiptTotal}>₹{item.total.toFixed(2)}</Text>
            </View>
        </TouchableOpacity>
    )

    const handleAddItem = () => {
        if (!newItemName.trim() || !newItemPrice.trim()) {
            setAlert({ visible: true, title: 'Error', message: 'Please enter both item name and price.', actions: [{ text: 'OK' }] });
            return
        }
        const price = parseFloat(newItemPrice)
        if (isNaN(price) || price <= 0) {
            setAlert({ visible: true, title: 'Error', message: 'Please enter a valid positive price.', actions: [{ text: 'OK' }] });
            return
        }
        addItem(newItemName.trim(), price)
        setNewItemName('')
        setNewItemPrice('')
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                {/* <Text style={styles.headerTitle}>Active Receipts</Text> */}
                <Text style={styles.headerSubtitle}>Manage your ongoing transactions</Text>
            </View>

            {activeReceipts.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                    <Ionicons name="receipt-outline" size={64} color="#94a3b8" />
                    <Text style={styles.emptyStateTitle}>No Active Receipts</Text>
                    <Text style={styles.emptyStateMessage}>
                        You don't have any active receipts yet.{'\n'}
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
                    data={activeReceipts}
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
                            <Text style={styles.modalTitle}>Edit Receipt</Text>
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
                                    contentContainerStyle={{ flexGrow: 1 }}
                                    showsVerticalScrollIndicator={false}
                                >
                                    <View style={styles.modalBody}>
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
                                            <Text style={styles.sectionTitle}>Items</Text>
                                            {items.map((item) => (
                                                <View key={item.id} style={styles.itemCard}>
                                                    <View style={styles.itemInfo}>
                                                        <Text style={styles.itemName}>{item.name}</Text>
                                                        <Text style={styles.itemPrice}>₹{item.price.toFixed(2)}</Text>
                                                    </View>
                                                    <View style={styles.quantityControls}>
                                                        <TouchableOpacity
                                                            onPress={() => {
                                                                if (item.quantity > 1) {
                                                                    updateQuantity(item.id, (item.quantity - 1).toString())
                                                                } else {
                                                                    removeItem(item.id)
                                                                }
                                                            }}
                                                            style={[styles.controlButton, item.quantity === 1 && styles.controlButtonWarning]}
                                                        >
                                                            <Ionicons name="remove" size={16} color="#fff" />
                                                        </TouchableOpacity>
                                                        <TextInput
                                                            style={styles.quantityInput}
                                                            keyboardType="numeric"
                                                            value={item.quantity.toString()}
                                                            onChangeText={text => updateQuantity(item.id, text)}
                                                        />
                                                        <TouchableOpacity
                                                            onPress={() => updateQuantity(item.id, (item.quantity + 1).toString())}
                                                            style={styles.controlButton}
                                                        >
                                                            <Ionicons name="add" size={16} color="#fff" />
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            ))}
                                        </View>

                                        <View style={styles.addItemSection}>
                                            <Text style={styles.sectionTitle}>Add New Item</Text>
                                            <View style={styles.addItemForm}>
                                                <View style={styles.addItemInputs}>
                                                    <CustomDropdown
                                                        items={inventoryItems}
                                                        selectedItemId={selectedInventoryItemId}
                                                        onSelectItem={(item) => {
                                                            setSelectedInventoryItemId(item.id)
                                                            setNewItemName(item.name)
                                                            setNewItemPrice(item.price.toString())
                                                        }}
                                                        placeholder="Select item"
                                                    />
                                                </View>
                                                <TouchableOpacity
                                                    style={styles.addButton}
                                                    onPress={handleAddItem}
                                                >
                                                    <Ionicons name="add" size={24} color="#fff" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        <View style={styles.totalSection}>
                                            <Text style={styles.totalLabel}>Total Amount</Text>
                                            <Text style={styles.totalAmount}>₹{calculateTotal().toFixed(2)}</Text>
                                        </View>
                                    </View>
                                </ScrollView>

                                <View style={styles.modalFooter}>
                                    <TouchableOpacity
                                        style={[styles.footerButton, styles.saveButton]}
                                        onPress={saveChanges}
                                    >
                                        <Text style={styles.buttonText}>Save Changes</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.footerButton, styles.finalizeButton]}
                                        onPress={finalizeReceipt}
                                    >
                                        <Text style={styles.buttonText}>Finalize Receipt</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>

            <CustomAlertModal
                visible={!!pendingDelete}
                title="Delete Receipt"
                message={pendingDelete ? `Are you sure you want to delete receipt ${pendingDelete.receiptNumber}?` : ''}
                actions={[
                    { text: 'Cancel', style: 'cancel', onPress: () => setPendingDelete(null) },
                    {
                        text: 'Delete', style: 'destructive', onPress: async () => {
                            if (!pendingDelete) return;
                            try {
                                const db = getFirestore();
                                const receiptRef = doc(db, 'Receipts', pendingDelete.id);
                                await updateDoc(receiptRef, { status: 'deleted' });
                                setActiveReceipts(prevReceipts => prevReceipts.filter(r => r.id !== pendingDelete.id));
                                await showToast(`Receipt ${pendingDelete.receiptNumber} has been deleted`);
                            } catch (error) {
                                setAlert({ visible: true, title: 'Error', message: 'Failed to delete receipt. Please try again.', actions: [{ text: 'OK' }] });
                                console.error('Error deleting receipt:', error);
                            } finally {
                                setPendingDelete(null);
                            }
                        }
                    }
                ]}
                onRequestClose={() => setPendingDelete(null)}
            />
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
        textAlign: 'center',
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
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        maxHeight: '90%',
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
        flexGrow: 1,
    },
    modalBody: {
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
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 12,
    },
    itemCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#eee',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemInfo: {
        flex: 1,
        marginRight: 12,
    },
    itemName: {
        fontSize: 15,
        color: '#1a1a1a',
        marginBottom: 2,
    },
    itemPrice: {
        fontSize: 14,
        fontWeight: '500',
        color: '#2196F3',
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    controlButton: {
        backgroundColor: '#2196F3',
        borderRadius: 6,
        width: 28,
        height: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    controlButtonWarning: {
        backgroundColor: '#FF5252',
    },
    quantityInput: {
        width: 40,
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 6,
        paddingHorizontal: 4,
        paddingVertical: 2,
        fontSize: 14,
        textAlign: 'center',
    },
    addItemSection: {
        marginBottom: 24,
    },
    addItemForm: {
        flexDirection: 'row',
        gap: 12,
    },
    addItemInputs: {
        flex: 1,
        flexDirection: 'row',
        gap: 12,
    },
    addItemInput: {
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 8,
        padding: 12,
        fontSize: 15,
        backgroundColor: '#fff',
    },
    nameInput: {
        flex: 2,
    },
    priceInput: {
        flex: 1,
    },
    addButton: {
        backgroundColor: '#2196F3',
        borderRadius: 8,
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    totalSection: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 16,
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
    modalFooter: {
        flexDirection: 'row',
        gap: 12,
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    footerButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveButton: {
        backgroundColor: '#2196F3',
    },
    finalizeButton: {
        backgroundColor: '#4CAF50',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
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
    deleteButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
    },
    receiptHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    dropdown: {
        position: 'absolute',
        width: '100%',
        zIndex: 1000,
    },
    dropdownItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    dropdownItemText: {
        fontSize: 15,
        color: '#1a1a1a',
    },
});

export default ActiveReceipts;
