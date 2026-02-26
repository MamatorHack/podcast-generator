const { getWinningSubject } = require('./reddit/readWinner');
const { generatePodcastScript } = require('./ai/researchAgent');
const { processPodcastAudio } = require('./audio/audioGenerator');
const { assemblePodcast } = require('./audio/audioMixer');
const { pushAudioToGitHub } = require('./github/gitPusher'); // Import du nouveau module !

async function runPipeline() {
    console.log("🚀 Lancement du Podcast Generator...");

    // On récupère tout l'objet
    const commentData = await getWinningSubject();
    if (!commentData || !commentData.body) return;

    // On passe le texte ET l'auteur à l'IA
    const script = await generatePodcastScript(commentData.body, commentData.author);

    if (script) {
        console.log("\n--- SCRIPT COMPLET ---");
        console.log(script);
        console.log("------------------------\n");

        console.log("⏭️ Étape 4 : Extraction des répliques et génération des voix avec fal.ai...");
        const audioSegments = await processPodcastAudio(script);

        if (audioSegments && audioSegments.length > 0) {
            console.log("\n✅ Voix générées avec succès !");

            console.log("⏭️ Étape 5 : Assemblage de l'épisode complet...");
            // assemblePodcast renvoie le chemin final du mp3 (ex: C:\...\output\podcast_final.mp3)
            const finalAudioPath = await assemblePodcast(audioSegments);

            if (finalAudioPath) {
                // --- L'ÉTAPE FINALE : DEPLOIEMENT GITHUB ---
                console.log("⏭️ Étape 6 : Publication sur GitHub...");
                await pushAudioToGitHub(finalAudioPath);
            }

        } else {
            console.log("\n⚠️ Aucun audio n'a pu être généré.");
        }
    } else {
        console.log("🛑 Échec de la génération du script.");
    }
}

runPipeline();