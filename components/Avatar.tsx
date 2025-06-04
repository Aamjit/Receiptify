import { useState, useEffect } from 'react'
import { StyleSheet, View, Alert, TouchableOpacity, Text, Image } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImageManipulator from 'expo-image-manipulator';
import { Constants } from '@/constants/AppConstants';

interface Props {
    size: { width?: number, height?: number }
    url: string | null
    onImageSelect: (filePath: ImagePicker.ImagePickerAsset) => void
}

export default function Avatar({ url, size: { width = 100, height = 100 }, onImageSelect }: Props) {
    const [uploading, setUploading] = useState(false)
    const [imageName, setImageName] = useState<string | null>(null)

    useEffect(() => {
        // if (url) downloadImage(url)
        if (url) {
            // downloadImage(url)
            const fileName = url.split('/').pop() || 'avatar'
            setImageName(fileName)
        } else {
            // setAvatarUrl(null)
            setImageName(null)
        }
    }, [url])

    async function uploadAvatar() {
        try {
            setUploading(true)

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images, // Restrict to only images
                allowsMultipleSelection: false, // Can only select one image
                allowsEditing: true, // Allows the user to crop / rotate their photo before uploading it
                aspect: [1, 1],
                quality: 1,
                exif: false, // We don't want nor need that data.
            })

            if (result.canceled || !result.assets || result.assets.length === 0) {
                // console.log('User cancelled image picker.')
                return
            }

            // Compress the image to reduce file size
            const compressImage = await ImageManipulator.manipulateAsync(
                result.assets[0].uri,
                [{ resize: { width: Constants.imageCompression.resizeWidth } }],
                {
                    compress: Constants.imageCompression.quality, // Compress the image to 80% quality
                    format: ImageManipulator.SaveFormat.JPEG
                }
            );

            const image = result.assets[0]
            // console.log('Got image', image)

            if (!image.uri) {
                throw new Error('No image uri!') // Realistically, this should never happen, but just in case...
            }
            compressImage && onImageSelect(compressImage)

        } catch (error) {
            if (error instanceof Error) {
                Alert.alert(error.message)
            } else {
                throw error
            }
        } finally {
            setUploading(false)
        }
    }

    return (
        <TouchableOpacity style={[styles.container, styles.logoPicker, { height: url ? 100 + height : 100 }]} onPress={() => { uploadAvatar() }}>

            {url ? (
                <View style={{ gap: 20 }}>
                    <Image
                        source={{ uri: url }}
                        accessibilityLabel="Avatar"
                        width={width}
                        height={height}
                        style={[styles.avatar, styles.image]}
                    />
                    <View style={styles.imageSelected}>
                        <Ionicons name="image-outline" size={42} color="black" />
                        <Text style={[styles.logoPickerText, { fontSize: 12 }]}>{imageName}</Text>
                    </View>
                </View>
            ) : (
                <View style={styles.noImage}>
                    <Text style={styles.logoPickerText}>Pick Your Business Logo</Text>
                    <Text style={styles.logoPickerSubText}>MAX SIZE: 1 MB</Text>
                </View>
            )
            }
        </TouchableOpacity >
    )
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 10,
    },
    avatar: {
        borderRadius: 5,
    },
    image: {
        objectFit: 'cover',
        paddingTop: 2,
    },
    noImage: {
        borderRadius: 5,
    },
    imageSelected: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoPicker: {
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 15,
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#ededed',
    },
    logoPickerText: {
        color: '#007AFF',
        fontSize: 18,
    },
    logoPickerSubText: {
        color: '#4da2ff',
        fontSize: 12,
        textAlign: 'center',
    }
})