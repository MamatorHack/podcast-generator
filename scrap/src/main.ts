import { Devvit } from "@devvit/public-api";
import cron from "node-cron";

Devvit.configure({ redditAPI: true });

// ---------- FONCTIONS UTILITAIRES ----------

async function getTopPost(context: any, subreddit: string) {
  const posts = await context.reddit.getPosts({
    subreddit,
    sort: "new",
    limit: 1
  });
  return posts[0];
}

async function getTopComment(context: any, postId: string) {
  const listing = await context.reddit.getComments({ postId, limit: 100, pageSize: 100 });
  const allComments = await listing.all();

  if (!allComments.length) return null;

  // Typage explicite pour les éléments
  type CommentType = typeof allComments[0];

  let top: CommentType | null = null;

  for (const c of allComments as CommentType[]) {
    if (!top || (c.score ?? 0) > (top.score ?? 0)) {
      top = c;
    }
  }

  return top;
}

async function processTopPost(context: any, subreddit: string) {
  try {
    const post = await getTopPost(context, subreddit);
    if (!post) return console.log("Aucun post récent trouvé.");

    if (!post.locked) await post.lock();

    const topComment = await getTopComment(context, post.id);
    if (!topComment) {
      console.log("Aucun commentaire trouvé.");
      if (post.locked) await post.unlock();
      return;
    }

    const authorName = topComment?.author?.name || topComment?.authorId || "[unknown]";
    const winnerText = topComment.body;

    // Post gagnant
    await context.reddit.submitComment({
      id: post.id,
      text: `🎉 Le top commentaire est de u/${authorName} : "${winnerText}" avec ${topComment.score} upvotes !`
    });

    // JSON pour serveur / IA
    const suggestionJSON = { body: winnerText };
    console.log("Top suggestion JSON:", JSON.stringify(suggestionJSON, null, 2));

    if (post.locked) await post.unlock();

    console.log(`✅ Suggestion traitée pour le post ${post.id}`);
  } catch (err: any) {
    console.error("Erreur dans le traitement du top post :", err);
  }
}

// ---------- SCHEDULER CRON ----------

export function scheduleTopCommentEvery2Days(context: any, subreddit: string) {
  // Cron : toutes les 48 heures à minuit (00:00)
  // Format : 'minute hour day-of-month month day-of-week'
  cron.schedule('0 0 */2 * *', async () => {
    console.log("🔁 Début du cycle automatique pour le top commentaire...");
    await processTopPost(context, subreddit);
  });

  console.log("✅ Cron-ready scheduler activé : toutes les 48h.");
}

// ---------- DEVVIT MENU (pour lancer manuellement si besoin) ----------

Devvit.addMenuItem({
  label: "Lancer automation top comment (cron-ready)",
  location: "subreddit",
  forUserType: "moderator",
  onPress: async (_, context) => {
    scheduleTopCommentEvery2Days(context, "votresubreddit");
    context.ui.showToast("Cron-ready automation top comment activée !");
  }
});

export default Devvit;