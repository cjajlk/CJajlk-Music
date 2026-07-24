function normalizeSearchText(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim();
}

function prepareSearchableText(track) {
  const parts = [
    track.title,
    track.artist,
    track.album,
    track.project,
    ...(track.themes || []),
    ...(track.keywords || [])
  ].filter(Boolean);

  return normalizeSearchText(parts.join(' '));
}

function matchesSearch(track, query) {
  const searchText = prepareSearchableText(track);
  return searchText.includes(normalizeSearchText(query));
}
