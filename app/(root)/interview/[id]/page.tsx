import { getInterviewById } from '@/lib/actions/general.action'
import { getRandomInterviewCover } from '@/lib/utils'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import DisplayTechIcons from '@/components/DisplayTechIcons'
import Agent from '@/components/Agent'
import { getCurrentUser, getCurrentCandidateSession } from '@/lib/actions/auth.action'
import InterviewCompletedMessage from '@/components/InterviewCompletedMessage'

const page = async ( {params}: RouteParams ) => {

    const {id} = await params
    
    // Check for candidate session first
    const candidateSession = await getCurrentCandidateSession()
    
    let user = await getCurrentUser()
    let interview = await getInterviewById(id)

    if (!interview) redirect('/')
    
    // If candidate session exists, verify it matches this interview
    if (candidateSession) {
        // Verify this candidate's session matches THIS interview
        if (candidateSession.interviewId !== id) {
            // Session is for a different interview
            redirect(`/interview/${candidateSession.interviewId}`)
        }
        
        // CRITICAL: Verify email matches a candidate in this interview
        let candidateData = null;
        
        // Check new format (candidates array)
        if (interview.candidates && Array.isArray(interview.candidates)) {
            candidateData = interview.candidates.find(
                (c: CandidateSession) => c.email === candidateSession.email && c.sessionCode === candidateSession.sessionCode
            );
        }
        // Check legacy format
        else if (interview.email === candidateSession.email && interview.sessionCode === candidateSession.sessionCode) {
            candidateData = {
                email: interview.email,
                sessionCode: interview.sessionCode,
                completed: interview.completed || false
            };
        }
        
        if (!candidateData) {
            redirect('/sign-in');
        }
        
        // Check if THIS candidate already completed the interview
        if (candidateData.completed) {
            return <InterviewCompletedMessage />
        }
        
        // Candidate is valid - create a user object for display
        user = {
            name: candidateSession.email.split('@')[0],
            email: candidateSession.email,
            id: 'candidate-' + candidateSession.sessionCode
        } as User
    } else if (!user) {
        // No candidate session and no regular user - redirect to sign in
        redirect('/sign-in')
    }
    

  return (
    <>

    <div className='flex flex-row ga-4 justify-between '>
        <div className=' flex flex-row gap-4 items-center max-sm:flex-col'>
            <div className='flex flex-row gap-4 items-center'>
                <Image src = {getRandomInterviewCover()} alt = 'cover-image'
                width = {40} height = {40} className = "rounded-full object-cover size-[40px]"
                />
                <h3 className='capitalize '>{interview.role} Interview </h3>

            </div>
            <DisplayTechIcons techStack={interview.techstack} />
        </div>
        <p className=' bg-dark-200 px-4 py-2 
         rounded-lg h-fit capitalize '>{interview.type}</p>
    </div>
    <Agent 
    userName={user?.name || ""} 
    userId= {user?.id}
    interviewId={id}
    type = 'interview'
    questions={interview.questions}
    hrUserId={interview.userId} // Pass the HR user ID who created the interview
    candidateEmail={candidateSession?.email} // Pass candidate email for tracking
    />
    </>
  )
}

export default page