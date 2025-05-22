import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';

const AccountSetupScreen: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        gstin: '',
        email: '',
        businessType: '',
        panNumber: '',
        website: '',
        otherInfo: '',
        businessLogo: null as string | null,
    });
    const router = useRouter();

    // Placeholder function for picking an image
    const handlePickLogo = () => {
        Alert.alert('Pick Logo', 'Image picker functionality to be implemented.');
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSubmit = () => {
        // if (!formData.name.trim()) {
        //     Alert.alert('Validation Error', 'Please enter your name.');
        //     return;
        // }
        // if (!formData.address.trim()) {
        //     Alert.alert('Validation Error', 'Please enter your address.');
        //     return;
        // }
        // if (!formData.gstin.trim()) {
        //     Alert.alert('Validation Error', 'Please enter your GSTIN.');
        //     return;
        // }
        // if (!formData.email.trim()) {
        //     Alert.alert('Validation Error', 'Please enter your email address.');
        //     return;
        // }
        // if (!formData.businessType.trim()) {
        //     Alert.alert('Validation Error', 'Please enter your business type or category.');
        //     return;
        // }
        // if (!formData.panNumber.trim()) {
        //     Alert.alert('Validation Error', 'Please enter your PAN number.');
        //     return;
        // }
        // For now, just show an alert with the entered details
        Alert.alert(
            'Account Setup Submitted',
            `Name: ${formData.name}\nAddress: ${formData.address}\nGSTIN: ${formData.gstin}\nEmail: ${formData.email}\nBusiness Type: ${formData.businessType}\nPAN Number: ${formData.panNumber}\nWebsite: ${formData.website}\nOther Info: ${formData.otherInfo}\nLogo: ${formData.businessLogo ? 'Selected' : 'Not selected'}`
        );

        router.replace("/(tabs)/home");
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Setup your Account</Text>

            <TextInput
                style={styles.input}
                placeholder="Name"
                value={formData.name}
                onChangeText={value => handleChange('name', value)}
                autoCapitalize="words"
            />

            <TextInput
                style={styles.input}
                placeholder="Address"
                value={formData.address}
                onChangeText={value => handleChange('address', value)}
                multiline
                numberOfLines={3}
            />

            <TextInput
                style={styles.input}
                placeholder="GSTIN"
                value={formData.gstin}
                onChangeText={value => handleChange('gstin', value)}
                autoCapitalize="characters"
                maxLength={15}
            />

            <TextInput
                style={styles.input}
                placeholder="Email Address"
                value={formData.email}
                onChangeText={value => handleChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
            />

            <TextInput
                style={styles.input}
                placeholder="Business Type or Category"
                value={formData.businessType}
                onChangeText={value => handleChange('businessType', value)}
                autoCapitalize="words"
            />

            <TextInput
                style={styles.input}
                placeholder="PAN Number"
                value={formData.panNumber}
                onChangeText={value => handleChange('panNumber', value)}
                autoCapitalize="characters"
                maxLength={10}
            />

            <TextInput
                style={styles.input}
                placeholder="Website or Social Media Links"
                value={formData.website}
                onChangeText={value => handleChange('website', value)}
                autoCapitalize="none"
            />

            <TouchableOpacity style={styles.logoPicker} onPress={handlePickLogo}>
                {formData.businessLogo ? (
                    <Image source={{ uri: formData.businessLogo }} style={styles.logoImage} />
                ) : (
                    <Text style={styles.logoPickerText}>Pick Business Logo</Text>
                )}
            </TouchableOpacity>

            <TextInput
                style={[styles.input, styles.otherInfoInput]}
                placeholder="Other Business Information"
                value={formData.otherInfo}
                onChangeText={value => handleChange('otherInfo', value)}
                multiline
                numberOfLines={4}
            />

            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                <Text style={styles.buttonText}>Finish</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

import { Platform, StatusBar } from 'react-native';

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        paddingInline: 40,
        backgroundColor: '#fff',
        paddingBottom: 20,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#051d5f',
    },
    input: {
        height: 50,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        fontSize: 16,
        marginBottom: 15,
        backgroundColor: '#fff',
    },
    otherInfoInput: {
        height: 100,
        textAlignVertical: 'top',
    },
    logoPicker: {
        height: 150,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 15,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9fafd',
    },
    logoPickerText: {
        color: '#007AFF',
        fontSize: 18,
    },
    logoImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
        resizeMode: 'contain',
    },
    button: {
        height: 50,
        backgroundColor: '#007AFF',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default AccountSetupScreen;
