
'use server';

import { getAuth } from 'firebase/auth';
import {
    createUserWithEmailAndPassword,
    type AuthError,
} from 'firebase/auth';
import { initializeFirebase } from '..';
import { z } from 'zod';

const SignUpCredentialsSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

export type SignUpCredentials = z.infer<typeof SignUpCredentialsSchema>;

export async function signUpWithEmailAndPassword(credentials: SignUpCredentials) {
    try {
        const { auth } = initializeFirebase();
        const userCredential = await createUserWithEmailAndPassword(auth, credentials.email, credentials.password);
        return { success: true, userId: userCredential.user.uid };
    } catch (e) {
        const error = e as AuthError;
        let errorMessage = 'An unknown error occurred during registration.';
        
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'This email is already in use. Please log in.';
        }
        
        return { success: false, error: errorMessage };
    }
}
