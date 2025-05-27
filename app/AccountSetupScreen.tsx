import { addDoc, collection, getFirestore } from '@react-native-firebase/firestore';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAppContext } from '../hooks/useApp';

const AccountSetupScreen: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phoneNumber: '',
        gstin: '',
        businessType: '',
        panNumber: '',
        website: '',
        otherInfo: '',
        businessLogo: null as string | null,
    });
    const [loading, setLoading] = useState({ state: false, text: "" });
    const router = useRouter();
    const { User } = useAppContext();

    // Placeholder function for picking an image
    const handlePickLogo = () => {
        Alert.alert('Pick Logo', 'Image picker functionality to be implemented.');
    };

    const handleChange = (field: string, value: string) => {
        switch (field) {
            case "phoneNumber":
                if (!value.match("^[0-9]*$")) {
                    return;
                }
                break;
            default:
                break;
        }
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSubmit = async () => {
        setLoading({ state: true, text: "Submitting" })
        addDoc(collection(getFirestore(), 'Users'), {
            ...formData,
            createdAt: new Date(),
            email: getAuth().currentUser?.email,
            userId: getAuth().currentUser?.uid as string,
        }).then(res => {
            router.dismissTo("/IntroScreen");
            router.push("/home")
            Alert.alert('Success', 'Account setup submitted successfully.');
        }).catch((error) => {
            console.error('Error uploading user data:', error);
            Alert.alert('Error', 'Failed to submit account setup. Please try again.');
        }).finally(() => setLoading({ state: false, text: "" }))

    };

    return loading.state ?
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={{ marginTop: 10 }}>{loading.text}...</Text>
        </View>
        :
        (<ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Setup your Account</Text>

            <TextInput
                style={styles.input}
                placeholder="Name"
                placeholderTextColor="#999999"
                value={formData.name}
                onChangeText={value => handleChange('name', value)}
                autoCapitalize="words"
            />

            <TextInput
                style={styles.input}
                placeholder="Address"
                placeholderTextColor="#999999"
                value={formData.address}
                onChangeText={value => handleChange('address', value)}
                multiline
                numberOfLines={3}
            />

            <TextInput
                style={styles.input}
                placeholder="Phone Number"
                keyboardType="phone-pad"
                placeholderTextColor="#999999"
                value={formData.phoneNumber}
                onChangeText={value => handleChange('phoneNumber', value)}
            />

            <TextInput
                style={styles.input}
                placeholder="GSTIN"
                placeholderTextColor="#999999"
                value={formData.gstin}
                onChangeText={value => handleChange('gstin', value)}
                autoCapitalize="characters"
                maxLength={15}
            />
            {/* 
            <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#999999"
                value={formData.email}
                onChangeText={value => handleChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
            /> */}

            <TextInput
                style={styles.input}
                placeholder="Business Type or Category"
                placeholderTextColor="#999999"
                value={formData.businessType}
                onChangeText={value => handleChange('businessType', value)}
                autoCapitalize="words"
            />

            <TextInput
                style={styles.input}
                placeholder="PAN Number"
                placeholderTextColor="#999999"
                value={formData.panNumber}
                onChangeText={value => handleChange('panNumber', value)}
                autoCapitalize="characters"
                maxLength={10}
            />

            <TextInput
                style={styles.input}
                placeholder="Website or Social Media Links"
                placeholderTextColor="#999999"
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
                placeholderTextColor="#999999"
                value={formData.otherInfo}
                onChangeText={value => handleChange('otherInfo', value)}
                multiline
                numberOfLines={4}
            />

            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                <Text style={styles.buttonText}>Create Account</Text>
            </TouchableOpacity>
        </ScrollView>
        );
};

import { getAuth } from '@react-native-firebase/auth';
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
