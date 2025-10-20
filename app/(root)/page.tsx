import { Button } from '@/components/ui/button'
import Link from 'next/link'
import React from 'react'
import Image from 'next/image'
import { dummyInterviews } from '@/constants'
import InterviewCard from '@/components/InterviewCard'
import { getInterviewByUserId, getLatestInterviews } from '@/lib/actions/general.action'
import { getCurrentUser, getCurrentCandidateSession } from '@/lib/actions/auth.action'
import { redirect } from 'next/navigation'

const page =  async () => {

  // IMPORTANT: Check for regular user FIRST (priority over candidate session)
  const user = await getCurrentUser();
  const candidateSession = await getCurrentCandidateSession();
  
  // If regular user exists, show dashboard (ignore candidate session)
  // If ONLY candidate session exists (no user), redirect to interview
  if (!user && candidateSession) {
    redirect(`/interview/${candidateSession.interviewId}`);
  }

  // If no user and no candidate, layout will redirect to sign-in
  if (!user) {
    redirect('/sign-in');
  }

  // Continue with regular dashboard for users - now we know user exists
  const [userInterviews, latestInterviews] = await Promise.all([
    getInterviewByUserId(user.id),
    getLatestInterviews({ userId: user.id })
  ])

  


  

  


  const hasPastInterviews = userInterviews && userInterviews.length > 0
  const hasUpcomingInterviews = latestInterviews && latestInterviews.length > 0

  return (
    <>
      <section className='card-cta'>
        <div className=' flex flex-col gap-6 max-w-lg'>
          <h2> Get Interview-Ready with AI-Powered Practice & Feedback</h2>

          <p className='text-lg'>
            Practice on real interview questions & get
            instant feedback
          </p>

          <Button asChild className='btn-primary max-sm:w-full'>
            <Link href="/interview">Start an Interview</Link>
          </Button>
        </div>
        <Image src="/robot.png" alt="robo-dude" width={400} height={400} 
        className='max-sm:hidden  ' />
      </section>
        <section className='flex flex-col gap-6 mt-8'>
          <h2>Scheduled Interviews</h2>
          <div className='interviews-section'>
            {
            
            hasPastInterviews ? (
              userInterviews?.map((interview) =>(
                 <InterviewCard 
                   {...interview} 
                   key={interview.id} 
                   showDelete={true}  // Enable delete for user's own interviews
                   completed={interview.completed}  // Pass completion status
                 />
              ))
            ) : (
              <p>You have no scheduled interviews yet</p> 
            )
          }
          
          


        </div>
      </section>
    </>
  )
}

export default page