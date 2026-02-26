const { exec } = require('child_process');
const path = require('path');

// Fonction pour exécuter une commande bash via Node.js
function runCommand(command, cwd) {
    return new Promise((resolve, reject) => {
        exec(command, { cwd }, (error, stdout, stderr) => {
            if (error) {
                console.error(`❌ Erreur Git : ${error.message}`);
                return reject(error);
            }
            resolve(stdout || stderr);
        });
    });
}

async function pushAudioToGitHub(filePath) {
    console.log(`\n🚀 Début du déploiement (Lot Final) : Envoi sur GitHub...`);

    // On se place à la racine du projet (là où se trouve le dossier .git)
    const projectRoot = path.join(__dirname, '../../');

    try {
        console.log(`⏳ Ajout du fichier au prochain commit...`);
        await runCommand(`git add "${filePath}"`, projectRoot);

        console.log(`⏳ Création du commit...`);
        // On génère un message de commit avec la date pour éviter les conflits
        const date = new Date().toLocaleString('fr-FR').replace(/[: ]/g, '-');
        await runCommand(`git commit -m "🎙️ Auto-publication : Nouvel épisode généré par l'IA le ${date}"`, projectRoot);

        console.log(`⏳ Envoi vers le repository distant...`);
        // 'HEAD' indique à Git de pousser sur la branche sur laquelle tu te trouves (ex: dev)
        const pushResult = await runCommand(`git push origin HEAD`, projectRoot);

        console.log(`\n🎉 [SUCCÈS] Épisode publié sur GitHub !`);
        console.log(`Infos : ${pushResult}`);
        return true;

    } catch (error) {
        console.log(`\n⚠️ L'envoi a échoué. Vérifie que tu as bien les droits (SSH/Token) pour push sur le repo.`);
        // Note : Si git dit "nothing to commit", c'est que le fichier est déjà sur GitHub et n'a pas été modifié.
        return false;
    }
}

module.exports = { pushAudioToGitHub };