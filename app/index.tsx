import { useAppContext } from '@/hooks/useApp';
import { useAsyncStorage } from '@react-native-async-storage/async-storage';
import { getAuth } from '@react-native-firebase/auth';
import { collection, getDocs, getFirestore, query, where } from '@react-native-firebase/firestore';
import { Redirect } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import { Image, StyleSheet, Animated, Platform } from 'react-native';

function SplashScreen() {
    const fadeAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 600,
            delay: 2400, // Start fading after 2.4s, finish at 3s
            useNativeDriver: true,
        }).start();
    }, [fadeAnim]);

    return (
        <Animated.View style={[styles.splashContainer, { opacity: fadeAnim }]}>
            <Image source={require('@/assets/images/Receiptify.webp')} style={styles.splashIcon} resizeMode="contain" />
        </Animated.View>
    );
}

export default function Index() {
    const AsyncStorageIntro = useAsyncStorage("receiptify-intro");
    const [introSeen, setIntroSeen] = useState<string | null>(null);
    const [showSplash, setShowSplash] = useState(true);
    const { User, setUser } = useAppContext()

    useEffect(() => {
        const timer = setTimeout(() => setShowSplash(false), 3000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const checkIntro = async () => {
            try {
                const introSeen = await AsyncStorageIntro.getItem()
                introSeen ? setIntroSeen(introSeen) : setIntroSeen("false")
            } catch (error) {
                console.error("Error reading intro seen status:", error);
                setIntroSeen("false");
            }
        };

        (Platform.OS == 'android' || Platform.OS == 'ios') && checkIntro();

        const fetchUser = async () => {
            try {
                // await getAuth().signOut();
                const userId = getAuth().currentUser?.uid;
                if (!userId) {
                    return;
                }
                const db = getFirestore();
                const usersCollection = collection(db, 'Users');
                const q = query(usersCollection, where('userId', '==', userId));
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    const userDoc = querySnapshot.docs[0];
                    const userData = userDoc.data();
                    setUser(userData)
                }
            } catch (err) {
                console.log("Error fetching user data\n", err);
            }
        }

        fetchUser();
    }, []);

    if (showSplash) return <SplashScreen />;
    if (introSeen === null) return null;

    return <Redirect href={introSeen !== "true" ? "/(screens)/IntroScreen" : !getAuth().currentUser?.emailVerified ? "/(screens)/AuthScreen" : User?.new ? "/AccountSetupScreen" : "/home"} />;
}

const styles = StyleSheet.create({
    splashContainer: {
        flex: 1,
        backgroundColor: '#fbfafd',
        justifyContent: 'center',
        alignItems: 'center',
    },
    splashIcon: {
        width: 360,
        height: 360,
    },
    splashText: {
        fontSize: 28,
        fontWeight: '700',
        color: '#2196F3',
        letterSpacing: 1.2,
    },
});
