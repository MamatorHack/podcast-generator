import { Devvit, FlairTemplate, SettingScope } from "@devvit/public-api";

// Activation API Reddit et HTTP fetch
Devvit.configure({
  redditAPI: true,
  http: true,
});

// Déclaration des paramètre utilsé par l'app
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
   Envoyer le podcast final 
============================================================ */
async function sendFinalPodcast(context: any) {

  //Accès au github
  try {
    const token = await context.settings.get("GITHUB_TOKEN");
    const repo = await context.settings.get("GITHUB_REPO");
    if (!token || !repo) throw new Error("Settings GitHub manquants.");

    const filepath = "scrap/contents/top_comment.json";
    const branch = "dev";
    const url = `https://api.github.com/repos/${repo}/contents/${filepath}?ref=${branch}`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (!res.ok) throw new Error("Impossible de récupérer le top comment.");

    // Récupération et décodage du top_comment.json
    const fileData = await res.json() as {
      content: string;
      sha: string;
    };

    const content = Buffer.from(fileData.content, "base64").toString("utf-8");
    const topComment = JSON.parse(content);

    console.log("Top comment décodé complet:", topComment);

    if (!topComment?.id) throw new Error("Commentaire invalide.");

    // Vérification subreddit
    const currentSubreddit = context.subredditName;
    const match = topComment.permalink?.match(/^\/r\/([^/]+)\//);

    if (!match) {
      console.error("Impossible d'extraire le subreddit");
      return;
    }

    const commentSubreddit = match[1];

    if (commentSubreddit !== currentSubreddit) {
      context.ui.showToast("❌ Ce commentaire appartient à un autre subreddit.");
      return;
    }

    // ✅ ENVOI FINAL
    await context.reddit.submitComment({
      id: topComment.id,
      text:
        `🎧 Salut u/${topComment.author} ! Ton podcast est prêt !\n\n` +
        `[▶️ Écouter l'épisode ici](https://raw.githubusercontent.com/MamatorHack/podcast-generator/dev/voice-generator/podcast_final.mp3)`,
    });

    context.ui.showToast("🎙 Podcast envoyé !");
  } catch (err) {
    console.error("Erreur envoi podcast :", err);
    context.ui.showToast("Erreur lors de l'envoi du podcast.");
  }
}

/* ============================================================
   Récupération du top comment
============================================================ */
async function processTopComment(context: any, postId: string) {
  //Récupérer tout les commentaites d'un post
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

    // Trouver le commentaire avec le score le plus élevé(upvote)
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

    

    // Ajout du flair "Clôturé" 
    // Si le flair n'a pas déjà été créé au préalable cela ne fonctionnera pas
    const post = await context.reddit.getPostById(postId);
    if (!post) return;

    const subredditName = post.subredditName;
    const flairLabel = "Clôturé"; // nom du flair exact
    const flairs = await context.reddit.getPostFlairTemplates(subredditName);
    const flair = flairs.find((f:FlairTemplate) => f.text.trim() === flairLabel);

    if (!flair) {
      console.log(`⚠️ Flair "${flairLabel}" non trouvé !`);
    } else {
      const flairId = flair.id;
      console.log("Flair trouvé :", flairId);
      
      //Appliquer le flair
      await context.reddit.setPostFlair({
        subredditName,
        postId,
        flairTemplateId: flairId, // ⚠️ utiliser flairTemplateId
      });

      console.log("✅ Flair appliqué !");
    }
    //Verouillage du post
    if (post) {
      await post.lock();
      context.ui.showToast("🔒 Post verrouillé. Votes terminés !");
    }
  

    return topCommentJSON;
  } catch (err) {
    console.error("❌ Erreur traitement top commentaire :", err);
    context.ui.showToast("Erreur lors du traitement du top commentaire.");
    return null;
  }
}

/* ============================================================
  Envoyer le top comment sur github
============================================================ */
async function pushTopCommentToGitHub(context: any, data: any) {
  // Récupération du repo / token d'accès
  try {
    const token = await context.settings.get("GITHUB_TOKEN");
    const repo = await context.settings.get("GITHUB_REPO");
    if (!token || !repo) throw new Error("Settings GitHub manquants.");
    // Chemin exacte du fichier à partir de la racine
    const filepath = "scrap/contents/top_comment.json";
    const branch = "dev";
    // url complète du fichieren passant par api.github
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

// Ajout d'un timer de 30 minutes
Devvit.addSchedulerJob({
  name: "podcast-job",
  onRun: async (event, context) => {
    if (!event.data || !("commentId" in event.data)) return;

    const commentId = event.data.commentId as string;
    const author = event.data.author as string;

    try {
      await context.reddit.submitComment({
        id: commentId, // on répond au commentaire gagnant
        text:
          `🎧 Salut u/${author} ! Ton podcast est prêt !\n\n` +
          `[▶️ Écouter l'épisode ici](https://raw.githubusercontent.com/MamatorHack/podcast-generator/dev/voice-generator/podcast_final.mp3)`,
      });

      console.log("🎙 Podcast posté sous le commentaire !");
    } catch (err) {
      console.error("Erreur scheduler :", err);
    }
  },
});



/* ============================================================
   DEVVIT MENU
============================================================ */

// Création d'un bouton permettant d'appeler: processTopComment() ; Location: On Post
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

Devvit.addMenuItem({
  label: "Envoyer le podcast final",
  location: "subreddit",
  forUserType: "moderator",
  onPress: async (_, context) => {
    await sendFinalPodcast(context);
  },
});


export default Devvit;