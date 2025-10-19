'use client'

import { useRouter } from 'next/navigation'
import { clearCandidateSession } from '@/lib/actions/auth.action'

const InterviewCompletedMessage = () => {
    const router = useRouter()
    
    const handleLogout = async () => {
        await clearCandidateSession()
        router.push('/sign-in')
        router.refresh()
    }
    
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <h2 className="text-3xl font-bold text-center">Interview Already Completed</h2>
            <p className="text-gray-600 dark:text-gray-400 text-center max-w-md px-4">
                You have already completed this interview. The HR team will review your responses and get back to you soon.
            </p>
            <button
                onClick={handleLogout}
                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
            >
                Logout
            </button>
        </div>
    )
}

export default InterviewCompletedMessage
