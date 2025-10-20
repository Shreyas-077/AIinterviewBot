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
    const{ email, idToken, password} = params;

    try {
        // First, check if this is an HR user (Firestore credentials)
        const hrUsersQuery = await db.collection('users')
            .where('email', '==', email)
            .where('role', '==', 'hr')
            .limit(1)
            .get();

        if (!hrUsersQuery.empty) {
            // This is an HR user - validate with Firestore credentials
            const hrUser = hrUsersQuery.docs[0];
            const userId = hrUser.id;
            const userData = hrUser.data();

            // Check if user is active
            if (!userData.isActive) {
                return {
                    success: false,
                    message: 'Your account has been deactivated. Please contact admin.'
                };
            }

            // Get credentials from user-credentials collection
            const credDoc = await db.collection('user-credentials').doc(userId).get();
            
            if (!credDoc.exists) {
                return {
                    success: false,
                    message: 'Invalid credentials'
                };
            }

            const credentials = credDoc.data();
            
            // Validate password (in production, use bcrypt comparison)
            if (credentials?.password !== password) {
                return {
                    success: false,
                    message: 'Invalid email or password'
                };
            }

            // Create session for HR user
            const cookieStore = await cookies();
            cookieStore.set('hr-session', JSON.stringify({
                userId,
                email: userData.email,
                name: userData.name,
                role: 'hr'
            }), {
                maxAge: ONE_WEEK,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                path: '/',
                sameSite: 'lax'
            });

            // Clear any existing candidate session
            cookieStore.delete('candidate-session');

            return {
                success: true,
                message: 'Logged in successfully'
            };
        }

        // Not an HR user - use Firebase Authentication (regular users)
        if (!idToken) {
            return {
                success: false,
                message: 'Invalid credentials'
            };
        }

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

        return {
            success: true,
            message: 'Logged in successfully'
        };

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

    // First check for HR session
    const hrSessionCookie = cookieStore.get('hr-session')?.value;
    
    if (hrSessionCookie) {
        try {
            const hrSession = JSON.parse(hrSessionCookie);
            
            // Verify the HR user still exists and is active
            const userDoc = await db.collection('users').doc(hrSession.userId).get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                
                // Check if user is still active
                if (userData?.isActive === false) {
                    // User deactivated - clear session
                    cookieStore.delete('hr-session');
                    return null;
                }
                
                return {
                    id: hrSession.userId,
                    name: hrSession.name,
                    email: hrSession.email
                } as User;
            }
        } catch (e) {
            console.error('Error parsing HR session:', e);
            cookieStore.delete('hr-session');
        }
    }

    // Check for regular Firebase Auth session
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
        cookieStore.delete('hr-session'); // Also clear HR session
        
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
        // Find interview with matching candidate
        const interviewsSnapshot = await db
            .collection('interviews')
            .where('finalized', '==', true)
            .get();

        let matchedInterview = null;
        let matchedCandidate = null;

        // Check each interview for matching candidate
        for (const doc of interviewsSnapshot.docs) {
            const interviewData = doc.data();
            
            // Check new format (candidates array)
            if (interviewData.candidates && Array.isArray(interviewData.candidates)) {
                const candidate = interviewData.candidates.find(
                    (c: any) => c.email === email && c.sessionCode === sessionCode.toUpperCase()
                );
                if (candidate) {
                    matchedInterview = { id: doc.id, ...interviewData };
                    matchedCandidate = candidate;
                    break;
                }
            }
            
            // Check legacy format (backward compatibility)
            if (interviewData.email === email && interviewData.sessionCode === sessionCode.toUpperCase()) {
                matchedInterview = { id: doc.id, ...interviewData };
                matchedCandidate = { email: interviewData.email, sessionCode: interviewData.sessionCode };
                break;
            }
        }

        if (!matchedInterview) {
            return {
                success: false,
                message: 'Invalid email or session code'
            };
        }

        // Store session info in cookie
        const cookieStore = await cookies();
        cookieStore.set('candidate-session', JSON.stringify({
            email,
            sessionCode,
            interviewId: matchedInterview.id,
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
            interviewId: matchedInterview.id,
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
