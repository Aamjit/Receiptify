import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Dimensions, FlatList, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Feature {
    key: string;
    label: string;
    icon: string;
    gradient: [string, string];
    locked?: boolean;
}

const features: Feature[] = [
    { key: 'createReceipt', label: 'Create Receipt', icon: "create", gradient: ['#4CAF50', '#2E7D32'] },
    { key: 'viewActiveReceipts', label: 'View Active Receipts', icon: "refresh-circle", gradient: ['#9C27B0', '#6A1B9A'] },
    { key: 'viewPastReceipts', label: 'View Completed Receipts', icon: "receipt", gradient: ['#2196F3', '#1565C0'] },
    { key: 'manageInventory', label: 'Manage Inventory', icon: "file-tray-stacked", gradient: ['#00BCD4', '#0097A7'] },
    { key: 'viewReports', label: 'View Reports', icon: "document-text", gradient: ['#FF9800', '#F57C00'] },
    { key: 'help', label: 'Get Help', icon: "help-circle", locked: true, gradient: ['#FF5722', '#E64A19'] },
    // Add more features here if needed
];

const numColumns = 2;
const screenWidth = Dimensions.get('window').width;
const padding = 20;
const gap = 16;
const itemWidth = (screenWidth - (padding * 2) - gap) / numColumns; // Account for padding and gap

const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 10;

const HomeScreen: React.FC = () => {
    const router = useRouter();

    const renderItem = ({ item }: { item: Feature }) => (
        <TouchableOpacity
            style={[styles.itemWrapper, { width: itemWidth }]}
            onPress={() => featurePress(item)}
            activeOpacity={0.9}
        >
            <LinearGradient
                colors={item.gradient}
                style={styles.item}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.iconContainer}>
                    <Ionicons name={item.icon as never} size={32} color="#fff" />
                    {item.locked && (
                        <View style={styles.lockContainer}>
                            <Ionicons name="lock-closed" size={14} color="#fff" />
                        </View>
                    )}
                </View>
                <Text style={styles.itemText}>{item.label}</Text>
            </LinearGradient>
        </TouchableOpacity>
    );

    const featurePress = (item: Feature) => {
        switch (item.key) {
            case 'createReceipt':
                router.navigate("/CreateReceipt")
                break;
            case 'manageInventory':
                router.navigate("/ManageInventory")
                break;
            case 'viewPastReceipts':
                router.navigate("/PastReceipts")
                break;
            case 'viewActiveReceipts':
                router.navigate("/ActiveReceipts")
                break;
            case 'viewReports':
                router.navigate("/ReportScreen")
                break;
            default:
                Alert.alert(
                    "Feature Locked 🔒",
                    "This feature is coming soon! We're working hard to bring it to you.",
                    [{ text: "OK", style: "default" }]
                );
                break;
        }
    }

    return (
        <View style={[styles.container, { paddingTop: statusBarHeight }]}>
            <View style={styles.header}>
                <Text style={styles.welcomeText}>Welcome back!</Text>
                <Text style={styles.subText}>What would you like to do today?</Text>
            </View>
            <FlatList
                data={features}
                renderItem={renderItem}
                keyExtractor={item => item.key}
                numColumns={numColumns}
                columnWrapperStyle={styles.row}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        paddingHorizontal: padding,
    },
    header: {
        marginVertical: 24,
    },
    welcomeText: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    subText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    listContent: {
        paddingBottom: 24,
    },
    row: {
        justifyContent: 'space-between',
        marginBottom: 16,
        gap: 16,
    },
    itemWrapper: {
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    item: {
        borderRadius: 16,
        padding: 20,
        height: 140,
        justifyContent: 'space-between',
    },
    iconContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    lockContainer: {
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderRadius: 12,
        padding: 6,
    },
    itemText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginTop: 12,
    },
});

export default HomeScreen;
