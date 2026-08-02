const SONGS_DATA_URL = 'data/songs.json';
const INITIAL_DISPLAY = 12;
let allTracks = [];
let displayedCount = 0;
let currentFilteredTracks = [];
let audioPreviewPlayer = null;

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeSearchText(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim();
}

function trackMatches(track, query) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return true;
  }

  const searchFields = [
    track.title,
    track.artist,
    track.performer,
    track.album,
    track.project,
    ...(track.themes || []),
    ...(track.keywords || [])
  ].filter(Boolean);

  return searchFields.some(field => normalizeSearchText(field).includes(normalizedQuery));
}

function filterTracks() {
  const searchValue = document.getElementById('searchInput').value;
  const artistValue = document.getElementById('filterArtist').value;
  const statusValue = document.getElementById('filterStatus').value;
  const themeValue = document.getElementById('filterTheme').value;
  const yearValue = document.getElementById('filterYear').value;
  const purchasableValue = document.getElementById('filterPurchasable').value;

  return allTracks.filter(track => {
    if (!trackMatches(track, searchValue)) {
      return false;
    }

    if (artistValue && artistValue !== 'all' && track.artist !== artistValue) {
      return false;
    }

    if (statusValue && statusValue !== 'all' && track.status !== statusValue) {
      return false;
    }

    if (themeValue && themeValue !== 'all' && !(track.themes || []).includes(themeValue)) {
      return false;
    }

    if (yearValue && yearValue !== 'all' && String(track.releaseYear) !== yearValue) {
      return false;
    }

    if (purchasableValue === 'yes' && !track.purchasable) {
      return false;
    }

    if (purchasableValue === 'no' && track.purchasable) {
      return false;
    }

    return true;
  });
}

function sortTracks(tracks) {
  const sortValue = document.getElementById('sortOrder').value;

  return tracks.slice().sort((a, b) => {
    if (sortValue === 'date') {
      const aDate = a.releaseYear || 0;
      const bDate = b.releaseYear || 0;
      return bDate - aDate;
    }
    return normalizeSearchText(a.title).localeCompare(normalizeSearchText(b.title));
  });
}

function renderTrackCard(track) {
  const statusLabel = track.status === 'available' ? 'Disponible' : 'À venir';
  const statusClass = track.status === 'available' ? 'available' : 'coming-soon';
  const purchasableLabel = track.purchasable ? 'Achetables' : 'Non achetables';

  const previewButton = track.audioPreview
    ? `<button type="button" class="btn btn-tertiary preview-button" data-preview="${escapeHtml(track.audioPreview)}" data-duration="${escapeHtml(String(track.previewDuration != null ? track.previewDuration : 45))}">Écouter l’extrait</button>`
    : `<span class="preview-unavailable">Extrait momentanément indisponible</span>`;

  const kofiButton = track.kofiUrl
    ? `<a href="${escapeHtml(track.kofiUrl)}" class="btn btn-primary" target="_blank" rel="noreferrer">Ko-fi</a>`
    : '';

  const subtitleParts = [];
  if (track.artist) {
    subtitleParts.push(track.artist);
  }
  const projectOrAlbum = track.project || track.album;
  if (projectOrAlbum) {
    subtitleParts.push(projectOrAlbum);
  }
  const subtitleText = subtitleParts.length > 0 ? subtitleParts.join(' · ') : '';

  const descriptionText = track.descriptionShort ? escapeHtml(track.descriptionShort) : '';
  return `
    <article class="card catalogue-card" id="${escapeHtml(track.slug)}">
      <div class="card-cover">
        <img src="${escapeHtml(track.cover || '')}" alt="Pochette de ${escapeHtml(track.title)}" onerror="this.closest('.card-cover').classList.add('cover-missing'); this.style.display='none';">
      </div>
      <div class="card-content">
        <h3>${escapeHtml(track.title)}</h3>
        ${subtitleText ? `<p class="track-subtitle">${escapeHtml(subtitleText)}</p>` : ''}
        ${descriptionText ? `<p>${descriptionText}</p>` : ''}
        <div class="card-meta">
          <span class="badge ${statusClass}">${statusLabel}</span>
          <span class="badge">${escapeHtml(track.releaseYear || '—')}</span>
          <span class="badge">${escapeHtml(purchasableLabel)}</span>
        </div>
        <div class="card-actions">
          <a href="titres/${escapeHtml(track.slug)}/" class="btn btn-secondary">Découvrir le titre</a>
          ${previewButton}
          ${kofiButton}
        </div>
      </div>
    </article>
  `;
}

function updateResultCount(filteredTracks) {
  const countElement = document.getElementById('resultCount');
  countElement.textContent = `${filteredTracks.length} titre${filteredTracks.length > 1 ? 's' : ''}`;
}

function renderCatalogue(filteredTracks) {
  const catalogueCards = document.getElementById('catalogueCards');
  const noResults = document.getElementById('noResults');
  const showMore = document.getElementById('showMore');

  if (filteredTracks.length === 0) {
    catalogueCards.innerHTML = '';
    noResults.classList.remove('hidden');
    showMore.classList.add('hidden');
    return;
  }

  noResults.classList.add('hidden');
  displayedCount = Math.min(filteredTracks.length, INITIAL_DISPLAY);
  catalogueCards.innerHTML = filteredTracks.slice(0, displayedCount).map(renderTrackCard).join('');
  showMore.classList.toggle('hidden', displayedCount >= filteredTracks.length);
}

function handleShowMore() {
  const showMore = document.getElementById('showMore');
  showMore.addEventListener('click', () => {
    displayedCount = Math.min(currentFilteredTracks.length, displayedCount + INITIAL_DISPLAY);
    const catalogueCards = document.getElementById('catalogueCards');
    catalogueCards.innerHTML = currentFilteredTracks.slice(0, displayedCount).map(renderTrackCard).join('');
    showMore.classList.toggle('hidden', displayedCount >= currentFilteredTracks.length);
  });
}

function initPreviewButtons() {
  const catalogueCards = document.getElementById('catalogueCards');
  let previewDuration = 45;
  let activeButton = null;

  catalogueCards.addEventListener('click', event => {
    const button = event.target.closest('.preview-button');
    if (!button) {
      return;
    }

    const previewSrc = button.dataset.preview;
    const previewUrl = new URL(previewSrc, location.href).href;
    const duration = Number(button.dataset.duration) || 45;
    previewDuration = duration;

    if (!previewSrc) {
      return;
    }

    if (!audioPreviewPlayer) {
      audioPreviewPlayer = document.createElement('audio');
      audioPreviewPlayer.preload = 'none';
      audioPreviewPlayer.controls = false;
      audioPreviewPlayer.className = 'audio-preview-player';
      document.body.appendChild(audioPreviewPlayer);

      audioPreviewPlayer.addEventListener('playing', () => {
        if (activeButton) {
          activeButton.textContent = 'Pause';
        }
      });

      audioPreviewPlayer.addEventListener('pause', () => {
        if (activeButton) {
          activeButton.textContent = 'Écouter l’extrait';
        }
      });

      audioPreviewPlayer.addEventListener('timeupdate', () => {
        if (audioPreviewPlayer.currentTime >= previewDuration) {
          audioPreviewPlayer.pause();
          audioPreviewPlayer.currentTime = 0;
          if (activeButton) {
            activeButton.textContent = 'Écouter l’extrait';
          }
        }
      });

      audioPreviewPlayer.addEventListener('ended', () => {
        if (activeButton) {
          activeButton.textContent = 'Écouter l’extrait';
        }
      });
    }

    const isSameTrack = audioPreviewPlayer.currentSrc === previewUrl;
    const isPlaying = !audioPreviewPlayer.paused;

    if (activeButton && activeButton !== button) {
      if (!audioPreviewPlayer.paused) {
        audioPreviewPlayer.pause();
      }
      audioPreviewPlayer.currentTime = 0;
      activeButton.textContent = 'Écouter l’extrait';
    }

    activeButton = button;

    if (!isSameTrack) {
      audioPreviewPlayer.src = previewSrc;
      audioPreviewPlayer.currentTime = 0;
      audioPreviewPlayer.play().then(() => {
        button.textContent = 'Pause';
      }).catch(() => {
        button.textContent = 'Erreur de lecture';
      });
      return;
    }

    if (isPlaying) {
      audioPreviewPlayer.pause();
      button.textContent = 'Écouter l’extrait';
      return;
    }

    audioPreviewPlayer.play().then(() => {
      button.textContent = 'Pause';
    }).catch(() => {
      button.textContent = 'Erreur de lecture';
    });
  });
}

function populateFilters(tracks) {
  const artistSelect = document.getElementById('filterArtist');
  const statusSelect = document.getElementById('filterStatus');
  const themeSelect = document.getElementById('filterTheme');
  const yearSelect = document.getElementById('filterYear');
  const purchasableSelect = document.getElementById('filterPurchasable');
  const sortSelect = document.getElementById('sortOrder');

  const artists = [...new Set(tracks.map(track => track.artist).filter(artist => artist && artist !== 'CJajlk Music'))].sort();
  const themes = [...new Set(tracks.flatMap(track => track.themes || []).filter(Boolean))].sort();
  const years = [...new Set(tracks.map(track => track.releaseYear).filter(Boolean))].sort((a, b) => b - a);

  artistSelect.innerHTML = `<option value="all">Tous les artistes</option>${artists.map(artist => `<option value="${artist}">${artist}</option>`).join('')}`;
  statusSelect.innerHTML = `<option value="all">Tous les statuts</option><option value="available">Disponible</option><option value="coming-soon">Bientôt</option>`;
  themeSelect.innerHTML = `<option value="all">Tous les thèmes</option>${themes.map(theme => `<option value="${theme}">${theme}</option>`).join('')}`;
  yearSelect.innerHTML = `<option value="all">Toutes les années</option>${years.map(year => `<option value="${year}">${year}</option>`).join('')}`;
  purchasableSelect.innerHTML = `<option value="all">Tous</option><option value="yes">Achetables</option><option value="no">Non achetables</option>`;
  sortSelect.innerHTML = `<option value="title">Trier par titre</option><option value="date">Trier par date</option>`;
}

function applyFilters() {
  currentFilteredTracks = sortTracks(filterTracks());
  updateResultCount(currentFilteredTracks);
  renderCatalogue(currentFilteredTracks);
}

function initCatalogue() {
  fetch(SONGS_DATA_URL)
    .then(response => {
      if (!response.ok) {
        throw new Error('Impossible de charger songs.json');
      }
      return response.json();
    })
    .then(tracks => {
      allTracks = tracks;
      populateFilters(tracks);
      applyFilters();

      document.getElementById('searchInput').addEventListener('input', applyFilters);
      document.getElementById('filterArtist').addEventListener('change', applyFilters);
      document.getElementById('filterStatus').addEventListener('change', applyFilters);
      document.getElementById('filterTheme').addEventListener('change', applyFilters);
      document.getElementById('filterYear').addEventListener('change', applyFilters);
      document.getElementById('filterPurchasable').addEventListener('change', applyFilters);
      document.getElementById('sortOrder').addEventListener('change', applyFilters);
      handleShowMore();
      initPreviewButtons();
      document.getElementById('resetFilters').addEventListener('click', () => {
        document.getElementById('searchInput').value = '';
        document.getElementById('filterArtist').value = 'all';
        document.getElementById('filterStatus').value = 'all';
        document.getElementById('filterTheme').value = 'all';
        document.getElementById('filterYear').value = 'all';
        document.getElementById('filterPurchasable').value = 'all';
        document.getElementById('sortOrder').value = 'title';
        applyFilters();
      });
    })
    .catch(() => {
      const catalogueCards = document.getElementById('catalogueCards');
      catalogueCards.innerHTML = '<p>Impossible de charger les titres. Veuillez réessayer plus tard.</p>';
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
  initCatalogue();
}

document.addEventListener('DOMContentLoaded', initPage);
