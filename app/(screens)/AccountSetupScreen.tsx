import { collection, getDocs, getFirestore, query, updateDoc, where } from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import Avatar from '@/components/Avatar';
import { supabase } from '@/lib/supabase';
import { ImagePickerAsset } from 'expo-image-picker'
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Platform, StatusBar, ToastAndroid } from 'react-native';
import CustomAlertModal from '@/components/CustomAlertModal';
import { useAppContext } from '@/hooks/useApp';

const AccountSetupScreen = () => {
    const { User, setUser } = useAppContext()
    const [formData, setFormData] = useState({
        name: '',
        email: User?.email,
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
    const [customAlert, setCustomAlert] = useState<{ visible: boolean; title: string; message: string; actions?: any[] }>({ visible: false, title: '', message: '', actions: [] });
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
        const requiredFields: (keyof typeof formData)[] = ['name', 'phoneNumber', 'businessType'];
        for (const field of requiredFields) {
            if (!formData[field]) {
                setCustomAlert({ visible: true, title: 'Validation Error', message: `${field.replace(/([A-Z])/g, ' $1')} is required.`, actions: [{ text: 'OK', onPress: () => setCustomAlert({ ...customAlert, visible: false }) }] });
                return false;
            }
        }
        if (formData.phoneNumber.length < 10) {
            setCustomAlert({ visible: true, title: 'Validation Error', message: 'Phone number must be at least 10 digits.', actions: [{ text: 'OK', onPress: () => setCustomAlert({ ...customAlert, visible: false }) }] });
            return false;
        }
        if (formData.gstin && formData.gstin.length !== 15) {
            setCustomAlert({ visible: true, title: 'Validation Error', message: 'GSTIN must be exactly 15 characters.', actions: [{ text: 'OK', onPress: () => setCustomAlert({ ...customAlert, visible: false }) }] });
            return false;
        }
        if (formData.panNumber && formData.panNumber.length !== 10) {
            setCustomAlert({ visible: true, title: 'Validation Error', message: 'PAN Number must be exactly 10 characters.', actions: [{ text: 'OK', onPress: () => setCustomAlert({ ...customAlert, visible: false }) }] });
            return false;
        }
        return true;
    }

    const uploadImageToSupabase = async (image: ImagePickerAsset | null): Promise<{ data: { publicUrl: string; }; } | null> => {
        if (!image) {
            return null;
        }

        const arraybuffer = await fetch(accountImage?.uri ?? '').then((res) => res.arrayBuffer())

        const fileExt = accountImage?.uri?.split('.').pop()?.toLowerCase() ?? 'jpeg'
        const path = `${userData?.uid}/${userData?.uid}.${fileExt}`
        const { data, error: uploadError } = arraybuffer && await supabase.storage
            .from('receiptify')
            .upload(path, arraybuffer, {
                contentType: accountImage?.mimeType ?? 'image/jpeg',
            })

        if (uploadError) {
            setCustomAlert({ visible: true, title: 'Error', message: 'Failed to upload profile image. Please try again.\n' + uploadError.message, actions: [{ text: 'OK', onPress: () => setCustomAlert({ ...customAlert, visible: false }) }] });
        }

        return supabase.storage.from('receiptify').getPublicUrl(data?.path ?? '');
    }

    const handleSubmit = async () => {
        setLoading({ state: true, text: "Saving user data..." })
        try {

            if (!checkFormValidation()) {
                return
            }

            // Check if the image size is less than 5MB
            if (accountImage?.fileSize && accountImage?.fileSize > 3 * 1024 * 1024) {
                setCustomAlert({ visible: true, title: 'Image Size Error', message: 'Business logo must be less than 3MB.', actions: [{ text: 'OK', onPress: () => setCustomAlert({ ...customAlert, visible: false }) }] });
                return;
            }

            // upload user image to supabase storage
            const imageUrl = await uploadImageToSupabase(accountImage);

            // Update user document in Firestore to add the image URL
            if (!userData?.uid) {
                setCustomAlert({ visible: true, title: 'Error', message: 'User not authenticated.', actions: [{ text: 'OK', onPress: () => setCustomAlert({ ...customAlert, visible: false }) }] });
                return;
            }
            const usersCollection = collection(getFirestore(), 'Users');
            const q = query(usersCollection, where('userId', '==', userData.uid));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                setCustomAlert({ visible: true, title: 'Error', message: 'User document not found.', actions: [{ text: 'OK', onPress: () => setCustomAlert({ ...customAlert, visible: false }) }] });
                return;
            }
            const userDocRef = querySnapshot.docs[0].ref;
            const updatedDoc = {
                name: formData.name || '',
                phoneNumber: formData.phoneNumber || '',
                address: formData.address || '',
                gstin: formData.gstin || '',
                businessType: formData.businessType || '',
                panNumber: formData.panNumber || '',
                website: formData.website || '',
                otherInfo: formData.otherInfo || '',
                businessLogo: imageUrl?.data.publicUrl || '',
                new: false, // Mark the account as set up
            }
            await updateDoc(userDocRef, updatedDoc)
                .then((res) => {
                    setUser({ ...User, ...updatedDoc })
                    // console.log("User document updated with profile picture URL");
                    ToastAndroid.show('Account details saved successfully.', ToastAndroid.LONG);
                    router.replace({ pathname: '/home', params: { reset: 'true' } });
                })
                .catch((error) => {
                    console.error("Error updating user document:", error)
                    setCustomAlert({ visible: true, title: 'Error', message: 'Failed to update user document.', actions: [{ text: 'OK', onPress: () => setCustomAlert({ ...customAlert, visible: false }) }] });
                });

        } catch (error) {
            console.error('Error during account setup:', error);
            setCustomAlert({ visible: true, title: 'Error', message: 'Failed to set up account. Please try again.', actions: [{ text: 'OK', onPress: () => setCustomAlert({ ...customAlert, visible: false }) }] });
        } finally {
            setLoading({ state: false, text: '' });
        }
    };

    return loading.state ?
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={{ marginTop: 10 }}>{loading.text}...</Text>
            <CustomAlertModal
                visible={customAlert.visible}
                title={customAlert.title}
                message={customAlert.message}
                actions={customAlert.actions}
                onRequestClose={() => setCustomAlert({ ...customAlert, visible: false })}
            />
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
                style={[styles.input, { color: '#4da2ff' }]}
                placeholder="Email"
                placeholderTextColor="#999999"
                value={'' + formData.email}
                editable={false}
                // onChangeText={value => handleChange('name', value)}
                autoCapitalize="words"
            />

            <TextInput
                style={styles.input}
                placeholder="Address"
                placeholderTextColor="#999999"
                value={formData.address}
                onChangeText={value => handleChange('address', value)}
                autoCapitalize="words"
                multiline
                numberOfLines={4}
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
                size={{ width: 300, height: 300 }}
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
                <Text style={styles.buttonText}>Save Details</Text>
            </TouchableOpacity>

            <CustomAlertModal
                visible={customAlert.visible}
                title={customAlert.title}
                message={customAlert.message}
                actions={customAlert.actions}
                onRequestClose={() => setCustomAlert({ ...customAlert, visible: false })}
            />
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
