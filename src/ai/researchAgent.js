require("dotenv").config();
const OpenAI = require("openai");

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// ON MODIFIE ICI : La fonction prend maintenant le sujet ET le nom de l'auteur
async function generatePodcastScript(winningSubject, authorName) {
    console.log(`\n🧠 Appel de GPT-4o pour la rédaction du script...`);
    console.log(`Sujet traité : "${winningSubject}" (proposé par ${authorName})\n`);

    const systemPrompt = `
    Tu es le showrunner et scénariste en chef d'un podcast tech d'avant-garde. 
    Ton objectif est de transformer une proposition de sujet (issue de Reddit) en un script audio complet, ultra-qualitatif, dynamique et très pédagogue, impliquant un casting de 4 personnes.

    RÈGLE ABSOLUE POUR L'INTRODUCTION :
    - L'animateur Mathis DOIT TOUJOURS commencer le podcast en rappelant brièvement le concept : "Une émission 100% générée par l'IA, où la communauté Reddit (sur r/CafePodcast) décide du sujet de la semaine."

    CASTING ET RÔLES :
    - "Mathis" : L'animateur principal. Il introduit le sujet, pose les questions candides, relance les débats et fait les transitions.
    - "Martino" : L'ingénieur/expert technique. Il explique le "comment ça marche" avec des mots simples.
    - "Louis" : Le chroniqueur "cas d'usage". Il donne des exemples très concrets ou apporte une touche d'humour.
    - "Sedra" : L'analyste visionnaire. Elle prend du recul, aborde les questions d'éthique, d'impact sociétal ou économique.

    CONTRAINTES DE FORMAT (STRICT) :
    - Structure du script : [Intro], [Segment 1 : Définition & Exemples], [Segment 2 : Enjeux & Débats], [Outro].
    - Format de sortie OBLIGATOIRE :
      [Mathis] : <texte>
      [Martino] : <texte>
      [Louis] : <texte>
      [Sedra] : <texte>
    - PONCTUATION : Termine TOUJOURS chaque réplique par un point de ponctuation fort (. ! ?) pour forcer la voix IA à finir sa phrase proprement.

    RÈGLES ÉDITORIALES :
    - DYNAMISME (PING-PONG) : Les répliques doivent être COURTES et percutantes. Maximum 2 à 3 phrases par prise de parole. Les chroniqueurs doivent s'interrompre, rebondir et se compléter rapidement. Évite absolument les longs monologues.
    - Vulgarise les termes techniques.
    - Interdiction absolue d'inventer des chiffres ou des statistiques.
    - CONCLUSION : La conclusion (outro) doit remercier chaleureusement le redditeur "${authorName}" pour son super commentaire, et inviter les auditeurs à proposer le sujet de la semaine prochaine sur r/CafePodcast.
    - Longueur : Rédige un script complet et consistant (environ 700 à 900 mots).
    `;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Voici le commentaire Reddit gagnant de la semaine. Écris le script de l'épisode sur cette base : "${winningSubject}"` }
            ],
            temperature: 0.75,
            frequency_penalty: 0.5,
            presence_penalty: 0.5,
        });

        const scriptContent = response.choices[0].message.content;
        console.log("✅ Script à 4 voix généré avec succès par l'IA (GPT-4o) !");
        return scriptContent;

    } catch (error) {
        console.error("❌ Erreur lors de la génération avec OpenAI :", error.message);
        return null;
    }
}

module.exports = { generatePodcastScript };