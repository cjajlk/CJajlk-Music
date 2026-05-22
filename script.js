// CJajlk Music - Script principal

document.addEventListener('DOMContentLoaded', function() {
    
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
    
    console.log('CJajlk Music - Site chargé');
});
