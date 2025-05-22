import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Image, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const AccountScreen: React.FC = () => {
    // Placeholder user data, replace with real data or context
    const user = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // Dummy profile image URL
    };

    const handleEditProfile = () => {
        Alert.alert('Edit Profile', 'Edit profile functionality to be implemented.');
    };

    const handleChangePassword = () => {
        Alert.alert('Change Password', 'Change password functionality to be implemented.');
    };

    const handleLogout = () => {
        Alert.alert('Logout', 'Logout successfull.');
        useRouter().replace("/(screens)/AuthScreen")
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <Text style={styles.title}>User Account</Text>
            <View style={styles.profileImageContainer}>
                <Image source={{ uri: user.profileImage }} style={styles.profileImage} />
            </View>
            <View style={styles.infoContainer}>
                <Text style={styles.label}>Name:</Text>
                <Text style={styles.value}>{user.name}</Text>
            </View>
            <View style={styles.infoContainer}>
                <Text style={styles.label}>Email:</Text>
                <Text style={styles.value}>{user.email}</Text>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleEditProfile}>
                <Text style={styles.buttonText}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={handleChangePassword}>
                <Text style={styles.buttonText}>Change Password</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
                <Text style={[styles.buttonText, styles.logoutButtonText]}>Logout</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
        paddingHorizontal: 15,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 20,
        color: '#051d5f',
        textAlign: 'center',
    },
    profileImageContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    infoContainer: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    label: {
        fontWeight: '600',
        fontSize: 16,
        width: 70,
        color: '#333',
    },
    value: {
        fontSize: 16,
        color: '#555',
        flexShrink: 1,
    },
    button: {
        backgroundColor: '#007AFF',
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 15,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    logoutButton: {
        backgroundColor: '#FF3B30',
    },
    logoutButtonText: {
        fontWeight: '700',
    },
});

export default AccountScreen;
