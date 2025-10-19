'use server'

import { feedbackSchema } from "@/constants";
import { db } from "@/firebase/admin";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";


export async function getInterviewByUserId(userId: string): Promise<Interview[] | null> {
    const interviews = await db
    .collection('interviews')
    .where('userId' , '==', userId)
    .orderBy('createdAt' , 'desc')
    .get();

    return interviews.docs.map((doc)=> ({ 
        id: doc.id,
        ...doc.data()
    }) ) as Interview[];
}


export async function getLatestInterviews(params: GetLatestInterviewsParams): Promise<Interview[] | null> {
    const {userId, limit = 20} = params

    const interviews = await db
    .collection('interviews')
    .orderBy('createdAt' , 'desc')
    .where('finalized' , '==', true)
    .where('userId' , '!=', userId)
    .limit(limit)
    .get();

    return interviews.docs.map((doc)=> ({ 
        id: doc.id,
        ...doc.data()
    }) ) as Interview[];
}

export async function getInterviewById(id: string): Promise<Interview | null> {
    const interview = await db
    .collection('interviews')
    .doc(id)
    .get()

    return interview.data() as Interview | null
}

export async function createFeedback(params: CreateFeedbackParams) {
  const { interviewId, userId, transcript, feedbackId } = params;

  console.log('=== createFeedback called ===');
  console.log('Interview ID:', interviewId);
  console.log('User ID:', userId);
  console.log('Transcript length:', transcript?.length);
  console.log('Feedback ID:', feedbackId);

  try {
    if (!transcript || transcript.length === 0) {
      console.error('❌ No transcript provided to createFeedback');
      return { success: false, error: 'No transcript provided' };
    }

    console.log('Full transcript:', JSON.stringify(transcript, null, 2));

    const formattedTranscript = transcript
      .map(
        (sentence: { role: string; content: string }) =>
          `- ${sentence.role}: ${sentence.content}\n`
      )
      .join("");

    console.log('Formatted transcript for AI:', formattedTranscript);

    const { object } = await generateObject({
      model: google("gemini-2.0-flash-001", {
        structuredOutputs: false,
      }),
      schema: feedbackSchema,
      prompt: `
        You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.
        
        IMPORTANT: This interview may be partial (not all questions answered). Evaluate based ONLY on what was discussed.
        
        Transcript:
        ${formattedTranscript}

        Please score the candidate from 0 to 100 in the following areas based on the responses provided. If a category wasn't covered in the conversation, score it as 30 (below average due to incomplete interview). Do not add categories other than the ones provided:
        - **Communication Skills**: Clarity, articulation, structured responses.
        - **Technical Knowledge**: Understanding of key concepts for the role.
        - **Problem-Solving**: Ability to analyze problems and propose solutions.
        - **Cultural & Role Fit**: Alignment with company values and job role.
        - **Confidence & Clarity**: Confidence in responses, engagement, and clarity.
        
        If the interview was incomplete (very few responses), mention this in your assessment.
        `,
      system:
        "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories",
    });

    console.log('✅ AI feedback generated:', object);

    const feedback = {
      interviewId: interviewId,
      userId: userId,
      totalScore: object.totalScore,
      categoryScores: object.categoryScores,
      strengths: object.strengths,
      areasForImprovement: object.areasForImprovement,
      finalAssessment: object.finalAssessment,
      createdAt: new Date().toISOString(),
      transcript: transcript, // Save the ORIGINAL transcript array
    };

    console.log('Feedback object to save:', {
      ...feedback,
      transcript: `[${transcript.length} messages]` // Don't log full transcript again
    });

    let feedbackRef;

    if (feedbackId) {
      feedbackRef = db.collection("feedback").doc(feedbackId);
      console.log('Using existing feedback ID:', feedbackId);
    } else {
      feedbackRef = db.collection("feedback").doc();
      console.log('Creating new feedback document with ID:', feedbackRef.id);
    }

    console.log('Saving feedback to Firestore...');
    await feedbackRef.set(feedback);
    console.log('✅ Feedback saved to Firestore');

    // Mark interview as completed
    console.log('Marking interview as completed...');
    await db.collection("interviews").doc(interviewId).update({
      completed: true,
      completedAt: new Date().toISOString(),
    });
    console.log('✅ Interview marked as completed');

    console.log('=== createFeedback SUCCESS ===');
    return { success: true, feedbackId: feedbackRef.id };
  } catch (error) {
    console.error("❌ Error saving feedback:", error);
    return { success: false, error: String(error) };
  }
}


export async function getFeedbackByInterviewId(
  params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
  const { interviewId, userId } = params;

  // If userId is undefined, return null (prevents Firestore error)
  if (!userId) {
    console.log('getFeedbackByInterviewId: userId is undefined');
    return null;
  }

  const querySnapshot = await db
    .collection("feedback")
    .where("interviewId", "==", interviewId)
    .where("userId", "==", userId)
    .limit(1)
    .get();

  if (querySnapshot.empty) return null;

  const feedbackDoc = querySnapshot.docs[0];
  return { id: feedbackDoc.id, ...feedbackDoc.data() } as Feedback;
}

export async function deleteInterview(interviewId: string) {
  'use server';
  
  try {
    // Delete the interview document
    await db.collection('interviews').doc(interviewId).delete();
    
    // Also delete associated feedback if exists
    const feedbackSnapshot = await db
      .collection('feedback')
      .where('interviewId', '==', interviewId)
      .get();
    
    // Delete all feedback documents for this interview
    const deletePromises = feedbackSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(deletePromises);
    
    return {
      success: true,
      message: 'Interview deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting interview:', error);
    return {
      success: false,
      message: 'Failed to delete interview'
    };
  }
}
