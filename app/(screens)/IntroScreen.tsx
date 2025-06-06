import { useAsyncStorage } from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Animated, FlatList, Image, ListRenderItemInfo, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View, ViewToken } from 'react-native';

// import IntroReceipt from "../assets/images/intro_receipt.svg";

const slides = [
    {
        key: '1',
        title: 'Welcome to Receiptify',
        description: 'Generate receipts quickly by adding or removing items from your personalised inventory.',
        image: require("../../assets/images/intro_receipt.webp"),
    },
    {
        key: '2',
        title: 'Manage Inventory',
        description: 'Easily add or remove items from your vendor inventory to the receipt.',
        image: require("../../assets/images/intro_inventory.webp"),
    },
    {
        key: '3',
        title: 'Get Prices',
        description: "We take care of your calculations, so you don't have to. Get the total amount for the receipt.",
        image: require("../../assets/images/intro_prices.webp"),
    },
    {
        key: '4',
        title: 'Get Started',
        description: 'Tap the button below to start using the app.',
        image: require("../../assets/images/intro_start.webp"),
    },
];


export default function IntroScreen() {
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const flatListRef = useRef<FlatList>(null);
    const scrollX = useRef(new Animated.Value(0)).current;
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
            router.replace('/AuthScreen');
        } catch (e) {
            console.error('Error setting intro flag', e);
        }
    };

    const Pagination = () => {
        return (
            <View style={styles.paginationContainer}>
                {slides.map((_, i) => {
                    const inputRange = [(i - 1) * width, i * width, (i + 1) * width];

                    const dotWidth = scrollX.interpolate({
                        inputRange,
                        outputRange: [8, 16, 8],
                        extrapolate: 'clamp',
                    });

                    const opacity = scrollX.interpolate({
                        inputRange,
                        outputRange: [0.3, 1, 0.3],
                        extrapolate: 'clamp',
                    });

                    return (
                        <Animated.View
                            key={i}
                            style={[
                                styles.dot,
                                { width: dotWidth, opacity },
                                i === currentIndex && styles.dotActive,
                            ]}
                        />
                    );
                })}
            </View>
        );
    };

    const renderItem = ({ item, index }: ListRenderItemInfo<typeof slides[0]>) => (
        <View style={[styles.slide, { width }]}>
            <View style={styles.imageContainer}>
                <Image
                    source={item.image}
                    style={styles.image}
                    resizeMode="contain"
                    onError={(error) => console.error('Image loading error:', error.nativeEvent.error)}
                />
            </View>
            <View style={styles.contentContainer}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.description}>{item.description}</Text>
                {index === slides.length - 1 && (
                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleGetStarted}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonText}>Get Started</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <Animated.FlatList
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
                scrollEventThrottle={16}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false }
                )}
            />
            <Pagination />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    slide: {
        flex: 1,
        alignItems: 'center',
        width: '100%',
    },
    imageContainer: {
        flex: 0.6,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 60,
        width: '100%',
        height: 300, // Explicit height
    },
    image: {
        width: 280,
        height: 280,
    },
    contentContainer: {
        flex: 0.4,
        alignItems: 'center',
        paddingHorizontal: 24,
        width: '100%',
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 16,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        color: '#666666',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
        paddingHorizontal: 16,
    },
    button: {
        backgroundColor: '#007AFF',
        paddingVertical: 16,
        paddingHorizontal: 48,
        borderRadius: 30,
        elevation: 3,
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        bottom: 50,
        width: '100%',
    },
    dot: {
        height: 8,
        borderRadius: 4,
        backgroundColor: '#007AFF',
        marginHorizontal: 4,
    },
    dotActive: {
        backgroundColor: '#007AFF',
    },
});
