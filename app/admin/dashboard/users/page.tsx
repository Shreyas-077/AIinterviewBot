import { getAllHRUsers } from "@/lib/actions/admin.action";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import UserTable from "@/components/admin/UserTable";

export default async function UsersPage() {
  const users = await getAllHRUsers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">HR Users</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage HR user accounts and permissions
          </p>
        </div>
        <Link href="/admin/dashboard/users/create">
          <Button className="btn-primary flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New HR User
          </Button>
        </Link>
      </div>

      <UserTable users={users} />
    </div>
  );
}
