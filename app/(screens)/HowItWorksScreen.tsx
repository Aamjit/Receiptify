import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

const features = [
    {
        icon: 'user-circle' as const,
        title: 'User Authentication',
        description: 'Sign up or log in using email/password, Google, or OTP. Reset your password if needed.'
    },
    {
        icon: 'id-badge' as const,
        title: 'Account Setup & Profile',
        description: 'Set up your business profile, edit details, change password, and upload a business logo.'
    },
    {
        icon: 'archive' as const,
        title: 'Inventory Management',
        description: 'Add, edit, or delete inventory items. Use the “Manage Inventory” button on the Home screen to quickly access and update your product list.'
    },
    {
        icon: 'file-text' as const,
        title: 'Receipt Creation & Management',
        description: 'Tap “Create Receipt” on the Home screen to start a new sale. Enter items quantity, apply discounts.\nManage ongoing and past receipts from the Home screen. Save the receipt to edit it furhter, finalize a receipt to mark it as completed.'
    },
    {
        icon: 'share-square' as const,
        title: 'Export & Share',
        description: 'Export receipts and reports as PDF files. Share them via email or other apps directly from the Home or Report screens.'
    },
    {
        icon: 'line-chart' as const,
        title: 'Analytics & Reports',
        description: 'Tap “Reports” on the Home screen to view sales trends, sales count, and top items. Filter analytics by date and export reports.'
    },
    {
        icon: 'bar-chart' as const,
        title: 'How to Read the Report & Visuals',
        description:
            'The Report screen summarizes your sales data for the selected date range.\n\n' +
            '• Total Sales: The sum of all sales in the period.\n' +
            '• Avg. Transaction: The average value of each sale.\n' +
            '• Top Selling Items: The most popular items, showing quantity sold and total revenue.\n' +
            '• Sales Trend: A line chart showing daily sales totals. Peaks indicate busy days.\n' +
            '• Sales Count: A line chart showing the number of transactions per day.\n' +
            '• Receipts Heatmap: A grid showing which hours and days are busiest. Each row is a day (Sun–Sat), each column is an hour (0–23). Darker colors mean more receipts. Use this to spot your peak business times.'
    },
    {
        icon: 'exclamation-circle' as const,
        title: 'Error Handling & Alerts',
        description: 'All errors and confirmations use a branded, consistent modal for clarity.'
    },
    {
        icon: 'question-circle' as const,
        title: 'Help & Support',
        description: 'Access this How It Works page anytime from the menu or Get Help screen.'
    }
];

export default function HowItWorksScreen() {
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.header}>How to Use This App</Text>
            <Text style={styles.subheader}>
                Explore the features below to get the most out of your business app.
            </Text>
            {features.map((feature, idx) => (
                <View key={feature.title} style={styles.featureBox}>
                    <FontAwesome name={feature.icon} size={32} color="#2196F3" style={styles.icon} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.featureTitle}>{feature.title}</Text>
                        <Text style={styles.featureDesc}>{feature.description}</Text>
                    </View>
                </View>
            ))}
            <Text style={styles.footer}>
                Need more help? Contact support from the Account or How It Works section
            </Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        padding: 24,
        paddingBottom: 40,
    },
    header: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#222',
        marginBottom: 8,
        textAlign: 'center',
    },
    subheader: {
        fontSize: 16,
        color: '#555',
        marginBottom: 24,
        textAlign: 'center',
    },
    featureBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#f3f8fd',
        borderRadius: 12,
        padding: 16,
        marginBottom: 18,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
    },
    icon: {
        marginRight: 16,
        marginTop: 2,
    },
    featureTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a237e',
        marginBottom: 2,
    },
    featureDesc: {
        fontSize: 15,
        color: '#333',
    },
    footer: {
        fontSize: 15,
        color: '#888',
        marginTop: 32,
        textAlign: 'center',
    },
});
