import React, { useState } from 'react'
import { FlatList, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

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
}

const mockPastReceipts: PastReceipt[] = [
    {
        id: '1',
        receiptNumber: 'R-1680000000000',
        date: '2023-03-01',
        total: 25.50,
        items: [
            { name: 'Apple', quantity: 3, price: 1.5 },
            { name: 'Milk', quantity: 2, price: 2.5 },
        ],
    },
    {
        id: '2',
        receiptNumber: 'R-1680000001000',
        date: '2023-03-05',
        total: 40.75,
        items: [
            { name: 'Banana', quantity: 5, price: 1.0 },
            { name: 'Cheese', quantity: 1, price: 3.0 },
        ],
    },
    {
        id: '3',
        receiptNumber: 'R-1680000002000',
        date: '2023-03-10',
        total: 15.20,
        items: [
            { name: 'Carrot', quantity: 4, price: 0.8 },
            { name: 'Broccoli', quantity: 2, price: 1.2 },
        ],
    },
]

const PastReceipts = () => {
    const [modalVisible, setModalVisible] = useState(false)
    const [selectedReceipt, setSelectedReceipt] = useState<PastReceipt | null>(null)

    const onReceiptPress = (receipt: PastReceipt) => {
        setSelectedReceipt(receipt)
        setModalVisible(true)
    }

    const renderItem = ({ item }: { item: PastReceipt }) => (
        <TouchableOpacity style={styles.receiptItem} onPress={() => onReceiptPress(item)}>
            <Text style={styles.receiptNumber}>{item.receiptNumber}</Text>
            <Text style={styles.receiptDate}>{item.date}</Text>
            <Text style={styles.receiptTotal}>${item.total.toFixed(2)}</Text>
        </TouchableOpacity>
    )

    return (
        <View style={styles.container}>
            <FlatList
                data={mockPastReceipts}
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
                        <Text style={styles.modalTitle}>Receipt Details</Text>
                        {selectedReceipt && (
                            <>
                                <Text style={styles.modalText}>Receipt Number: {selectedReceipt.receiptNumber}</Text>
                                <Text style={styles.modalText}>Date: {selectedReceipt.date}</Text>
                                <Text style={[styles.modalText, styles.itemsHeader]}>Items:</Text>
                                {selectedReceipt.items.map((item, index) => (
                                    <View key={index} style={styles.itemRow}>
                                        <Text style={styles.itemName}>{item.name}</Text>
                                        <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                                        <Text style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
                                    </View>
                                ))}
                                <Text style={styles.modalTotal}>Total: ${selectedReceipt.total.toFixed(2)}</Text>
                            </>
                        )}
                        <Pressable style={styles.closeButton} onPress={() => setModalVisible(false)}>
                            <Text style={styles.closeButtonText}>Close</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </View>
    )
}

export default PastReceipts

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
        width: '85%',
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
        marginBottom: 6,
    },
    itemName: {
        flex: 2,
        fontSize: 16,
    },
    itemQuantity: {
        flex: 1,
        fontSize: 16,
        textAlign: 'center',
    },
    itemPrice: {
        flex: 1,
        fontSize: 16,
        textAlign: 'right',
    },
    modalTotal: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 12,
        textAlign: 'right',
    },
    closeButton: {
        marginTop: 16,
        backgroundColor: '#007AFF',
        borderRadius: 6,
        paddingVertical: 10,
        alignItems: 'center',
    },
    closeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
})
