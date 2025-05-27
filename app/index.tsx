import { useAsyncStorage } from '@react-native-async-storage/async-storage';
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

export default function Index() {
    const AsyncStorageIntro = useAsyncStorage("receiptify-intro");
    const router = useRouter();
    const [introSeen, setIntroSeen] = useState<string | null>(null);

    useEffect(() => {
        const checkIntro = async () => {
            try {
                const introSeen = await AsyncStorageIntro.getItem()
                setIntroSeen(introSeen)
            } catch (e) {
                // setHasSeenIntro(false);
                console.log(e);

            }
        };
        checkIntro();
    }, []);

    return introSeen && <Redirect href={introSeen == "true" ? "/AuthScreen1" : "/IntroScreen"} />;
}
