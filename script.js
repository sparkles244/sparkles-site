const modal = document.getElementById('videoModal');
const iframe = document.getElementById('modalFrame');
const closeModalBtn = document.getElementById('closeModal');
const backdrop = document.getElementById('backdrop');

// Build YouTube embed URL
const ytUrl = (id) =>
  `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;

document.querySelectorAll('.orb').forEach(orb => {
  orb.addEventListener('click', () => {
    const id = orb.dataset.ytid;
    if (!id) return;
    iframe.src = ytUrl(id);
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  });
});

function closeModal(){
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  iframe.src = ''; // stop video
}

closeModalBtn.addEventListener('click', closeModal);
backdrop.addEventListener('click', closeModal);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
});
