import { getInterviewById } from '@/lib/actions/general.action'
import { getCurrentUser } from '@/lib/actions/auth.action'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const CandidatesListPage = async ({ params }: RouteParams) => {
  const { id } = await params
  
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const interview = await getInterviewById(id)
  if (!interview) redirect('/')
  
  // Only interview creator can view candidates
  if (interview.userId !== user.id) {
    redirect('/')
  }

  // Get candidates list
  const candidates = interview.candidates || [
    { email: interview.email, sessionCode: interview.sessionCode, completed: interview.completed }
  ]

  return (
    <section className="flex flex-col gap-8 p-8">
      <div>
        <h1 className="text-4xl font-bold capitalize mb-2">
          {interview.role} Interview - Candidates
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Select a candidate to view their feedback
        </p>
      </div>

      <div className="grid gap-4">
        {candidates.filter(c => c.email).map((candidate, index) => (
          <div
            key={index}
            className="card-border p-6 flex items-center justify-between hover:shadow-lg transition-shadow"
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-xl">
                  {candidate.email![0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{candidate.email}</h3>
                  <p className="text-sm text-gray-500">
                    Session Code: <span className="font-mono">{candidate.sessionCode}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {candidate.completed ? (
                <>
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-semibold">Completed</span>
                  </div>
                  <Button className="btn-primary">
                    <Link href={`/interview/${id}/feedback/${encodeURIComponent(candidate.email!)}`}>
                      View Feedback
                    </Link>
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold">Pending</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Button className="btn-secondary w-fit">
        <Link href="/">
          Back to Dashboard
        </Link>
      </Button>
    </section>
  )
}

export default CandidatesListPage
