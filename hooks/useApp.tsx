import { getAuth } from '@react-native-firebase/auth';
import { collection, FirebaseFirestoreTypes, getDocs, getFirestore, query, where } from '@react-native-firebase/firestore';
import React, { createContext, useContext, useState } from 'react';

// Define the context and its type
interface AppContextType {
    User: FirebaseFirestoreTypes.DocumentData | null
    setUser: React.Dispatch<React.SetStateAction<FirebaseFirestoreTypes.DocumentData | null>>
    getUserIdToken: () => Promise<string>;
    getUserData: () => Promise<FirebaseFirestoreTypes.DocumentData | null>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [User, setUser] = useState<FirebaseFirestoreTypes.DocumentData | null>(null);

    const getUserIdToken = async () => {
        const auth = getAuth();
        const user = auth.currentUser;

        if (user) {
            let token;
            token = await user.getIdToken();
            if (!token) { token = await user.getIdToken(true); }
            // Use token as Bearer token in your API requests
            console.log('Bearer token:', token);
            return token;
        }
        return ''
    }

    const getUserData = async () => {
        const email = getAuth().currentUser?.email;

        const db = getFirestore();
        const usersCollection = collection(db, 'Users');
        const q = query(usersCollection, where('email', '==', email));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();
            // console.log(userData);
            setUser(userData)
            return userData;
        }
        return null;
    }

    return (
        <AppContext.Provider value={{ User, setUser, getUserIdToken, getUserData }}>
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

