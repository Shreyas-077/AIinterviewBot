import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
    try {
        const { email, sessionCode, role, interviewId } = await request.json();

        // Validate input
        if (!email || !sessionCode || !role) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check environment variables
        if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
            console.error('Missing Gmail credentials in environment variables');
            return NextResponse.json(
                { 
                    success: false, 
                    error: 'Gmail credentials not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD in .env.local' 
                },
                { status: 500 }
            );
        }

        console.log('Attempting to send email to:', email);
        console.log('Using Gmail account:', process.env.GMAIL_USER);

        // Create transporter using Gmail
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD,
            },
        });

        // Email content
        const mailOptions = {
            from: `"InterviewAI Pro" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: `Your Interview Session Code - ${role}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                        }
                        .header {
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            padding: 30px;
                            border-radius: 10px 10px 0 0;
                            text-align: center;
                        }
                        .content {
                            background: #f9f9f9;
                            padding: 30px;
                            border-radius: 0 0 10px 10px;
                        }
                        .session-code {
                            background: white;
                            border: 2px dashed #667eea;
                            padding: 20px;
                            margin: 20px 0;
                            text-align: center;
                            border-radius: 8px;
                        }
                        .session-code h2 {
                            color: #667eea;
                            font-size: 32px;
                            margin: 10px 0;
                            letter-spacing: 3px;
                        }
                        .info-box {
                            background: white;
                            padding: 15px;
                            margin: 15px 0;
                            border-left: 4px solid #667eea;
                            border-radius: 4px;
                        }
                        .footer {
                            text-align: center;
                            margin-top: 30px;
                            color: #666;
                            font-size: 12px;
                        }
                        .button {
                            display: inline-block;
                            background: #667eea;
                            color: white;
                            padding: 12px 30px;
                            text-decoration: none;
                            border-radius: 5px;
                            margin: 20px 0;
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>🎯 Interview Session Ready!</h1>
                    </div>
                    <div class="content">
                        <p>Hi there! 👋</p>
                        <p>Your personalized interview prep session has been successfully created. Here's your unique session code:</p>
                        
                        <div class="session-code">
                            <p style="margin: 0; color: #666;">Session Code</p>
                            <h2>${sessionCode}</h2>
                            <p style="margin: 0; color: #666; font-size: 12px;">Keep this code safe - you'll need it to access your interview</p>
                        </div>

                        <div class="info-box">
                            <strong>📋 Interview Details:</strong><br>
                            <strong>Role:</strong> ${role}<br>
                            ${interviewId ? `<strong>Interview ID:</strong> ${interviewId}` : ''}
                        </div>

                        <p><strong>What's Next?</strong></p>
                        <ul>
                            <li>Use this session code to access your interview when prompted</li>
                            <li>The code is valid for your entire interview session</li>
                            <li>Keep this email for your records</li>
                        </ul>

                        <div style="text-align: center;">
                            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" class="button">
                                Start Your Interview
                            </a>
                        </div>

                        <p>Good luck with your interview preparation! 🚀</p>
                        
                        <p style="margin-top: 30px; color: #666; font-size: 14px;">
                            <em>This is an automated email from InterviewAI Pro. Please do not reply to this email.</em>
                        </p>
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} InterviewAI Pro. All rights reserved.</p>
                    </div>
                </body>
                </html>
            `,
            text: `
                Your Interview Session Code
                
                Hi there!
                
                Your personalized interview prep session has been successfully created.
                
                Session Code: ${sessionCode}
                Role: ${role}
                ${interviewId ? `Interview ID: ${interviewId}` : ''}
                
                Keep this code safe - you'll need it to access your interview.
                
                Good luck with your interview preparation!
                
                ---
                InterviewAI Pro
                ${new Date().getFullYear()}
            `,
        };

        // Send email
        console.log('Sending email...');
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);

        return NextResponse.json(
            { success: true, message: 'Session code sent successfully' },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Error sending email:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            command: error.command,
        });
        return NextResponse.json(
            { 
                success: false, 
                error: 'Failed to send email',
                details: error.message 
            },
            { status: 500 }
        );
    }
}
