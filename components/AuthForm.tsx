
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import {Form,} from "@/components/ui/form"

import Link from "next/link"
import { toast } from "sonner"
import FormField from "./FormField"
import { useRouter } from "next/navigation"

import { signInWithSession, signIn, signUp } from "@/lib/actions/auth.action"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth"
import { auth as firebaseAuth } from "@/firebase/client"
import { useState } from "react"

// Schema for regular user login (email + password)
const regularAuthSchema = z.object({
  name: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

// Schema for candidate login (email + session code)
const candidateAuthSchema = z.object({
  email: z.string().email(),
  sessionCode: z.string().min(8, "Session code must be at least 8 characters"),
})


const AuthForm = ( {type}: {type: FormType }) => {
    const router = useRouter();
    const [loginMode, setLoginMode] = useState<'regular' | 'candidate'>('regular');

    // Form for regular users (email + password)
    const regularForm = useForm<z.infer<typeof regularAuthSchema>>({
      resolver: zodResolver(regularAuthSchema),
      defaultValues: {
        name: "",
        email: "",
        password: "",
      },
    })

    // Form for candidates (email + session code)
    const candidateForm = useForm<z.infer<typeof candidateAuthSchema>>({
      resolver: zodResolver(candidateAuthSchema),
      defaultValues: {
        email: "",
        sessionCode: "",
      },
    })
 
  // Submit handler for regular users
  async function onRegularSubmit(values: z.infer<typeof regularAuthSchema>) {
    try {
      const { name, email, password } = values;
      
      if(type === 'sign-in') {
        // First, try HR user login (Firestore credentials)
        const hrResult = await signIn({ email, password });

        if (hrResult?.success) {
          toast.success('Signed in successfully!');
          router.push('/');
          return;
        }

        // If HR login failed, try Firebase Authentication (regular users)
        try {
          const userCredential = await signInWithEmailAndPassword(
            firebaseAuth,
            email,
            password
          );

          const idToken = await userCredential.user.getIdToken();

          await signIn({ email, idToken });

          toast.success('Signed in successfully!');
          router.push('/');
        } catch (firebaseError: any) {
          console.error('Firebase auth error:', firebaseError);
          
          // Show appropriate error message
          if (firebaseError.code === 'auth/invalid-credential' || 
              firebaseError.code === 'auth/user-not-found' ||
              firebaseError.code === 'auth/wrong-password') {
            toast.error(hrResult?.message || 'Invalid email or password');
          } else {
            toast.error('Failed to sign in. Please try again.');
          }
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          firebaseAuth,
          email,
          password
        );

        const result = await signUp({
          uid: userCredential.user.uid,
          name: name!,
          email
        });

        if (!result?.success) {
          toast.error(result?.message);
          return;
        }

        toast.success(result?.message);
        router.push('/sign-in');
      }
      
    } catch (error: any) {
      console.log(error);
      toast.error(error.message || 'Authentication failed')
    }
  }

  // Submit handler for candidates
  async function onCandidateSubmit(values: z.infer<typeof candidateAuthSchema>) {
    try {
      const { email, sessionCode } = values;
      
      const result = await signInWithSession({
        email,
        sessionCode
      });

      if (!result?.success) {
        toast.error(result?.message || 'Invalid email or session code');
        return;
      }

      toast.success('Signed in successfully!');
      router.push(`/interview/${result.interviewId}`);
      
    } catch (error) {
      console.log(error);
      toast.error(`There was an error: ${error}`)
    }
  }

  return (
    <div className="card-border lg:min-w-[566px] ">
        <div className="flex flex-col gap-6 card py-14 px-10">
            <div className="flex flex-row gap-2 justify-center">
                <Image src= "/logo.svg" alt="logo" height={32} width={38} />

                <h2 className=" text-primary-100 ">InterviewAI Pro</h2>
            </div>
            
            {type === 'sign-in' && (
              <>
                <h3>{loginMode === 'regular' ? 'Sign In' : 'Candidate Login'}</h3>
                
                {/* Login Mode Toggle */}
                <div className="flex gap-2 justify-center">
                  <Button
                    type="button"
                    variant={loginMode === 'regular' ? 'default' : 'outline'}
                    onClick={() => setLoginMode('regular')}
                    className="flex-1"
                  >
                    User Login
                  </Button>
                  <Button
                    type="button"
                    variant={loginMode === 'candidate' ? 'default' : 'outline'}
                    onClick={() => setLoginMode('candidate')}
                    className="flex-1"
                  >
                    Candidate Login
                  </Button>
                </div>
              </>
            )}

            {type === 'sign-up' && <h3>Create an Account</h3>}

            {/* Regular User Form (Email + Password) */}
            {loginMode === 'regular' && (
              <>
                <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                  {type === 'sign-in' 
                    ? 'Practice job interviews with AI' 
                    : 'Sign up to create and manage interviews'}
                </p>
           
                <Form {...regularForm}>
                  <form onSubmit={regularForm.handleSubmit(onRegularSubmit)} 
                  className="w-full space-y-6 mt-4 form">
                   
                    {type === 'sign-up' && (
                      <FormField 
                        control= {regularForm.control}
                        name= "name"
                        label= "Name"
                        placeholder="Your name" 
                        type="text"
                      />
                    )}

                    <FormField 
                      control= {regularForm.control}
                      name= "email"
                      label= "Email"
                      placeholder="Your email address" 
                      type="email"
                    />

                    <FormField 
                      control= {regularForm.control}
                      name= "password"
                      label= "Password"
                      placeholder="Enter your password" 
                      type="password"
                    />

                    <Button className="btn" type="submit">
                      {type === 'sign-in' ? 'Sign In' : 'Create an Account'}
                    </Button>
                  </form>
                </Form>
              </>
            )}

            {/* Candidate Form (Email + Session Code) */}
            {loginMode === 'candidate' && type === 'sign-in' && (
              <>
                <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                  Enter your email and session code to access your interview
                </p>
           
                <Form {...candidateForm}>
                  <form onSubmit={candidateForm.handleSubmit(onCandidateSubmit)} 
                  className="w-full space-y-6 mt-4 form">
                   
                    <FormField 
                      control= {candidateForm.control}
                      name= "email"
                      label= "Email"
                      placeholder="Email that received the session code" 
                      type="email"
                    />

                    <FormField 
                      control= {candidateForm.control}
                      name= "sessionCode"
                      label= "Session Code"
                      placeholder="Enter your 8-character session code" 
                      type="text"
                    />

                    <Button className="btn" type="submit">
                      Access Interview
                    </Button>
                  </form>
                </Form>

                <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
                  Check your email for the session code sent after interview creation
                </p>
              </>
            )}
        </div> 
    </div>
  )
}

export default AuthForm