const SONGS_DATA_URL = 'data/songs.json';
const REVIEWS_DATA_URL = 'data/reviews-demo.json';
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
      const soonTracks = songs.filter(song => song.status === 'coming-soon');

      if (soonTracks.length === 0) {
        comingSoonList.innerHTML = '<p>Aucun titre à venir pour le moment.</p>';
      } else {
        comingSoonList.innerHTML = soonTracks.map(track => `
          <article class="card">
            <h3>${safeText(track.title)}</h3>
            <p>${safeText(track.descriptionShort)}</p>
            <p><strong>Statut :</strong> Bientôt disponible</p>
          </article>
        `).join('');
      }
    })
    .catch(() => {
      const comingSoonList = document.getElementById('comingSoonList');
      comingSoonList.innerHTML = '<p>Impossible de charger les titres pour le moment.</p>';
    });

  fetchJson(REVIEWS_DATA_URL)
    .then(reviews => {
      const demoReviews = reviews.slice(0, 2);
      const reviewsContainer = document.getElementById('demoReviews');
      reviewsContainer.innerHTML = demoReviews.map(createReviewCard).join('');
    })
    .catch(() => {
      const reviewsContainer = document.getElementById('demoReviews');
      reviewsContainer.innerHTML = '<p>Impossible de charger les avis de démonstration.</p>';
    });
}

function initContact() {
  fetchJson(SONGS_DATA_URL)
    .then(songs => {
      const selectTrack = document.getElementById('selectTrack');
      selectTrack.innerHTML += songs
        .map(track => `<option value="${safeText(track.slug)}">${safeText(track.title)}</option>`)
        .join('');

      const emailRequest = document.getElementById('emailRequest');

      function updateEmailButton() {
        const currentTrack = songs.find(song => song.slug === selectTrack.value);
        if (!currentTrack) {
          emailRequest.disabled = true;
          emailRequest.classList.add('disabled');
          return;
        }

        emailRequest.disabled = false;
        emailRequest.classList.remove('disabled');
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
