# 🎙️ Podcast Generator - Activ'ESAIP

Bienvenue sur le dépôt du **Podcast Generator**, un projet réalisé dans le cadre d'Activ'ESAIP.
Ce projet est un pipeline complet en Node.js permettant de générer automatiquement un podcast audio à 4 voix à partir d'un sujet issu de la communauté Reddit.

## 👥 L'Équipe
* **Axel** : Pôle Scraping & Data (Intégration Devvit/Reddit pour récupérer le sujet gagnant).
* **Mathis** : Pôle Orchestration, IA & Montage (Génération du script GPT-4o, architecture Node.js, mixage audio FFmpeg).
* **Louis & Sedra** : Pôle Voix & TTS (Intégration de l'API fal.ai, modèles vocaux Qwen-3-TTS, clonage et attribution des voix).

---

## ⚙️ Comment fonctionne le pipeline ?

1. **Ingestion** : Le script récupère le commentaire Reddit le plus upvoté depuis la branche `dev` du repository (`scrap/contents/top_comment.json`).
2. **Scénarisation** : L'IA (GPT-4o) rédige un script dynamique, pédagogue et structuré pour 4 chroniqueurs (Mathis, Martino, Louis, Sedra).
3. **Synthèse Vocale (TTS)** : Le texte est intelligemment découpé (chunking) et envoyé à l'API fal.ai pour générer les voix clonées des chroniqueurs.
4. **Mastering** : Le module `fluent-ffmpeg` assemble les pistes, ajoute le jingle d'introduction (`Café_Podcast_Jingle.mp3`), et normalise le volume au standard radio (EBU R128).
5. **Livraison** : Le fichier final `podcast_final.mp3` est généré dans le dossier `voice-generator/` et peut être poussé automatiquement sur GitHub.

---

## 🚀 Installation & Prérequis

### 1. Prérequis
Assurez-vous d'avoir installé sur votre machine :
* [Node.js](https://nodejs.org/) (version 18 ou supérieure recommandée)
* Git

### 2. Cloner le projet
```bash
git clone [https://github.com/MamatorHack/podcast-generator.git](https://github.com/MamatorHack/podcast-generator.git)
cd podcast-generator
git checkout dev

```

### 3. Installer les dépendances

Exécutez cette commande à la racine du projet pour installer les modules nécessaires (`axios`, `openai`, `dotenv`, `fluent-ffmpeg`, `ffmpeg-static`) :

```bash
npm install

```

---

## 🔐 Configuration (Fichier .env)

**⚠️ NE JAMAIS COMMIT LE FICHIER `.env` SUR GITHUB.** Assurez-vous qu'il est bien présent dans votre fichier `.gitignore`.

Créez un fichier nommé `.env` à la racine du projet et ajoutez vos clés API secrètes :

```env
OPENAI_API_KEY=sk-votre_cle_openai_ici
FAL_KEY=votre_cle_fal_ai_ici

```

---

## 📂 Structure du Projet requise

Pour que le script fonctionne parfaitement, vérifiez que l'arborescence suivante est respectée :

```text
podcast-generator/
│
├── .env                  # Vos clés API (ignoré par Git)
├── .gitignore            # Doit contenir node_modules/ et .env
├── package.json          # Dépendances Node.js
│
├── assets/
│   └── Café_Podcast_Jingle.mp3  # Le jingle d'intro du podcast
│
├── src/                  # Code source du backend
│   ├── index.js          # Chef d'orchestre (point d'entrée)
│   ├── ai/               # Agents OpenAI
│   ├── audio/            # Génération TTS et Mixage FFmpeg
│   ├── github/           # Scripts de push automatique
│   └── reddit/           # Récupération du JSON distant
│
└── voice-generator/      # Dossier de destination du produit fini
    └── podcast_final.mp3 # Le fichier généré atterrira ici

```

---

## 🎧 Lancer la génération

Une fois tout configuré, il suffit de lancer la commande suivante à la racine du projet :

```bash
node src/index.js

```

Le terminal affichera les étapes en temps réel :

1. Récupération du sujet.
2. Écriture du script à 4 voix.
3. Génération des segments audio.
4. Mixage et normalisation.
5. (Optionnel) Push du MP3 sur GitHub.

Le fichier final sera disponible dans le dossier `voice-generator/`. Bonne écoute ! 📻

```

```
