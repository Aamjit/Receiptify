
import { getAuth } from '@react-native-firebase/auth';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, GestureResponderEvent, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
// const confirmation = await signInWithPhoneNumber(getAuth(), phoneNumber);

const AuthScreen = () => {
    const [phoneNumber, setPhoneNumber] = useState<string>('')
    const router = useRouter();
    // const handleAuthStateChanged = (user: any) => {
    //     if (user) {
    //         // Some Android devices can automatically process the verification code (OTP) message, and the user would NOT need to enter the code.
    //         // Actually, if he/she tries to enter it, he/she will get an error message because the code was already used in the background.
    //         // In this function, make sure you hide the component(s) for entering the code and/or navigate away from this screen.
    //         // It is also recommended to display a message to the user informing him/her that he/she has successfully logged in.
    //     }
    // }

    useEffect(() => {
        // const subscriber = onAuthStateChanged(getAuth(), handleAuthStateChanged);
        // return subscriber; // unsubscribe on unmount
        getAuth().currentUser && router.replace("/home")
    }, []);

    // const handleSignInWithPhoneNumber = async (phoneNumber: string) => {
    //     const confirmation = await signInWithPhoneNumber(getAuth(), phoneNumber);
    //     setConfirm(confirmation as any);
    //     console.log("confirmation", confirmation);
    // }

    const handleLogin = async (e: GestureResponderEvent) => {
        e.preventDefault()
        // Basic validation for phone number length
        if (phoneNumber.length < 10) {
            Alert.alert('Invalid Phone Number', 'Please enter a valid phone number with at least 10 digits.')
            return
        }

        // Here you can add the logic to handle phone number login
        Alert.alert('Login', `OTP sent to phone number: +91-${phoneNumber}`)

        router.navigate({
            pathname: '/OTPScreen',
            params: { phoneNumber: phoneNumber },
        });
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Login with Phone Number</Text>
            <TextInput
                style={styles.input}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={(val) => {
                    if (!val.match("^[0-9]*$")) {
                        return;
                    }
                    setPhoneNumber(val);
                }}
                maxLength={10}
            />
            <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Send OTP</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
        backgroundColor: '#f9fafd',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#051d5f',
        textAlign: 'center',
    },
    input: {
        // height: 50,
        // borderColor: '#ccc',
        // borderWidth: 1,
        // borderRadius: 8,
        // paddingHorizontal: 15,
        // fontSize: 16,
        // marginBottom: 20,
        // backgroundColor: '#fff',
        height: 50,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        fontSize: 18,
        marginBottom: 20,
        // textAlign: 'center',
        // letterSpacing: 10,
    },
    button: {
        height: 50,
        backgroundColor: '#007AFF',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
})

export default AuthScreen
