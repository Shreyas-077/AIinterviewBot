'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import FormField from "@/components/FormField"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { createHRUser } from "@/lib/actions/admin.action"
import { useState } from "react"

const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function CreateUserForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  console.log('🎨 CreateUserForm component rendered');

  // Test function - bypasses form completely
  const testDirectCall = async () => {
    console.log('🧪 TEST: Direct function call');
    const testData = {
      name: 'Test User',
      email: 'test' + Date.now() + '@example.com',
      password: 'password123'
    };
    
    console.log('🧪 TEST: Calling createHRUser with:', testData);
    const result = await createHRUser(testData);
    console.log('🧪 TEST: Result:', result);
    
    if (result.success) {
      alert('SUCCESS! User created: ' + result.userId);
    } else {
      alert('FAILED: ' + result.error);
    }
  };

  const form = useForm<z.infer<typeof createUserSchema>>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof createUserSchema>) {
    console.log('✅ Form submitted with values:', { ...values, password: '***', confirmPassword: '***' });
    setIsLoading(true);
    
    try {
      const result = await createHRUser({
        name: values.name,
        email: values.email,
        password: values.password,
      });

      console.log('Create HR user result:', result);

      if (result.success) {
        toast.success('HR user created successfully!');
        router.push('/admin/dashboard/users');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Create user error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {/* DEBUG TEST BUTTON */}
      <div className="mb-4 p-4 bg-yellow-100 border-2 border-yellow-500 rounded">
        <p className="font-bold mb-2">🧪 DEBUG: Test Direct Server Action</p>
        <button
          type="button"
          onClick={testDirectCall}
          className="bg-yellow-500 text-black px-4 py-2 rounded font-bold hover:bg-yellow-600"
        >
          Test Create User (Bypasses Form)
        </button>
        <p className="text-xs mt-2">This will create a user with random email to test if server action works</p>
      </div>

      <Form {...form}>
        <form 
          onSubmit={(e) => {
            console.log('🔥 RAW form submit triggered');
            console.log('📝 Current form values:', form.getValues());
            console.log('📋 Current form errors:', form.formState.errors);
            
            form.handleSubmit(
              (data) => {
                console.log('✅ Validation passed, data:', data);
                onSubmit(data);
              },
              (errors) => {
                console.log('❌ Form validation failed:', errors);
                toast.error('Please check all fields and try again');
              }
            )(e);
          }}
          className="space-y-6"
        >
        {/* Show validation errors at top */}
        {Object.keys(form.formState.errors).length > 0 && (
          <div className="bg-red-50 border-2 border-red-500 rounded p-4">
            <p className="font-bold text-red-700 mb-2">⚠️ Form Errors:</p>
            <ul className="list-disc pl-5 text-sm text-red-600">
              {Object.entries(form.formState.errors).map(([field, error]) => (
                <li key={field}>
                  <strong>{field}:</strong> {error?.message as string}
                </li>
              ))}
            </ul>
          </div>
        )}

        <FormField
          control={form.control}
          name="name"
          label="Full Name"
          placeholder="Enter HR manager's full name"
        />

        <FormField
          control={form.control}
          name="email"
          label="Email Address"
          placeholder="hr@company.com"
          type="email"
        />

        <FormField
          control={form.control}
          name="password"
          label="Password"
          placeholder="Enter password (min 8 characters)"
          type="password"
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          label="Confirm Password"
          placeholder="Re-enter password"
          type="password"
        />

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm">
              <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Account Credentials</p>
              <p className="text-blue-700 dark:text-blue-300">
                The HR user will be able to login with the email and password you provide here. 
                Make sure to share these credentials securely with them.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/dashboard/users')}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="btn-primary flex-1"
          >
            {isLoading ? 'Creating...' : 'Create HR User'}
          </Button>
        </div>
      </form>
    </Form>
    </>
  );
}
