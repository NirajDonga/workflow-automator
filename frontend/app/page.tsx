"use client";
import { useQuery, gql } from "@apollo/client";
import { useAuthenticationStatus } from "@nhost/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

const GET_DASHBOARD = gql`
  query GetDashboard {
    workflows {
      id
      name
      created_at
    }
    org_monthly_usage {
      org_id
      calls_used
      calls_allowed
    }
  }
`;

export default function Home() {
  const { isAuthenticated, isLoading: authLoading } = useAuthenticationStatus();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  const { data, loading, error } = useQuery(GET_DASHBOARD, { skip: !isAuthenticated });

  if (authLoading || loading) return <div className="p-8">Loading...</div>;
  if (!isAuthenticated) return null;
  if (error) return <div className="p-8 text-red-500">Error: {error.message}</div>;

  const usage = data?.org_monthly_usage?.[0];

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl">Workflows</h1>
        {usage && (
          <div className="text-sm bg-[#E8F5E9] p-2 rounded">
            Quota: {usage.calls_used} / {usage.calls_allowed} used
          </div>
        )}
      </div>
      
      <div className="grid gap-4">
        {data?.workflows?.map((w: any) => (
          <div key={w.id} className="border p-4 flex justify-between items-center">
            <div>
              <h2 className="font-bold">{w.name}</h2>
              <div className="text-xs text-gray-500">{new Date(w.created_at).toLocaleDateString()}</div>
            </div>
            <div className="flex gap-2">
              <Link href={`/workflows/${w.id}`} className="bg-gray-100 px-3 py-1 text-sm">Edit</Link>
              <Link href={`/runs/${w.id}`} className="bg-[#4CAF50] text-white px-3 py-1 text-sm">View Runs</Link>
            </div>
          </div>
        ))}
        {data?.workflows?.length === 0 && <div>No workflows found.</div>}
      </div>
    </main>
  );
}
