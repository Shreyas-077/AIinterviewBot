'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { deleteInterview } from '@/lib/actions/general.action'
import Image from 'next/image'

interface DeleteInterviewButtonProps {
  interviewId: string
  interviewRole: string
}

const DeleteInterviewButton = ({ interviewId, interviewRole }: DeleteInterviewButtonProps) => {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setIsDeleting(true)
    
    try {
      const result = await deleteInterview(interviewId)
      
      if (result.success) {
        toast.success('Interview deleted successfully')
        setShowConfirmModal(false)
        router.refresh() // Refresh the page to update the list
      } else {
        toast.error(result.message || 'Failed to delete interview')
      }
    } catch (error) {
      console.error('Error deleting interview:', error)
      toast.error('An error occurred while deleting')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowConfirmModal(true)}
        className="absolute top-2 left-2 p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors group"
        title="Delete interview"
      >
        <Image 
          src="/trash.svg" 
          alt="Delete" 
          width={20} 
          height={20}
          className="opacity-70 group-hover:opacity-100"
        />
      </button>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Delete Interview?
              </h3>
              
              <p className="text-center text-gray-600 dark:text-gray-300">
                Are you sure you want to delete the <span className="font-semibold capitalize">"{interviewRole}"</span> interview?
              </p>
              
              <p className="text-center text-sm text-red-600 dark:text-red-400">
                This action cannot be undone. All associated feedback will also be deleted.
              </p>

              <div className="flex gap-3 w-full mt-2">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default DeleteInterviewButton
