import { getAuth } from "@react-native-firebase/auth";

export const generateReportData = async (userId: string, fromDate: Date, toDate: Date): Promise<any> => {
    const appId = process.env.EXPO_PUBLIC_APP_ID ?? '';
    const token = await getAuth().currentUser?.getIdToken();
    let data;
    data = {
        "userId": userId,
        "fromDate": fromDate,
        "toDate": toDate
    }

    const domain = process.env.EXPO_PUBLIC_SERVER ?? '';

    const response = await fetch(domain + "/generate-report-data", {
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

    let res = await response.json();

    return res;
}
