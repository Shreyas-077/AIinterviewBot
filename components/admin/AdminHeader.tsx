'use client'

import { adminSignOut } from "@/lib/actions/admin.action";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface AdminHeaderProps {
  admin: {
    email: string;
    isAdmin: boolean;
  };
}

export default function AdminHeader({ admin }: AdminHeaderProps) {
  const handleSignOut = async () => {
    await adminSignOut();
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Image 
            src="/logo.svg" 
            width={40} 
            height={40} 
            alt="InterviewAI Logo"
            className="dark:invert"
          />
          <div>
            <h1 className="text-2xl font-bold text-primary-200">Admin Panel</h1>
            <p className="text-sm text-gray-500">Manage HR users and system settings</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium">{admin.email}</p>
            <p className="text-xs text-gray-500">Administrator</p>
          </div>
          <Button 
            onClick={handleSignOut}
            variant="outline"
            className="btn-secondary"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
}
