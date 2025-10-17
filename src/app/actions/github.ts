"use server";
import axios from "axios";
import { getGitHubToken } from "@/lib/getGitHubToken";
export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
}

export interface GitHubRepo {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  updated_at?: string | null;
  language?: string | null;
  stargazers_count?: number;
  watchers_count?: number;
  owner: {
    name?: string | null;
    email?: string | null;
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    html_url: string;
    type: string;
    site_admin: boolean;
  };
}

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    } | null;
  };
  author: {
    login: string;
    avatar_url: string;
    html_url: string;
  } | null;
  html_url: string;
}

async function fetchGitHubAPI(endpoint: string, token?: string) {
  const baseUrl = "https://api.github.com";
  // Use provided token or get from environment/storage
  const authToken = token || getGitHubToken();

  const response = await axios.get(`${baseUrl}${endpoint}`, {
    headers: {
      Authorization: authToken ? `Bearer ${authToken}` : undefined,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "GitHub-Notifier/1.0",
    },
  });

  if (response.status !== 200) {
    throw new Error(
      `GitHub API error: ${response.status} - ${response.statusText}`
    );
  }

  return response.data;
}

export async function getUser(
  username: string,
  token?: string
): Promise<GitHubUser> {
  if (!username) {
    throw new Error("Username is required");
  }

  try {
    return await fetchGitHubAPI(`/users/${username}`, token);
  } catch (error: unknown) {
    const axiosError = error as {
      response?: { status: number; statusText: string };
    };
    if (axiosError.response?.status === 404) {
      throw new Error("User not found");
    }
    if (axiosError.response?.status === 403) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    if (axiosError.response?.status === 401) {
      throw new Error("Authentication failed. Please check your GitHub token.");
    }
    throw new Error("Failed to fetch user data");
  }
}

export async function getUserRepos(
  username: string,
  perPage = 100,
  token?: string
): Promise<GitHubRepo[]> {
  if (!username) {
    throw new Error("Username is required");
  }

  try {
    return await fetchGitHubAPI(
      `/users/${username}/repos?per_page=${perPage}&sort=updated&direction=desc`,
      token
    );
  } catch (error: unknown) {
    const axiosError = error as {
      response?: { status: number; statusText: string };
    };
    if (axiosError.response?.status === 404) {
      throw new Error("User not found");
    }
    if (axiosError.response?.status === 403) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    throw new Error("Failed to fetch repositories");
  }
}

export async function getRepoCommits(
  owner: string,
  repo: string,
  perPage = 10,
  token?: string
): Promise<GitHubCommit[]> {
  if (!owner || !repo) {
    throw new Error("Owner and repository are required");
  }

  try {
    return await fetchGitHubAPI(
      `/repos/${owner}/${repo}/commits?per_page=${perPage}`,
      token
    );
  } catch (error: unknown) {
    const axiosError = error as {
      response?: { status: number; statusText: string };
    };
    if (axiosError.response?.status === 404) {
      throw new Error("Repository not found");
    }
    if (axiosError.response?.status === 403) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    if (axiosError.response?.status === 401) {
      throw new Error("Authentication failed. Please check your GitHub token.");
    }
    throw new Error("Failed to fetch commits");
  }
}

export async function searchUserRepositories(username: string, token?: string) {
  if (!username) {
    throw new Error("Username is required");
  }

  try {
    // Fetch user information first
    const user = await fetchGitHubAPI(`/users/${username}`, token);

    // Fetch repositories
    const repos = await fetchGitHubAPI(
      `/users/${username}/repos?per_page=100&sort=updated&direction=desc`,
      token
    );

    if (repos.length === 0) {
      return {
        user,
        repos: [],
        reposWithCommits: [],
        commits: [],
      };
    }

    // Batch fetch commits for all repositories in parallel
    const commitPromises = repos.map(async (repo: GitHubRepo) => {
      try {
        const commits = await fetchGitHubAPI(
          `/repos/${username}/${repo.name}/commits?per_page=10`,
          token
        );
        return {
          repo,
          commits,
          latestCommitDate:
            commits[0]?.commit?.author?.date || repo.updated_at || null,
        };
      } catch {
        return {
          repo,
          commits: [],
          latestCommitDate: repo.updated_at || null,
        };
      }
    });

    const commitResults = await Promise.allSettled(commitPromises);

    // Process results and create repos with commit data
    const reposWithCommits = commitResults.map((result) => {
      if (result.status === "fulfilled") {
        const { repo, commits, latestCommitDate } = result.value;
        return {
          ...repo,
          lastCommitDate: latestCommitDate,
          commits,
        };
      } else {
        return {
          ...result.reason.repo,
          lastCommitDate: result.reason.repo.updated_at || null,
          commits: [],
        };
      }
    });

    // Sort repositories by last commit date (newest first)
    reposWithCommits.sort((a, b) => {
      const dateA = a.lastCommitDate ? new Date(a.lastCommitDate).getTime() : 0;
      const dateB = b.lastCommitDate ? new Date(b.lastCommitDate).getTime() : 0;
      return dateB - dateA; // Descending order (newest first)
    });

    // Get commits for the first repository (already fetched above)
    const firstRepoCommits = reposWithCommits[0]?.commits || [];

    return {
      user,
      repos: reposWithCommits.map((repo) => repo.name),
      reposWithCommits,
      commits: firstRepoCommits,
    };
  } catch (error: unknown) {
    const axiosError = error as {
      response?: { status: number; statusText: string };
    };
    if (axiosError.response?.status === 404) {
      throw new Error("User not found");
    }
    if (axiosError.response?.status === 403) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    if (axiosError.response?.status === 401) {
      throw new Error("Authentication failed. Please check your GitHub token.");
    }
    throw new Error("Failed to search repositories");
  }
}
