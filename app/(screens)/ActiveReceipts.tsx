import React, { useState } from 'react'
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

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
}

const mockActiveReceipts: ActiveReceipt[] = [
    {
        id: '1',
        receiptNumber: 'R-1680000003000',
        date: '2023-03-15',
        total: 30.00,
        items: [
            { id: '1', name: 'Apple', quantity: 2, price: 1.5 },
            { id: '2', name: 'Milk', quantity: 3, price: 2.5 },
        ],
    },
    {
        id: '2',
        receiptNumber: 'R-1680000004000',
        date: '2023-03-18',
        total: 50.00,
        items: [
            { id: '3', name: 'Banana', quantity: 4, price: 1.0 },
            { id: '4', name: 'Cheese', quantity: 2, price: 3.0 },
        ],
    },
]

const ActiveReceipts = () => {
    const [modalVisible, setModalVisible] = useState(false)
    const [selectedReceipt, setSelectedReceipt] = useState<ActiveReceipt | null>(null)
    const [items, setItems] = useState<ReceiptItem[]>([])

    const [newItemName, setNewItemName] = useState('')
    const [newItemPrice, setNewItemPrice] = useState('')

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

    const saveChanges = () => {
        if (selectedReceipt) {
            // For now, just alert the updated receipt summary
            let summary = `Receipt Number: ${selectedReceipt.receiptNumber}\n\nItems:\n`
            items.forEach(item => {
                summary += `${item.name} x${item.quantity} = $${(item.price * item.quantity).toFixed(2)}\n`
            })
            summary += `\nTotal: $${calculateTotal().toFixed(2)}`
            Alert.alert('Receipt Updated', summary, [
                {
                    text: 'OK',
                    onPress: () => setModalVisible(false),
                },
            ])
        }
    }

    const renderItem = ({ item }: { item: ActiveReceipt }) => (
        <TouchableOpacity style={styles.receiptItem} onPress={() => onReceiptPress(item)}>
            <Text style={styles.receiptNumber}>{item.receiptNumber}</Text>
            <Text style={styles.receiptDate}>{item.date}</Text>
            <Text style={styles.receiptTotal}>${item.total.toFixed(2)}</Text>
        </TouchableOpacity>
    )

    const handleAddItem = () => {
        if (!newItemName.trim() || !newItemPrice.trim()) {
            Alert.alert('Error', 'Please enter both item name and price.')
            return
        }
        const price = parseFloat(newItemPrice)
        if (isNaN(price) || price <= 0) {
            Alert.alert('Error', 'Please enter a valid positive price.')
            return
        }
        addItem(newItemName.trim(), price)
        setNewItemName('')
        setNewItemPrice('')
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={mockActiveReceipts}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
            />
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit Receipt</Text>
                        {selectedReceipt && (
                            <>
                                <Text style={styles.modalText}>Receipt Number: {selectedReceipt.receiptNumber}</Text>
                                <Text style={styles.modalText}>Date: {selectedReceipt.date}</Text>
                                <Text style={[styles.modalText, styles.itemsHeader]}>Items:</Text>
                                {items.map((item, index) => (
                                    <View key={item.id} style={styles.itemRow}>
                                        <Text style={styles.itemName}>{item.name}</Text>
                                        <View style={styles.quantityControls}>
                                            <TouchableOpacity onPress={() => {
                                                if (item.quantity > 1) {
                                                    updateQuantity(item.id, (item.quantity - 1).toString())
                                                } else {
                                                    removeItem(item.id)
                                                }
                                            }} style={styles.controlButton}>
                                                <Text style={styles.controlButtonText}>-</Text>
                                            </TouchableOpacity>
                                            <TextInput
                                                style={styles.quantityInput}
                                                keyboardType="numeric"
                                                value={item.quantity.toString()}
                                                onChangeText={text => updateQuantity(item.id, text)}
                                            />
                                            <TouchableOpacity onPress={() => updateQuantity(item.id, (item.quantity + 1).toString())} style={styles.controlButton}>
                                                <Text style={styles.controlButtonText}>+</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <Text style={styles.itemPrice}>Rs.{(item.price * item.quantity).toFixed(2)}</Text>
                                    </View>
                                ))}
                                <Text style={styles.modalTotal}>Total: ${calculateTotal().toFixed(2)}</Text>
                            </>
                        )}
                        <View style={styles.addItemRow}>
                            <TextInput
                                style={styles.addItemInput}
                                placeholder="Item name"
                                value={newItemName}
                                onChangeText={setNewItemName}
                            />
                            <TextInput
                                style={styles.addItemInput}
                                placeholder="Price"
                                keyboardType="numeric"
                                value={newItemPrice}
                                onChangeText={setNewItemPrice}
                            />
                            <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
                                <Text style={styles.addButtonText}>Add</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.modalButtonsRow}>
                            <Pressable style={styles.saveButton} onPress={saveChanges}>
                                <Text style={styles.saveButtonText}>Save</Text>
                            </Pressable>
                            <Pressable style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    )
}

export default ActiveReceipts

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    listContent: {
        paddingBottom: 16,
    },
    receiptItem: {
        padding: 12,
        borderBottomColor: '#ddd',
        borderBottomWidth: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    receiptNumber: {
        fontSize: 16,
        fontWeight: '600',
        flex: 2,
    },
    receiptDate: {
        fontSize: 14,
        color: '#666',
        flex: 1,
        textAlign: 'center',
    },
    receiptTotal: {
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'right',
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
        borderRadius: 8,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    modalText: {
        fontSize: 16,
        marginBottom: 8,
    },
    itemsHeader: {
        marginTop: 8,
        fontWeight: '600',
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    itemName: {
        flex: 1.5,
        fontSize: 16,
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1.5,
        marginHorizontal: 8,
    },
    controlButton: {
        backgroundColor: '#ddd',
        borderRadius: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginHorizontal: 4,
    },
    controlButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    quantityInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        fontSize: 16,
        textAlign: 'center',
        marginHorizontal: 8,
    },
    itemPrice: {
        flex: 1,
        fontSize: 16,
        textAlign: 'right',
    },
    modalButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    saveButton: {
        flex: 1,
        backgroundColor: '#34C759',
        borderRadius: 6,
        paddingVertical: 12,
        alignItems: 'center',
        marginRight: 8,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#FF3B30',
        borderRadius: 6,
        paddingVertical: 12,
        alignItems: 'center',
        marginLeft: 8,
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    addItemRow: {
        flexDirection: 'row',
        marginTop: 16,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    addItemInput: {
        flex: 2,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        paddingHorizontal: 8,
        paddingVertical: 6,
        fontSize: 16,
        marginRight: 8,
    },
    addButton: {
        flex: 1,
        backgroundColor: '#007AFF',
        borderRadius: 6,
        paddingVertical: 12,
        alignItems: 'center',
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    modalTotal: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 12,
        textAlign: 'right',
    },
})
