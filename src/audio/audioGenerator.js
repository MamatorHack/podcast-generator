require('dotenv').config();
const axios = require('axios');

// Le mapping complet de ton casting vocal !
const VOICES = {
    "Mathis": "https://v3b.fal.media/files/b/0a8fa48d/dlkcedZS23VhgBRlVCGMC_tmp5aat1jn3.safetensors",
    "Louis": "https://v3b.fal.media/files/b/0a8fa498/jj_Q79Fp5vLQW28Pcd8o2_tmpfij442bs.safetensors",
    "Martino": "https://v3b.fal.media/files/b/0a8fa4a3/WUSzHYrEbo8L80yU0BT-K_tmp0sahqhdm.safetensors",
    "Sedra": "https://v3b.fal.media/files/b/0a8fa539/IX3okJcdm4xFR6kVyUZ5f_tmp1qbea3jj.safetensors"
};

// Fonction pour découper le texte généré par OpenAI en segments (Qui parle ? Que dit-il ?)
function parseScript(scriptText) {
    const segments = [];
    const regex = /\[(Mathis|Martino|Louis|Sedra)\]\s*:\s*([^\[]+)/g;
    let match;

    while ((match = regex.exec(scriptText)) !== null) {
        const speaker = match[1];
        const fullText = match[2].trim();

        // On sépare le long texte par phrases (en gardant les points, !, ?)
        const sentences = fullText.match(/[^.!?]+[.!?]+/g);

        // Si la regex ne trouve pas de ponctuation claire, on garde tout
        if (!sentences) {
            segments.push({ speaker, text: fullText });
            continue;
        }

        let currentChunk = "";
        const MAX_CHARS = 250; // La limite de sécurité pour éviter la coupure de Qwen TTS

        // On regroupe les petites phrases entre elles, mais on coupe si c'est trop long
        sentences.forEach(sentence => {
            if (currentChunk.length + sentence.length <= MAX_CHARS) {
                currentChunk += sentence + " ";
            } else {
                if (currentChunk.trim()) {
                    segments.push({ speaker, text: currentChunk.trim() });
                }
                currentChunk = sentence + " ";
            }
        });

        // On n'oublie pas d'ajouter le dernier morceau restant
        if (currentChunk.trim()) {
            segments.push({ speaker, text: currentChunk.trim() });
        }
    }
    return segments;
}

// Fonction pour envoyer un segment à fal.ai
// Fonction pour envoyer un segment à fal.ai
async function generateAudioSegment(text, speakerName, index) {
    console.log(`🎙️ [En cours] Segment ${index} - Voix de ${speakerName}...`);
    const voiceUrl = VOICES[speakerName];

    try {
        const response = await axios.post(
            'https://fal.run/fal-ai/qwen-3-tts/text-to-speech/0.6b',
            {
                // L'astuce magique : on force une pause d'une demi-seconde à la fin
                // pour que l'IA ait le temps de prononcer le dernier mot en entier.
                text: text + " ...",
                speaker_voice_embedding_file_url: voiceUrl
            },
            {
                headers: {
                    'Authorization': `Key ${process.env.FAL_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // Récupération de l'URL du fichier audio généré (.mp3 ou .wav)
        const audioUrl = response.data.audio?.url || response.data.url;
        console.log(`✅ [Succès] Segment ${index} généré : ${audioUrl}`);

        return { index, speakerName, audioUrl };

    } catch (error) {
        // On affiche l'erreur en détail si ça coince encore
        console.error(`❌ Erreur TTS pour le segment ${index} (${speakerName}) :`, JSON.stringify(error.response?.data || error.message, null, 2));
        return null;
    }
}

// Fonction principale qui orchestre le tout
async function processPodcastAudio(scriptText) {
    const segments = parseScript(scriptText);

    if (segments.length === 0) {
        console.log("🛑 Aucun segment vocal trouvé dans le script. Vérifie le format [Nom] : Texte.");
        return [];
    }

    console.log(`\n🎧 Découpage du script réussi : ${segments.length} répliques trouvées.`);
    console.log(`🚀 Lancement des générateurs de voix (cela peut prendre un moment)...\n`);

    const audioResults = [];

    // On utilise une boucle 'for' classique pour générer les audios un par un.
    // Cela évite de spammer l'API fal.ai et de se prendre une erreur "Rate Limit".
    for (let i = 0; i < segments.length; i++) {
        const result = await generateAudioSegment(segments[i].text, segments[i].speaker, i + 1);
        if (result) audioResults.push(result);
    }

    console.log("\n🎉 Toutes les générations audio sont terminées !");
    return audioResults;
}

module.exports = { processPodcastAudio };