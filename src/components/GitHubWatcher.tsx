"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { GitHubRepo, GitHubCommit } from "@/types/github-api";
import { formatDistance } from "date-fns";
import { getRepoCommits, searchUserRepositories } from "@/app/actions/github";
import { getGitHubToken } from "@/lib/getGitHubToken";

interface RepoWithLastCommit extends GitHubRepo {
  lastCommitDate: string | null;
  commits?: GitHubCommit[];
}

export default function GitHubWatcher() {
  const [username, setUsername] = useState("");
  const [repos, setRepos] = useState<string[]>([]);
  const [reposWithCommits, setReposWithCommits] = useState<
    RepoWithLastCommit[]
  >([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const searchInProgressRef = useRef(false);

  // Update current time every minute to refresh relative dates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const handleSearch = async () => {
    if (!username) {
      setError("Please enter a GitHub username");
      return;
    }

    // Prevent multiple simultaneous searches
    if (searchInProgressRef.current) {
      return;
    }

    searchInProgressRef.current = true;
    setLoading(true);
    setError("");
    setHasSearched(true);
    setRepos([]);
    setReposWithCommits([]);
    setSelectedRepo("");
    setCommits([]);

    try {
      // Use the optimized single server action that handles everything
      const token = getGitHubToken();
      const searchResult = await searchUserRepositories(
        username,
        token || undefined
      );

      setRepos(searchResult.repos);
      setReposWithCommits(searchResult.reposWithCommits);
      setSelectedRepo(searchResult.repos[0] || "");
      setCommits(searchResult.commits);
    } catch {
      setError("Failed to fetch repositories. Please check the username.");
      setRepos([]);
      setSelectedRepo("");
      setCommits([]);
    } finally {
      setLoading(false);
      searchInProgressRef.current = false;
    }
  };

  // Fetch commits when repository is selected (after initial search)
  const handleRepoChange = async (repoName: string) => {
    if (!username || !repoName || !hasSearched) return;

    setSelectedRepo(repoName);
    setLoading(true);
    setError("");

    try {
      // Use cached commits data if available
      const selectedRepoData = reposWithCommits.find(
        (r) => r.name === repoName
      );

      if (selectedRepoData?.commits && selectedRepoData.commits.length > 0) {
        // Use cached commits - no API call needed!
        setCommits(selectedRepoData.commits);
      } else {
        // Fallback: fetch commits if not cached (shouldn't happen with optimized search)
        const token = getGitHubToken();
        const response = await getRepoCommits(
          username,
          repoName,
          10,
          token || undefined
        );
        setCommits(response);
      }
    } catch {
      setError("Failed to fetch commits.");
      setCommits([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card className="relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-card via-card to-card/95 backdrop-blur-sm">
        {/* Decorative background elements */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-accent/10 to-transparent rounded-full translate-y-12 -translate-x-12" />

        <CardHeader className="relative pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </div>
            <CardTitle className="text-2xl md:text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              GitPulse
            </CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Monitor repository activity in real-time
          </p>
        </CardHeader>

        <CardContent className="relative space-y-6">
          {/* Search Section */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">
              GitHub Username
            </label>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
              className="flex gap-3"
            >
              <Input
                placeholder="Enter GitHub username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="flex-1 h-11 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200"
              />
              <Button
                type="submit"
                disabled={loading || username.length < 1}
                className="h-11 px-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    Searching...
                  </>
                ) : (
                  "Search"
                )}
              </Button>
            </form>
          </div>

          {/* Repository Selection */}
          {hasSearched && repos.length > 0 && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                Select Repository
              </label>
              <Select value={selectedRepo} onValueChange={handleRepoChange}>
                <SelectTrigger className="!h-12 cursor-pointer bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200">
                  <SelectValue placeholder="Select a repository" />
                </SelectTrigger>
                <SelectContent>
                  {repos.map((repo) => {
                    const repoWithCommit = reposWithCommits.find(
                      (r) => r.name === repo
                    );
                    const formattedDate = repoWithCommit?.lastCommitDate
                      ? formatDistance(
                          new Date(repoWithCommit.lastCommitDate),
                          currentTime,
                          { addSuffix: true }
                        )
                      : "No commits";

                    return (
                      <SelectItem
                        key={repo}
                        value={repo}
                        className="cursor-pointer"
                      >
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-foreground">
                            {repo}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formattedDate}
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="animate-spin h-8 w-8 text-primary mb-4" />
              <p className="text-muted-foreground">Loading...</p>
            </div>
          )}

          {/* Commits Display */}
          {hasSearched && commits.length > 0 && !loading && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-foreground">
                  Recent Commits
                </h3>
                <div className="h-px bg-border flex-1" />
              </div>
              <div className="space-y-3">
                {commits.map((commit, index) => {
                  const commitUrl = `https://github.com/${username}/${selectedRepo}/commit/${commit.sha}`;

                  return (
                    <div
                      key={commit.sha}
                      className="group p-4 rounded-lg bg-card/50 border border-border/50 hover:border-border hover:bg-card transition-all duration-200 hover:shadow-md cursor-pointer"
                      style={{ animationDelay: `${index * 50}ms` }}
                      onClick={() => window.open(commitUrl, "_blank")}
                      title={`View commit ${commit.sha.substring(0, 7)} on GitHub`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 rounded-full bg-primary/10 text-primary text-xs font-mono">
                          {commit.sha.substring(0, 7)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground mb-1 line-clamp-2">
                            {commit.commit?.message || "No commit message"}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>
                              {commit.commit.author?.date
                                ? formatDistance(
                                    new Date(commit.commit.author.date),
                                    currentTime,
                                    { addSuffix: true }
                                  )
                                : "Unknown date"}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg
                                className="w-3 h-3"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                              </svg>
                              {commit.commit.author?.name || "Unknown author"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty State */}
          {hasSearched &&
            !loading &&
            commits.length === 0 &&
            repos.length === 0 && (
              <div className="text-center py-12">
                <svg
                  className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-.881-5.583-2.292C5.125 11.125 4.5 9.125 4.5 7.5a4.5 4.5 0 119 0c0 1.625-.625 3.625-1.917 5.208z"
                  />
                </svg>
                <p className="text-muted-foreground">
                  No repositories found for this user.
                </p>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
