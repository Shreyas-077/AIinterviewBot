import { db } from "@/firebase/admin";

export async function getFeedbackCount(interviewId: string): Promise<number> {
  try {
    const feedbackSnapshot = await db
      .collection('feedback')
      .where('interviewId', '==', interviewId)
      .get();
    
    return feedbackSnapshot.size;
  } catch (error) {
    console.error('Error getting feedback count:', error);
    return 0;
  }
}

export async function hasMultipleCandidates(interviewId: string): Promise<boolean> {
  try {
    const interviewDoc = await db.collection('interviews').doc(interviewId).get();
    const interview = interviewDoc.data();
    
    if (interview && interview.candidates && Array.isArray(interview.candidates)) {
      return interview.candidates.length > 1;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking candidates:', error);
    return false;
  }
}
