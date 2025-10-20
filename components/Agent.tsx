'use client'

import { cn } from "@/lib/utils";
import Image from "next/image"
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {vapi} from '@/lib/vapi.sdk'
import { generator, interviewer } from "@/constants";
import { createFeedback } from "@/lib/actions/general.action";




enum CallStatus{
    INACTIVE = 'INACTIVE',
    CONNECTING = 'CONNECTING',
    ACTIVE = 'ACTIVE',
    FINISHED = 'FINISHED'
}

interface SavedMessage{
    role: 'user' | 'system' | 'assistant'
    content: string;
}

const Agent = ({userName, userId, type, interviewId, questions, hrUserId, candidateEmail}: AgentProps) => {
    const router = useRouter();

    const [isSpeaking, setIsSpeaking] = useState(false);
    const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
    const [messages, setMessages] = useState<SavedMessage[]>([]);
    const [shouldAutoEnd, setShouldAutoEnd] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [showEmailInput, setShowEmailInput] = useState(false);
    const [showCandidateEndMessage, setShowCandidateEndMessage] = useState(false);

    // Check if this is a candidate (userId starts with 'candidate-')
    const isCandidate = userId?.startsWith('candidate-');
    
    // Use HR user ID for feedback if this is a candidate, otherwise use current userId
    const feedbackUserId = isCandidate ? hrUserId : userId;

    

    useEffect(() => {
  // 🧠 Async function to create the workflow
    

  // 🧩 Event handlers
  const onCallStart = () => setCallStatus(CallStatus.ACTIVE);
  const onCallEnd = () => setCallStatus(CallStatus.FINISHED);

  const onMessage = (message: Message) => {
    if (message.type === "transcript" && message.transcriptType === "final") {
      const newMessage = { role: message.role, content: message.transcript };
      setMessages((prev) => [...prev, newMessage]);
      
      // Check if AI is asking for email - show input field ONLY ONCE
      if (message.role === "assistant" && type === "generate" && !showEmailInput && !userEmail &&
          (message.transcript.toLowerCase().includes("email") || 
           message.transcript.toLowerCase().includes("e-mail"))) {
        setShowEmailInput(true);
      }
      
      // Check if AI said goodbye - auto end call after 3 seconds
      // Only auto-end if we have enough messages (prevent premature endings)
      if (message.role === "assistant" && messages.length >= 5 &&
          (message.transcript.toLowerCase().includes("goodbye") || 
           message.transcript.toLowerCase().includes("good luck") ||
           message.transcript.toLowerCase().includes("thank you for your time"))) {
        console.log("AI said goodbye, ending call in 3 seconds...");
        setShouldAutoEnd(true);
        setTimeout(() => {
          console.log("Auto-ending call now");
          vapi.stop();
        }, 3000);
      }
    }
  };

  const onSpeechStart = () => setIsSpeaking(true);
  const onSpeechEnd = () => setIsSpeaking(false);
  const onError = (error: Error) => {
    console.error("❌ Vapi Error:", error);
    // Don't auto-end on errors - let user manually end if needed
    // This prevents premature meeting endings
  };

  // 📞 Register Vapi event listeners
  vapi.on("call-start", onCallStart);
  vapi.on("call-end", onCallEnd);
  vapi.on("message", onMessage);
  vapi.on("speech-start", onSpeechStart);
  vapi.on("speech-end", onSpeechEnd);
  vapi.on("error", onError);

  // 🧹 Cleanup
  return () => {
    vapi.off("call-start", onCallStart);
    vapi.off("call-end", onCallEnd);
    vapi.off("message", onMessage);
    vapi.off("speech-start", onSpeechStart);
    vapi.off("speech-end", onSpeechEnd);
    vapi.off("error", onError);
  };
}, []);

    const handleGenerateFeedback = async (messages: SavedMessage[]) => {
        console.log ('Generate feedback here')
        console.log('Total messages:', messages.length);
        console.log('Messages array:', JSON.stringify(messages, null, 2));

        // Check if interview is too short (less than 3 messages means likely incomplete)
        if (messages.length < 3) {
            console.error('❌ Interview too short - not enough conversation');
            alert('The interview ended too early. Please ensure you answer at least a few questions before ending the call.');
            if (isCandidate) {
                setShowCandidateEndMessage(false);
            } else {
                router.push('/');
            }
            return;
        }

        // If candidate, create feedback and mark as complete regardless of how many questions answered
        if (isCandidate) {
            console.log('Candidate finished interview');
            
            const candidateResponses = messages.filter(m => m.role === 'user').length;
            console.log('Number of candidate responses:', candidateResponses);
            
            if (messages.length === 0) {
                console.error('No messages to save! Interview was too short.');
                alert('Interview was too short. Please answer at least one question.');
                return;
            }
            
            // Create feedback to mark interview as complete (even if partial)
            // IMPORTANT: Use HR user ID (hrUserId) not candidate ID
            console.log('Creating feedback for completed interview with transcript');
            console.log('Sending to createFeedback:', {
                interviewId: interviewId,
                userId: feedbackUserId, // HR user ID, not candidate ID
                candidateId: userId, // For reference
                transcriptLength: messages.length
            });
            
            const result = await createFeedback({
                interviewId: interviewId!,
                userId: feedbackUserId!, // Use HR user ID so HR can retrieve it
                transcript: messages,
                candidateEmail: candidateEmail, // Track which candidate this feedback is for
            });
            
            console.log('Feedback creation result:', result);
            
            if (result.success) {
                console.log('✅ Feedback created successfully with ID:', result.feedbackId);
                setShowCandidateEndMessage(true);
            } else {
                console.error('❌ Failed to create feedback');
                alert('Failed to save interview feedback. The interview may have been too short or incomplete.');
            }
            return;
        }

        // HR is taking their own interview
        try {
            const { success, feedbackId: id } = await createFeedback({
                interviewId: interviewId!,
                userId: feedbackUserId!,
                transcript: messages,
            });

            if(success && id){
                router.push(`/interview/${interviewId}/feedback`)
            } else {
                console.log('Error saving feedback')
                alert('Failed to save interview feedback. Please ensure you completed at least a few questions.');
                router.push('/')
            }
        } catch (error) {
            console.error('❌ Error in handleGenerateFeedback:', error);
            alert('An error occurred while saving feedback. Please try again.');
            router.push('/');
        }
    }
  
    useEffect(()=>{

        if(callStatus=== CallStatus.FINISHED){
            if(type === 'generate'){
                // Process the conversation to extract interview parameters
                handleGenerateInterview(messages);
            } else{
                handleGenerateFeedback(messages)
            }
        }
        
    }, [messages, callStatus, type, userId] )

    const handleGenerateInterview = async (messages: SavedMessage[]) => {
        console.log('Processing interview generation from transcript...');
        
        // Combine all messages into a single transcript
        const fullTranscript = messages.map(m => `${m.role}: ${m.content}`).join('\n');
        
        console.log('Full transcript:', fullTranscript);
        
        // Validate email
        if (type === 'generate' && !userEmail) {
            console.error('Email is required but not provided');
            alert('Please enter your email address before finishing the interview.');
            return;
        }
        
        // Use AI to extract the parameters from the conversation
        try {
            // Use relative URL for same-origin requests
            const apiUrl = '/api/vapi/extract';
            console.log('Calling API:', apiUrl);
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    transcript: fullTranscript,
                    userId: userId,
                    email: userEmail, // Pass the email from input
                }),
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API error response:', errorText);
                throw new Error(`API returned ${response.status}: ${errorText}`);
            }
            
            const data = await response.json();
            console.log('Extraction result:', data);
            
            if (data.success) {
                console.log('Interview generated successfully!');
                // Small delay then redirect
                setTimeout(() => {
                    router.push('/');
                }, 1000);
            } else {
                console.error('Failed to generate interview:', data);
                router.push('/');
            }
        } catch (error) {
            console.error('Error generating interview:', error);
            // Still redirect even on error
            setTimeout(() => {
                router.push('/');
            }, 1000);
        }
    }

  const handleCall = async () => {
    setCallStatus(CallStatus.CONNECTING);

    if (type === "generate") {
      try {
        console.log("Starting call to collect interview preferences");
        
        // Simple assistant that collects info and ends naturally
        await vapi.start({
          name: "Interview Prep Assistant",
          transcriber: {
            provider: "deepgram",
            model: "nova-2",
            language: "en",
          },
          voice: {
            provider: "11labs",
            voiceId: "sarah",
          },
          model: {
            provider: "openai",
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `You are a friendly interview prep assistant helping ${userName} create a personalized interview session.

Your job:
1. Ask these 6 questions ONE BY ONE (wait for clear answer before moving to next):
   
   a) "What role are you preparing for?" 
      (Get answer like: Frontend Developer, Backend Engineer, Full Stack, etc.)
   
   b) "What's the experience level for the job role?"
      (Get answer like: Junior, Mid-level, or Senior)
   
   c) "What technologies do you want to focus on?"
      (Get comma-separated list like: React, Node.js, TypeScript)
   
   d) "What type of interview questions do you prefer?"
      (Get answer like: Technical, Behavioral, or Mixed)
   
   e) "How many questions would you like?"
      (Get a number like: 5, 10, or 15)
   
   f) "Please provide the email addresses of candidates who will take this interview. You can provide multiple emails separated by commas."
      (Get emails like: candidate1@example.com, candidate2@example.com, candidate3@example.com)

2. After collecting ALL 6 answers clearly, say:
   "Perfect! I have all the information I need. Your personalized interview prep session will be ready in just a moment. We'll send unique session codes to each candidate's email shortly. Thank you ${userName}, and good luck! Goodbye!"

3. IMPORTANT: After saying goodbye, IMMEDIATELY say "endCall" to end the conversation.

Be conversational, patient, and make sure you get clear answers for each question. For the email question, accept both single and multiple emails. Once you have all 6 answers, deliver your final message and say "endCall".`,
              },
            ],
          },
          firstMessage: `Hey ${userName}! I'm excited to help you prepare for your interview. I'll ask you just 6 quick questions to create the perfect prep session for you. Ready? Let's start - what role are you preparing for?`,
          endCallMessage: "Thank you for using InterviewAI Pro! Your interview prep session is being generated. Goodbye!",
        } as any);
      } catch (error: any) {
        console.error("Vapi start error:", error);
        console.error("Error details:", {
          message: error?.message,
          status: error?.status,
          statusText: error?.statusText,
        });
        
        if (error?.response) {
          error.response.json().then((body: any) => {
            console.error("Error response body:", body);
          }).catch(() => {
            console.error("Could not parse error response");
          });
        }
        
        setCallStatus(CallStatus.INACTIVE);
      }
    } else {
      let formattedQuestions = "";
      if (questions) {
        formattedQuestions = questions
          .map((question) => `- ${question}`)
          .join("\n");
      }

      await vapi.start(interviewer, {
        variableValues: {
          questions: formattedQuestions,
        }
      });
    }
  };

    const handleDisconnect = async () => {
        setCallStatus(CallStatus.FINISHED);

        vapi.stop()
    }

    const latestMessage = messages[messages.length -1]?.content;
    const isCallInactiveOrFinished =  callStatus === CallStatus.INACTIVE || callStatus === CallStatus.FINISHED;

    

  return (
    <>
    <div className='call-view'>
        <div className='card-interviewer'>
            <div className='avatar'>
                <Image src="/ai-avatar.png" alt="vapi" width={65} height={54}
                className="object-cover" />
                {isSpeaking && <span className="animate-speak"/>}
            </div>
            <h3>AI Interviewer</h3>
        </div>
        <div className="card-border">
            <div className="card-content">
                <Image src="/user-avatar.png" alt="user avatar" width={540} height={540} className="rounded-full object-cover size-[120px] " />
                <h3>{userName}</h3>
            </div>
        </div>
    </div>

        {messages.length > 0 && (
            <div className="transcript-border">
                <div className="transcript">
                    <p key={latestMessage} className={cn('transition-opacity duration-500 opacity-0', 
                        'animate-fadeIn opacity-100'
                    )}>
                        {latestMessage}
                    </p>
                </div>
            </div>

        )}

        {/* Email Input Field - Shows when AI asks for email */}
        {showEmailInput && callStatus === CallStatus.ACTIVE && type === 'generate' && (
            <div className="w-full max-w-md mx-auto my-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 border-purple-500">
                <label htmlFor="email-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    📧 Enter your email address
                </label>
                <div className="flex gap-2">
                    <input
                        id="email-input"
                        type="email"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && userEmail) {
                                vapi.send({
                                    type: 'add-message',
                                    message: {
                                        role: 'user',
                                        content: userEmail
                                    }
                                });
                                setShowEmailInput(false);
                            }
                        }}
                        placeholder="your.email@example.com"
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        required
                        autoFocus
                    />
                    <button
                        onClick={() => {
                            if (userEmail && userEmail.includes('@')) {
                                vapi.send({
                                    type: 'add-message',
                                    message: {
                                        role: 'user',
                                        content: userEmail
                                    }
                                });
                                setShowEmailInput(false);
                            } else {
                                alert('Please enter a valid email address');
                            }
                        }}
                        className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!userEmail || !userEmail.includes('@')}
                    >
                        Submit
                    </button>
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    We'll send your session code to this email. Press Enter or click Submit.
                </p>
            </div>
        )}

        {/* Candidate End Message */}
        {showCandidateEndMessage && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md mx-4 shadow-xl">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Interview Complete!</h3>
                        <p className="text-center text-gray-600 dark:text-gray-300">
                            Thank you for completing the interview. Your responses have been recorded.
                        </p>
                        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                            The HR team will review your interview and get back to you soon.
                        </p>
                        <div className="flex flex-col gap-2 w-full mt-4">
                            <button
                                onClick={() => router.push('/sign-in')}
                                className="w-full px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
                            >
                                Logout
                            </button>
                            <button
                                onClick={() => setShowCandidateEndMessage(false)}
                                className="w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        <div className="w-full flex justify-center">
            {callStatus !== 'ACTIVE'?(
                <button className="relative btn-call " onClick={handleCall}>
                    <span className={cn(' absolute animate-ping rounded-full opacity-75', callStatus !== 'CONNECTING' && 'hidden'  )}
                        />

                        <span>
                            { isCallInactiveOrFinished?'Call': ". . ." } 
                        </span>
                    
                </button>
            ):(
                <button className="btn-disconnect" onClick={handleDisconnect}>
                    End
                    </button>
            ) }
        </div>
    </>
    
  )
}

export default Agent