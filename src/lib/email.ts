import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface CommitNotificationEmail {
  to: string;
  username: string;
  repoName: string;
  commitMessage: string;
  commitSha: string;
  author: string;
  commitUrl: string;
}

export async function sendCommitNotificationEmail(data: CommitNotificationEmail) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not configured, skipping email");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const { to, username, repoName, commitMessage, commitSha, author, commitUrl } = data;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Commit from ${username}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🚀 New Commit Alert</h1>
          </div>

          <div style="background: #ffffff; border: 1px solid #e1e5e9; border-radius: 0 0 10px 10px; padding: 30px;">
            <h2 style="color: #333; margin-top: 0;">${username} pushed to ${repoName}</h2>

            <div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0;">
              <p style="margin: 0; font-size: 16px; color: #333;"><strong>${commitMessage}</strong></p>
            </div>

            <div style="margin: 20px 0;">
              <p style="margin: 5px 0; color: #666;"><strong>Author:</strong> ${author}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Commit:</strong> <code style="background: #f1f3f4; padding: 2px 6px; border-radius: 3px; font-family: 'Courier New', monospace;">${commitSha.substring(0, 7)}</code></p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${commitUrl}"
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">
                View Commit on GitHub
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #e1e5e9; margin: 30px 0;">

            <p style="color: #666; font-size: 14px; text-align: center;">
              You're receiving this because you're subscribed to notifications for <strong>${username}</strong>.
              <br>
              <a href="{{unsubscribe_url}}" style="color: #667eea;">Unsubscribe</a>
            </p>
          </div>
        </body>
      </html>
    `;

    const result = await resend.emails.send({
      from: "GitHub Notifier <notifications@yourdomain.com>", // Update with your domain
      to: [to],
      subject: `New commit from ${username}: ${commitMessage.substring(0, 50)}${commitMessage.length > 50 ? '...' : ''}`,
      html: emailHtml,
    });

    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error: "Failed to send email" };
  }
}
