import { Devvit, SettingScope } from "@devvit/public-api";

// Activation API Reddit et HTTP fetch
Devvit.configure({
  redditAPI: true,
  http: true,
});

// Déclare les settings utilisés par ton app
Devvit.addSettings([
  {
    name: "GITHUB_TOKEN",
    label: "GitHub Personal Access Token",
    type: "string",
    isSecret: true,
    scope: SettingScope.App,
  },
  {
    name: "GITHUB_REPO",
    label: "GitHub Repository (owner/repo)",
    type: "string",
    scope: SettingScope.App,
  },
]);

/* ============================================================
   CREATE GENERIC POST
============================================================ */
async function createGenericPost(context: any) {
  try {
    const subredditName = context.subredditName;
    if (!subredditName) {
      context.ui.showToast("Impossible de déterminer le subreddit actuel !");
      return;
    }

    const post = await context.reddit.submitPost({
      subredditName,
      title: "💡 Nouveau post générique",
      text: "Ceci est un post généré automatiquement pour le test.",
    });

    console.log("✅ Post créé :", post.id);
    context.ui.showToast(`Post créé : ${post.title}`);
    return post;
  } catch (err) {
    console.error("❌ Erreur création post :", err);
    context.ui.showToast("Erreur lors de la création du post.");
  }
}

/* ============================================================
   PROCESS TOP COMMENT
============================================================ */
async function processTopComment(context: any, postId: string) {
  try {
    const listing = await context.reddit.getComments({
      postId,
      limit: 100,
      pageSize: 100,
    });

    const allComments = await listing.all();
    if (!allComments.length) {
      context.ui.showToast("Aucun commentaire trouvé.");
      return null;
    }

    // Trouver le commentaire avec le score le plus élevé
    let topComment = allComments[0];
    for (const c of allComments) {
      if ((c.score ?? 0) > (topComment.score ?? 0)) topComment = c;
    }

    const topCommentJSON = {
      id: topComment.id,
      author: topComment.authorName,
      body: topComment.body,
      score: topComment.score,
      permalink: topComment.permalink,
    };

    console.log("🏆 Top commentaire :", topCommentJSON);
    context.ui.showToast(
      `Top commentaire par u/${topCommentJSON.author} (${topCommentJSON.score} upvotes)`
    );

    // Répondre au gagnant
    await context.reddit.submitComment({
      id: topCommentJSON.id,
      text: `🎉 Félicitations u/${topCommentJSON.author}, votre commentaire a gagné !`,
    });

    // Push sur GitHub
    await pushTopCommentToGitHub(context, topCommentJSON);

    return topCommentJSON;
  } catch (err) {
    console.error("❌ Erreur traitement top commentaire :", err);
    context.ui.showToast("Erreur lors du traitement du top commentaire.");
    return null;
  }
}

/* ============================================================
   PUSH TOP COMMENT TO GITHUB
============================================================ */
async function pushTopCommentToGitHub(context: any, data: any) {
  try {
    const token = await context.settings.get("GITHUB_TOKEN");
    const repo = await context.settings.get("GITHUB_REPO");
    if (!token || !repo) throw new Error("Settings GitHub manquants.");

    const filename = "top_comment.json";
    const filepath = "contents/" + filename; // chemin exact dans ton repo
    const branch = "main";
    const url = `https://api.github.com/repos/${repo}/contents/${filepath}?ref=${branch}`;
    const content = Buffer.from(JSON.stringify(data, null, 2)).toString("base64");

    // Vérifie si le fichier existe
    let sha: string | undefined;
    const getRes = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (getRes.status === 200) {
      const existing = (await getRes.json()) as { sha?: string };
      sha = existing.sha;
      console.log("Fichier existant trouvé, SHA :", sha);
    }

    // Création ou mise à jour
    const putRes = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        message: "Update top_comment.json depuis Devvit",
        content,
        sha,
        branch,
      }),
    });

    if (!putRes.ok) {
      const errText = await putRes.text();
      throw new Error(errText);
    }

    context.ui.showToast("✅ Top commentaire enregistré sur GitHub !");
    console.log("Top commentaire pushé :", data);
  } catch (err) {
    console.error("❌ Erreur push GitHub :", err);
    context.ui.showToast("Impossible d'envoyer le commentaire sur GitHub.");
  }
}

/* ============================================================
   DEVVIT MENU
============================================================ */
Devvit.addMenuItem({
  label: "Créer un post générique",
  location: "subreddit",
  forUserType: "moderator",
  onPress: async (_, context) => {
    await createGenericPost(context);
  },
});

Devvit.addMenuItem({
  label: "Récupérer le commentaire le plus upvoté",
  location: "post",
  forUserType: "moderator",
  onPress: async (_, context) => {
    if (!context.postId) {
      context.ui.showToast("Cliquez sur un vrai post.");
      return;
    }
    await processTopComment(context, context.postId);
  },
});

export default Devvit;