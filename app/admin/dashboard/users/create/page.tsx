import CreateUserForm from "@/components/admin/CreateUserForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CreateUserPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/dashboard/users">
          <Button variant="outline" className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold mb-2">Create New HR User</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Add a new HR manager to the system
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700">
        <CreateUserForm />
      </div>
    </div>
  );
}
