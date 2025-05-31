import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getAuth } from '@react-native-firebase/auth';
import { collection, doc, getDocs, getFirestore, query, updateDoc, where } from '@react-native-firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, NativeScrollEvent, NativeSyntheticEvent, Platform, ScrollView, StyleSheet, Text, TextInput, ToastAndroid, TouchableOpacity, View } from 'react-native';
import CustomAlertModal from '../../components/CustomAlertModal';

interface InventoryItem {
    id: string;
    name: string;
    price: number;
    category: string;
    availability: string;
}

const AVAILABILITY_OPTIONS = ['In Stock', 'Out of Stock'] as const;
type AvailabilityType = typeof AVAILABILITY_OPTIONS[number];

const ManageInventory = () => {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('');
    const [availability, setAvailability] = useState<AvailabilityType>(AVAILABILITY_OPTIONS[0]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
    const [isFormVisible, setIsFormVisible] = useState(true);
    const [alert, setAlert] = useState<{ visible: boolean; title: string; message: string; actions?: any[] }>({ visible: false, title: '', message: '', actions: [] });
    const [pendingRemove, setPendingRemove] = useState<{ id: string; name: string } | null>(null);
    const animatedHeight = useRef(new Animated.Value(1)).current;
    const lastScrollY = useRef(0);
    const scrollThreshold = 10; // minimum scroll distance to trigger collapse
    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        try {
            const userEmail = getAuth().currentUser?.email;
            if (!userEmail) {
                setAlert({ visible: true, title: 'Error', message: 'User not authenticated', actions: [{ text: 'OK' }] });
                return;
            }

            const userQuery = await getDocs(
                query(collection(getFirestore(), 'Users'),
                    where('email', '==', userEmail))
            );

            if (!userQuery.empty) {
                const userData = userQuery.docs[0].data();
                setInventory(userData.inventory || []);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching inventory:', error);
            setAlert({ visible: true, title: 'Error', message: 'Failed to fetch inventory', actions: [{ text: 'OK' }] });
            setLoading(false);
        }
    };

    const updateInventoryInFirebase = async (newInventory: InventoryItem[]) => {
        try {
            const userEmail = getAuth().currentUser?.email;
            if (!userEmail) {
                setAlert({ visible: true, title: 'Error', message: 'User not authenticated', actions: [{ text: 'OK' }] });
                return;
            }

            const userQuery = await getDocs(
                query(collection(getFirestore(), 'Users'),
                    where('email', '==', userEmail))
            );

            if (!userQuery.empty) {
                await updateDoc(doc(getFirestore(), 'Users', userQuery.docs[0].id), {
                    inventory: newInventory
                });
            } else {
                setAlert({ visible: true, title: 'Error', message: 'User document not found', actions: [{ text: 'OK' }] });
            }
        } catch (error) {
            console.error('Error updating inventory:', error);
            setAlert({ visible: true, title: 'Error', message: 'Failed to update inventory', actions: [{ text: 'OK' }] });
        }
    };

    const showToast = (message: string) => {
        if (Platform.OS === 'android') {
            ToastAndroid.show(message, ToastAndroid.SHORT);
        } else {
            setAlert({ visible: true, title: 'Success', message, actions: [{ text: 'OK' }] });
        }
    };

    const addItem = async () => {
        if (!name || !price || !category || !availability) {
            setAlert({
                visible: true,
                title: 'Error',
                message: 'Please fill all fields',
                actions: [{ text: 'OK', onPress: () => setAlert(a => ({ ...a, visible: false })) }]
            });
            return;
        }

        const numericPrice = parseFloat(price);
        if (isNaN(numericPrice)) {
            setAlert({
                visible: true, title: 'Error', message: 'Please enter a valid price',
                actions: [{ text: 'OK', onPress: () => setAlert(a => ({ ...a, visible: false })) }]
            });
            return;
        }

        setLoading(true);

        try {
            let newItems: InventoryItem[];
            if (editingId) {
                // Update existing item
                newItems = inventory.map(item =>
                    item.id === editingId
                        ? { id: editingId, name, price: numericPrice, category, availability }
                        : item
                );
                showToast(`${name} has been updated`);
            } else {
                // Add new item
                const newItem: InventoryItem = {
                    id: Date.now().toString(),
                    name,
                    price: numericPrice,
                    category,
                    availability,
                };
                newItems = [...inventory, newItem];
                showToast(`${name} has been added to inventory`);
            }

            await updateInventoryInFirebase(newItems);
            setInventory(newItems);
            setEditingId(null);
            setName('');
            setPrice('');
            setCategory('');
            setAvailability(AVAILABILITY_OPTIONS[0]);
        } catch (error) {
            console.error('Error adding/updating item:', error);
            setAlert({ visible: true, title: 'Error', message: 'Failed to save item', actions: [{ text: 'OK' }] });
        } finally {
            setLoading(false);
            toggleForm();
        }
    };

    const removeItem = async (id: string) => {
        try {
            const itemToRemove = inventory.find(item => item.id === id);
            if (!itemToRemove) return;
            setPendingRemove({ id, name: itemToRemove.name });
        } catch (error) {
            console.error('Error removing item:', error);
            setAlert({ visible: true, title: 'Error', message: 'Failed to remove item', actions: [{ text: 'OK' }] });
        }
    };

    const startEditing = (item: InventoryItem) => {
        !isFormVisible && toggleForm();
        setEditingId(item.id);
        setName(item.name);
        setPrice(item.price.toString());
        setCategory(item.category);
        setAvailability(item.availability as AvailabilityType);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setName('');
        setPrice('');
        setCategory('');
        setAvailability(AVAILABILITY_OPTIONS[0]);
    };

    const toggleForm = () => {
        const toValue = isFormVisible ? 0 : 1;
        setIsFormVisible(!isFormVisible);
        Animated.spring(animatedHeight, {
            toValue,
            useNativeDriver: false,
            bounciness: 2
        }).start();
        // Scroll to top when expanding the form
        if (!isFormVisible && scrollViewRef.current) {
            setTimeout(() => {
                scrollViewRef.current?.scrollTo({ y: 0, animated: true });
            }, 250); // Wait for animation
        }
    };

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;

        if (currentScrollY > lastScrollY.current + scrollThreshold && isFormVisible) {
            // Scrolling up, collapse the form
            toggleForm();
        }

        lastScrollY.current = currentScrollY;
    };

    const renderItem = ({ item }: { item: InventoryItem }) => (
        <View style={styles.itemContainer} key={item.id}>
            <View style={styles.itemContent}>
                <Text style={styles.itemName}>{item.name}</Text>
                <View style={styles.itemDetails}>
                    <Text style={styles.itemPrice}>₹{(+item.price).toFixed(2)}</Text>
                    <View style={styles.itemTags}>
                        <View style={styles.tag}>
                            <Text style={styles.tagText}>{item.category}</Text>
                        </View>
                        <View style={[styles.tag, item.availability.toLowerCase() === 'in stock' ? styles.inStock : styles.outStock]}>
                            <Text style={styles.tagText}>{item.availability}</Text>
                        </View>
                    </View>
                </View>
            </View>
            <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.editButton} onPress={() => startEditing(item)}>
                    <Text style={styles.buttonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.removeButton} onPress={() => removeItem(item.id)}>
                    <Text style={styles.buttonText}>Remove</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* <View style={styles.header}>
                <Text style={styles.headerText}>Manage your inventory items</Text>
            </View> */}

            <ScrollView
                ref={scrollViewRef}
                style={styles.scrollContainer}
                onScroll={(event) => handleScroll(event)}
                scrollEventThrottle={16}
            >
                <Animated.View style={[
                    styles.formContainer,
                    {
                        maxHeight: animatedHeight.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 500]
                        }),
                        opacity: animatedHeight,
                        marginBottom: animatedHeight.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 16]
                        })
                    }
                ]}>
                    <View style={styles.inputContainer}>
                        <View style={styles.formHeader}>
                            <Text style={styles.formTitle}>Add New Item</Text>
                            <TouchableOpacity
                                style={styles.collapseButton}
                                onPress={toggleForm}
                            >
                                <FontAwesome
                                    name="chevron-up"
                                    size={16}
                                    color="#666"
                                />
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            placeholder="Item Name"
                            placeholderTextColor="#999"
                            value={name}
                            onChangeText={setName}
                            autoCapitalize='words'
                            style={styles.input}
                        />
                        <TextInput
                            placeholder="Price (₹)"
                            placeholderTextColor="#999"
                            value={price ? "₹" + price : ''}
                            onChangeText={(t) => {
                                setPrice(t.replaceAll("₹", ""))
                            }}
                            keyboardType="numeric"
                            style={styles.input}
                        />
                        <TextInput
                            placeholder="Category (e.g., Electronics, Clothing)"
                            placeholderTextColor="#999"
                            value={category}
                            onChangeText={setCategory}
                            style={styles.input}
                        />
                        <View style={styles.pickerContainer}>
                            <Text style={styles.pickerLabel}>Availability</Text>
                            <TouchableOpacity
                                style={styles.pickerButton}
                                onPress={() => setShowAvailabilityModal(true)}
                            >
                                <Text style={styles.pickerButtonText}>{availability}</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={[styles.mainButton, editingId ? styles.saveButton : styles.addButton]}
                                onPress={addItem}
                            >
                                <Text style={styles.mainButtonText}>
                                    {editingId ? "Save Changes" : "Add Item"}
                                </Text>
                            </TouchableOpacity>
                            {editingId && (
                                <TouchableOpacity
                                    style={[styles.mainButton, styles.cancelButton]}
                                    onPress={cancelEditing}
                                >
                                    <Text style={styles.mainButtonText}>Cancel</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </Animated.View>

                {inventory.length === 0 ? (
                    <View style={[styles.emptyStateContainer, { flex: 1, minHeight: 400 }]}>
                        <Ionicons name="cube-outline" size={64} color="#94a3b8" />
                        <Text style={styles.emptyStateTitle}>No Items Yet</Text>
                        <Text style={styles.emptyStateMessage}>
                            Use the form above to add items to your inventory.{'\n'}
                            This will help you manage your stock efficiently.
                        </Text>
                    </View>
                ) : (
                    <View style={styles.listContainer}>
                        {inventory.map((item) => renderItem({ item }))}
                    </View>
                )}
            </ScrollView>

            {!isFormVisible && (
                <TouchableOpacity
                    style={styles.expandButton}
                    onPress={toggleForm}
                >
                    <FontAwesome
                        name="plus"
                        size={16}
                        color="#fff"
                    />
                    <Text style={styles.expandButtonText}>Add New Item</Text>
                </TouchableOpacity>
            )}

            {/* // Availability Dropdown Modal */}
            <Modal
                visible={showAvailabilityModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowAvailabilityModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowAvailabilityModal(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Availability</Text>
                        {AVAILABILITY_OPTIONS.map((option) => (
                            <TouchableOpacity
                                key={option}
                                style={[
                                    styles.modalOption,
                                    availability === option && styles.modalOptionSelected
                                ]}
                                onPress={() => {
                                    setAvailability(option);
                                    setShowAvailabilityModal(false);
                                }}
                            >
                                <Text style={[
                                    styles.modalOptionText,
                                    availability === option && styles.modalOptionTextSelected
                                ]}>
                                    {option}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>

            <CustomAlertModal
                visible={!!pendingRemove}
                title="Confirm Deletion"
                message={pendingRemove ? `Are you sure you want to remove ${pendingRemove.name}?` : ''}
                actions={[
                    { text: 'Cancel', style: 'cancel', onPress: () => setPendingRemove(null) },
                    {
                        text: 'Remove', style: 'destructive', onPress: async () => {
                            if (!pendingRemove) return;
                            const { id, name } = pendingRemove;
                            const newItems = inventory.filter(item => item.id !== id);
                            await updateInventoryInFirebase(newItems);
                            setInventory(newItems);
                            if (editingId === id) {
                                setEditingId(null);
                                setName('');
                                setPrice('');
                                setCategory('');
                                setAvailability(AVAILABILITY_OPTIONS[0]);
                            }
                            setPendingRemove(null);
                            showToast(`${name} has been removed`);
                        }
                    }
                ]}
                onRequestClose={() => setPendingRemove(null)}
            />
            <CustomAlertModal
                visible={alert.visible}
                title={alert.title}
                message={alert.message}
                actions={alert.actions}
                onRequestClose={() => setAlert({ ...alert, visible: false })}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingBottom: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerText: {
        fontSize: 15,
        color: '#666',
    },
    inputContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    input: {
        backgroundColor: '#f8f8f8',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    mainButton: {
        flex: 1,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addButton: {
        backgroundColor: '#2196F3',
    },
    saveButton: {
        backgroundColor: '#4CAF50',
    },
    cancelButton: {
        backgroundColor: '#888',
    },
    mainButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    list: {
        flex: 1,
    },
    listContent: {
        paddingBottom: 20,
    },
    itemContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2.22,
        elevation: 3,
    },
    itemContent: {
        flex: 1,
    },
    itemName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    itemDetails: {
        flexDirection: 'column',
        gap: 10,
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    itemPrice: {
        fontSize: 18,
        flex: 1,
        fontWeight: '500',
        color: '#2196F3',
    },
    itemTags: {
        flexDirection: 'row',
        flex: 2,
        gap: 8,
    },
    tag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: '#e0e0e0',
    },
    inStock: {
        backgroundColor: '#E8F5E9',
    },
    outStock: {
        backgroundColor: '#FFEBEE',
    },
    tagText: {
        fontSize: 12,
        color: '#666',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    editButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    removeButton: {
        backgroundColor: '#FF5252',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    loadingText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        color: '#666',
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
    addFirstItemButton: {
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
    addFirstItemButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    pickerContainer: {
        marginBottom: 12,
    },
    pickerLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    pickerButton: {
        backgroundColor: '#f8f8f8',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        padding: 12,
        width: '100%',
    },
    pickerButtonText: {
        fontSize: 16,
        color: '#333',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        width: '80%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
        textAlign: 'center',
    },
    modalOption: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginBottom: 8,
    },
    modalOptionSelected: {
        backgroundColor: '#2196F3',
    },
    modalOptionText: {
        fontSize: 16,
        color: '#333',
    },
    modalOptionTextSelected: {
        color: '#fff',
    },
    formHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    formTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    collapseButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
    },
    expandButton: {
        backgroundColor: '#2196F3',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingBlock: 18,
        borderRadius: 8,
        // marginBottom: 16,
        gap: 8,
    },
    expandButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    formContainer: {
        overflow: 'hidden',
    },
    scrollContainer: {
        flex: 1,
    },
    listContainer: {
        paddingInline: 20,
        paddingBlock: 10,
    },
});

export default ManageInventory;
