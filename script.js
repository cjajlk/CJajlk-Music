// CJajlk Music - Script principal

document.addEventListener('DOMContentLoaded', function() {
    
    // ===== FILTRAGE DES CHANSONS =====
    const filterButtons = document.querySelectorAll('.filter-btn');
    const musicCards = document.querySelectorAll('.music-card');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filterValue = this.getAttribute('data-filter');
            
            // Mettre à jour le bouton actif
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Afficher/masquer les cartes
            musicCards.forEach(card => {
                if (filterValue === 'all') {
                    card.classList.remove('hidden');
                } else {
                    if (card.classList.contains('filter-' + filterValue)) {
                        card.classList.remove('hidden');
                    } else {
                        card.classList.add('hidden');
                    }
                }
            });
        });
    });
    
    // Navigation lisse
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#' && document.querySelector(href)) {
                e.preventDefault();
                document.querySelector(href).scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    
    // Arrêter l'audio en cours lors du clic sur play d'une autre piste
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
        audio.addEventListener('play', function(e) {
            audioElements.forEach(a => {
                if (a !== audio) {
                    a.pause();
                }
            });
        });
    });
    
    // Limiter la lecture à 60 secondes
    const LIMIT_SECONDS = 60;
    
    const notice = document.getElementById("musicNotice");
    const closeNotice = document.getElementById("closeNotice");
    
    document.querySelectorAll("audio").forEach((audio) => {
        audio.addEventListener("timeupdate", () => {
            if (audio.currentTime >= LIMIT_SECONDS) {
                audio.pause();
                audio.currentTime = 0;
                notice.classList.remove("hidden");
            }
        });
    });
    
    closeNotice.addEventListener("click", () => {
        notice.classList.add("hidden");
    });
    
    // Gestion de la modal album
    const albumCard = document.getElementById('albumCard');
    const albumModal = document.getElementById('albumModal');
    const closeModal = document.querySelector('.close-modal');
    
    if (albumCard && albumModal) {
        albumCard.addEventListener('click', function(e) {
            e.stopPropagation();
            albumModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        });
        
        closeModal.addEventListener('click', function(e) {
            e.stopPropagation();
            albumModal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        });
        
        albumModal.addEventListener('click', function(e) {
            if (e.target === albumModal) {
                albumModal.classList.add('hidden');
                document.body.style.overflow = 'auto';
            }
        });
        
        // Fermer avec la touche Echap
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && !albumModal.classList.contains('hidden')) {
                albumModal.classList.add('hidden');
                document.body.style.overflow = 'auto';
            }
        });
    }
    
    console.log('CJajlk Music - Site chargé');
});
