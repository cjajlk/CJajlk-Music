const SONGS_DATA_URL = 'data/songs.json';
const FEATURED_SLUG = 'ne-pars-pas';

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeText(text) {
  return escapeHtml(text);
}

function buildPlatformBadges(platforms) {
  if (!platforms || typeof platforms !== 'object') {
    return '';
  }

  return Object.entries(platforms)
    .filter(([, value]) => value)
    .map(([key, value]) => `<span class="platform-badge">${key}</span>`)
    .join('');
}

function createReviewCard(review) {
  return `
    <article class="review-card">
      <h3>${safeText(review.displayName)}</h3>
      <p class="review-badge">Démonstration</p>
      <p>${safeText(review.comment)}</p>
      <p><strong>Note :</strong> ${Number(review.rating) || 0}/5</p>
    </article>
  `;
}

function createTrackCard(track) {
  return `
    <article class="card">
      <h3>${safeText(track.title)}</h3>
      <p>${safeText(track.descriptionShort)}</p>
      <p><strong>Statut :</strong> ${safeText(track.status)}</p>
      <p><strong>Album :</strong> ${safeText(track.album || track.project || 'N/A')}</p>
    </article>
  `;
}

function fetchJson(url) {
  return fetch(url).then(response => {
    if (!response.ok) {
      throw new Error(`Impossible de charger ${url}`);
    }
    return response.json();
  });
}

function initIndex() {
  fetchJson(SONGS_DATA_URL)
    .then(songs => {
      const featured = songs.find(song => song.slug === FEATURED_SLUG) || songs.find(song => song.featured);
      if (featured) {
        const btn = document.getElementById('playFeatured');
        let audioPreview;

        btn.addEventListener('click', () => {
          if (!audioPreview) {
            audioPreview = document.createElement('audio');
            audioPreview.controls = true;
            audioPreview.preload = 'none';
            audioPreview.className = 'audio-preview-player';
            audioPreview.src = featured.audioPreview;
            document.body.appendChild(audioPreview);
          }
          audioPreview.play().catch(() => {});
        });

        const platformsContainer = document.getElementById('featuredPlatforms');
        platformsContainer.innerHTML = buildPlatformBadges(featured.platforms);
      }

      const comingSoonList = document.getElementById('comingSoonList');
      const soonTracks = songs.filter(song => song.status === 'coming-soon').slice(0, 3);

      if (soonTracks.length === 0) {
        comingSoonList.innerHTML = '<p>Aucun titre à venir pour le moment.</p>';
      } else {
        comingSoonList.innerHTML = soonTracks.map(track => {
          const cover = track.cover && track.cover.trim();
          const releaseDate = track.releaseDate ? `<span class="card-detail">${safeText(track.releaseDate)}</span>` : '';
          const coverHtml = cover ? `
            <div class="card-cover">
              <img src="${safeText(cover)}" alt="Pochette de ${safeText(track.title)}" loading="lazy" decoding="async" onerror="this.closest('.card-cover').classList.add('cover-missing'); this.remove();">
            </div>
          ` : `
            <div class="card-cover cover-missing">Pochette indisponible</div>
          `;

          return `
            <article class="card coming-soon-card">
              ${coverHtml}
              <div class="card-content">
                <div class="card-meta">
                  <span class="badge coming-soon">Bientôt disponible</span>
                  ${releaseDate}
                </div>
                <h3>${safeText(track.title)}</h3>
                <p>${safeText(track.descriptionShort)}</p>
                <a href="titres/${safeText(track.slug)}/" class="btn btn-tertiary">Voir la fiche</a>
              </div>
            </article>
          `;
        }).join('');
      }
    })
    .catch(() => {
      const comingSoonList = document.getElementById('comingSoonList');
      comingSoonList.innerHTML = '<p>Impossible de charger les titres pour le moment.</p>';
    });

  // Reviews are loaded separately by assets/js/reviews.js
}

function initContact() {
  fetchJson(SONGS_DATA_URL)
    .then(songs => {
      const selectTrack = document.getElementById('selectTrack');
      selectTrack.innerHTML += songs
        .map(track => `<option value="${safeText(track.slug)}">${safeText(track.title)}</option>`)
        .join('');

      const emailRequest = document.getElementById('emailRequest');
      const reviewTrack = document.getElementById('reviewTrack');
      const reviewNickname = document.getElementById('reviewNickname');
      const reviewRating = document.getElementById('reviewRating');
      const reviewComment = document.getElementById('reviewComment');
      const sendReviewEmail = document.getElementById('sendReviewEmail');

      reviewTrack.innerHTML += songs
        .map(track => `<option value="${safeText(track.slug)}">${safeText(track.title)}</option>`)
        .join('');

      function updateEmailButton() {
        const currentTrack = songs.find(song => song.slug === selectTrack.value);
        emailRequest.disabled = !currentTrack;
        emailRequest.classList.toggle('disabled', !currentTrack);
      }

      selectTrack.addEventListener('change', updateEmailButton);
      updateEmailButton();

      emailRequest.addEventListener('click', () => {
        const currentTrack = songs.find(song => song.slug === selectTrack.value);
        if (!currentTrack) {
          return;
        }

        const subject = `Demande d’achat — ${currentTrack.title}`;
        const body = `Bonjour,\r\n\r\nJe souhaite obtenir des informations sur l'achat du titre : ${currentTrack.title}.\r\n\r\nMerci.\r\n`;
        const mailto = `mailto:cjajlk@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailto;
      });

      if (sendReviewEmail) {
        sendReviewEmail.addEventListener('click', () => {
          const selectedTrack = songs.find(song => song.slug === reviewTrack.value);
          if (!selectedTrack) {
            alert('Veuillez sélectionner un titre pour votre avis.');
            return;
          }
          if (!reviewNickname.value.trim() || !reviewRating.value || !reviewComment.value.trim()) {
            alert('Merci de renseigner votre pseudonyme, votre note et votre commentaire.');
            return;
          }

          const subject = `Avis à valider — ${selectedTrack.title}`;
          const body = `Titre : ${selectedTrack.title}\r\nPseudonyme : ${reviewNickname.value.trim()}\r\nNote : ${reviewRating.value}/5\r\nCommentaire : ${reviewComment.value.trim()}\r\n\r\nVotre avis sera vérifié avant publication.`;
          const mailto = `mailto:cjajlk@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
          window.location.href = mailto;
        });
      }
    })
    .catch(() => {
      const selectTrack = document.getElementById('selectTrack');
      selectTrack.innerHTML = '<option>Aucun titre disponible</option>';
    });
}

function initNavigation() {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('main-nav');

  if (!toggle || !nav) {
    return;
  }

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });
}

function initPage() {
  initNavigation();
  if (document.body.classList.contains('index-page') && document.getElementById('playFeatured')) {
    initIndex();
  }
  if (document.body.classList.contains('contact-page')) {
    initContact();
  }
}

document.addEventListener('DOMContentLoaded', initPage);
