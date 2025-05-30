import FontAwesome from '@expo/vector-icons/FontAwesome';
import { getAuth, signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from '@react-native-firebase/auth';
import { collection, doc, FirebaseFirestoreTypes, getDocs, getFirestore, query, updateDoc, where } from '@react-native-firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Modal, Platform, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import EditProfileModal from '../components/EditProfileModal';

const ChangePasswordModal: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill all fields.');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New passwords do not match.');
            return;
        }
        setLoading(true);
        try {
            const auth = getAuth();
            const user = auth.currentUser;
            if (!user || !user.email) throw new Error('No user found');
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);
            Alert.alert('Success', 'Password changed successfully.');
            onClose();
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to change password.');
        } finally {
            setLoading(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 24, width: '90%' }}>
                    <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 18, color: '#1e293b', textAlign: 'center' }}>Change Password</Text>
                    <TextInput
                        style={styles.changePassworrdInput}
                        placeholder="Current Password"
                        placeholderTextColor="#999999"
                        secureTextEntry
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                    />
                    <TextInput
                        style={styles.changePassworrdInput}
                        placeholder="New Password"
                        placeholderTextColor="#999999"
                        secureTextEntry
                        value={newPassword}
                        onChangeText={setNewPassword}
                    />
                    <TextInput
                        style={styles.changePassworrdInput}
                        placeholder="Confirm New Password"
                        placeholderTextColor="#999999"
                        secureTextEntry
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                    />
                    {loading ? <ActivityIndicator size="large" color="#3b82f6" style={{ marginVertical: 10 }} /> : null}
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 10 }}>
                        <TouchableOpacity style={{ backgroundColor: '#e5e7eb', paddingVertical: 10, paddingHorizontal: 22, borderRadius: 8, marginRight: 8 }} onPress={onClose} disabled={loading}>
                            <Text style={{ color: '#3b82f6', fontWeight: '600', fontSize: 15 }}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{ backgroundColor: '#3b82f6', paddingVertical: 10, paddingHorizontal: 22, borderRadius: 8, alignItems: 'center' }} onPress={handleChange} disabled={loading}>
                            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Change</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const AccountScreen: React.FC = () => {
    const router = useRouter();
    const [user, setUser] = useState<FirebaseFirestoreTypes.DocumentData | null>();
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [changePasswordVisible, setChangePasswordVisible] = useState(false);
    const [imageLoading, setImageLoading] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            // Fetch user data from firestore collection "Users" where phone number equals User's
            try {
                const docPromise = await getDocs(query(collection(getFirestore(), 'Users'), where('userId', '==', getAuth().currentUser?.uid)))
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
        setEditModalVisible(true);
    };

    const handleSaveProfile = async (newName: string, newAddress: string, newPan: string, newGstin: string, newPhone: string, newWebsite: string, logoUrl?: string) => {

        try {
            const db = getFirestore();
            const userRef = collection(db, 'Users');
            const q = query(userRef, where('userId', '==', getAuth().currentUser?.uid));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const docId = querySnapshot.docs[0].id;
                const userDocRef = doc(db, 'Users', docId);
                await updateDoc(userDocRef, {
                    name: newName,
                    address: newAddress,
                    panNumber: newPan,
                    gstin: newGstin,
                    phoneNumber: newPhone,
                    website: newWebsite,
                    ...(logoUrl ? { businessLogo: logoUrl } : {}),
                });
                setUser({ ...user, name: newName, address: newAddress, panNumber: newPan, gstin: newGstin, phoneNumber: newPhone, website: newWebsite, ...(logoUrl ? { businessLogo: logoUrl } : {}) });
                Alert.alert('Success', 'Profile updated successfully.');
            } else {
                Alert.alert('Error', 'User document not found.');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to update profile.');
            console.error('Error updating profile:', error);
        } finally {
            setEditModalVisible(false);
        }
    };

    const handleChangePassword = () => {
        setChangePasswordVisible(true);
    };

    const handleLogout = async () => {
        Alert.alert('Logout', 'Logout successful.');
        setUser(null);
        await signOut(getAuth());
        router.replace({
            pathname: '/AuthScreen',
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
                {user?.businessLogo ? (
                    <View>
                        <Image
                            source={{ uri: user?.businessLogo }}
                            style={styles.profileImage}
                            onLoadStart={() => setImageLoading(true)}
                            onLoadEnd={() => setImageLoading(false)}
                        />
                        {imageLoading && (
                            <ActivityIndicator
                                size="large"
                                color="#3b82f6"
                                style={{ position: 'absolute', top: 40, left: 40, zIndex: 2 }}
                            />
                        )}
                    </View>
                ) : (
                    <LinearGradient
                        colors={['#4c669f', '#3b5998', '#192f6a']}
                        style={styles.profileBackground}>
                        <FontAwesome name="user" size={100} color="white" />
                    </LinearGradient>
                )}
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
                <Text style={styles.value}>{user?.phoneNumber && "+91-" + user?.phoneNumber}</Text>
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

            <EditProfileModal
                userId={getAuth().currentUser?.uid || ''}
                visible={editModalVisible}
                initialName={user?.name || ''}
                initialAddress={user?.address || ''}
                initialPanNumber={user?.panNumber || ''}
                initialGstin={user?.gstin || ''}
                initialPhoneNumber={user?.phoneNumber || ''}
                initialWebsite={user?.website || ''}
                initialLogo={user?.businessLogo || ''}
                onSave={handleSaveProfile}
                onCancel={() => setEditModalVisible(false)}
            />
            <ChangePasswordModal visible={changePasswordVisible} onClose={() => setChangePasswordVisible(false)} />
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
        borderWidth: 2,
        borderColor: '#e5e7eb',
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
    },
    changePassworrdInput: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        padding: 12,
        fontSize: 15,
        marginBottom: 10,
        backgroundColor: '#f8fafc',
        color: '#1e293b',
    },
});

export default AccountScreen;
