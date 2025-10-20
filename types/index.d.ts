interface Feedback {
  id: string;
  interviewId: string;
  candidateEmail: string; // NEW: Track which candidate this feedback is for
  totalScore: number;
  categoryScores: Array<{
    name: string;
    score: number;
    comment: string;
  }>;
  strengths: string[];
  areasForImprovement: string[];
  finalAssessment: string;
  createdAt: string;
  transcript?: Array<{
    role: string;
    content: string;
  }>;
}

interface CandidateSession {
  email: string;
  sessionCode: string;
  completed: boolean;
  completedAt?: string;
}

interface Interview {
  id: string;
  role: string;
  level: string;
  questions: string[];
  techstack: string[];
  createdAt: string;
  userId: string;
  type: string;
  finalized: boolean;
  candidates?: CandidateSession[]; // NEW: Array of candidates with their session codes
  // Legacy fields (keep for backward compatibility)
  email?: string;
  sessionCode?: string;
  completed?: boolean;
  completedAt?: string;
}

interface CreateFeedbackParams {
  interviewId: string;
  userId: string;
  transcript: { role: string; content: string }[];
  feedbackId?: string;
  candidateEmail?: string; // NEW: Track which candidate this feedback is for
}

interface User {
  name: string;
  email: string;
  id: string;
}

interface HRUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface InterviewCardProps {
  id?: string;
  userId?: string;
  role: string;
  type: string;
  techstack: string[];
  createdAt?: string;
  showDelete?: boolean; // Option to show delete button for HR
  completed?: boolean; // Track if interview is completed
}

interface AgentProps {
  userName: string;
  userId?: string;
  interviewId?: string;
  feedbackId?: string;
  type: "generate" | "interview";
  questions?: string[];
  hrUserId?: string; // The HR user ID who created the interview (for candidates)
  candidateEmail?: string; // The candidate's email for tracking feedback
}

interface RouteParams {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string>>;
}

interface GetFeedbackByInterviewIdParams {
  interviewId: string;
  userId: string;
}

interface GetLatestInterviewsParams {
  userId: string;
  limit?: number;
}

interface SignInParams {
  email: string;
  idToken?: string;
  password?: string;
}

interface SignUpParams {
  uid: string;
  name: string;
  email: string;
}

type FormType = "sign-in" | "sign-up";

interface InterviewFormProps {
  interviewId: string;
  role: string;
  level: string;
  type: string;
  techstack: string[];
  amount: number;
}

interface TechIconProps {
  techStack: string[];
}
