"use client";
import { useSubscription, useMutation, gql } from "@apollo/client";
import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";

const RUN_SUBSCRIPTION = gql`
  subscription GetRunUpdates($run_id: uuid!) {
    workflow_runs_by_pk(id: $run_id) {
      id
      status
      started_at
      completed_at
      step_runs(order_by: { created_at: asc }) {
        id
        status
        input
        output
        error
        attempt_count
        workflow_step {
          step_type
          step_order
        }
      }
    }
  }
`;

const APPROVE_STEP = gql`
  mutation ApproveStep($step_run_id: String!) {
    approveStep(step_run_id: $step_run_id) {
      run_id
    }
  }
`;

export default function RunViewer() {
  const { id } = useParams(); // workflow_id
  const searchParams = useSearchParams();
  const run_id = searchParams.get("run_id");

  const [approvingId, setApprovingId] = useState<string | null>(null);

  const { data, loading, error } = useSubscription(RUN_SUBSCRIPTION, { 
    variables: { run_id },
    skip: !run_id
  });
  
  const [approveStep] = useMutation(APPROVE_STEP);

  if (!run_id) return <div className="p-8">No run ID provided.</div>;
  if (loading) return <div className="p-8">Waiting for run data...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error.message}</div>;

  const run = data?.workflow_runs_by_pk;
  if (!run) return <div className="p-8">Run not found.</div>;

  const handleApprove = async (stepRunId: string) => {
    try {
      setApprovingId(stepRunId);
      await approveStep({ variables: { step_run_id: stepRunId } });
    } catch (err: any) {
      alert("Failed to approve: " + err.message);
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <h1 className="text-2xl font-bold">Run Viewer</h1>
        <div className={`px-3 py-1 rounded text-sm font-bold ${
          run.status === 'success' || run.status === 'completed' ? 'bg-green-100 text-green-800' :
          run.status === 'failed' ? 'bg-red-100 text-red-800' :
          run.status === 'paused' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
        }`}>
          Status: {run.status.toUpperCase()}
        </div>
      </div>

      <div className="grid gap-4">
        {run.step_runs.map((sr: any) => (
          <div key={sr.id} className={`border p-4 ${sr.status === 'running' ? 'border-blue-500 shadow' : ''}`}>
            <div className="flex justify-between items-center mb-3">
              <span className="font-bold">
                Step {sr.workflow_step.step_order}: {sr.workflow_step.step_type}
              </span>
              <span className={`text-xs px-2 py-1 bg-gray-100 ${
                sr.status === 'paused' ? 'bg-yellow-200 text-yellow-900' : ''
              }`}>
                {sr.status}
              </span>
            </div>
            
            {sr.error && (
              <div className="text-xs text-red-600 bg-red-50 p-2 mb-2 break-all">
                Error: {sr.error}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4 text-xs font-mono bg-gray-50 p-2">
              <div className="overflow-x-auto">
                <div className="text-gray-500 mb-1">Input:</div>
                <pre>{JSON.stringify(sr.input, null, 2)}</pre>
              </div>
              <div className="overflow-x-auto">
                <div className="text-gray-500 mb-1">Output:</div>
                <pre>{JSON.stringify(sr.output, null, 2)}</pre>
              </div>
            </div>

            {sr.status === 'paused' && sr.workflow_step.step_type === 'approval_gate' && (
              <div className="mt-4 flex justify-end">
                <button 
                  onClick={() => handleApprove(sr.id)}
                  disabled={approvingId === sr.id}
                  className="bg-[#4CAF50] text-white px-4 py-2 text-sm disabled:opacity-50"
                >
                  {approvingId === sr.id ? "Approving..." : "Approve & Resume"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
