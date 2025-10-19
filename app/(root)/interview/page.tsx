
import Agent from "@/components/Agent";
import { getCurrentUser } from "@/lib/actions/auth.action";

const Page = async () => {
  const user = await getCurrentUser();

  return (
    <>
      <h3>Interview generation</h3>
      <h5>Say hello to get started</h5>

      <Agent
        userName={user?.name!}
        userId={user?.id}
        type="generate"
      />
    </>
  );
};

export default Page;