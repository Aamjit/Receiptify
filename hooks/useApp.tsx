import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { createContext, useContext, useState } from 'react';

// Define the context and its type
interface AppContextType {
    User: FirebaseFirestoreTypes.DocumentData | null
    setUser: React.Dispatch<React.SetStateAction<FirebaseFirestoreTypes.DocumentData | null>>
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [User, setUser] = useState<FirebaseFirestoreTypes.DocumentData | null>(null);

    return (
        <AppContext.Provider value={{ User, setUser }}>
            {children}
        </AppContext.Provider>
    );
};


// Custom hook to use the AppContext
export function useAppContext() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
}

export { AppContext };

