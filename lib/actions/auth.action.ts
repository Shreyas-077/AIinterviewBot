'use server';

import { auth, db } from "@/firebase/admin";
import { cookies } from "next/headers";


const ONE_WEEK = 60 * 60 * 24 * 7;

export async function  signUp(params:SignUpParams) {
    const {uid, name, email} = params;

    try {

        const userRecord = await db.collection('users').doc(uid).get();

        if(userRecord.exists){
            return{
                success: false,
                message: 'User already exist. Please sign in instead'
            }
        }

        await db.collection('users').doc(uid).set({
            name, email
        })

        return{
            success: true,
            message: 'Account created successfully. Please sign in'
        }
        
    } catch (e: any) {
        console.error('Error creating a user', e);

        if(e.code === 'auth/email-already-exists'){
            return{
                success: false,
                message: 'This email is already in use'
            }
        }

        return{
            success: false,
            message: 'Failed to create an account'
        }
    }
}


export async function signIn(params:SignInParams) {
    const{ email, idToken} = params;

    try {
        const userRecord = await auth.getUserByEmail(email);

        if(!userRecord){
            return{
                success: false,
                message: 'User does not exist. create an account instead'
            }
        }

        await setSessionCookie(idToken);
        
        // Clear any existing candidate session when regular user logs in
        const cookieStore = await cookies();
        cookieStore.delete('candidate-session');

    } catch (e) {
        console.log(e);

        return{
            success: false,
            message: 'Failed to log into an account'
        }
    }
}


export async function setSessionCookie(idToken: string) {
    const cookieStore = await cookies();
    const sessionCookie =  await auth.createSessionCookie(idToken, {
        expiresIn: ONE_WEEK * 1000,

    })

    cookieStore.set('session', sessionCookie, {
        maxAge: ONE_WEEK,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'lax'
    })
}


export async function getCurrentUser(): Promise<User | null> {
    const cookieStore = await cookies();

    const sessionCookie = cookieStore.get('session')?.value;

    if(!sessionCookie) return null;

    try {
        const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);

        const userRecord = await db.
        collection('users')
        .doc(decodedClaims.uid)
        .get();


        if(!userRecord.exists) return null;

        return{
            ...userRecord.data(),
            id: userRecord.id,

            
        } as User;
        
    } catch (e) {
        console.log(e)

        return null;
    }

}

export async function isAuthenticated() {
    const user = await getCurrentUser();

    return !!user;
}

export async function signOut() {
    'use server';
    
    try {
        const cookieStore = await cookies();
        cookieStore.delete('session');
        
        return {
            success: true,
            message: 'Signed out successfully'
        };
    } catch (e) {
        console.error('Error signing out:', e);
        return {
            success: false,
            message: 'Failed to sign out'
        };
    }
}

export async function signInWithSession(params: { email: string; sessionCode: string }) {
    'use server';
    
    const { email, sessionCode } = params;
    
    try {
        // Find interview with matching email and session code
        const interviewsSnapshot = await db
            .collection('interviews')
            .where('email', '==', email)
            .where('sessionCode', '==', sessionCode.toUpperCase())
            .limit(1)
            .get();

        if (interviewsSnapshot.empty) {
            return {
                success: false,
                message: 'Invalid email or session code'
            };
        }

        const interview = interviewsSnapshot.docs[0];
        const interviewData = interview.data();

        // Store session info in cookie
        const cookieStore = await cookies();
        cookieStore.set('candidate-session', JSON.stringify({
            email,
            sessionCode,
            interviewId: interview.id,
            timestamp: new Date().toISOString()
        }), {
            maxAge: ONE_WEEK,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            sameSite: 'lax'
        });

        return {
            success: true,
            interviewId: interview.id,
            message: 'Session validated successfully'
        };
    } catch (e) {
        console.error('Error validating session:', e);
        return {
            success: false,
            message: 'Failed to validate session'
        };
    }
}

export async function getCurrentCandidateSession() {
    'use server';
    
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('candidate-session')?.value;

        if (!sessionCookie) return null;

        const session = JSON.parse(sessionCookie);
        return session;
    } catch (e) {
        console.error('Error getting candidate session:', e);
        return null;
    }
}

export async function signOutCandidate() {
    'use server';
    
    try {
        const cookieStore = await cookies();
        cookieStore.delete('candidate-session');
        
        return {
            success: true,
            message: 'Signed out successfully'
        };
    } catch (e) {
        console.error('Error signing out candidate:', e);
        return {
            success: false,
            message: 'Failed to sign out'
        };
    }
}

export async function clearCandidateSession() {
    'use server';
    
    try {
        const cookieStore = await cookies();
        cookieStore.delete('candidate-session');
    } catch (e) {
        console.error('Error clearing candidate session:', e);
    }
}
