import { useAsyncStorage } from '@react-native-async-storage/async-storage';
import { getAuth } from '@react-native-firebase/auth';
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

export default function Index() {
    const AsyncStorageIntro = useAsyncStorage("receiptify-intro");
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

    return introSeen && <Redirect href={introSeen == "true" ? getAuth().currentUser ? "/home" : "/(screens)/AuthScreen1" : "/(screens)/IntroScreen"} />;

    // return <Redirect href={"/(screens)/AccountSetupScreen"} />;
    // return <Redirect href={introSeen == "true" ? "/IntroScreen" : "/IntroScreen"} />;
}
