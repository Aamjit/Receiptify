import { collection, getDocs, getFirestore, query, updateDoc, where } from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import Avatar from '@/components/Avatar';
import { supabase } from '@/lib/supabase';
import { ImagePickerAsset } from 'expo-image-picker'
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Platform, StatusBar, ToastAndroid } from 'react-native';

const AccountSetupScreen = () => {
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phoneNumber: '',
        gstin: '',
        businessType: '',
        panNumber: '',
        website: '',
        otherInfo: '',
        businessLogo: null,
    });
    const [loading, setLoading] = useState({ state: false, text: "" });
    const [accountImage, setAccountImage] = useState<ImagePickerAsset | null>(null);
    const router = useRouter();
    const userData = getAuth().currentUser

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

    const checkFormValidation = () => {
        const requiredFields: (keyof typeof formData)[] = ['name', 'address', 'phoneNumber', 'businessType'];
        for (const field of requiredFields) {
            if (!formData[field]) {
                Alert.alert('Validation Error', `${field.replace(/([A-Z])/g, ' $1')} is required.`);
                return false;
            }
        }

        if (formData.phoneNumber.length < 10) {
            Alert.alert('Validation Error', 'Phone number must be at least 10 digits.');
            return false;
        }

        if (formData.gstin.length !== 15) {
            Alert.alert('Validation Error', 'GSTIN must be exactly 15 characters.');
            return false;
        }

        if (formData.panNumber.length !== 10) {
            Alert.alert('Validation Error', 'PAN Number must be exactly 10 characters.');
            return false;
        }

        return true;
    }

    const handleSubmit = async () => {
        setLoading({ state: true, text: "Submitting" })
        try {

            if (!checkFormValidation()) {
                return
            }

            // Check if the image size is less than 5MB
            if (accountImage?.fileSize && accountImage?.fileSize > 3 * 1024 * 1024) {
                Alert.alert('Image Size Error', 'Business logo must be less than 3MB.');
                return;
            }

            // upload user image to supabase storage
            const arraybuffer = await fetch(accountImage?.uri ?? '').then((res) => res.arrayBuffer())

            const fileExt = accountImage?.uri?.split('.').pop()?.toLowerCase() ?? 'jpeg'
            const path = `${userData?.uid}/${userData?.uid}.${fileExt}`
            const { data, error: uploadError } = arraybuffer && await supabase.storage
                .from('receiptify')
                .upload(path, arraybuffer, {
                    contentType: accountImage?.mimeType ?? 'image/jpeg',
                })

            if (uploadError) {
                Alert.alert('Error', 'Failed to upload profile image. Please try again.\n' + uploadError.message);
            }

            const imageUrl = supabase.storage.from('receiptify').getPublicUrl(data?.path ?? '');

            // Update user document in Firestore to add the image URL
            if (!userData?.uid) {
                Alert.alert('Error', 'User not authenticated.');
                return;
            }
            const usersCollection = collection(getFirestore(), 'Users');
            const q = query(usersCollection, where('userId', '==', userData.uid));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                Alert.alert('Error', 'User document not found.');
                return;
            }
            const userDocRef = querySnapshot.docs[0].ref;
            await updateDoc(userDocRef, {
                // name: formData.name || '',
                // phoneNumber: formData.phoneNumber || '',
                // address: formData.address || '',
                // gstin: formData.gstin || '',
                // businessType: formData.businessType || '',
                // panNumber: formData.panNumber || '',
                // website: formData.website || '',
                // otherInfo: formData.otherInfo || '',
                businessLogo: imageUrl.data.publicUrl || '',
            })
                .then(() => {
                    // console.log("User document updated with profile picture URL");
                    ToastAndroid.show('Account setup submitted successfully.', ToastAndroid.LONG);
                    router.push("/home");
                })
                .catch((error) =>
                    console.error("Error updating user document:", error)
                );

        } catch (error) {
            console.error('Error during account setup:', error);
            Alert.alert('Error', 'Failed to set up account. Please try again.');
        } finally {
            setLoading({ state: false, text: '' });
        }
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
                placeholder="Business Name"
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

            <Avatar
                size={{ width: 400, height: 150 }}
                url={accountImage?.uri ?? ''}
                onImageSelect={(image) => {
                    setAccountImage(image)
                }}
            />

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

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        paddingInline: 40,
        backgroundColor: '#fff',
        paddingBottom: 20,
        paddingTop: Platform.OS === 'android' ? ((StatusBar.currentHeight ?? 0) + 20) : 20,
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
