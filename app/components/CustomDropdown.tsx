import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

type InventoryItem = {
    id: string;
    name: string;
    price: number;
};

type CustomDropdownProps = {
    items: InventoryItem[];
    selectedItemId: string;
    onSelectItem: (item: InventoryItem) => void;
    placeholder?: string;
};

const CustomDropdown: React.FC<CustomDropdownProps> = ({
    items,
    selectedItemId,
    onSelectItem,
    placeholder = 'Select item',
}) => {
    const [dropdownVisible, setDropdownVisible] = useState(false);

    const selectedItem = items.find(item => item.id === selectedItemId);

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.selector}
                onPress={() => setDropdownVisible(!dropdownVisible)}
            >
                <Text style={[styles.selectorText, { color: selectedItem ? '#000' : '#999' }]}>
                    {selectedItem ? selectedItem.name : placeholder}
                </Text>
            </TouchableOpacity>
            {dropdownVisible && (
                <View style={styles.dropdown}>
                    <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={true} indicatorStyle="black">
                        {items.map(item => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.dropdownItem}
                                onPress={() => {
                                    onSelectItem(item);
                                    setDropdownVisible(false);
                                }}
                            >
                                <Text style={styles.dropdownItemText}>{item.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        // position: 'absolute',
        width: '100%',
    },
    selector: {
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 8,
        backgroundColor: '#fff',
        justifyContent: 'center',
    },
    selectorText: {
        fontSize: 15,
    },
    dropdown: {
        maxHeight: 150,
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 8,
        backgroundColor: '#fff',
        marginTop: 4,
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

export default CustomDropdown;
