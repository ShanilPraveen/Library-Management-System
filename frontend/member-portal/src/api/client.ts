type Service = "catalog" | "circulation" | "identity";
import { getToken } from "./../utils/auth";

const SERVICE_URLS = {
  catalog: "http://localhost:4000/catalog/graphql",
  circulation: "http://localhost:4000/circulation/graphql",
  identity: "http://localhost:4000/identity/graphql",
};

// Generic function to make GraphQL requests to different services
export async function graphqlRequest<T>(
  service: Service,
  query: string,
  variables?: Record<string, any>,
  requireAuth: boolean = true
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (requireAuth) {
    const token = getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(SERVICE_URLS[service], {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables: variables || {} }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const responseData = await response.json();

  if (responseData.errors) {
    throw new Error(
      responseData.errors.map((err: any) => err.message).join(", ")
    );
  }

  return responseData.data;
}
