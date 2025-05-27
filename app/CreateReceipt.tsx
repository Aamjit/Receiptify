import Ionicons from '@expo/vector-icons/Ionicons'
import { getAuth } from '@react-native-firebase/auth'
import { addDoc, collection, getDocs, getFirestore, query, where } from '@react-native-firebase/firestore'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

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
    const router = useRouter();
    const [loading, setLoading] = useState({
        state: true,
        text: "",
    });
    const userData = getAuth().currentUser

    useEffect(() => {
        fetchInventory();
    }, []);

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
                const userData = userQuery.docs[0].data();
                // Ensure prices are converted to numbers
                const inventory = (userData.inventory || []).map((item: any) => ({
                    ...item,
                    price: typeof item.price === 'string' ? parseFloat(item.price) : item.price
                }));
                setInventoryItems(inventory);
            }
            setLoading({ state: false, text: "" });
        } catch (error) {
            console.error('Error fetching inventory:', error);
            setLoading({ state: false, text: "" });
        }
    };

    useEffect(() => {
        // Autogenerate receipt number on mount
        const generatedNumber = 'R-' + Date.now().toString()
        setReceiptNumber(generatedNumber)
    }, [])

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
        return Object.entries(receiptItems).reduce((total, [itemId, qty]) => {
            const item = inventoryItems.find(i => i.id === itemId)
            if (!item) return total
            return total + item.price * qty
        }, 0)
    }

    const discardReceipt = () => {
        // Alert.alert('Discard Receipt', 'Are you sure you want to discard this receipt?', [
        //     { text: 'Cancel', style: 'cancel' },
        //     {
        //         text: 'Discard',
        //         style: 'destructive',
        //         onPress: () => {
        //             setReceiptItems({})
        //             setReceiptNumber('R-' + Date.now().toString())
        //             router.back();
        //         },
        //     },
        // ])
        router.back();

    }

    const saveReceipt = async () => {
        if (Object.keys(receiptItems).length === 0) {
            Alert.alert('No items', 'Please add items to the receipt before completing.')
            return
        }
        setLoading({ state: true, text: "Saving receipt" })

        const db = getFirestore();
        const itemsArray = Object.entries(receiptItems).map(([itemId, qty]) => {
            const item = inventoryItems.find(i => i.id === itemId)
            return item ? { id: item.id, name: item.name, quantity: qty, price: item.price } : null
        }).filter(i => i !== null);

        const receiptData = {
            receiptNumber,
            userId: userData?.uid,
            items: itemsArray,
            total: calculateTotal(),
            status: "active",
            createdAt: new Date(),
            timestamp: Date.now()
        };

        try {
            await addDoc(collection(db, 'Receipts'), receiptData);
            let summary = `Receipt Number: ${receiptNumber}\n\nItems:\n`
            itemsArray.forEach(item => {
                if (item) {
                    summary += `${item.name} x${item.quantity} = $${(item.price * item.quantity).toFixed(2)}\n`
                }
            })
            summary += `\nTotal: $${calculateTotal().toFixed(2)}`
            Alert.alert('Receipt Saved', summary, [
                {
                    text: 'OK',
                    onPress: () => {
                        setReceiptItems({})
                        setReceiptNumber('R-' + Date.now().toString())
                    },
                },
            ])
        } catch (error) {
            Alert.alert('Error', 'Failed to save receipt. Please try again.')
            console.error('Error saving receipt:', error);
        }
        finally {
            setLoading({ state: false, text: "" })
        }
    }

    const groupedInventory = groupByCategory(inventoryItems)

    return loading.state ? (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.loadingText}>{loading.text || 'Loading'}...</Text>
        </View>
    ) : inventoryItems.length === 0 ? (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>New Receipt</Text>
                    <Text style={styles.receiptNumber}>#{receiptNumber}</Text>
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
                    <Text style={styles.receiptNumber}>#{receiptNumber}</Text>
                </View>
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={discardReceipt}
                >
                    <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.inventoryList}
                showsVerticalScrollIndicator={false}
            >
                {Object.entries(groupedInventory).map(([category, items]) => (
                    <View key={category} style={styles.categorySection}>
                        <Text style={styles.categoryHeader}>{category}</Text>
                        <View style={styles.itemsContainer}>
                            {items.map(item => {
                                const qty = receiptItems[item.id] || 0
                                return (
                                    <View key={item.id} style={styles.itemCard}>
                                        <View style={styles.itemInfo}>
                                            <Text style={styles.itemName}>{item.name}</Text>
                                            <Text style={styles.itemPrice}>₹{item.price.toFixed(2)}</Text>
                                        </View>
                                        <View style={styles.quantityControls}>
                                            <TouchableOpacity
                                                onPress={() => removeItem(item.id)}
                                                style={[styles.controlButton, qty === 0 && styles.controlButtonDisabled]}
                                            >
                                                <Ionicons name="remove" size={20} color="#fff" />
                                            </TouchableOpacity>
                                            <Text style={styles.quantityText}>{qty}</Text>
                                            <TouchableOpacity
                                                onPress={() => addItem(item.id)}
                                                style={styles.controlButton}
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
            </ScrollView>

            <LinearGradient
                colors={['rgba(255,255,255,0)', '#ffffff']}
                style={styles.footerGradient}
                pointerEvents="none"
            />

            <View style={styles.footer}>
                <View style={styles.totalContainer}>
                    <Text style={styles.totalLabel}>Total Amount</Text>
                    <Text style={styles.totalText}>₹{calculateTotal().toFixed(2)}</Text>
                </View>
                <TouchableOpacity
                    onPress={saveReceipt}
                    style={[
                        styles.saveButton,
                        Object.keys(receiptItems).length === 0 && styles.saveButtonDisabled
                    ]}
                    disabled={Object.keys(receiptItems).length === 0}
                >
                    <Text style={styles.saveButtonText}>Save Receipt</Text>
                </TouchableOpacity>
            </View>
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
        marginBlock: 12
    },
    categoryHeader: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 12,
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
    },
    totalLabel: {
        fontSize: 15,
        color: '#666',
        marginBottom: 4,
    },
    totalText: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    saveButton: {
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
});

export default CreateReceipt;
