import { createUserWithEmailAndPassword, getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithCredential, signInWithEmailAndPassword } from '@react-native-firebase/auth';
import { collection, doc, getDocs, getFirestore, query, setDoc, where } from '@react-native-firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, GestureResponderEvent, Image, StyleSheet, Text, TextInput, ToastAndroid, TouchableOpacity, View, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import CustomAlertModal from '@/components/CustomAlertModal'; // Adjust the import based on your project structure

const AuthScreen = () => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [isSignUp, setIsSignUp] = useState<boolean>(false);
    const [loading, setLoading] = useState({ state: false, text: "" });
    const [passwordVisible, setPasswordVisible] = useState<boolean>(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState<boolean>(false);
    const [customAlert, setCustomAlert] = useState<{ visible: boolean; title: string; message: string; actions?: any[] }>({ visible: false, title: '', message: '', actions: [] });
    const router = useRouter();

    useEffect(() => {
        // Configure Google Signin
        GoogleSignin.configure({
            webClientId: process.env.EXPO_PUBLIC_CLIENT_ID // Replace with your actual web client ID from Firebase console
        });

        // Redirect if already logged in
        // if (getAuth().currentUser) {
        //     router.replace('/home');
        // }
    }, []);


    // Handle user state changes
    function handleAuthStateChanged(user: any) {
        // setUser(user);
        // if (initializing) setInitializing(false);
        if (user) {
            router.replace('/home');
        }
    }

    useEffect(() => {
        const subscriber = onAuthStateChanged(getAuth(), handleAuthStateChanged);
        return subscriber; // unsubscribe on unmount
    }, []);

    const handleSignInOrSignUp = async (e: any) => {
        e.preventDefault();
        if (!email || !password) {
            setCustomAlert({ visible: true, title: 'Error', message: 'Please enter both email and password.', actions: [{ text: 'OK', onPress: () => setCustomAlert({ ...customAlert, visible: false }) }] });
            return;
        }
        if (isSignUp && password !== confirmPassword) {
            setCustomAlert({ visible: true, title: 'Error', message: 'Passwords do not match. Please retype your password.', actions: [{ text: 'OK', onPress: () => setCustomAlert({ ...customAlert, visible: false }) }] });
            return;
        }

        try {
            if (!isSignUp) {
                setLoading({ state: true, text: "Signing you in" })
                // Sign in flow
                const singInPro = await signInWithEmailAndPassword(getAuth(), email, password);
                if (singInPro) {
                    if (Platform.OS === 'android') {
                        ToastAndroid.show('Signed in successfully!', ToastAndroid.SHORT);
                    } else {
                        // Optionally add iOS toast/snackbar here
                    }
                    router.replace({ pathname: '/home', params: { reset: 'true' } });
                }
            } else {
                // Sign up flow with confirmation prompt
                setCustomAlert({
                    visible: true,
                    title: 'Account Create',
                    message: 'Confirm to create a new account?\n\nMake sure you remember your password.',
                    actions: [
                        { text: 'Back', onPress: () => setCustomAlert({ ...customAlert, visible: false }) },
                        {
                            text: 'Yes',
                            onPress: async () => {
                                setCustomAlert({ ...customAlert, visible: false });
                                setLoading({ state: true, text: "Creating user account..." });
                                try {
                                    await createUserWithEmailAndPassword(getAuth(), email, password);
                                    const authResult = getAuth().currentUser;
                                    if (!authResult) {
                                        throw new Error('Sign up failed: No user returned');
                                    }
                                    const db = getFirestore();
                                    const usersCollection = collection(db, 'Users');
                                    await setDoc(doc(usersCollection), {
                                        userId: authResult.uid,
                                        name: '',
                                        email: authResult.email || '',
                                        businessLogo: '',
                                        phoneNumber: '',
                                        address: '',
                                        gstin: '',
                                        businessType: '',
                                        panNumber: '',
                                        website: '',
                                        otherInfo: '',
                                        createdAt: new Date()
                                    });
                                    if (Platform.OS === 'android') {
                                        ToastAndroid.show('Account created successfully!', ToastAndroid.SHORT);
                                    } else {
                                        // Optionally add iOS toast/snackbar here
                                    }
                                    router.replace('/AccountSetupScreen');
                                } catch (signUpError: any) {
                                    setCustomAlert({ visible: true, title: 'Account Error', message: signUpError.message || 'Failed to sign in or sign up.', actions: [{ text: 'OK', onPress: () => setCustomAlert({ ...customAlert, visible: false }) }] });
                                } finally {
                                    setLoading({ state: false, text: "" });
                                }
                            }
                        }
                    ]
                });
                return;
            }
        } catch (error: any) {
            setCustomAlert({ visible: true, title: 'Authentication Error', message: 'Please check you email ID and password and try again.', actions: [{ text: 'OK', onPress: () => setCustomAlert({ ...customAlert, visible: false }) }] });
        } finally {
            setLoading({ state: false, text: "" })
        }
    };

    const handleGoogleSignIn = async (e: GestureResponderEvent) => {
        e.preventDefault();
        setLoading({ state: true, text: "Logging in" });
        try {
            await GoogleSignin.hasPlayServices();

            const userInfo = await GoogleSignin.signIn();
            const idToken = userInfo?.data?.idToken;
            if (!idToken) {
                throw new Error('Google Sign-In failed: No idToken returned');
            }

            const googleCredential = GoogleAuthProvider.credential(idToken);
            const authResult = await signInWithCredential(getAuth(), googleCredential);

            if (!authResult.user) {
                throw new Error('Google Sign-In failed: No user returned');
            }

            // if (!GoogleSignin.hasPreviousSignIn()) {
            // Wait for Firestore operations to complete
            const db = getFirestore();
            const usersCollection = collection(db, 'Users');
            const q = query(usersCollection, where('userId', '==', authResult.user.uid));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                // Wait for user data to be stored
                await setDoc(doc(usersCollection), {
                    userId: authResult.user.uid,
                    name: authResult.user.displayName || '',
                    email: authResult.user.email || '',
                    businessLogo: authResult.user.photoURL || '',
                    phoneNumber: authResult.user.phoneNumber || '',
                    address: '',
                    gstin: '',
                    businessType: '',
                    panNumber: '',
                    website: '',
                    otherInfo: '',
                    createdAt: new Date()
                });
            }
            // }

            // Only navigate after all operations are complete
            setLoading({ state: false, text: "" });
            if (Platform.OS === 'android') {
                ToastAndroid.show('Signed in successfully!', ToastAndroid.SHORT);
            } else {
                // Optionally add iOS toast/snackbar here
            }
            router.replace({ pathname: '/home', params: { reset: 'true' } });

        } catch (error: any) {
            setLoading({ state: false, text: "" });
            setCustomAlert({ visible: true, title: 'Google Sign-In Error', message: error.message || 'Failed to sign in with Google.', actions: [{ text: 'OK', onPress: () => setCustomAlert({ ...customAlert, visible: false }) }] });
        }
    };

    const handleForgotPassword = (e: any) => {
        e.preventDefault();
        if (!email) {
            setCustomAlert({ visible: true, title: 'Error', message: 'Please enter your email address to reset your password.', actions: [{ text: 'OK', onPress: () => setCustomAlert({ ...customAlert, visible: false }) }] });
            return;
        }
        setCustomAlert({ visible: true, title: 'Password Reset', message: `Password reset link sent to ${email} (functionality to be implemented).`, actions: [{ text: 'OK', onPress: () => setCustomAlert({ ...customAlert, visible: false }) }] });
    };

    return (
        loading.state ?
            <View style={[styles.loadingContainer, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>{loading.text}...</Text>
            </View>
            :
            <View style={styles.container}>
                <Image source={require('@/assets/images/Receiptify.png')} style={styles.logo} resizeMode="contain" />
                <Text style={styles.title}>{isSignUp ? 'Sign Up' : 'Sign In'}</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#999999"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                />
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor="#999999"
                        secureTextEntry={!passwordVisible}
                        value={password}
                        onChangeText={setPassword}
                    />
                    <TouchableOpacity
                        style={styles.visibilityToggle}
                        onPress={() => setPasswordVisible(!passwordVisible)}
                    >
                        <View style={{ marginBlock: 'auto' }}>{passwordVisible ? <Ionicons name="eye" size={24} color="#999999" /> : <Ionicons name="eye-off" size={24} color="#999999" />}</View>
                    </TouchableOpacity>
                </View>
                {isSignUp && (
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Confirm Password"
                            placeholderTextColor="#999999"
                            secureTextEntry={!confirmPasswordVisible}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                        />
                        <TouchableOpacity
                            style={styles.visibilityToggle}
                            onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                        >
                            <View>{confirmPasswordVisible ? <Ionicons name="eye" size={24} color="#999999" /> : <Ionicons name="eye-off" size={24} color="#999999" />}</View>
                        </TouchableOpacity>
                    </View>
                )}
                <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPassword}>
                    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={handleSignInOrSignUp}>
                    <Text style={styles.buttonText}>{isSignUp ? 'Sign Up' : 'Sign In'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.googleButton]} onPress={handleGoogleSignIn}>
                    <Image width={1} height={1} source={require('@/assets/images/google-icon-min.png')} resizeMode='contain' style={{ flex: .2 }} />
                    <Text style={[styles.buttonText, styles.buttonTextGoogle]}>Sign In with Google</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} style={styles.switchButton}>
                    <Text style={styles.switchButtonText}>
                        {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                    </Text>
                </TouchableOpacity>
                <CustomAlertModal
                    visible={customAlert.visible}
                    title={customAlert.title}
                    message={customAlert.message}
                    actions={customAlert.actions}
                    onRequestClose={() => setCustomAlert({ ...customAlert, visible: false })}
                />
            </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        backgroundColor: '#f8fafc',
    },
    logo: {
        width: 140,
        height: 140,
        alignSelf: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        marginBottom: 24,
        color: '#555',
        textAlign: 'center',
    },
    input: {
        height: 56,
        color: "#1e293b",
        backgroundColor: '#fff',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
    },
    button: {
        height: 56,
        backgroundColor: '#3b82f6',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 10, height: 5 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    signUpButton: {
        backgroundColor: '#34A853',
    },
    googleButton: {
        flexDirection: "row",
        backgroundColor: '#fff',
        gap: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    buttonTextGoogle: {
        color: '#555',
    },
    forgotPasswordText: {
        color: '#3b82f6',
        textAlign: 'right',
        marginBottom: 24,
        fontSize: 15,
        fontWeight: '500',
    },
    switchButton: {
        marginTop: 16,
        alignItems: 'center',
    },
    switchButtonText: {
        color: '#3b82f6',
        fontSize: 15,
        fontWeight: '500',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 15,
        color: '#64748b',
        fontWeight: '500',
    },
    inputContainer: {
        position: 'relative',
        justifyContent: 'center',
    },
    visibilityToggle: {
        position: 'absolute',
        right: "5%",
        bottom: "10%",
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        padding: "auto",
    },
});

export default AuthScreen;
