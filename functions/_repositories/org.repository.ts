import { adminQuery } from '../_utils/graphql-client';
import { OrgRole } from '../_utils/types';

export async function getMemberRole(userId: string, orgId: string): Promise<OrgRole | null> {
  const data = await adminQuery<{
    org_members: Array<{ role: OrgRole }>;
  }>(
    `query($userId: uuid!, $orgId: uuid!) {
      org_members(where: { user_id: { _eq: $userId }, org_id: { _eq: $orgId } }, limit: 1) {
        role
      }
    }`,
    { userId, orgId },
  );
  return data.org_members[0]?.role ?? null;
}

export async function getOrgQuota(orgId: string): Promise<{ quota_limit: number; quota_used: number }> {
  const data = await adminQuery<{
    organizations_by_pk: { quota_limit: number; quota_used: number } | null;
  }>(
    `query($orgId: uuid!) {
      organizations_by_pk(id: $orgId) { quota_limit, quota_used }
    }`,
    { orgId },
  );
  if (!data.organizations_by_pk) throw new Error(`Org ${orgId} not found`);
  return data.organizations_by_pk;
}

export async function incrementQuotaUsed(orgId: string): Promise<void> {
  await adminQuery(
    `mutation($orgId: uuid!) {
      update_organizations_by_pk(pk_columns: { id: $orgId }, _inc: { quota_used: 1 }) { id }
    }`,
    { orgId },
  );
}
