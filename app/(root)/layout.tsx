import Link from 'next/link'
import { ReactNode } from 'react'
import Image from 'next/image'
import { getCurrentUser, getCurrentCandidateSession, signOut, signOutCandidate } from '@/lib/actions/auth.action'
import { redirect } from 'next/navigation'

const RootLayout = async ({ children }: {children: ReactNode}) => {
  // Check for BOTH regular user and candidate session (inspired by user login logic)
  const user = await getCurrentUser();
  const candidateSession = await getCurrentCandidateSession();

  // If neither user nor candidate session exists, redirect to sign-in
  if (!user && !candidateSession) redirect('/sign-in');

  // Determine display name and logout handler based on session type
  const displayName = user?.name || candidateSession?.email?.split('@')[0] || 'Guest';
  const isCandidate = !user && candidateSession;

  async function handleSignOut() {
    'use server';
    if (isCandidate) {
      await signOutCandidate();
    } else {
      await signOut();
    }
    redirect('/sign-in');
  }

  return (
    <div className='root-layout'>
      <nav className="flex justify-between items-center w-full">
        <Link href={isCandidate ? `/interview/${candidateSession?.interviewId}` : '/'} className = "flex items-center gap-2 ">
          <Image src='/logo.svg' alt='logo' width={38} height={32}/>
          <h2 className='text-primary-100'>InterviewAI Pro</h2>
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Image 
              src='/user-avatar.png' 
              alt='user' 
              width={32} 
              height={32}
              className="rounded-full"
            />
            <span className="text-white-100">{displayName}</span>
            {isCandidate && <span className="text-xs text-gray-400">(Candidate)</span>}
          </div>
          <form action={handleSignOut}>
            <button 
              type="submit"
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              Logout
            </button>
          </form>
        </div>
      </nav>
      {children}
    </div>
  )
}

export default RootLayout