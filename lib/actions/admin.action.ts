'use server'

import { db } from "@/firebase/admin";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Admin credentials (in production, store this in environment variables or database)
const ADMIN_CREDENTIALS = {
  email: process.env.ADMIN_EMAIL || "admin@interviewai.com",
  password: process.env.ADMIN_PASSWORD || "admin123456", // Change this!
};

export async function adminSignIn({ email, password }: { email: string; password: string }) {
  try {
    // Verify admin credentials
    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
      // Create admin session
      const cookieStore = await cookies();
      cookieStore.set('admin-session', JSON.stringify({ email, isAdmin: true }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return { success: true };
    }

    return { success: false, error: 'Invalid credentials' };
  } catch (error) {
    console.error('Admin sign in error:', error);
    return { success: false, error: 'Authentication failed' };
  }
}

export async function adminSignOut() {
  const cookieStore = await cookies();
  cookieStore.delete('admin-session');
  redirect('/admin/login');
}

export async function getCurrentAdmin() {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get('admin-session');

    if (!adminSession) return null;

    const session = JSON.parse(adminSession.value);
    return session.isAdmin ? session : null;
  } catch (error) {
    return null;
  }
}

// User Management Functions
export async function createHRUser({ name, email, password }: { name: string; email: string; password: string }) {
  try {
    console.log('Creating HR user:', { name, email });
    
    // Check if user already exists
    const existingUser = await db.collection('users').where('email', '==', email).get();
    
    if (!existingUser.empty) {
      console.log('User already exists:', email);
      return { success: false, error: 'User with this email already exists' };
    }

    // Create new HR user
    console.log('Adding user to database...');
    const userRef = await db.collection('users').add({
      name,
      email,
      role: 'hr',
      createdAt: new Date().toISOString(),
      createdBy: 'admin',
      isActive: true,
    });
    console.log('User created with ID:', userRef.id);

    // Store password (in production, use proper password hashing like bcrypt)
    console.log('Storing user credentials...');
    await db.collection('user-credentials').doc(userRef.id).set({
      userId: userRef.id,
      email,
      password, // In production, hash this!
      createdAt: new Date().toISOString(),
    });
    console.log('Credentials stored successfully');

    return { success: true, userId: userRef.id };
  } catch (error) {
    console.error('Create HR user error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
    return { success: false, error: errorMessage };
  }
}

export async function getAllHRUsers(): Promise<HRUser[]> {
  try {
    const usersSnapshot = await db
      .collection('users')
      .where('role', '==', 'hr')
      .orderBy('createdAt', 'desc')
      .get();

    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as HRUser[];

    return users;
  } catch (error) {
    console.error('Get HR users error:', error);
    return [];
  }
}

export async function updateHRUser({ 
  userId, 
  name, 
  email, 
  isActive 
}: { 
  userId: string; 
  name: string; 
  email: string; 
  isActive: boolean;
}) {
  try {
    await db.collection('users').doc(userId).update({
      name,
      email,
      isActive,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    console.error('Update HR user error:', error);
    return { success: false, error: 'Failed to update user' };
  }
}

export async function deleteHRUser(userId: string) {
  try {
    // Delete user document
    await db.collection('users').doc(userId).delete();
    
    // Delete credentials
    await db.collection('user-credentials').doc(userId).delete();

    return { success: true };
  } catch (error) {
    console.error('Delete HR user error:', error);
    return { success: false, error: 'Failed to delete user' };
  }
}

export async function getAdminStats() {
  try {
    const [usersSnapshot, interviewsSnapshot, feedbackSnapshot] = await Promise.all([
      db.collection('users').where('role', '==', 'hr').get(),
      db.collection('interviews').get(),
      db.collection('feedback').get(),
    ]);

    return {
      totalHRUsers: usersSnapshot.size,
      totalInterviews: interviewsSnapshot.size,
      totalFeedback: feedbackSnapshot.size,
      activeUsers: usersSnapshot.docs.filter(doc => doc.data().isActive).length,
    };
  } catch (error) {
    console.error('Get admin stats error:', error);
    return {
      totalHRUsers: 0,
      totalInterviews: 0,
      totalFeedback: 0,
      activeUsers: 0,
    };
  }
}
