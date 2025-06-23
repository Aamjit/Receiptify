import { getAuth } from "@react-native-firebase/auth";

interface EmailSendBodyType {
    name: string,
    to: string[],
    subject: string,
    text: string,
    html: string
}

export async function sendEmail(data: EmailSendBodyType, headers: Record<string, string> = {}) {
    const appId = process.env.EXPO_PUBLIC_APP_ID ?? '';
    const domain = process.env.EXPO_PUBLIC_SERVER ?? '';
    const token = await getAuth().currentUser?.getIdToken();
    const response = await fetch(domain + "/send-email", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-App-Id': appId,
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        let errorText = '';
        try {
            const errorJson = await response.json();
            if (errorJson && errorJson.error) {
                errorText = errorJson.error;
            } else {
                errorText = JSON.stringify(errorJson);
            }
        } catch {
            errorText = await response.text();
        }
        throw new Error(`API Error: ${errorText}`);
    }
    return response.json();
}