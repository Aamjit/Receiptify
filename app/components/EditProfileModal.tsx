import React, { useState } from 'react';
import { Modal, View, Text, TextInput, StyleSheet, TouchableOpacity, Platform, ActivityIndicator, Alert, Image, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from '@/lib/supabase';

interface EditProfileModalProps {
  userId?: string;
  visible: boolean;
  initialName: string;
  initialAddress: string;
  initialPanNumber?: string;
  initialGstin?: string;
  initialPhoneNumber?: string;
  initialWebsite?: string;
  initialLogo?: string;
  onSave: (name: string, address: string, panNumber: string, gstin: string, phoneNumber: string, website: string, logoUrl?: string) => void;
  onCancel: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ userId, visible, initialName, initialAddress, initialPanNumber = '', initialGstin = '', initialPhoneNumber = '', initialWebsite = '', initialLogo = '', onSave, onCancel }) => {
  const [name, setName] = useState(initialName);
  const [address, setAddress] = useState(initialAddress);
  const [panNumber, setPanNumber] = useState(initialPanNumber);
  const [gstin, setGstin] = useState(initialGstin);
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  const [website, setWebsite] = useState(initialWebsite);
  const [logo, setLogo] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Reset fields when modal opens
  React.useEffect(() => {
    setName(initialName);
    setAddress(initialAddress);
    setPanNumber(initialPanNumber);
    setGstin(initialGstin);
    setPhoneNumber(initialPhoneNumber);
    setWebsite(initialWebsite);
    setLogo(initialLogo || null);
    initialLogo ? setLogoPreview(initialLogo) : setLogoPreview(null);
  }, [visible, initialName, initialAddress, initialPanNumber, initialGstin, initialPhoneNumber, initialWebsite]);

  const handlePickLogo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      legacy: true, // Use legacy behavior for better compatibility
    });
    console.log(result);

    if (!result.canceled && result.assets && result.assets[0]) {
      // Compress the image before preview/upload
      const compressed = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 640 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      setLogoPreview(compressed.uri);
      setLogo(compressed.uri);
    }
  };

  const handleUploadLogo = async (previousLogoUrl?: string | null) => {
    if (!logo) return null;
    try {
      setLogoUploading(true);
      const fileExt = logo.split('.').pop()?.toLowerCase() || 'jpg';
      // Add a random string and timestamp to filename to avoid cache/collision
      const uniqueSuffix = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
      const fileName = `${userId}/${userId ?? 'user'}_${uniqueSuffix}.${fileExt}`;
      const arraybuffer = await fetch(logo).then(res => res.arrayBuffer());
      const { data, error: uploadError } = await supabase.storage
        .from('receiptify')
        .upload(fileName, arraybuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });
      if (uploadError) {
        Alert.alert('Error', 'Failed to upload image.\n' + uploadError.message);
        return null;
      }
      const imageUrl = supabase.storage.from('receiptify').getPublicUrl(data?.path ?? fileName);

      // Delete all previous images in the user's folder except the new one
      try {
        const { data: listData, error: listError } = await supabase.storage.from('receiptify').list(`${userId}/`);
        if (!listError && listData && Array.isArray(listData)) {
          const filesToDelete = listData
            .filter(item => item.name !== fileName.split('/').pop())
            .map(item => `${userId}/${item.name}`);
          if (filesToDelete.length > 0) {
            await supabase.storage.from('receiptify').remove(filesToDelete);
          }
        }
      } catch (deleteErr) {
        console.warn('Failed to delete previous logos:', deleteErr);
      }

      return imageUrl.data.publicUrl;
    } catch (e) {
      Alert.alert('Error', 'Image upload failed.');
      return null;
    } finally {
      setLogo(null);
      setLogoUploading(false);
    }
  };

  const handleSave = async () => {
    let logoUrl = logoPreview;
    if (logo) {
      // Pass the previous logo URL for deletion if needed
      logoUrl = await handleUploadLogo(logoPreview || initialLogo || undefined);
    }
    onSave(name, address, panNumber, gstin, phoneNumber, website, logoUrl || undefined);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={{ paddingBottom: 12 }} showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Edit Profile</Text>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor={'#9ca3af'}
              autoCapitalize="words"
            />
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={[styles.input, { minHeight: 48 }]}
              value={address}
              onChangeText={setAddress}
              placeholder="Enter your address"
              placeholderTextColor={'#9ca3af'}
              multiline
            />
            <Text style={styles.label}>PAN Number</Text>
            <TextInput
              style={styles.input}
              value={panNumber}
              onChangeText={setPanNumber}
              placeholder="Enter PAN Number"
              placeholderTextColor={'#9ca3af'}
              autoCapitalize="characters"
              maxLength={10}
            />
            <Text style={styles.label}>GSTIN</Text>
            <TextInput
              style={styles.input}
              value={gstin}
              onChangeText={setGstin}
              placeholder="Enter GSTIN"
              placeholderTextColor={'#9ca3af'}
              autoCapitalize="characters"
              maxLength={15}
            />
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Enter Phone Number"
              keyboardType="phone-pad"
              placeholderTextColor={'#9ca3af'}
              maxLength={15}
            />
            <Text style={styles.label}>Website</Text>
            <TextInput
              style={styles.input}
              value={website}
              onChangeText={setWebsite}
              placeholder="Enter Website"
              placeholderTextColor={'#9ca3af'}
              autoCapitalize="none"
            />
            <View style={[styles.logoSection, { marginVertical: 12 }]}>
              {logoPreview ? (
                <Image source={{ uri: logoPreview }} style={[styles.imagePreview]} />
              ) : null}

              <TouchableOpacity style={{ backgroundColor: '#e5e7eb', padding: 16, borderRadius: 8 }} onPress={handlePickLogo}>
                <Text style={{ color: '#3b82f6', fontWeight: '600' }}>{logoPreview ? 'Change Logo' : 'Pick Logo'}</Text>
              </TouchableOpacity>
              {logoUploading && <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 6 }} />}
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onCancel} disabled={logoUploading}>
                <Text style={[styles.buttonText, { color: '#3b82f6' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={handleSave} disabled={logoUploading}>
                <Text style={styles.buttonText} disabled={logoUploading} >Save</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 24,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 18,
    color: '#1e293b',
    textAlign: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 15,
    marginBottom: 4,
    backgroundColor: '#f8fafc',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 18,
    gap: 12,
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e5e7eb',
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  imagePreview: {
    width: 100,
    height: 100,
    marginBottom: 6,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  logoSection: {
    flex: 1,
    gap: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  }
});

export default EditProfileModal;
