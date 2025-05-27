import FontAwesome from '@expo/vector-icons/FontAwesome';
import { getAuth, signOut } from '@react-native-firebase/auth';
import { collection, FirebaseFirestoreTypes, getDocs, getFirestore, query, where } from '@react-native-firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const AccountScreen: React.FC = () => {
    const router = useRouter();
    const [user, setUser] = useState<FirebaseFirestoreTypes.DocumentData | null>();

    useEffect(() => {
        const fetchUser = async () => {
            // Fetch user data from firestore collection "Users" where phone number equals User's
            try {
                const docPromise = await getDocs(query(collection(getFirestore(), 'Users'), where('email', '==', getAuth().currentUser?.email)))
                docPromise.forEach(doc => {
                    setUser(doc.data())
                })
            } catch (error) {
                console.error('Error checking email existence:', error);
            }

        };
        fetchUser();
    }, [])

    const handleEditProfile = () => {
        Alert.alert('Edit Profile', 'Edit profile functionality to be implemented.');
    };

    const handleChangePassword = () => {
        Alert.alert('Change Password', 'Change password functionality to be implemented.');
    };

    const handleLogout = async () => {
        Alert.alert('Logout', 'Logout successful.');
        setUser(null);
        await signOut(getAuth());
        router.replace({
            pathname: '/AuthScreen1',
            params: {
                reset: 'true'
            }
        });
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <Text style={styles.title}>User Account</Text>
            <View style={styles.profileImageContainer}>
                {user?.businessLogo ? <Image source={{ uri: user?.businessLogo }} style={styles.profileImage} /> :
                    <LinearGradient
                        colors={['#4c669f', '#3b5998', '#192f6a']}
                        style={styles.profileBackground}>
                        <FontAwesome name="user" size={100} color="white" />
                    </LinearGradient>
                }
            </View>
            <View style={styles.infoContainer}>
                <Text style={styles.label}>Name:</Text>
                <Text style={styles.value}>{user?.name}</Text>
            </View>
            <View style={styles.infoContainer}>
                <Text style={styles.label}>Email:</Text>
                <Text style={styles.value}>{user?.email}</Text>
            </View>
            <View style={styles.infoContainer}>
                <Text style={styles.label}>Phone:</Text>
                <Text style={styles.value}>{user?.phoneNumber}</Text>
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
        backgroundColor: '#f8fafc',
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        marginVertical: 24,
        color: '#1e293b',
        textAlign: 'center',
    },
    profileImageContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    infoContainer: {
        flexDirection: 'row',
        marginBottom: 16,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    label: {
        fontWeight: '600',
        fontSize: 15,
        width: 70,
        color: '#64748b',
    },
    value: {
        fontSize: 15,
        color: '#1e293b',
        flexShrink: 1,
        fontWeight: '500',
    },
    button: {
        backgroundColor: '#3b82f6',
        paddingVertical: 16,
        borderRadius: 12,
        marginTop: 12,
        marginHorizontal: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    logoutButton: {
        backgroundColor: '#ef4444',
        marginTop: 24,
    },
    logoutButtonText: {
        fontWeight: '600',
    },
    profileBackground: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#3b82f6',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
    }
});

export default AccountScreen;
