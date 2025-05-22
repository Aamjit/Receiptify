import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const OTPScreen: React.FC = () => {
    const [otp, setOtp] = useState('');
    const router = useRouter();

    const handleOTPSubmit = () => {
        // Placeholder for OTP validation logic
        if (otp.length === 6) {
            Alert.alert('Success', 'OTP validated successfully!');
            // Add further navigation or logic here

            router.navigate("/(screens)/AccountSetupScreen")
        } else {
            Alert.alert('Error', 'Please enter a valid 6-digit OTP.');
        }
    };

    return (
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
