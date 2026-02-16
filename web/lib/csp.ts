import { headers } from 'next/headers';

/**
 * Get the CSP nonce for the current request
 * This should be used in Server Components to add nonce to inline scripts
 * 
 * @returns The nonce value or undefined in development mode
 */
export async function getNonce(): Promise<string | undefined> {
  // In development, we allow unsafe-inline so no nonce is needed
  if (process.env.NODE_ENV === 'development') {
    return undefined;
  }

  const headersList = await headers();
  return headersList.get('x-nonce') || undefined;
}
