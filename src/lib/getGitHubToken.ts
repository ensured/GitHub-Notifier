// Utility function to get GitHub token - works on both client and server
export function getGitHubToken(): string | null {
  // Server-side: check environment variable only
  if (typeof window === 'undefined') {
    return process.env.GITHUB_TOKEN || null;
  }

  // Client-side: check localStorage token, fallback to environment variable
  const storedToken = localStorage.getItem("github-token");
  return storedToken || process.env.GITHUB_TOKEN || null;
}
