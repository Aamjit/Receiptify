import { useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

type InventoryItem = {
    id: string
    name: string
    category: string
    price: number
}

const mockInventory: InventoryItem[] = [
    { id: '1', name: 'Apple', category: 'Fruits', price: 1.5 },
    { id: '2', name: 'Banana', category: 'Fruits', price: 1.0 },
    { id: '3', name: 'Carrot', category: 'Vegetables', price: 0.8 },
    { id: '4', name: 'Broccoli', category: 'Vegetables', price: 1.2 },
    { id: '5', name: 'Milk', category: 'Dairy', price: 2.5 },
    { id: '6', name: 'Cheese', category: 'Dairy', price: 3.0 },
]

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
    const [inventory, setInventory] = useState<InventoryItem[]>([])
    const [receiptItems, setReceiptItems] = useState<Record<string, number>>({})
    const router = useRouter();

    useEffect(() => {
        // Autogenerate receipt number on mount
        const generatedNumber = 'R-' + Date.now().toString()
        setReceiptNumber(generatedNumber)
        // Load inventory (mocked here)
        setInventory(mockInventory)
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
            const item = inventory.find(i => i.id === itemId)
            if (!item) return total
            return total + item.price * qty
        }, 0)
    }

    const discardReceipt = () => {
        Alert.alert('Discard Receipt', 'Are you sure you want to discard this receipt?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Discard',
                style: 'destructive',
                onPress: () => {
                    setReceiptItems({})
                    setReceiptNumber('R-' + Date.now().toString())
                    router.back();
                },
            },
        ])

    }

    const completeReceipt = () => {
        if (Object.keys(receiptItems).length === 0) {
            Alert.alert('No items', 'Please add items to the receipt before completing.')
            return
        }
        // For now, just alert the receipt summary
        let summary = `Receipt Number: ${receiptNumber}\n\nItems:\n`
        Object.entries(receiptItems).forEach(([itemId, qty]) => {
            const item = inventory.find(i => i.id === itemId)
            if (item) {
                summary += `${item.name} x${qty} = $${(item.price * qty).toFixed(2)}\n`
            }
        })
        summary += `\nTotal: $${calculateTotal().toFixed(2)}`
        Alert.alert('Receipt Completed', summary, [
            {
                text: 'OK',
                onPress: () => {
                    setReceiptItems({})
                    setReceiptNumber('R-' + Date.now().toString())
                },
            },
        ])
    }

    const groupedInventory = groupByCategory(inventory)

    return (
        <View style={styles.container}>
            {/* <Text style={styles.header}>Create Receipt</Text> */}
            <Text style={styles.receiptNumber}>Receipt Number: {receiptNumber}</Text>
            <ScrollView style={styles.inventoryList}>
                {Object.entries(groupedInventory).map(([category, items]) => (
                    <View key={category} style={styles.categorySection}>
                        <Text style={styles.categoryHeader}>{category}</Text>
                        {items.map(item => {
                            const qty = receiptItems[item.id] || 0
                            return (
                                <View key={item.id} style={styles.itemRow}>
                                    <Text style={styles.itemName}>{item.name}</Text>
                                    <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                                    <View style={styles.quantityControls}>
                                        <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.controlButton}>
                                            <Text style={styles.controlButtonText}>-</Text>
                                        </TouchableOpacity>
                                        <Text style={styles.quantityText}>{qty}</Text>
                                        <TouchableOpacity onPress={() => addItem(item.id)} style={styles.controlButton}>
                                            <Text style={styles.controlButtonText}>+</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )
                        })}
                    </View>
                ))}
            </ScrollView>
            <View style={styles.footer}>
                <Text style={styles.totalText}>Total: ${calculateTotal().toFixed(2)}</Text>
                <View style={styles.buttonsRow}>
                    <TouchableOpacity onPress={discardReceipt} style={[styles.button, styles.discardButton]}>
                        <Text style={styles.buttonText}>Discard</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={completeReceipt} style={[styles.button, styles.completeButton]}>
                        <Text style={styles.buttonText}>Complete</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    )
}

export default CreateReceipt

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight! : 16,
        paddingTop: 10,
        paddingHorizontal: 16,
        paddingBottom: 36,
        backgroundColor: '#fff',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    receiptNumber: {
        fontSize: 16,
        marginBottom: 16,
    },
    inventoryList: {
        flex: 1,
        marginBottom: 16,
    },
    categorySection: {
        marginBottom: 16,
    },
    categoryHeader: {
        fontSize: 18,
        fontWeight: '600',
        backgroundColor: '#f0f0f0',
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomColor: '#ddd',
        borderBottomWidth: 1,
    },
    itemName: {
        flex: 2,
        fontSize: 16,
    },
    itemPrice: {
        flex: 1,
        fontSize: 16,
        textAlign: 'right',
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'flex-end',
    },
    controlButton: {
        backgroundColor: '#007AFF',
        borderRadius: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginHorizontal: 4,
    },
    controlButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    quantityText: {
        fontSize: 16,
        minWidth: 20,
        textAlign: 'center',
    },
    footer: {
        borderTopColor: '#ddd',
        borderTopWidth: 1,
        paddingTop: 12,
    },
    totalText: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'right',
    },
    buttonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 6,
        alignItems: 'center',
        marginHorizontal: 8,
    },
    discardButton: {
        backgroundColor: '#FF3B30',
    },
    completeButton: {
        backgroundColor: '#34C759',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
})
