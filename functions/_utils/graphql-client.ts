const HASURA_URL = process.env.NHOST_HASURA_URL || 'http://localhost:1337/v1/graphql';
const ADMIN_SECRET = process.env.NHOST_ADMIN_SECRET || 'nhost-admin-secret';

export async function adminQuery<T = Record<string, unknown>>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(HASURA_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': ADMIN_SECRET,
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json() as { data?: T; errors?: Array<{ message: string }> };

  if (json.errors?.length) {
    throw new Error(`GraphQL error: ${json.errors[0].message}`);
  }

  return json.data as T;
}
