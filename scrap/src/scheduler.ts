import { Devvit } from "@devvit/public-api";

Devvit.configure({
  redditAPI: true,
});

// 🕒 1️⃣ Define the scheduled job type
Devvit.addSchedulerJob({
  name: "createSuggestionThread",
  onRun: async (event, context) => {
    const subreddit = event.data?.subredditName as string;
    if (!subreddit) return;

    await context.reddit.submitPost({
      title: `🎙️ Podcast Suggestion Thread – ${new Date().toLocaleDateString()}`,
      subredditName: subreddit,
      text:
        "Post your podcast ideas below! In 2 days, the most upvoted suggestion will be picked automatically.",
    });

    console.log(`✅ Posted a new suggestion thread in r/${subreddit}`);
  },
});

Devvit.addMenuItem({
  label: "Start recurring suggestion thread",
  description: "Schedules a suggestion thread every 2 days",
  location: "subreddit", // or "post"
  forUserType: "moderator",
  onPress: async (_, context) => {
    if (!context.subredditName) {
      context.ui.showToast("Subreddit not available.");
      return;
    }

    await context.scheduler.runJob({
      name: "createSuggestionThread",
      data: { subredditName: context.subredditName },
      cron: "* * * * *", // every 2 days
    });

    context.ui.showToast("✅ Suggestion thread scheduler started!");
  },
});