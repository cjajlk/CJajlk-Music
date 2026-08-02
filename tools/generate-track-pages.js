const fs = require('fs');
const path = require('path');

const SITE_BASE_URL = process.env.SITE_BASE_URL || 'https://example.com';
// À remplacer par le domaine officiel avant tout déploiement public.

const dataPath = path.join(__dirname, '..', 'data', 'songs.json');
const outputDir = path.join(__dirname, '..', 'titres');
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function normalizeUrl(url) {
  return String(url).replace(/\/+$/g, '');
}

function isValidSlug(slug) {
  return typeof slug === 'string' && SLUG_REGEX.test(slug);
}

function resolveOutputPath(slug) {
  const trackDir = path.join(outputDir, slug);
  const filePath = path.join(trackDir, 'index.html');
  const resolvedOutput = path.resolve(outputDir) + path.sep;
  const resolvedFile = path.resolve(filePath);

  if (!resolvedFile.startsWith(resolvedOutput)) {
    throw new Error(`Le chemin de sortie n'est pas contenu dans ${resolvedOutput} : ${resolvedFile}`);
  }

  return { trackDir, filePath };
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeJsonLdString(jsonString) {
  return String(jsonString)
    .replace(/</g, '\u003C')
    .replace(/>/g, '\u003E')
    .replace(/&/g, '\u0026')
    .replace(/\u2028/g, '\u2028')
    .replace(/\u2029/g, '\u2029');
}

function buildStructuredData(track) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MusicRecording',
    name: track.title || '',
    byArtist: {
      '@type': 'MusicGroup',
      name: track.artist || ''
    },
    genre: Array.isArray(track.themes) ? track.themes : [],
    datePublished: track.releaseDate || undefined,
    description: track.descriptionShort || '',
    image: track.ogImage || track.cover || '',
    url: `${normalizeUrl(SITE_BASE_URL)}/titres/${track.slug}/`
  };
}

function renderPage(track) {
  const title = track.seoTitle || `${track.title} — CJajlk Music`;
  const description = track.seoDescription || track.descriptionShort || '';
  const ogImage = track.ogImage || track.cover || '';
  const canonical = `${normalizeUrl(SITE_BASE_URL)}/titres/${track.slug}/`;
  const jsonLd = escapeJsonLdString(JSON.stringify(buildStructuredData(track), null, 2));

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="music.song">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:url" content="${canonical}">
  <meta name="twitter:card" content="summary_large_image">
  <script type="application/ld+json">
${jsonLd}
  </script>
  <link rel="stylesheet" href="../../assets/css/style.css">
</head>
<body>
  <header class="site-header">
    <nav class="site-nav">
      <a href="../../index.html">Accueil</a>
      <a href="../../catalogue.html">Catalogue</a>
      <a href="../../about.html">À propos</a>
      <a href="../../contact.html">Contact</a>
    </nav>
  </header>
  <main class="track-page">
    <section class="track-hero">
      <div class="track-cover-wrapper">
        <img src="../../${track.cover}" alt="${escapeHtml(track.title)}" class="track-cover">
      </div>
      <div class="track-details">
        <span class="track-status">${escapeHtml(track.status === 'available' ? 'Disponible' : 'Bientôt disponible')}</span>
        <h1>${escapeHtml(track.title)}</h1>
        <p class="track-artist">${escapeHtml(track.artist)}</p>
        <p class="track-meta">${escapeHtml(track.album || track.project || 'Titre musical')}</p>
      </div>
    </section>
    <section class="track-description">
      <p>${escapeHtml(track.descriptionLong)}</p>
    </section>
    <section class="track-audio">
      <audio controls preload="none" data-preview-duration="${track.previewDuration || 0}">
        <source src="../../${track.audioPreview}" type="audio/mp4">
        Votre navigateur ne supporte pas la lecture audio.
      </audio>
    </section>
  </main>
  <script src="../../assets/js/audio-player.js"></script>
</body>
</html>`;
}

function validateTrack(track) {
  const errors = [];

  if (!track || typeof track !== 'object') {
    errors.push('Track invalide ou absent.');
    return errors;
  }

  if (!track.id) {
    errors.push('Champ manquant : id');
  }
  if (!track.slug) {
    errors.push('Champ manquant : slug');
  } else if (!isValidSlug(track.slug)) {
    errors.push(`Slug invalide : ${track.slug}`);
  }
  if (!track.title) {
    errors.push('Champ manquant : title');
  }
  if (!track.artist) {
    errors.push('Champ manquant : artist');
  }

  return errors;
}

function main() {
  if (!fs.existsSync(dataPath)) {
    console.error('Fichier songs.json introuvable :', dataPath);
    process.exit(1);
  }

  const rawData = fs.readFileSync(dataPath, 'utf-8');
  let tracks;
  const errors = [];
  let generated = 0;
  let ignored = 0;

  try {
    tracks = JSON.parse(rawData);
  } catch (error) {
    console.error('Erreur de parsing de songs.json :', error.message);
    process.exit(1);
  }

  if (!Array.isArray(tracks)) {
    console.error('songs.json doit contenir un tableau.');
    process.exit(1);
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  tracks.forEach(track => {
    const trackErrors = validateTrack(track);
    if (trackErrors.length > 0) {
      ignored += 1;
      errors.push(`Titre ignoré (${track && track.id ? track.id : 'inconnu'}): ${trackErrors.join(', ')}`);
      return;
    }

    const { trackDir, filePath } = resolveOutputPath(track.slug);
    if (!fs.existsSync(trackDir)) {
      fs.mkdirSync(trackDir, { recursive: true });
    }

    try {
      fs.writeFileSync(filePath, renderPage(track), 'utf-8');
      generated += 1;
    } catch (error) {
      ignored += 1;
      errors.push(`Impossible d'écrire ${filePath}: ${error.message}`);
    }
  });

  console.log(`Pages générées : ${generated}`);
  console.log(`Titres ignorés : ${ignored}`);

  if (errors.length > 0) {
    console.error('Erreurs rencontrées :');
    errors.forEach(error => console.error(`- ${error}`));
  }
}

main();
