const axios = require('axios');

async function getWinningSubject() {
    // L'URL "Raw" de ton fichier sur la branche dev de ton repo GitHub
    const githubRawUrl = 'https://raw.githubusercontent.com/MamatorHack/podcast-generator/dev/scrap/contents/top_comment.json';

    try {
        console.log(`📡 Récupération du sujet gagnant depuis GitHub...`);

        // ⚠️ Si ton repo GitHub est PRIVÉ, il faudra ajouter un token d'accès ici. 
        // Si le repo est PUBLIC, cette ligne suffit amplement :
        const response = await axios.get(githubRawUrl);
        const commentData = response.data;

        console.log(`🏆 Sujet gagnant récupéré avec succès depuis le cloud !`);
        console.log(`Auteur : ${commentData.author}`);
        console.log(`Sujet : "${commentData.body}"`);
        console.log(`Score : ${commentData.score}`);

        return commentData;

    } catch (error) {
        console.error("❌ Erreur : Impossible de lire le fichier JSON sur GitHub.");
        if (error.response && error.response.status === 404) {
            console.error("👉 Le fichier n'existe pas à cette adresse ou le repository est privé (nécessite un token d'authentification).");
        } else {
            console.error(error.message);
        }
        return null;
    }
}

module.exports = { getWinningSubject };