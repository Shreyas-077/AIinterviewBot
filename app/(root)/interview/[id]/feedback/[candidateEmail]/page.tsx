import { db } from "@/firebase/admin";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import dayjs from "dayjs";

interface PageProps {
  params: Promise<{
    id: string;
    candidateEmail: string;
  }>;
}

export default async function CandidateFeedbackPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { id: interviewId, candidateEmail } = resolvedParams;
  
  // Decode the email from URL
  const decodedEmail = decodeURIComponent(candidateEmail);

  // Get interview details
  const interviewDoc = await db.collection('interviews').doc(interviewId).get();
  
  if (!interviewDoc.exists) {
    redirect('/');
  }

  const interview = interviewDoc.data();

  // Get feedback for this specific candidate
  const feedbackSnapshot = await db
    .collection('feedback')
    .where('interviewId', '==', interviewId)
    .where('candidateEmail', '==', decodedEmail)
    .limit(1)
    .get();

  if (feedbackSnapshot.empty) {
    return (
      <section className="section-feedback">
        <div className="flex flex-col items-center gap-4 text-center py-12">
          <h1 className="text-3xl font-bold">No Feedback Available</h1>
          <p className="text-muted-foreground mb-6">
            This candidate hasn't completed the interview yet.
          </p>
          <Button className="btn-secondary">
            <Link href={`/interview/${interviewId}/candidates`}>
              Back to Candidates List
            </Link>
          </Button>
        </div>
      </section>
    );
  }

  const feedbackDoc = feedbackSnapshot.docs[0];
  const feedback = feedbackDoc.data();

  // Find candidate details
  const candidate = interview?.candidates?.find(
    (c: any) => c.email === decodedEmail
  );

  return (
    <section className="section-feedback">
      {/* Header */}
      <div className="flex flex-row justify-center">
        <h1 className="text-4xl font-semibold">
          Feedback on the Interview -{" "}
          <span className="capitalize">{interview?.role}</span> Interview
        </h1>
      </div>

      {/* Candidate Info Badge */}
      <div className="flex flex-row justify-center mb-4">
        <div className="flex items-center gap-3 bg-primary/10 px-6 py-3 rounded-full border border-primary/20">
          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white text-lg font-bold">
            {decodedEmail[0].toUpperCase()}
          </div>
          <div className="text-left">
            <p className="font-semibold text-sm">{decodedEmail}</p>
            <p className="text-xs text-muted-foreground">
              Session: {candidate?.sessionCode || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex flex-row justify-center">
        <div className="flex flex-row gap-5">
          {/* Overall Impression */}
          <div className="flex flex-row gap-2 items-center">
            <Image src="/star.svg" width={22} height={22} alt="star" />
            <p>
              Overall Impression:{" "}
              <span className="text-primary-200 font-bold">
                {feedback?.totalScore || 'N/A'}
              </span>
              /100
            </p>
          </div>

          {/* Date */}
          <div className="flex flex-row gap-2">
            <Image src="/calendar.svg" width={22} height={22} alt="calendar" />
            <p>
              {candidate?.completedAt
                ? dayjs(candidate.completedAt).format("MMM D, YYYY h:mm A")
                : feedback?.createdAt
                ? dayjs(feedback.createdAt).format("MMM D, YYYY h:mm A")
                : "N/A"}
            </p>
          </div>
        </div>
      </div>

      <hr />

      {/* Transcript Section - Show this FIRST */}
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
              {feedback.transcript.map((message: any, index: number) => (
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
      <p className="mb-6">{feedback?.finalAssessment || 'No assessment available.'}</p>

      {/* Interview Breakdown */}
      <div className="flex flex-col gap-4">
        <h2>Breakdown of the Interview:</h2>
        {feedback?.categoryScores && Array.isArray(feedback.categoryScores) ? (
          feedback.categoryScores.map((category: any, index: number) => (
            <div key={index}>
              <p className="font-bold">
                {index + 1}. {category.name} ({category.score}/100)
              </p>
              <p>{category.comment}</p>
            </div>
          ))
        ) : feedback?.categoryScores && typeof feedback.categoryScores === 'object' ? (
          // Handle object format (fallback case)
          Object.entries(feedback.categoryScores).map(([key, value], index) => (
            <div key={index}>
              <p className="font-bold">
                {index + 1}. {key.replace(/([A-Z])/g, ' $1').trim().replace(/^./, str => str.toUpperCase())} ({value as number}/100)
              </p>
              <p>Score based on interview responses</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No category scores available.</p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h3>Strengths</h3>
        <ul>
          {feedback?.strengths && Array.isArray(feedback.strengths) && feedback.strengths.length > 0 ? (
            feedback.strengths.map((strength: string, index: number) => (
              <li key={index}>{strength}</li>
            ))
          ) : (
            <li className="text-gray-500">No strengths recorded.</li>
          )}
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        <h3>Areas for Improvement</h3>
        <ul>
          {feedback?.areasForImprovement && Array.isArray(feedback.areasForImprovement) && feedback.areasForImprovement.length > 0 ? (
            feedback.areasForImprovement.map((area: string, index: number) => (
              <li key={index}>{area}</li>
            ))
          ) : (
            <li className="text-gray-500">No areas for improvement recorded.</li>
          )}
        </ul>
      </div>

      <div className="buttons">
        <Button className="btn-secondary flex-1">
          <Link href={`/interview/${interviewId}/candidates`} className="flex w-full justify-center">
            <p className="text-sm font-semibold text-primary-200 text-center">
              Back to Candidates List
            </p>
          </Link>
        </Button>

        <Button className="btn-primary flex-1">
          <Link
            href="/"
            className="flex w-full justify-center"
          >
            <p className="text-sm font-semibold text-white text-center">
              Back to Dashboard
            </p>
          </Link>
        </Button>
      </div>
    </section>
  );
}
