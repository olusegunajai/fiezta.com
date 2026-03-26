import CryptoJS from 'crypto-js';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

const ENCRYPTION_KEY = process.env.VITE_ENCRYPTION_KEY || 'fiezta-default-secret-key';

export const encryptData = (data: string): string => {
  return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
};

export const decryptData = (ciphertext: string): string => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

export const logActivity = async (
  agencyId: string,
  userId: string,
  userName: string,
  action: string,
  resourceType: string,
  resourceId: string,
  details?: string
) => {
  try {
    await addDoc(collection(db, 'audit_logs'), {
      agencyId,
      userId,
      userName,
      action,
      resourceType,
      resourceId,
      details,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};
