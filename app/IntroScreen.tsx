import { useAsyncStorage } from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { FlatList, Image, ListRenderItemInfo, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View, ViewToken } from 'react-native';

// import IntroReceipt from "../assets/images/intro_receipt.svg";

const slides = [
    {
        key: '1',
        title: 'Welcome to Receiptify',
        description: 'Generate receipts quickly by adding or removing items from your personalised inventory.',
        image: require("@/assets/images/intro_receipt.png"),
    },
    {
        key: '2',
        title: 'Manage Inventory',
        description: 'Easily add or remove items from your vendor inventory to the receipt.',
        image: require("@/assets/images/intro_inventory.png"),
    },
    {
        key: '3',
        title: 'Get Prices',
        description: "We take care of your calculations, so you don't have to. Get the total amount for the receipt.",
        image: require("@/assets/images/intro_prices.png"),
    },
    {
        key: '4',
        title: 'Get Started',
        description: 'Tap the button below to start using the app.',
        image: require("@/assets/images/intro_start.png"),
    },
];


export default function IntroScreen() {
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const flatListRef = useRef<FlatList>(null);
    const router = useRouter();
    const { width } = useWindowDimensions();
    const AsyncStorageIntro = useAsyncStorage("receiptify-intro");

    const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index ?? 0);
        }
    }).current;

    const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    const handleGetStarted = async () => {
        try {
            // await AsyncStorage.setItem('hasSeenIntro', 'true');
            AsyncStorageIntro.setItem("true")
            router.replace('/AuthScreen1');
        } catch (e) {
            console.error('Error setting intro flag', e);
        }
    };

    const renderItem = ({ item }: ListRenderItemInfo<typeof slides[0]>) => (
        <View style={[styles.slide, { width }]}>
            <Image source={item.image} style={[styles.image, { width, resizeMode: 'contain' }]} />
            {/* <item.image /> */}
            {/* {item.image} */}
            {/* <Image source={} /> */}
            <View style={{
                flex: 0.3, justifyContent: 'center', alignItems: 'center'
            }}>

                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.description}>{item.description}</Text>
                {item.key === '4' && (
                    <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
                        <Text style={styles.buttonText}>Get Started</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <View style={{ flex: 1 }}>
            <FlatList
                data={slides}
                horizontal
                pagingEnabled
                bounces={false}
                showsHorizontalScrollIndicator={false}
                renderItem={renderItem}
                keyExtractor={(item) => item.key}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewConfig}
                ref={flatListRef}
                scrollEventThrottle={32}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    slide: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    image: {
        flex: 0.7,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    description: {
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 40,
    },
    button: {
        backgroundColor: '#007AFF',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 25,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
});
