import { Resend } from 'resend';

const resend = new Resend(process.env.EXPO_PUBLIC_RESEND_API_KEY);

export default resend