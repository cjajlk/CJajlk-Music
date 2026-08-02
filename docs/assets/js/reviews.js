const REVIEWS_DATA_URL = 'data/reviews.json';

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function createReviewCard(review) {
  return `
    <article class="review-card">
      <h3>${escapeHtml(review.displayName || 'Anonyme')}</h3>
      <p>${escapeHtml(review.comment || '')}</p>
      <p><strong>Note :</strong> ${Number(review.rating) || 0}/5</p>
    </article>
  `;
}

function initReviews() {
  fetch(REVIEWS_DATA_URL)
    .then(response => {
      if (!response.ok) {
        throw new Error('Impossible de charger les avis.');
      }
      return response.json();
    })
    .then(reviews => {
      const publishedReviews = Array.isArray(reviews)
        ? reviews.filter(review => review.approved === true && review.isDemo === false)
        : [];

      const reviewsContainer = document.getElementById('publishedReviews');
      if (!reviewsContainer) {
        return;
      }

      if (publishedReviews.length === 0) {
        reviewsContainer.innerHTML = '<p>Aucun avis publié pour le moment. Soyez le premier à partager votre ressenti.</p>';
        return;
      }

      reviewsContainer.innerHTML = publishedReviews.map(createReviewCard).join('');
    })
    .catch(() => {
      const reviewsContainer = document.getElementById('publishedReviews');
      if (reviewsContainer) {
        reviewsContainer.innerHTML = '<p>Aucun avis publié pour le moment. Soyez le premier à partager votre ressenti.</p>';
      }
    });
}

document.addEventListener('DOMContentLoaded', initReviews);
