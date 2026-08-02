const ACTIVE_AUDIO_CLASS = 'active-audio';
let currentAudio = null;
let currentProgress = null;

function createAudioPlayer(track) {
  const wrapper = document.createElement('div');
  wrapper.className = 'audio-card';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'audio-button';
  button.textContent = 'Lire l’extrait';
  button.setAttribute('aria-label', `Lire l'extrait ${track.title}`);

  const progress = document.createElement('progress');
  progress.value = 0;
  progress.max = track.previewDuration || 45;
  progress.className = 'audio-progress';

  button.addEventListener('click', () => {
    if (currentAudio && currentAudio.src === track.audioPreview && !currentAudio.paused) {
      currentAudio.pause();
      button.textContent = 'Lire l’extrait';
      return;
    }

    if (currentAudio && currentAudio !== track.audioElement) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      if (currentProgress) {
        currentProgress.value = 0;
      }
    }

    if (!track.audioElement) {
      const audio = document.createElement('audio');
      audio.preload = 'none';
      audio.src = track.audioPreview;
      audio.controls = false;
      audio.dataset.previewDuration = track.previewDuration || 45;
      track.audioElement = audio;

      audio.addEventListener('timeupdate', () => {
        progress.value = Math.min(audio.currentTime, audio.dataset.previewDuration);
        if (audio.currentTime >= audio.dataset.previewDuration) {
          audio.pause();
          audio.currentTime = 0;
          button.textContent = 'Lire l’extrait';
          progress.value = 0;
        }
      });

      audio.addEventListener('ended', () => {
        button.textContent = 'Lire l’extrait';
        progress.value = 0;
      });

      audio.addEventListener('error', () => {
        button.textContent = 'Erreur de lecture';
      });
    }

    currentAudio = track.audioElement;
    currentProgress = progress;
    currentAudio.play().then(() => {
      button.textContent = 'Pause';
    }).catch(() => {
      button.textContent = 'Erreur de lecture';
    });
  });

  wrapper.appendChild(button);
  wrapper.appendChild(progress);
  return wrapper;
}

function initAudioPlayers() {
  const audioButtons = document.querySelectorAll('.audio-play-trigger');

  audioButtons.forEach(button => {
    const previewUrl = button.dataset.preview;
    const title = button.dataset.title;
    const duration = Number(button.dataset.duration) || 45;
    const track = { audioPreview: previewUrl, title, previewDuration: duration };
    const player = createAudioPlayer(track);
    button.replaceWith(player);
  });
}

document.addEventListener('DOMContentLoaded', initAudioPlayers);
