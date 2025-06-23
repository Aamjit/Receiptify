/**
 * Ping server on render to start up
 * @returns Wake up reponse as OK message
 */
export const wakeUpServer = async () => {
    const domain = process.env.EXPO_PUBLIC_SERVER ?? '';
    const response = await fetch(domain + "/", {
        method: 'GET',
    });

    let res = await response.json();
    return res;
}
