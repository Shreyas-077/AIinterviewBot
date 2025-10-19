import { generateObject, generateText } from "ai";
import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";
import { google } from "@ai-sdk/google";
import { z } from "zod";

export async function POST(request: Request) {
    const { transcript, userId, email } = await request.json();

    try {
        // Use email from request if provided, otherwise extract from transcript
        let userEmail = email;
        let extractedData: any;
        
        if (userEmail) {
            // Email provided via input - extract other data from transcript
            const { object } = await generateObject({
                model: google('models/gemini-2.5-flash'),
                schema: z.object({
                    role: z.string().describe('The job role mentioned (e.g., Frontend Developer, Backend Engineer)'),
                    level: z.string().describe('Experience level mentioned (e.g., Junior, Mid, Senior)'),
                    techstack: z.string().describe('Technologies mentioned as comma-separated (e.g., React, Node.js, TypeScript)'),
                    type: z.string().describe('Interview type mentioned (e.g., Technical, Behavioral, Mixed)'),
                    amount: z.string().describe('Number of questions mentioned (e.g., 5, 10, 15)'),
                }),
                prompt: `Extract interview preparation parameters from this conversation transcript:

${transcript}

Extract:
- role: The job position they're preparing for
- level: Their experience level (Junior/Mid/Senior)
- techstack: Technologies they want to focus on (comma-separated)
- type: Type of interview questions (Technical/Behavioral/Mixed)
- amount: Number of questions they want (as a number string like "5", "10", or "15")

If any information is unclear or missing, make a reasonable assumption based on the context.`,
            });
            extractedData = { ...object, email: userEmail };
        } else {
            // Fallback: Extract everything including email from transcript
            const { object } = await generateObject({
                model: google('models/gemini-2.5-flash'),
                schema: z.object({
                    role: z.string().describe('The job role mentioned (e.g., Frontend Developer, Backend Engineer)'),
                    level: z.string().describe('Experience level mentioned (e.g., Junior, Mid, Senior)'),
                    techstack: z.string().describe('Technologies mentioned as comma-separated (e.g., React, Node.js, TypeScript)'),
                    type: z.string().describe('Interview type mentioned (e.g., Technical, Behavioral, Mixed)'),
                    amount: z.string().describe('Number of questions mentioned (e.g., 5, 10, 15)'),
                    email: z.string().describe('Email address provided by the user (e.g., user@example.com)'),
                }),
                prompt: `Extract interview preparation parameters from this conversation transcript:

${transcript}

Extract:
- role: The job position they're preparing for
- level: Their experience level (Junior/Mid/Senior)
- techstack: Technologies they want to focus on (comma-separated)
- type: Type of interview questions (Technical/Behavioral/Mixed)
- amount: Number of questions they want (as a number string like "5", "10", or "15")
- email: The email address they provided for receiving the session code

If any information is unclear or missing, make a reasonable assumption based on the context.`,
            });
            extractedData = object;
        }

        console.log('Extracted data:', extractedData);

        // Generate interview questions using simple text generation (faster)
        const { text: questionsText } = await generateText({
            model: google('models/gemini-2.5-flash'), // Using Gemini 2.5 Flash
            prompt: `Generate ${extractedData.amount} interview questions for a job interview.

Role: ${extractedData.role}
Experience Level: ${extractedData.level}
Tech Stack: ${extractedData.techstack}
Interview Type: ${extractedData.type}

Return ONLY a JSON array of question strings. No other text.
Do not use special characters like "/" or "*".

Example format:
["Question 1", "Question 2", "Question 3"]

Generate the questions now:`,
        });

        console.log('Generated questions text:', questionsText);

        // Parse the questions
        const questions = JSON.parse(questionsText.trim());

        // Generate a unique session code (8 characters alphanumeric)
        const sessionCode = Math.random().toString(36).substring(2, 10).toUpperCase();

        // Save the interview
        const interview = {
            role: extractedData.role,
            type: extractedData.type,
            level: extractedData.level,
            techstack: extractedData.techstack.split(",").map((t: string) => t.trim()),
            questions: questions,
            userId: userId,
            finalized: true,
            coverImage: getRandomInterviewCover(),
            email: extractedData.email,
            sessionCode: sessionCode,
            createdAt: new Date().toISOString()
        };

        const interviewRef = await db.collection('interviews').add(interview);
        const interviewId = interviewRef.id;

        // Send session code via email immediately
        try {
            const emailResponse = await fetch(`${request.headers.get('origin')}/api/send-session-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: extractedData.email,
                    sessionCode: sessionCode,
                    role: extractedData.role,
                    interviewId: interviewId,
                }),
            });

            if (!emailResponse.ok) {
                console.error('Failed to send email:', await emailResponse.text());
            } else {
                console.log('Session code email sent successfully to:', extractedData.email);
            }
        } catch (emailError) {
            console.error('Error sending email:', emailError);
            // Don't fail the whole request if email fails
        }

        return Response.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('Extract API error:', error);
        return Response.json({ success: false, error: String(error) }, { status: 500 });
    }
}
