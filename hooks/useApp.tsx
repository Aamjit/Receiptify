import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { createContext, useContext } from 'react';

// Define the context and its type
interface AppContextType {
    // hasSeenIntro: boolean | null;
    // setHasSeenIntro: React.Dispatch<React.SetStateAction<boolean | null>>;
    User: FirebaseAuthTypes.User | null
    setUser: React.Dispatch<React.SetStateAction<FirebaseAuthTypes.User | null>>
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Custom hook to use the AppContext
export function useAppContext() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
}

export { AppContext };

