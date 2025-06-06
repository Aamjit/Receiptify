import Ionicons from '@expo/vector-icons/Ionicons'
import { getAuth } from '@react-native-firebase/auth'
import { addDoc, collection, getDocs, getFirestore, query, where, doc, updateDoc } from '@react-native-firebase/firestore'
import { LinearGradient } from 'expo-linear-gradient'
import { useFocusEffect, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import CustomAlertModal from '@/components/CustomAlertModal';

type InventoryItem = {
    id: string
    name: string
    category: string
    price: number
    availability: string
}

const groupByCategory = (items: InventoryItem[]) => {
    return items.reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = []
        }
        acc[item.category].push(item)
        return acc
    }, {} as Record<string, InventoryItem[]>)
}

const CreateReceipt = () => {
    const [receiptNumber, setReceiptNumber] = useState<string>('')
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
    const [receiptItems, setReceiptItems] = useState<Record<string, number>>({})
    const [discount, setDiscount] = useState<number>(0); // Discount in percentage
    const router = useRouter();
    const [loading, setLoading] = useState({
        state: true,
        text: "",
    });
    const [userDocId, setUserDocId] = useState<string>('');
    const [alert, setAlert] = useState<{ visible: boolean; title: string; message: string; actions?: Array<{ text: string; onPress?: () => void; style?: any }> }>({ visible: false, title: '', message: '' });
    const userData = getAuth().currentUser

    useEffect(() => {
        fetchInventory();
    }, []);

    // Use useFocusEffect to reload data when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            fetchInventory()
        }, [])
    )

    const generateNextReceiptNumber = (lastNumber: number | undefined) => {
        // If no last number exists, start from 100
        const nextNumber = (lastNumber || 99) + 1;
        return nextNumber.toString();
    }

    const fetchInventory = async () => {
        try {
            const userEmail = getAuth().currentUser?.email;
            if (!userEmail) {
                console.error('User not authenticated');
                setLoading({ state: false, text: "" });
                return;
            }

            const userQuery = await getDocs(
                query(collection(getFirestore(), 'Users'),
                    where('email', '==', userEmail))
            );

            if (!userQuery.empty) {
                const userDoc = userQuery.docs[0];
                const userData = userDoc.data();
                setUserDocId(userDoc.id);

                // Ensure prices are converted to numbers
                const inventory = (userData.inventory || []).map((item: any) => ({
                    ...item,
                    price: typeof item.price === 'string' ? parseFloat(item.price) : item.price
                }));
                setInventoryItems(inventory);

                // Generate receipt number based on lastReceiptNumber
                const nextNumber = generateNextReceiptNumber(userData.lastReceiptNumber);
                setReceiptNumber(nextNumber);
            }
        } catch (error) {
            console.error('Error fetching inventory:', error);
        } finally {
            setTimeout(() => {
                setLoading({ state: false, text: "" });
            }, 500);
        }
    };

    const addItem = (itemId: string) => {
        setReceiptItems(prev => {
            const currentQty = prev[itemId] || 0
            return { ...prev, [itemId]: currentQty + 1 }
        })
    }

    const removeItem = (itemId: string) => {
        setReceiptItems(prev => {
            const currentQty = prev[itemId] || 0
            if (currentQty <= 0) return prev
            const newQty = currentQty - 1
            if (newQty === 0) {
                const { [itemId]: _, ...rest } = prev
                return rest
            }
            return { ...prev, [itemId]: newQty }
        })
    }

    const calculateTotal = () => {
        const subtotal = Object.entries(receiptItems).reduce((total, [itemId, qty]) => {
            const item = inventoryItems.find(i => i.id === itemId)
            if (!item) return total
            return total + item.price * qty
        }, 0);
        return subtotal;
    }

    const calculateDiscountTotal = () => {
        const subtotal = Object.entries(receiptItems).reduce((total, [itemId, qty]) => {
            const item = inventoryItems.find(i => i.id === itemId)
            if (!item) return total
            return total + item.price * qty
        }, 0);
        // Apply discount
        const discountedTotal = subtotal - (subtotal * (discount / 100));
        return discountedTotal;
    }

    const discardReceipt = () => {
        setAlert({
            visible: true,
            title: 'Discard Receipt',
            message: 'Are you sure you want to discard this receipt?',
            actions: [
                { text: 'Cancel', style: 'cancel', onPress: () => setAlert({ ...alert, visible: false }) },
                {
                    text: 'Discard',
                    style: 'destructive',
                    onPress: () => {
                        setReceiptItems({})
                        setReceiptNumber('R-' + Date.now().toString())
                        router.back();
                    },
                },
            ]
        });
    }

    const saveReceipt = async (status: 'active' | 'complete' = 'active') => {
        if (Object.keys(receiptItems).length === 0) {
            setAlert({ visible: true, title: 'No items', message: 'Please add items to the receipt before completing.' });
            return;
        }
        setLoading({ state: true, text: "Saving receipt" })

        const db = getFirestore();
        const itemsArray = Object.entries(receiptItems).map(([itemId, qty]) => {
            const item = inventoryItems.find(i => i.id === itemId)
            return item ?
                {
                    id: item.id,
                    name: item.name,
                    quantity: qty,
                    price: item.price,
                    category: item.category
                } : null
        }).filter(i => i !== null);

        const receiptData = {
            receiptNumber,
            userId: userData?.uid,
            items: itemsArray,
            total: calculateTotal(),
            totalAfterDiscount: calculateDiscountTotal(),
            discount, // Save discount percentage
            status: status,
            createdAt: new Date(),
            timestamp: Date.now()
        };

        try {
            // Save the receipt
            await addDoc(collection(db, 'Receipts'), receiptData);

            // Update lastReceiptNumber in Users document
            if (userDocId) {
                const userRef = doc(db, 'Users', userDocId);
                await updateDoc(userRef, {
                    lastReceiptNumber: parseInt(receiptNumber)
                });
            }

            let summary = `Receipt Number: ${receiptNumber}\n\nItems:\n`
            itemsArray.forEach(item => {
                if (item) {
                    summary += `${item.name} x${item.quantity} = $${(item.price * item.quantity).toFixed(2)}\n`
                }
            })
            if (discount > 0) {
                summary += `\nDiscount: ${discount}%`;
            }
            summary += `\nTotal: $${calculateTotal().toFixed(2)}`
            setAlert({
                visible: true,
                title: status === 'active' ? 'Receipt Saved' : 'Receipt Finalized',
                message: summary.replace(/\n/g, '\n'),
                actions: [
                    {
                        text: 'OK',
                        onPress: () => {
                            setReceiptItems({})
                            // Generate next receipt number
                            const nextNumber = generateNextReceiptNumber(parseInt(receiptNumber));
                            setReceiptNumber(nextNumber);
                            setAlert({ ...alert, visible: false });
                        }
                    }
                ]
            });
        } catch (error) {
            setAlert({ visible: true, title: 'Error', message: 'Failed to save receipt. Please try again.' });
            console.error('Error saving receipt:', error);
        }
        finally {
            setLoading({ state: false, text: "" })
        }
    }

    const groupedInventory = groupByCategory(inventoryItems)

    return !loading.state && inventoryItems.length === 0 ? (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>New Receipt</Text>
                    <Text style={styles.receiptNumber}>#{receiptNumber.padStart(3, '0')}</Text>
                </View>
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={discardReceipt}
                >
                    <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
            </View>

            <View style={styles.emptyStateContainer}>
                <Ionicons name="cube-outline" size={64} color="#94a3b8" />
                <Text style={styles.emptyStateTitle}>No Items Available</Text>
                <Text style={styles.emptyStateMessage}>
                    You need to add items to your inventory first.{'\n'}
                    Go to Inventory Management to add items.
                </Text>
                <TouchableOpacity
                    style={styles.emptyStateButton}
                    onPress={() => router.push('/ManageInventory')}
                >
                    <Text style={styles.emptyStateButtonText}>Go to Inventory</Text>
                </TouchableOpacity>
            </View>
        </View>
    ) : (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>New Receipt</Text>
                    <Text style={styles.receiptNumber}>#{receiptNumber.padStart(3, '0')}</Text>
                </View>
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={discardReceipt}
                >
                    <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
            </View>

            {loading.state ? (
                <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                    <ActivityIndicator size="large" color="#2196F3" />
                    <Text style={styles.loadingText}>{loading.text || 'Loading'}...</Text>
                </View>) :
                <ScrollView
                    style={styles.inventoryList}
                    showsVerticalScrollIndicator={true}
                >
                    {Object.entries(groupedInventory).map(([category, items], idx) => (
                        <View key={category} style={[styles.categorySection, { marginBottom: idx === Object.keys(groupedInventory).length - 1 ? 20 : 0 }]}>
                            <Text style={styles.categoryHeader}>{category}</Text>
                            <View style={styles.itemsContainer}>
                                {items.map(item => {
                                    const qty = receiptItems[item.id] || 0;
                                    const isOutOfStock = item.availability.toLowerCase() !== 'in stock';
                                    return (
                                        <View key={item.id} style={styles.itemCard}>
                                            <View style={styles.itemInfo}>
                                                <Text style={styles.itemName}>{item.name}</Text>
                                                <Text style={styles.itemPrice}>₹{item.price.toFixed(2)}</Text>
                                                {isOutOfStock && (
                                                    <Text style={{ color: '#ef4444', fontWeight: '600', fontSize: 13, marginTop: 2 }}>Out of Stock</Text>
                                                )}
                                            </View>
                                            <View style={styles.quantityControls}>
                                                <TouchableOpacity
                                                    onPress={() => removeItem(item.id)}
                                                    style={[styles.controlButton, qty === 0 && styles.controlButtonDisabled]}
                                                    disabled={isOutOfStock}
                                                >
                                                    <Ionicons name="remove" size={20} color="#fff" />
                                                </TouchableOpacity>
                                                <Text style={styles.quantityText}>{qty}</Text>
                                                <TouchableOpacity
                                                    onPress={() => addItem(item.id)}
                                                    style={[styles.controlButton, (isOutOfStock || false) && styles.controlButtonDisabled]}
                                                    disabled={isOutOfStock}
                                                >
                                                    <Ionicons name="add" size={20} color="#fff" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    )
                                })}
                            </View>
                        </View>
                    ))}
                </ScrollView>}

            <LinearGradient
                colors={['rgba(255,255,255,0)', '#ffffff']}
                style={styles.footerGradient}
                pointerEvents="none"
            />

            <View style={styles.footer}>
                <View style={styles.totalContainer}>
                    {/* Discount Area */}
                    <View>
                        <Text style={styles.totalLabel}>Discount (%)</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}>
                            <TouchableOpacity
                                style={[styles.controlButton, discount <= 0 && styles.controlButtonDisabled]}
                                onPress={() => setDiscount(d => Math.max(0, d - 1))}
                                disabled={discount <= 0}
                            >
                                <Ionicons name="remove" size={20} color="#fff" />
                            </TouchableOpacity>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 8, gap: 2 }}>
                                <TextInput
                                    style={[styles.quantityText, { minWidth: 32, borderWidth: 1, borderColor: '#eee', borderRadius: 6, textAlign: 'center', backgroundColor: '#fff', fontSize: 16, padding: 0, height: 32, lineHeight: 28 }]}
                                    keyboardType="numeric"
                                    value={discount.toString()}
                                    onChangeText={text => {
                                        let val = parseInt(text.replace(/[^0-9]/g, ''), 10);
                                        if (isNaN(val)) val = 0;
                                        if (val > 100) val = 100;
                                        setDiscount(val);
                                    }}
                                    maxLength={3}
                                    returnKeyType="done"
                                />
                                <Text style={{ fontSize: 18, color: '#666' }}>%</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.controlButton}
                                onPress={() => setDiscount(d => Math.min(100, d + 1))}
                                disabled={discount >= 100}
                            >
                                <Ionicons name="add" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={{ alignItems: 'flex-end', flex: 1 }}>
                        <View style={{ marginBottom: 6 }}>
                            <Text style={styles.totalLabel}>Subtotal</Text>
                            <Text style={styles.subtotalAmount}>₹{calculateTotal().toFixed(2)}</Text>
                        </View>
                        {/* {discount > 0 && (
                            <View style={{ marginBottom: 6 }}>
                                <Text style={styles.discountLabel}>Discount</Text>
                                <Text style={styles.discountAmount}>{discount}%</Text>
                            </View>
                        )} */}
                        <View style={{ borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 2, marginTop: 2 }}>
                            <Text style={styles.totalLabel}>Total Amount</Text>
                            <Text style={styles.finalTotalAmount}>₹{calculateDiscountTotal().toFixed(2)}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        onPress={() => {
                            saveReceipt('active')
                        }}
                        style={[
                            styles.saveButton,
                            Object.keys(receiptItems).length === 0 && styles.saveButtonDisabled
                        ]}
                        disabled={Object.keys(receiptItems).length === 0}
                    >
                        <Text style={styles.saveButtonText}>Save as Active</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => {
                            saveReceipt('complete')
                        }}
                        style={[
                            styles.saveButton,
                            { backgroundColor: "#4CAF50" },
                            Object.keys(receiptItems).length === 0 && styles.saveButtonDisabled
                        ]}
                        disabled={Object.keys(receiptItems).length === 0}
                    >
                        <Text style={styles.saveButtonText}>Save & Finalize</Text>
                    </TouchableOpacity>
                </View>
            </View>

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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
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
    receiptNumber: {
        fontSize: 15,
        color: '#666',
        fontWeight: '500',
    },
    closeButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    inventoryList: {
        flex: 1,
        paddingHorizontal: 20,
    },
    categorySection: {
        marginBlock: 8
    },
    categoryHeader: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    itemsContainer: {
        gap: 12,
    },
    itemCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    itemPrice: {
        fontSize: 15,
        color: '#2196F3',
        fontWeight: '600',
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    controlButton: {
        backgroundColor: '#2196F3',
        borderRadius: 8,
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    controlButtonDisabled: {
        backgroundColor: '#ccc',
    },
    quantityText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        minWidth: 24,
        textAlign: 'center',
    },
    footerGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 40,
    },
    footer: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    },
    totalContainer: {
        marginBottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 15,
        color: '#666',
        marginBottom: 4,
        marginHorizontal: 'auto'
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
    finalTotalAmount: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#0ea5e9',
        marginLeft: 'auto'
    },
    saveButton: {
        flex: 1,
        backgroundColor: '#2196F3',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    saveButtonDisabled: {
        backgroundColor: '#ccc',
    },
    saveButtonText: {
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
        backgroundColor: '#3b82f6',
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
    buttonContainer: {
        flexDirection: 'row',
        paddingHorizontal: 4,
        justifyContent: 'space-between',
        gap: 12,
    }
});

export default CreateReceipt;
