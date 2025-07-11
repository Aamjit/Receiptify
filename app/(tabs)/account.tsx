import FontAwesome from '@expo/vector-icons/FontAwesome';
import { getAuth, signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from '@react-native-firebase/auth';
import { collection, doc, getDocs, getFirestore, query, updateDoc, where } from '@react-native-firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, Modal, Platform, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator, ToastAndroid } from 'react-native';
import CustomAlertModal from '@/components/CustomAlertModal';
import EditProfileModal from '../components/EditProfileModal';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useAppContext } from '@/hooks/useApp';

const ChangePasswordModal: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState({ state: false, text: '' });
    const [alert, setAlert] = useState<{ visible: boolean; title: string; message: string; actions?: any[] }>({ visible: false, title: '', message: '', actions: [] });

    const handleChange = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            setAlert({ visible: true, title: 'Error', message: 'Please fill all fields.', actions: [{ text: 'OK' }] });
            return;
        }
        if (newPassword !== confirmPassword) {
            setAlert({ visible: true, title: 'Error', message: 'New passwords do not match.', actions: [{ text: 'OK' }] });
            return;
        }
        setLoading({ state: true, text: "Updating password..." });
        try {
            const auth = getAuth();
            const user = auth.currentUser;
            if (!user || !user.email) throw new Error('No user found');
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);
            setAlert({ visible: true, title: 'Success', message: 'Password changed successfully.', actions: [{ text: 'OK', onPress: onClose }] });
        } catch (err: any) {
            setAlert({ visible: true, title: 'Error', message: err.message || 'Failed to change password.', actions: [{ text: 'OK' }] });
        } finally {
            setLoading({ ...loading, state: false });
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
                    {loading.state ? <ActivityIndicator size="large" color="#3b82f6" style={{ marginVertical: 10 }} /> : null}
                    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 10 }}>
                        <TouchableOpacity style={{ backgroundColor: '#e5e7eb', paddingVertical: 10, paddingHorizontal: 22, borderRadius: 8, marginRight: 8 }} onPress={onClose} disabled={loading.state}>
                            <Text style={{ color: '#3b82f6', fontWeight: '600', fontSize: 15 }}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{ backgroundColor: '#3b82f6', paddingVertical: 10, paddingHorizontal: 22, borderRadius: 8, alignItems: 'center' }} onPress={handleChange} disabled={loading.state}>
                            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Change</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
            <CustomAlertModal
                visible={alert.visible}
                title={alert.title}
                message={alert.message}
                actions={alert.actions}
                onRequestClose={() => setAlert({ ...alert, visible: false })}
            />
        </Modal>
    );
};

const AccountScreen: React.FC = () => {
    const router = useRouter();
    const { User, setUser } = useAppContext();
    // const [user, setUser] = useState<FirebaseFirestoreTypes.DocumentData | null>();
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [changePasswordVisible, setChangePasswordVisible] = useState(false);
    const [imageLoading, setImageLoading] = useState(false);
    const [alert, setAlert] = useState<{ visible: boolean; title: string; message: string; actions?: any[] }>({ visible: false, title: '', message: '', actions: [] });
    const [loggingOut, setLoggingOut] = useState(false);
    const [loading, setLoading] = useState({ state: !User ? true : false, text: "Loading..." });

    const handleEditProfile = () => {
        setEditModalVisible(true);
    };

    const handleSaveProfile = async (newName: string, newAddress: string, newPan: string, newGstin: string, newPhone: string, newWebsite: string, logoUrl?: string) => {
        setLoading({ state: true, text: "Saving user data..." })
        try {
            const db = getFirestore();
            const userRef = collection(db, 'Users');
            const q = query(userRef, where('userId', '==', getAuth().currentUser?.uid));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const docId = querySnapshot.docs[0].id;
                const userDocRef = doc(db, 'Users', docId);
                const updatedUser = {
                    name: newName,
                    address: newAddress,
                    panNumber: newPan,
                    gstin: newGstin,
                    phoneNumber: newPhone,
                    website: newWebsite,
                    ...(logoUrl ? { businessLogo: logoUrl } : {}),
                }
                await updateDoc(userDocRef, updatedUser);
                setUser({ ...User, ...updatedUser });
                // setUser({ ...User, name: newName, address: newAddress, panNumber: newPan, gstin: newGstin, phoneNumber: newPhone, website: newWebsite, ...(logoUrl ? { businessLogo: logoUrl } : {}) });
                setAlert({ visible: true, title: 'Success', message: 'Profile updated successfully.', actions: [{ text: 'OK', onPress: () => setAlert({ ...alert, visible: false }) }] });
            } else {
                setAlert({ visible: true, title: 'Error', message: 'User document not found.', actions: [{ text: 'OK', onPress: () => setAlert({ ...alert, visible: false }) }] });
            }
        } catch (error) {
            setAlert({ visible: true, title: 'Error', message: 'Failed to update profile.', actions: [{ text: 'OK', onPress: () => setAlert({ ...alert, visible: false }) }] });
            console.error('Error updating profile:', error);
        } finally {
            setLoading({ state: false, text: "" })
            setEditModalVisible(false);
        }
    };

    const handleChangePassword = () => {
        setChangePasswordVisible(true);
    };

    const handleLogout = async () => {
        setAlert({
            visible: true,
            title: 'Confirm Logout',
            message: 'Are you sure you want to logout?',
            actions: [
                { text: 'Cancel', onPress: () => setAlert({ ...alert, visible: false }) },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        setAlert({ ...alert, visible: false });
                        setLoggingOut(true);

                        // Configure Google Signin
                        GoogleSignin.configure({
                            webClientId: process.env.EXPO_PUBLIC_CLIENT_ID // Replace with your actual web client ID from 
                        });

                        if (GoogleSignin.getCurrentUser()) {
                            try {
                                await GoogleSignin.signOut();
                            } catch (error) {
                                console.error('Error signing out from Google:', error);
                                ToastAndroid.show('Error signing out from Google', ToastAndroid.SHORT);
                                setLoggingOut(false);
                                return;
                            }
                        }
                        // console.log("Firebase", getAuth().currentUser);
                        if (getAuth().currentUser) {
                            await signOut(getAuth());
                        }

                        setTimeout(() => {
                            ToastAndroid.show('Logged out successfully!', ToastAndroid.SHORT);
                            setUser(null);
                            setLoggingOut(false);
                            router.replace({ pathname: '/AuthScreen', params: { reset: 'true' } });
                        }, 2000);
                    }
                }
            ]
        });
    };

    if (loading.state) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={{ marginTop: 12, color: '#3b82f6', fontWeight: '600', fontSize: 16 }}>{loading.text}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {loggingOut && (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.15)', zIndex: 999, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text style={{ marginTop: 12, color: '#3b82f6', fontWeight: '600', fontSize: 16 }}>Logging out...</Text>
                </View>
            )}
            <StatusBar barStyle="dark-content" />
            {/* <Text style={styles.title}> Account Details </Text> */}
            <View style={styles.profileImageContainer}>
                {User?.businessLogo ? (
                    <View>
                        <Image
                            source={{ uri: User?.businessLogo }}
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
                <Text style={styles.value}>{User?.name}</Text>
            </View>
            <View style={styles.infoContainer}>
                <Text style={styles.label}>Email:</Text>
                <Text style={styles.value}>{User?.email}</Text>
            </View>
            <View style={styles.infoContainer}>
                <Text style={styles.label}>Phone:</Text>
                <Text style={styles.value}>{User?.phoneNumber && "+91-" + User?.phoneNumber}</Text>
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
                initialName={User?.name || ''}
                initialAddress={User?.address || ''}
                initialPanNumber={User?.panNumber || ''}
                initialGstin={User?.gstin || ''}
                initialPhoneNumber={User?.phoneNumber || ''}
                initialWebsite={User?.website || ''}
                initialLogo={User?.businessLogo || ''}
                onSave={handleSaveProfile}
                onCancel={() => setEditModalVisible(false)}
            />
            <ChangePasswordModal visible={changePasswordVisible} onClose={() => setChangePasswordVisible(false)} />
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
        marginBottom: 20,
        paddingVertical: 34
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 2,
        borderColor: 'rgb(100, 100, 100)',
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
