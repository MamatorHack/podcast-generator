const fs = require('fs');
const path = require('path');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

ffmpeg.setFfmpegPath(ffmpegPath);

async function downloadFile(url, dest) {
    const response = await axios({ url, method: 'GET', responseType: 'stream' });
    return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(dest);
        response.data.pipe(writer);
        let error = null;
        writer.on('error', err => { error = err; writer.close(); reject(err); });
        writer.on('close', () => { if (!error) resolve(dest); });
    });
}

async function assemblePodcast(audioSegments) {
    console.log(`\n🎧 Début du montage et du mastering audio...`);

    const outputDir = path.join(__dirname, '../../voice-generator');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    const localFiles = [];
    const finalPodcastPath = path.join(outputDir, 'podcast_final.mp3');
    const listFilePath = path.join(outputDir, 'files.txt');

    // --- NOUVEAUTÉ : Gestion du Jingle ---
    // On pointe vers le dossier 'assets' à la racine de ton projet
    const jingleSrc = path.join(__dirname, '../../assets/Café_Podcast_Jingle.mp3');
    const jingleDest = path.join(outputDir, '00_jingle.mp3'); // Nommé "00" pour être sûr qu'il soit le premier

    if (fs.existsSync(jingleSrc)) {
        console.log(`🎵 Jingle 'Café_Podcast_Jingle' trouvé ! Ajout au tout début de l'épisode.`);
        fs.copyFileSync(jingleSrc, jingleDest);
        localFiles.push(jingleDest); // On l'ajoute en TOUT PREMIER dans la liste à mixer
    } else {
        console.log(`⚠️ Jingle introuvable (attendu ici : ${jingleSrc}). Le podcast commencera sans intro.`);
    }
    // -------------------------------------

    console.log(`⬇️ Téléchargement des ${audioSegments.length} segments vocaux...`);
    for (const segment of audioSegments) {
        // On formate l'index avec un zéro devant (ex: 01, 02) pour garder l'ordre alphabétique
        const fileName = `segment_${String(segment.index).padStart(2, '0')}_${segment.speakerName}.mp3`;
        const filePath = path.join(outputDir, fileName);
        await downloadFile(segment.audioUrl, filePath);
        localFiles.push(filePath); // On ajoute les voix À LA SUITE du jingle
    }
    console.log(`✅ Téléchargements terminés.`);

    // Création de la liste de lecture FFmpeg (le jingle sera ligne 1)
    const fileContent = localFiles.map(f => `file '${path.basename(f)}'`).join('\n');
    fs.writeFileSync(listFilePath, fileContent);

    console.log(`🎛️ Mastering en cours (Assemblage Jingle + Voix et Normalisation)...`);

    return new Promise((resolve, reject) => {
        ffmpeg()
            .input(listFilePath)
            .inputOptions(['-f concat', '-safe 0'])
            .outputOptions([
                // Normalisation professionnelle EBU R128 : lissera le volume du jingle ET des voix
                '-af loudnorm=I=-16:LRA=11:TP=-1.5',
                '-c:a libmp3lame',
                '-q:a 2'
            ])
            .on('error', (err) => {
                console.error('❌ Erreur lors du mastering FFmpeg :', err.message);
                reject(err);
            })
            .on('end', () => {
                console.log(`\n🎉 MASTERING TERMINÉ !`);
                console.log(`Ton épisode est parfait et prêt à être écouté ici : ${finalPodcastPath}`);

                localFiles.forEach(file => fs.unlinkSync(file));
                fs.unlinkSync(listFilePath);

                resolve(finalPodcastPath);
            })
            .save(finalPodcastPath);
    });
}

module.exports = { assemblePodcast };