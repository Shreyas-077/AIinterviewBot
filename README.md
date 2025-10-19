<p align="center">
  <img src="public/logo.svg" alt="InterviewAI Pro Logo" width="180"/>
</p>

<h1 align="center">InterviewAI Pro</h1>

<p align="center">
  AI-powered voice interview platform for job seekers. Practice with realistic interviews, get instant AI feedback, and ace your next job opportunity.
  <br />
  <b>Master Your Interview Skills with AI-Powered Voice Interviews</b>
</p>

<p align="center">
  <a href="https://interview-ai-pro.vercel.app"><strong>✨ Live Demo</strong></a> •
  <a href="#-key-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-environment-setup">Environment Setup</a>
</p>

<p align="center">
  <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js" alt="Next.js"></a>
  <a href="https://react.dev"><img src="https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react" alt="React"></a>
  <a href="https://firebase.google.com"><img src="https://img.shields.io/badge/Firebase-Auth%20%26%20Firestore-orange?style=flat-square&logo=firebase" alt="Firebase"></a>
  <a href="https://ai.google.dev"><img src="https://img.shields.io/badge/Gemini-2.5_Flash-green?style=flat-square&logo=google" alt="Google Gemini"></a>
  <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css" alt="Tailwind"></a>
  <a href="https://vapi.ai"><img src="https://img.shields.io/badge/Vapi-Web_SDK-purple?style=flat-square" alt="Vapi"></a>
</p>

<br>


---

## 🎯 Overview

**InterviewAI Pro** is a cutting-edge platform that revolutionizes interview preparation through AI-powered voice interactions. Perfect your interview skills with realistic simulations, receive instant expert feedback, and track your improvement—all in one sleek, modern application.

### Why InterviewAI Pro?

- **Realistic Practice**: Face challenging interview questions tailored to your industry and role
- **Instant Feedback**: Get detailed assessments of your responses to improve fast
- **Convenience**: Practice anytime, anywhere, as many times as you need
- **Progress Tracking**: Monitor your improvement over time with detailed analytics

---

## 🚀 Key Features

- **Real-time voice interviews** powered by Vapi Web SDK
- **AI interviewer** using Google Gemini 2.5 Flash
- **Automatic question generation** & personalized feedback
- **Secure user authentication** (Firebase)
- **Interview history & performance dashboard**
- **📧 Email session codes** - Receive unique session codes via email after interview creation

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org) 15
- **Library**: [React](https://react.dev) 19
- **Authentication**: [Firebase Authentication](https://firebase.google.com/docs/auth)
- **Database**: [Cloud Firestore](https://firebase.google.com/docs/firestore)
- **AI Model**: [Google Gemini 2.5 Flash](https://ai.google.dev)
- **Voice SDK**: [Vapi](https://vapi.ai)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Deployment**: [Vercel](https://vercel.com)

---

## 🏁 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v18 or higher)
- [pnpm](https://pnpm.io/installation)
- [Firebase](https://firebase.google.com/) account for backend services

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Prajwal-R-P/InterviewAI-Pro.git
    cd InterviewAI-Pro
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

3.  **Set up environment variables:**
    Create a `.env.local` file in the root directory and add the required Firebase, Vapi, and Gmail credentials. See the Environment Setup section for more details.
    
    📧 **Note**: For email functionality, see [EMAIL_SETUP_INSTRUCTIONS.md](./EMAIL_SETUP_INSTRUCTIONS.md) for detailed Gmail setup.

4.  **Run the development server:**
    ```bash
    pnpm dev
    ```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

---

## 🔑 Environment Setup

You'll need to create a `.env.local` file in the root of your project and add the following environment variables:

```env
# Firebase Client Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin SDK (for backend functions)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Vapi Configuration
NEXT_PUBLIC_VAPI_API_URL=https://api.vapi.ai
NEXT_PUBLIC_VAPI_PUBLIC_KEY=

# Gemini API Key
GEMINI_API_KEY=

# Gmail Configuration for Session Codes
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Obtaining Credentials

- **Firebase**:
    1.  Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
    2.  In your project settings, find your web app's configuration details for the `NEXT_PUBLIC_` variables.
    3.  Generate a new private key for the Admin SDK (`FIREBASE_` variables) under **Project settings > Service accounts**.

- **Vapi**:
    1.  Sign up on the [Vapi Dashboard](https://vapi.ai).
    2.  Find your Public Key in the "Developers" section.

- **Gemini**:
    1.  Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

- **📧 Gmail** (for session codes):
    1.  See detailed instructions in [EMAIL_SETUP_INSTRUCTIONS.md](./EMAIL_SETUP_INSTRUCTIONS.md)
    2.  You'll need to generate a Gmail App Password
    3.  Never use your actual Gmail password

---

## 🧑‍💻 Created by

This project was created and is maintained by **Prajwal R P**.

- **GitHub**: [@Prajwal-R-P](https://github.com/Alpha-Rp)
- **LinkedIn**: [Prajwal R P](https://www.linkedin.com/in/prajwal-r-p-33b085300/)
