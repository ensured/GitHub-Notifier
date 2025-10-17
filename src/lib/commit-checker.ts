import { prisma } from "@/lib/db";
import { sendCommitNotificationEmail } from "@/lib/email";
import { getUserRepos, getRepoCommits, GitHubCommit } from "@/app/actions/github";

interface CommitCheck {
  subscriptionId: string;
  username: string;
  email: string;
  lastChecked?: Date | null;
}

export async function checkForNewCommits() {
  try {
    // Get all active subscriptions
    const subscriptions = await prisma.subscription.findMany({
      where: { isActive: true },
    });

    if (subscriptions.length === 0) {
      console.log("No active subscriptions found");
      return;
    }

    // Group subscriptions by username for efficient API calls
    const subscriptionsByUser = subscriptions.reduce((acc: Record<string, typeof subscriptions>, sub: any) => {
      if (!acc[sub.username]) {
        acc[sub.username] = [];
      }
      acc[sub.username].push(sub);
      return acc;
    }, {} as Record<string, typeof subscriptions>);

    for (const [username, userSubscriptions] of Object.entries(subscriptionsByUser) as [string, typeof subscriptions][]) {
      console.log(`Checking commits for user: ${username}`);

      try {
        // Get all repositories for this user
        const repos = await getUserRepos(username);

        for (const subscription of userSubscriptions) {
          await checkUserCommits(subscription, repos);
        }
      } catch (error) {
        console.error(`Failed to check commits for ${username}:`, error);
      }
    }
  } catch (error) {
    console.error("Error in checkForNewCommits:", error);
  }
}

async function checkUserCommits(subscription: any, repos: any[]) {
  const { id: subscriptionId, username, email, lastChecked } = subscription;

  for (const repo of repos) {
    try {
      // Get recent commits for this repo
      const commits = await getRepoCommits(username, repo.name, 50);

      // Filter commits that are newer than lastChecked
      const newCommits = commits.filter((commit: GitHubCommit) => {
        if (!lastChecked) return true;
        const commitDate = new Date(commit.commit.author?.date || "");
        return commitDate > lastChecked;
      });

      // Send notifications for new commits
      for (const commit of newCommits) {
        await sendCommitNotification(subscriptionId, commit, repo.name, username);
      }
    } catch (error) {
      console.error(`Failed to check commits for ${username}/${repo.name}:`, error);
    }
  }

  // Update last checked timestamp
  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { lastChecked: new Date() },
  });
}

async function sendCommitNotification(
  subscriptionId: string,
  commit: GitHubCommit,
  repoName: string,
  username: string
) {
  // Check if we've already sent a notification for this commit
  const existingNotification = await prisma.commitNotification.findUnique({
    where: {
      subscriptionId_commitSha: {
        subscriptionId,
        commitSha: commit.sha,
      },
    },
  });

  if (existingNotification) {
    return; // Already notified
  }

  // Get subscription details for email
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
  });

  if (!subscription) {
    return;
  }

  // Create notification record
  await prisma.commitNotification.create({
    data: {
      subscriptionId,
      commitSha: commit.sha,
      commitMessage: commit.commit.message,
      repoName,
      author: commit.commit.author?.name || "Unknown",
      commitDate: new Date(commit.commit.author?.date || ""),
    },
  });

  // Send email notification
  const commitUrl = `https://github.com/${username}/${repoName}/commit/${commit.sha}`;
  await sendCommitNotificationEmail({
    to: subscription.email,
    username,
    repoName,
    commitMessage: commit.commit.message,
    commitSha: commit.sha,
    author: commit.commit.author?.name || "Unknown",
    commitUrl,
  });

  console.log(`Sent notification for commit ${commit.sha.substring(0, 7)} in ${username}/${repoName}`);
}
