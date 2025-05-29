import { useAppContext } from '@/hooks/useApp';
import { FirebaseAuthTypes, getAuth, onAuthStateChanged, signInWithPhoneNumber } from '@react-native-firebase/auth';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, GestureResponderEvent, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';


const OTPScreen = () => {
    const router = useRouter();
    const [otp, setOtp] = useState('');
    const { User, setUser } = useAppContext()
    const { phoneNumber } = useLocalSearchParams();
    const [confirm, setConfirm] = useState<FirebaseAuthTypes.ConfirmationResult>(null as never);
    const [loading, setLoading] = useState({
        state: true,
        text: "Sending OTP"
    });

    function handleAuthStateChanged(user: any) {
        if (user) {
            // Some Android devices can automatically process the verification code (OTP) message, and the user would NOT need to enter the code.
            // Actually, if he/she tries to enter it, he/she will get an error message because the code was already used in the background.
            // In this function, make sure you hide the component(s) for entering the code and/or navigate away from this screen.
            // It is also recommended to display a message to the user informing him/her that he/she has successfully logged in.
            setUser(User)
            // router.replace("/home")
        }
    }

    useEffect(() => {
        const subscriber = onAuthStateChanged(getAuth(), handleAuthStateChanged);
        return subscriber; // unsubscribe on unmount
    }, []);

    useEffect(() => {
        const handleSignInWithPhoneNumber = async (phoneNumber: string) => {
            if (!phoneNumber) {
                console.log("Phone number could not be loaded");
                router.navigate("/AuthScreen")
                return;
            }

            try {
                // const confirmationPromise = await signInWithPhoneNumber(getAuth(), `+91${phoneNumber}`)
                signInWithPhoneNumber(getAuth(), `+91${phoneNumber}`).then(confirmationPromise => {
                    setConfirm(confirmationPromise);
                }).finally(() => setLoading({ state: false, text: "" }))
            } catch (error: any) {
                console.log("Error in signInWithPhoneNumber:", error);
                Alert.alert('Error', error.message || 'Failed to send OTP');
            }
        }
        handleSignInWithPhoneNumber(phoneNumber as string)
    }, [phoneNumber])

    const handleOTPSubmit = async (e: GestureResponderEvent) => {
        e.preventDefault()
        setLoading({ state: true, text: "Validating OTP" })
        // OTP validation logic
        if (otp.length !== 6) {
            Alert.alert('Error', 'Please enter a valid 6-digit OTP.');
            return
        }

        try {
            confirm.confirm(otp)
                .then(() => {
                    Alert.alert('Success', 'OTP validated successfully!');
                    router.navigate("/AccountSetupScreen")
                })
                .catch(() => Alert.alert('Error', 'OTP is invalid!'))
                .finally(() => { setLoading({ state: false, text: "" }) })
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'OTP is invalid!')
        }
    }


    return (
        loading.state ? (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={{ marginTop: 10 }}>{loading.text}...</Text>
            </View>
        ) : (
            <View style={styles.container}>
                <Text style={styles.title}>OTP Validation</Text>
                <Text style={styles.instructions}>Enter the 6-digit code sent to your phone</Text>
                <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    maxLength={6}
                    value={otp}
                    onChangeText={setOtp}
                    placeholder="Enter OTP"
                    placeholderTextColor="#999"
                />
                <TouchableOpacity style={styles.button} onPress={handleOTPSubmit}>
                    <Text style={styles.buttonText}>Verify OTP</Text>
                </TouchableOpacity>
            </View>
        )
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    instructions: {
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center',
        color: '#666',
    },
    input: {
        height: 50,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        fontSize: 18,
        marginBottom: 20,
        textAlign: 'center',
        letterSpacing: 10,
    },
    button: {
        backgroundColor: '#007AFF',
        paddingVertical: 15,
        borderRadius: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        textAlign: 'center',
        fontWeight: '600',
    },
});

export default OTPScreen;
