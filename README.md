# GitHub Notifier (GitPulse)

A Next.js application that monitors GitHub users for new commits and sends email notifications via Resend.

## Features

- 🔍 **Real-time GitHub Monitoring**: Search and view GitHub user repositories and recent commits
- 📧 **Email Notifications**: Subscribe to receive email alerts when users make new commits
- 🎛️ **Flexible Scheduling**: Choose between daily summaries, weekly digests, or real-time notifications
- 💾 **Persistent Subscriptions**: SQLite database stores subscription preferences
- 🔄 **Background Processing**: Automated commit checking via API endpoints

## Quick Start

### 1. Setup

```bash
# Clone and install dependencies
npm install

# Setup database and generate Prisma client
npm run setup
# or manually:
# npx prisma generate
# npx prisma db push
```

### 2. Environment Variables

Create a `.env.local` file with:

```env
# Database (SQLite by default)
DATABASE_URL="file:./dev.db"

# GitHub API Token (optional, for higher rate limits)
GITHUB_TOKEN="your_github_token_here"

# Resend API Key (required for email notifications)
RESEND_API_KEY="your_resend_api_key_here"

# Security (change this in production)
CRON_SECRET="your_secure_random_string"
```

### 3. Email Setup

1. **Sign up for Resend**: Go to [resend.com](https://resend.com) and create an account
2. **Add your domain**: In Resend dashboard, add and verify your domain
3. **Get API key**: Copy your API key to `RESEND_API_KEY`
4. **Update email sender**: Modify the `from` field in `src/lib/email.ts` to use your verified domain

### 4. Run the Application

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

Visit [http://localhost:3000](http://localhost:3000) to use the application.

## Usage

### Using the Web Interface

1. **Search for a GitHub user**: Enter a username in the search box
2. **Browse repositories**: Select repositories to view recent commits
3. **Subscribe to notifications**:
   - Enter your email address
   - Choose notification frequency (daily, weekly, real-time)
   - Click "Subscribe"

### Subscription Options

- **Daily Summary**: Receive one email per day with all new commits
- **Weekly Summary**: Receive a weekly digest of all commits
- **Real-time**: Get notified immediately when new commits are pushed

## Background Job Setup

For automated commit checking, set up a cron job that calls the API endpoint:

```bash
# Check every 15 minutes
*/15 * * * * curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://yourdomain.com/api/check-commits
```

Or use a service like:
- **Vercel Cron Jobs**: Built-in cron support
- **Railway**: Cron jobs in settings
- **GitHub Actions**: Scheduled workflows
- **cron-job.org**: Free cron service

## API Endpoints

### Check for New Commits
`GET /api/check-commits`

Triggers the background job to check all subscriptions for new commits.

**Headers:**
- `Authorization: Bearer YOUR_CRON_SECRET` (if CRON_SECRET is set)

### Subscription Management
`POST /api/subscriptions` - Create subscription (server action)
`GET /api/subscriptions` - Get user subscriptions (server action)
`DELETE /api/subscriptions/[id]` - Delete subscription (server action)

## Development

### Database Schema

The application uses Prisma with the following models:

```prisma
model Subscription {
  id        String   @id @default(cuid())
  email     String
  username  String   // GitHub username to monitor
  frequency String   @default("daily")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  lastChecked DateTime?
  isActive  Boolean  @default(true)
}

model CommitNotification {
  id            String   @id @default(cuid())
  subscriptionId String
  subscription  Subscription @relation(fields: [subscriptionId], references: [id])
  commitSha     String
  commitMessage String
  repoName      String
  author        String
  commitDate    DateTime
  sentAt        DateTime @default(now())
}
```

### Project Structure

```
src/
├── app/
│   ├── actions/          # Server actions
│   │   ├── github.ts     # GitHub API integration
│   │   └── subscriptions.ts # Subscription management
│   ├── api/
│   │   └── check-commits/ # Background job endpoint
│   └── ...
├── components/
│   └── GitHubWatcher.tsx # Main UI component
├── lib/
│   ├── db.ts             # Database connection
│   ├── email.ts          # Resend integration
│   ├── commit-checker.ts # Background job logic
│   └── ...
```

## Deployment

### Recommended Platforms

- **Vercel**: Easy deployment with cron job support
- **Railway**: Good for full-stack apps with databases
- **Netlify**: Static frontend with serverless functions

### Production Considerations

1. **Database**: Switch from SQLite to PostgreSQL for production
2. **Environment Variables**: Use proper secrets management
3. **Rate Limits**: Monitor GitHub API usage
4. **Email Deliverability**: Ensure proper SPF/DKIM/DMARC setup
5. **Monitoring**: Add logging and error tracking

### Example Deployment

```bash
# Vercel (recommended)
npm install -g vercel
vercel --prod

# Or use GitHub integration for automatic deployments
```

## Troubleshooting

### Common Issues

1. **GitHub API Rate Limits**: Add a GitHub token for higher limits
2. **Email Not Sending**: Check Resend API key and domain verification
3. **Database Errors**: Run `npx prisma db push` to sync schema
4. **Cron Job Not Working**: Ensure proper authentication and endpoint URL

### Logs

Check the console for:
- Background job execution logs
- Email sending status
- Database connection errors

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
