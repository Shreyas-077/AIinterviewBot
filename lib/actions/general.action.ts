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

    // Simplified query to avoid composite index requirement
    const interviews = await db
    .collection('interviews')
    .where('finalized' , '==', true)
    .orderBy('createdAt' , 'desc')
    .limit(limit)
    .get();

    // Filter out user's own interviews in code instead of query
    const filteredInterviews = interviews.docs
        .map((doc) => ({ 
            id: doc.id,
            ...doc.data()
        }) as Interview)
        .filter(interview => interview.userId !== userId);

    return filteredInterviews;
}

export async function getInterviewById(id: string): Promise<Interview | null> {
    const interview = await db
    .collection('interviews')
    .doc(id)
    .get()

    return interview.data() as Interview | null
}

export async function createFeedback(params: CreateFeedbackParams) {
  const { interviewId, userId, transcript, feedbackId, candidateEmail } = params;

  console.log('=== createFeedback called ===');
  console.log('Interview ID:', interviewId);
  console.log('User ID:', userId);
  console.log('Candidate Email:', candidateEmail);
  console.log('Transcript length:', transcript?.length);
  console.log('Feedback ID:', feedbackId);

  try {
    if (!transcript || transcript.length === 0) {
      console.error('❌ No transcript provided to createFeedback');
      return { success: false, error: 'No transcript provided' };
    }

    console.log('Full transcript:', JSON.stringify(transcript, null, 2));

    // Count actual user responses (not just messages)
    const userResponses = transcript.filter((msg: { role: string }) => msg.role === 'user').length;
    const assistantMessages = transcript.filter((msg: { role: string }) => msg.role === 'assistant').length;
    
    console.log('User responses:', userResponses);
    console.log('Assistant messages:', assistantMessages);

    // Require at least 3 meaningful exchanges (user answered at least 3 questions)
    if (userResponses < 3) {
      console.log('❌ Interview too short - not enough user responses');
      return { 
        success: false, 
        error: 'Interview ended too early. Please answer at least 3 questions before ending the call.' 
      };
    }

    const formattedTranscript = transcript
      .map(
        (sentence: { role: string; content: string }) =>
          `${sentence.role.toUpperCase()}: ${sentence.content}`
      )
      .join("\n\n");

    console.log('Formatted transcript for AI (first 500 chars):', formattedTranscript.substring(0, 500));

    let object;
    try {
      const result = await generateObject({
        model: google("gemini-2.0-flash-exp", {
          structuredOutputs: false,
        }),
        schema: feedbackSchema,
        prompt: `You are an expert AI interviewer analyzing a completed mock interview session. Your task is to provide detailed, constructive feedback.

INTERVIEW TRANSCRIPT:
${formattedTranscript}

EVALUATION CRITERIA:
Please provide a comprehensive evaluation with scores from 0-100 for each category below. Be fair but thorough - give credit where deserved, but also identify genuine areas for improvement.

1. **Communication Skills** (0-100)
   - Clarity and articulation
   - Structure of responses
   - Professional language use
   - Ability to explain complex concepts

2. **Technical Knowledge** (0-100)
   - Understanding of relevant technologies
   - Depth of technical expertise
   - Accuracy of technical explanations
   - Problem-solving approach

3. **Problem-Solving** (0-100)
   - Analytical thinking
   - Approach to challenges
   - Creativity in solutions
   - Logical reasoning

4. **Cultural & Role Fit** (0-100)
   - Alignment with role requirements
   - Enthusiasm and motivation
   - Team collaboration mindset
   - Growth mindset

5. **Confidence & Clarity** (0-100)
   - Confidence in responses
   - Clarity of thought
   - Engagement level
   - Handling of difficult questions

INSTRUCTIONS:
- Review the entire conversation carefully
- Provide specific examples from the interview in your feedback
- Calculate realistic scores based on actual performance
- Identify 3-5 genuine strengths with examples
- Suggest 3-5 specific areas for improvement
- Provide an overall assessment summary

Be constructive, specific, and helpful. Your goal is to help the candidate understand their performance and improve.`,
        system: "You are an expert interview evaluator providing detailed, constructive feedback on mock interviews."
      });
      object = result.object;
      console.log('✅ AI feedback generated successfully');
    } catch (aiError: any) {
      console.error('❌ AI generation failed:', aiError);
      
      // Better fallback that indicates system error, not poor performance
      object = {
        totalScore: 0,
        categoryScores: [
          {
            name: "Communication Skills",
            score: 0,
            comment: "Unable to evaluate - system error occurred."
          },
          {
            name: "Technical Knowledge", 
            score: 0,
            comment: "Unable to evaluate - system error occurred."
          },
          {
            name: "Problem Solving",
            score: 0,
            comment: "Unable to evaluate - system error occurred."
          },
          {
            name: "Cultural Fit",
            score: 0,
            comment: "Unable to evaluate - system error occurred."
          },
          {
            name: "Confidence and Clarity",
            score: 0,
            comment: "Unable to evaluate - system error occurred."
          }
        ],
        strengths: ["Interview was completed"],
        areasForImprovement: ["System error prevented feedback generation", "Please contact support or retry the interview"],
        finalAssessment: "A technical error occurred while generating your feedback. Your interview responses were recorded but could not be analyzed. Please contact support or try taking the interview again."
      };
    }

    console.log('Feedback scores:', {
      total: object.totalScore,
      categories: object.categoryScores.map((c: any) => `${c.name}: ${c.score}`)
    });

    const feedback = {
      interviewId: interviewId,
      userId: userId,
      candidateEmail: candidateEmail || 'unknown',
      totalScore: object.totalScore,
      categoryScores: object.categoryScores,
      strengths: object.strengths,
      areasForImprovement: object.areasForImprovement,
      finalAssessment: object.finalAssessment,
      createdAt: new Date().toISOString(),
      transcript: transcript,
    };

    console.log('Saving feedback to Firestore...');

    let feedbackRef;

    if (feedbackId) {
      feedbackRef = db.collection("feedback").doc(feedbackId);
      console.log('Using existing feedback ID:', feedbackId);
    } else {
      feedbackRef = db.collection("feedback").doc();
      console.log('Creating new feedback document with ID:', feedbackRef.id);
    }

    await feedbackRef.set(feedback);
    console.log('✅ Feedback saved to Firestore');

    // Mark THIS candidate as completed in the interview
    if (candidateEmail) {
      console.log('Marking candidate as completed:', candidateEmail);
      const interviewRef = db.collection("interviews").doc(interviewId);
      const interviewDoc = await interviewRef.get();
      const interviewData = interviewDoc.data();
      
      if (interviewData && interviewData.candidates && Array.isArray(interviewData.candidates)) {
        const updatedCandidates = interviewData.candidates.map((c: CandidateSession) => {
          if (c.email === candidateEmail) {
            return {
              ...c,
              completed: true,
              completedAt: new Date().toISOString()
            };
          }
          return c;
        });
        
        await interviewRef.update({ candidates: updatedCandidates });
        console.log('✅ Candidate marked as completed');
      } else {
        await interviewRef.update({
          completed: true,
          completedAt: new Date().toISOString(),
        });
        console.log('✅ Interview marked as completed (legacy)');
      }
    } else {
      await db.collection("interviews").doc(interviewId).update({
        completed: true,
        completedAt: new Date().toISOString(),
      });
      console.log('✅ Interview marked as completed');
    }

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
