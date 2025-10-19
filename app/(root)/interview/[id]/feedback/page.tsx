import dayjs from "dayjs";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

import {
  getFeedbackByInterviewId,
  getInterviewById,
} from "@/lib/actions/general.action";
import { Button } from "@/components/ui/button";
import { getCurrentUser, getCurrentCandidateSession } from "@/lib/actions/auth.action";

const Feedback = async ({ params }: RouteParams) => {
  const { id } = await params;
  
  // Check if candidate is trying to access feedback
  const candidateSession = await getCurrentCandidateSession();
  
  // Candidates should NOT see feedback - redirect them
  if (candidateSession) {
    redirect(`/interview/${id}`);
  }
  
  const user = await getCurrentUser();
  
  // If no user at all, redirect to sign-in
  if (!user) redirect('/sign-in');

  const interview = await getInterviewById(id);
  if (!interview) redirect("/");

  const feedback = await getFeedbackByInterviewId({
    interviewId: id,
    userId: user.id,
  });

  console.log('Feedback page - Interview ID:', id);
  console.log('Feedback page - User ID:', user.id);
  console.log('Feedback page - Feedback found:', !!feedback);
  console.log('Feedback page - Transcript exists:', !!feedback?.transcript);
  console.log('Feedback page - Transcript length:', feedback?.transcript?.length || 0);

  return (
    <section className="section-feedback">
      <div className="flex flex-row justify-center">
        <h1 className="text-4xl font-semibold">
          Feedback on the Interview -{" "}
          <span className="capitalize">{interview.role}</span> Interview
        </h1>
      </div>

      <div className="flex flex-row justify-center ">
        <div className="flex flex-row gap-5">
          {/* Overall Impression */}
          <div className="flex flex-row gap-2 items-center">
            <Image src="/star.svg" width={22} height={22} alt="star" />
            <p>
              Overall Impression:{" "}
              <span className="text-primary-200 font-bold">
                {feedback?.totalScore}
              </span>
              /100
            </p>
          </div>

          {/* Date */}
          <div className="flex flex-row gap-2">
            <Image src="/calendar.svg" width={22} height={22} alt="calendar" />
            <p>
              {feedback?.createdAt
                ? dayjs(feedback.createdAt).format("MMM D, YYYY h:mm A")
                : "N/A"}
            </p>
          </div>
        </div>
      </div>

      <hr />

      {/* Transcript Section - Show this FIRST and ALWAYS if it exists */}
      {feedback?.transcript && Array.isArray(feedback.transcript) && feedback.transcript.length > 0 ? (
        <div className="card-border mt-8 mb-8">
          <div className="card p-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Interview Transcript ({feedback.transcript.length} messages)
            </h2>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {feedback.transcript.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === 'assistant' ? 'justify-start' : 'justify-end'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === 'assistant'
                        ? 'bg-blue-500/10 border border-blue-500/20'
                        : 'bg-purple-500/10 border border-purple-500/20'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {message.role === 'assistant' ? (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <span className="font-semibold text-blue-400">AI Interviewer</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-purple-400">Candidate</span>
                          <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="card-border mt-8 mb-8">
          <div className="card p-6">
            <p className="text-gray-500">No transcript available for this interview.</p>
          </div>
        </div>
      )}

      <hr className="my-8" />

      {/* AI Assessment */}
      <h2 className="text-2xl font-bold mb-4">AI Assessment</h2>
      <p className="mb-6">{feedback?.finalAssessment}</p>

      {/* Interview Breakdown */}
      <div className="flex flex-col gap-4">
        <h2>Breakdown of the Interview:</h2>
        {feedback?.categoryScores?.map((category, index) => (
          <div key={index}>
            <p className="font-bold">
              {index + 1}. {category.name} ({category.score}/100)
            </p>
            <p>{category.comment}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <h3>Strengths</h3>
        <ul>
          {feedback?.strengths?.map((strength, index) => (
            <li key={index}>{strength}</li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        <h3>Areas for Improvement</h3>
        <ul>
          {feedback?.areasForImprovement?.map((area, index) => (
            <li key={index}>{area}</li>
          ))}
        </ul>
      </div>

      <div className="buttons">
        <Button className="btn-secondary flex-1">
          <Link href="/" className="flex w-full justify-center">
            <p className="text-sm font-semibold text-primary-200 text-center">
              Back to dashboard
            </p>
          </Link>
        </Button>

        <Button className="btn-primary flex-1">
          <Link
            href={`/interview/${id}`}
            className="flex w-full justify-center"
          >
            <p className="text-sm font-semibold text-black text-center">
              Retake Interview
            </p>
          </Link>
        </Button>
      </div>
    </section>
  );
};

export default Feedback;