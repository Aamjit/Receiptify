import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Dimensions, FlatList, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const features = [
    { key: 'createReceipt', label: 'Create Receipt', icon: "create" },
    { key: 'viewPastReceipts', label: 'View Past Receipts', icon: "receipt" },
    { key: 'viewActiveReceipts', label: 'View Active Receipts', icon: "refresh-circle" },
    { key: 'viewReports', label: 'View Reports', icon: "document-text", locked: true },
    { key: 'manageInventory', label: 'Manage Inventory', icon: "file-tray-stacked" },
    { key: 'help', label: 'Get Help', icon: "help-circle", locked: true },
    // Add more features here if needed
];

const numColumns = 2;
const screenWidth = Dimensions.get('window').width;
const itemWidth = (screenWidth - 40) / numColumns; // 20 padding on each side and 10 margin between items
const router = useRouter();

const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 20;

const HomeScreen: React.FC = () => {
    const renderItem = ({ item }: { item: typeof features[0] }) => (
        <TouchableOpacity style={[styles.item, { width: itemWidth }]} onPress={() => featurePress(item)}>
            <Ionicons name={item.icon as never} size={54} color="#fff" />
            {item.locked && <Ionicons name={"lock-closed"} size={20} color="#fff" style={styles.lockIcon} />}
            <Text style={styles.itemText}>{item.label}</Text>
        </TouchableOpacity>
    );

    const featurePress = (item: typeof features[0]) => {
        switch (item.key) {
            case 'createReceipt':
                router.navigate("/(screens)/CreateReceipt")
                break;
            case 'manageInventory':
                router.navigate("/(screens)/ManageInventory")
                break;
            case 'viewPastReceipts':
                router.navigate("/(screens)/PastReceipts")
                break;
            case 'viewActiveReceipts':
                router.navigate("/(screens)/ActiveReceipts")
                break;

            default:
                Alert.alert("Feature Locked 🔒", "Sorry! we are not ready with this. We are wokring on it.")
                break;
        }
    }

    return (
        <View style={[styles.container, { paddingTop: statusBarHeight + 20 }]}>
            <FlatList
                data={features}
                renderItem={renderItem}
                keyExtractor={item => item.key}
                numColumns={numColumns}
                columnWrapperStyle={styles.row}
                contentContainerStyle={styles.listContent}
            />
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 10,
        backgroundColor: '#fff',
    },
    headerText: {
        fontSize: 32,
        fontFamily: 'SourceCodePro',
        fontWeight: '700',
        paddingInline: 10,
        paddingBottom: 20,
    },
    listContent: {
        paddingBottom: 20,
    },
    row: {
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    item: {
        backgroundColor: '#007AFF',
        borderRadius: 12,
        // height: 110,
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 6,
        paddingBlock: 20,
    },
    itemText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        paddingHorizontal: 10,
    },
    lockIcon: {
        position: 'absolute',
        right: 100,
        top: "50%",
        borderStyle: 'solid',
        borderRadius: 20,
        backgroundColor: "#f39c12",
        padding: 4
    }
});

export default HomeScreen;
