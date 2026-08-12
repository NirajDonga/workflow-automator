"use client";
import { useQuery, useMutation, gql } from "@apollo/client";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

const GET_WORKFLOW = gql`
  query GetWorkflow($id: uuid!) {
    workflows_by_pk(id: $id) {
      id
      name
      workflow_steps(order_by: { step_order: asc }) {
        id
        step_type
        config
        step_order
      }
      workflow_triggers {
        id
        trigger_type
        config
      }
    }
  }
`;

const TRIGGER_RUN = gql`
  mutation TriggerRun($workflow_id: String!) {
    triggerWorkflowRun(workflow_id: $workflow_id) {
      run_id
    }
  }
`;

export default function WorkflowBuilder() {
  const { id } = useParams();
  const router = useRouter();
  const [triggering, setTriggering] = useState(false);
  
  const { data, loading, error } = useQuery(GET_WORKFLOW, { variables: { id } });
  const [triggerRun] = useMutation(TRIGGER_RUN);

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error.message}</div>;

  const workflow = data?.workflows_by_pk;
  if (!workflow) return <div className="p-8">Workflow not found.</div>;

  const handleRun = async () => {
    try {
      setTriggering(true);
      const res = await triggerRun({ variables: { workflow_id: workflow.id } });
      if (res.data?.triggerWorkflowRun?.run_id) {
        router.push(`/runs/${workflow.id}?run_id=${res.data.triggerWorkflowRun.run_id}`);
      }
    } catch (err: any) {
      alert("Failed to trigger run: " + err.message);
    } finally {
      setTriggering(false);
    }
  };

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <h1 className="text-2xl font-bold">{workflow.name} - Builder</h1>
        <button 
          onClick={handleRun} 
          disabled={triggering}
          className="bg-[#4CAF50] text-white px-4 py-2 disabled:opacity-50"
        >
          {triggering ? "Starting..." : "Run Workflow"}
        </button>
      </div>

      <div className="mb-8">
        <h2 className="text-xl mb-4">Triggers</h2>
        <div className="grid gap-2">
          {workflow.workflow_triggers.map((t: any) => (
            <div key={t.id} className="border p-3 bg-gray-50 flex justify-between">
              <span className="font-mono">{t.trigger_type}</span>
              <span className="text-sm text-gray-500">{JSON.stringify(t.config)}</span>
            </div>
          ))}
          {workflow.workflow_triggers.length === 0 && <div className="text-gray-500">No triggers configured (Manual run only)</div>}
        </div>
      </div>

      <div>
        <h2 className="text-xl mb-4">Steps</h2>
        <div className="grid gap-3">
          {workflow.workflow_steps.map((s: any, idx: number) => (
            <div key={s.id} className="border p-4">
              <div className="flex justify-between mb-2">
                <span className="font-bold">Step {idx + 1}: {s.step_type}</span>
              </div>
              <pre className="text-xs bg-gray-100 p-2 overflow-x-auto">
                {JSON.stringify(s.config, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
