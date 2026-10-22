import type { PrismaClient } from '../src/generated/prisma/client.js';

export async function seedFeedbackResults(prisma: PrismaClient) {
  const results: {
    id: string;
    title: string;
    summary: string;
    score: number;
    priority: 'red' | 'yellow' | 'green';
    contradiction: string | null;
  }[] = [
    {
      id: 'demo-result-performance',
      title: 'Slow dashboard with large datasets',
      summary:
        'The dashboard takes over 12 seconds to load with more than 50,000 records.',
      score: 78,
      priority: 'red' as const,
      contradiction: null,
    },
    {
      id: 'demo-result-csv',
      title: 'CSV export for reporting',
      summary:
        'A customer needs CSV exports for their monthly reporting workflow.',
      score: 52,
      priority: 'yellow' as const,
      contradiction: null,
    },
    {
      id: 'demo-result-dark-mode',
      title: 'Dark mode',
      summary: 'Users request a dark theme for more comfortable use at night.',
      score: 21,
      priority: 'green' as const,
      contradiction: null,
    },
  ];
  const additionalResults: [string, string, string, number, string?][] = [
    [
      'session-expiry',
      'Unexpected session expiration',
      'Active users are signed out while completing long feedback forms.',
      94,
    ],
    [
      'missing-feedback',
      'Submitted feedback disappears',
      'Some submissions do not appear after refreshing the feedback list.',
      98,
    ],
    [
      'mobile-layout',
      'Dashboard overflow on mobile',
      'Feedback cards extend beyond the screen on smaller phones.',
      82,
    ],
    [
      'search',
      'Search across feedback',
      'Founders need to find feedback by keyword without scanning every card.',
      87,
    ],
    [
      'filters',
      'Filter results by priority',
      'Teams want to focus the dashboard on high priority results.',
      89,
    ],
    [
      'duplicate-submissions',
      'Duplicate feedback submissions',
      'Clicking Send twice on a slow connection can create duplicate entries.',
      91,
    ],
    [
      'password-reset',
      'Self-service password reset',
      'Users who forget their password need a recovery flow.',
      93,
    ],
    [
      'invite-team',
      'Invite team members',
      'Founders need to invite product managers to review customer feedback.',
      85,
    ],
    [
      'permissions',
      'Workspace access controls',
      'Teams need separate viewer and editor permissions for sensitive feedback.',
      90,
    ],
    [
      'loading-state',
      'Clear loading indicators',
      'Users cannot tell whether a slow feedback submission is still processing.',
      76,
    ],
    [
      'offline-draft',
      'Preserve unsent feedback',
      'Feedback drafts are lost when the connection drops or the tab reloads.',
      88,
    ],
    [
      'keyboard-access',
      'Keyboard accessible controls',
      'Keyboard users struggle to reach controls with an obvious focus indicator.',
      84,
    ],
    [
      'screen-reader',
      'Screen reader announcements',
      'Submission success and error messages need to be announced accessibly.',
      81,
    ],
    [
      'billing-errors',
      'Billing page errors',
      'Customers report an error when opening their latest invoice.',
      96,
    ],
    [
      'sync-delay',
      'Delayed feedback synchronization',
      'New feedback can take several minutes to appear in the founder dashboard.',
      80,
    ],
    [
      'pagination',
      'Paginate long feedback lists',
      'Large result lists are difficult to browse and slow to render.',
      79,
    ],
    [
      'date-filter',
      'Filter by date range',
      'Founders want to compare feedback received before and after a release.',
      65,
    ],
    [
      'sort-score',
      'Sort results by score',
      'Teams want the highest scoring feedback to appear first.',
      68,
    ],
    [
      'status-tracking',
      'Track feedback status',
      'Founders need to mark results as planned, in progress, or resolved.',
      73,
    ],
    [
      'assign-owner',
      'Assign an owner',
      'Feedback needs a clear teammate responsible for following up.',
      64,
    ],
    [
      'slack-alerts',
      'Slack notifications',
      'Product teams want high priority feedback delivered to their Slack channel.',
      62,
      'Some teams prefer a daily digest to individual notifications.',
    ],
    [
      'email-digest',
      'Weekly email digest',
      'Founders request a weekly summary of new themes and important feedback.',
      58,
    ],
    [
      'tags',
      'Custom feedback tags',
      'Teams want to group feedback by product area using their own labels.',
      66,
    ],
    [
      'merge-results',
      'Merge related results',
      'Similar requests should be grouped to avoid splitting their impact.',
      74,
    ],
    [
      'source-links',
      'Links to original submissions',
      'Founders want to inspect the customer wording behind each summary.',
      71,
    ],
    [
      'score-explanation',
      'Explain feedback scores',
      'Teams need to understand which signals contribute to a result score.',
      69,
    ],
    [
      'customer-segment',
      'Segment by customer plan',
      'Founders want to compare requests from free and paid customers.',
      63,
    ],
    [
      'api-access',
      'Feedback API access',
      'Customers want to retrieve feedback results in their internal tools.',
      60,
    ],
    [
      'webhooks',
      'Webhook integrations',
      'Teams need a webhook when a new high priority result is created.',
      56,
    ],
    [
      'bulk-actions',
      'Bulk status updates',
      'Product managers want to update several related feedback items together.',
      54,
    ],
    [
      'roadmap',
      'Share a public roadmap',
      'Customers want visibility into which requested features are planned.',
      67,
      'Some founders want roadmap visibility limited to paying customers.',
    ],
    [
      'attachments',
      'Attach screenshots',
      'Users want to include screenshots when reporting visual problems.',
      72,
    ],
    [
      'localization',
      'Additional interface languages',
      'International teams request French and German interface translations.',
      53,
    ],
    [
      'onboarding',
      'Guided first dashboard visit',
      'New founders need a short explanation of scores and priority labels.',
      55,
    ],
    [
      'empty-state',
      'More helpful empty states',
      'New workspaces should explain how to collect their first feedback.',
      48,
    ],
    [
      'compact-view',
      'Compact feedback cards',
      'Power users want a denser view to scan more results at once.',
      39,
      'Other users prefer larger cards with the full summary visible.',
    ],
    [
      'avatar',
      'Custom profile pictures',
      'Users would like to upload an avatar for their account.',
      18,
    ],
    [
      'accent-color',
      'Workspace accent colors',
      'Founders want to choose an accent color matching their brand.',
      24,
    ],
    [
      'saved-views',
      'Save dashboard views',
      'Teams want to save frequently used combinations of filters.',
      44,
    ],
    [
      'relative-dates',
      'Relative submission dates',
      'Users prefer labels such as yesterday for recent feedback.',
      22,
      'Some reviewers require exact dates for reporting.',
    ],
    [
      'print-view',
      'Printer friendly summaries',
      'Founders want a clean printable version for planning meetings.',
      28,
    ],
    [
      'emoji-reactions',
      'Emoji reactions on results',
      'Teammates want a quick way to acknowledge feedback without comments.',
      16,
    ],
    [
      'card-animation',
      'Subtle card transitions',
      'Users suggest smoother transitions when refreshing the result list.',
      12,
    ],
    [
      'custom-greeting',
      'Personalized dashboard greeting',
      'Founders would like a greeting using their first name.',
      9,
    ],
    [
      'favicon',
      'Distinct workspace favicon',
      'Users with many tabs want to recognize their workspace more easily.',
      20,
    ],
    [
      'density-setting',
      'Adjustable interface spacing',
      'Users request a setting for comfortable or compact spacing.',
      34,
    ],
    [
      'export-pdf',
      'Export summaries as PDF',
      'Founders occasionally need a PDF snapshot to share in planning meetings.',
      41,
    ],
  ];
  for (const [key, title, summary, score, contradiction] of additionalResults) {
    results.push({
      id: `demo-result-${key}`,
      title,
      summary,
      score,
      priority: score >= 75 ? 'red' : score >= 50 ? 'yellow' : 'green',
      contradiction: contradiction ?? null,
    });
  }
  for (const result of results) {
    await prisma.feedbackResult.upsert({
      where: { id: result.id },
      create: result,
      update: result,
    });
  }
}
