import React, { useState } from 'react';
import { Alert, Button, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface InventoryItem {
    id: string;
    name: string;
    price: string;
    category: string;
    availability: string;
}

const ManageInventory = () => {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('');
    const [availability, setAvailability] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    const addItem = () => {
        if (!name || !price || !category || !availability) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }
        if (editingId) {
            // Save changes to existing item
            setItems(items.map(item => item.id === editingId ? { id: editingId, name, price, category, availability } : item));
            setEditingId(null);
        } else {
            // Add new item
            const newItem: InventoryItem = {
                id: Date.now().toString(),
                name,
                price,
                category,
                availability,
            };
            setItems([...items, newItem]);
        }
        setName('');
        setPrice('');
        setCategory('');
        setAvailability('');
    };

    const removeItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
        if (editingId === id) {
            // Cancel editing if the item being edited is removed
            setEditingId(null);
            setName('');
            setPrice('');
            setCategory('');
            setAvailability('');
        }
    };

    const startEditing = (item: InventoryItem) => {
        setEditingId(item.id);
        setName(item.name);
        setPrice(item.price);
        setCategory(item.category);
        setAvailability(item.availability);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setName('');
        setPrice('');
        setCategory('');
        setAvailability('');
    };

    const renderItem = ({ item }: { item: InventoryItem }) => (
        <View style={styles.itemContainer}>
            <View style={{ flex: 1 }}>
                <Text style={styles.itemText}>Name: {item.name}</Text>
                <Text style={styles.itemText}>Price: {item.price}</Text>
                <Text style={styles.itemText}>Category: {item.category}</Text>
                <Text style={styles.itemText}>Availability: {item.availability}</Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity style={styles.editButton} onPress={() => startEditing(item)}>
                    <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.removeButton} onPress={() => removeItem(item.id)}>
                    <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* <Text style={styles.title}>Manage Inventory</Text> */}
            <View style={styles.inputContainer}>
                <TextInput
                    placeholder="Name"
                    value={name}
                    onChangeText={setName}
                    style={styles.input}
                />
                <TextInput
                    placeholder="Price"
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                    style={styles.input}
                />
                <TextInput
                    placeholder="Category"
                    value={category}
                    onChangeText={setCategory}
                    style={styles.input}
                />
                <TextInput
                    placeholder="Availability"
                    value={availability}
                    onChangeText={setAvailability}
                    style={styles.input}
                />
                <View style={styles.buttonRow}>
                    <Button title={editingId ? "Save Changes" : "Add Item"} onPress={addItem} />
                    {editingId && <Button title="Cancel" onPress={cancelEditing} color="#888" />}
                </View>
            </View>
            <FlatList
                data={items}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                ListEmptyComponent={<Text style={styles.emptyText}>No items added yet.</Text>}
                style={styles.list}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff'
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    inputContainer: {
        marginBottom: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: '#999',
        borderRadius: 4,
        padding: 8,
        marginBottom: 8,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    list: {
        flex: 1,
    },
    itemContainer: {
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        padding: 12,
        marginBottom: 8,
        alignItems: 'center',

    },
    itemText: {
        fontSize: 16,
    },
    editButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 4,
        marginRight: 8,
    },
    editButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    removeButton: {
        backgroundColor: '#ff4444',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 4,
    },
    removeButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 20,
        fontStyle: 'italic',
        color: '#666',
    },
});

export default ManageInventory;
