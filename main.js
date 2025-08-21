// Preloader
const loader = document.getElementById("preloader");
window.addEventListener("load", () => loader.style.display = "none");

// Mobile menu
const menuToggleBtn = document.querySelector('.menu-toggle');
const menuIcon = document.querySelector('#menu-icon');
const navbar = document.querySelector('.navbar');

menuToggleBtn?.addEventListener('click', ()=>{
  const expanded = menuToggleBtn.getAttribute('aria-expanded') === 'true';
  menuToggleBtn.setAttribute('aria-expanded', String(!expanded));
  menuIcon.classList.toggle('bx-x');
  navbar.classList.toggle('active');
});

// Active nav + sticky header
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('header nav a');
window.addEventListener('scroll', ()=>{
  sections.forEach(sec => {
    const top = window.scrollY;
    const offset = sec.offsetTop - 150;
    const height = sec.offsetHeight;
    const id = sec.getAttribute('id');
    if (top >= offset && top < offset + height) {
      navLinks.forEach(links => {
        links.classList.remove('active');
        const el = document.querySelector('header nav a[href*=' + id + ']');
        if (el) el.classList.add('active');
      });
    }
  });
  const header = document.querySelector('header');
  header.classList.toggle('sticky', window.scrollY > 100);

  // Close mobile menu when scrolling
  menuIcon.classList.remove('bx-x');
  navbar.classList.remove('active');
  menuToggleBtn?.setAttribute('aria-expanded', 'false');
});

// ScrollReveal
if (typeof ScrollReveal !== 'undefined') {
  ScrollReveal({ distance: '80px', duration: 2000, delay: 200 });
  ScrollReveal().reveal('.home-content, .heading', { origin: 'top' });
  ScrollReveal().reveal('.home-img, .expertise-container, .services-container, .portfolio-box, .contact form', { origin: 'bottom' });
  ScrollReveal().reveal('.home-content h1, .about-img', { origin: 'left' });
  ScrollReveal().reveal('.home-content p, .about-content', { origin: 'right' });
}

// Typed.js
if (typeof Typed !== 'undefined') {
  new Typed('.multiple-text', {
    strings: ['a MERN Stack Developer', 'an AI/ML Enthusiast', 'a CyberSecurity Enthusiast', 'an Ethical Hacking Enthusiast', 'an IITian'],
    typeSpeed: 100, backSpeed: 100, backDelay: 1000, loop: true
  });
}

// Netflix-style rail logic for Latest Projects
(function(){
  const rail       = document.querySelector('.rail');
  const railWindow = document.querySelector('.rail-window');
  const track      = document.querySelector('.rail-track');
  const prevBtn    = document.querySelector('.rail-prev');
  const nextBtn    = document.querySelector('.rail-next');

  // Ensure end-cap exists and is last
  function ensureEndcapLast() {
    if (!track) return;
    track.querySelectorAll('.rail-endcap').forEach(ec => ec.remove());
    const li = document.createElement('li');
    li.className = 'rail-endcap';
    li.setAttribute('aria-hidden','true');
    track.appendChild(li);
  }
  ensureEndcapLast();

  // Mobile class to enforce 1+peek layout
  const MOBILE_BP = 768; // increase to 900 if you want it on small tablets too
  function isMobileVW(){ return window.innerWidth <= MOBILE_BP; }
  function applyMobilePeek(){
    if (!rail) return;
    if (isMobileVW()) rail.classList.add('rail--mobilepeek');
    else rail.classList.remove('rail--mobilepeek');
  }
  applyMobilePeek();

  // Step = card width + gap, rounded to int (prevents DPI/zoom drift)
  function cardStep() {
    const first = track?.querySelector('.rail-card');
    if (!first) return railWindow?.clientWidth || 0;
    const rect = first.getBoundingClientRect();
    const styles = getComputedStyle(track);
    const gap = parseFloat(styles.gap || styles.columnGap || '0') || 12; // robust gap fallback
    const step = rect.width + gap;
    // Slightly inflate on mobile so rounding never fits 2 cards
    return Math.max(1, Math.round(isMobileVW() ? step * 1.02 : step));
  }

  function maxLeft() {
    return Math.max(0, railWindow.scrollWidth - railWindow.clientWidth);
  }

  // Debounced snap
  let snapT = null;
  function cancelSnap(){ if (snapT) { clearTimeout(snapT); snapT = null; } }
  function snapToNearest(delay=80){
    cancelSnap();
    snapT = setTimeout(()=>{
      const step = cardStep();
      if (!step) return;
      const nearest = Math.round(railWindow.scrollLeft / step) * step;
      const maxL = maxLeft();
      // More tolerance on mobile to avoid tugging into a 2-card alignment
      const tol = isMobileVW() ? Math.round(step * 0.18) : 0;
      const target = Math.min(maxL, Math.max(0, nearest));
      if (Math.abs(railWindow.scrollLeft - target) > tol){
        railWindow.scrollTo({ left: target, behavior: 'smooth' });
      }
    }, delay);
  }

  // Page by one card; clamp at ends with small tolerance
  function page(dir=1){
    cancelSnap();
    const step = cardStep();
    const maxL = maxLeft();
    const next = railWindow.scrollLeft + dir*step;
    const tol  = 0.5;
    if (dir>0 && next >= maxL - tol) { railWindow.scrollTo({ left:maxL, behavior:'smooth' }); return; }
    if (dir<0 && next <= 0 + tol)    { railWindow.scrollTo({ left:0,    behavior:'smooth' }); return; }
    railWindow.scrollTo({ left: Math.max(0, Math.min(next,maxL)), behavior:'smooth' });
  }

  function scrollLastIntoView(){
    const lastCard = track?.querySelector('.rail-card:last-of-type');
    if (!lastCard) return;
    lastCard.scrollIntoView({ behavior:'smooth', block:'nearest', inline:'end' });
  }

  prevBtn?.addEventListener('click', ()=> page(-1));
  nextBtn?.addEventListener('click', ()=>{
    const nearEnd = (maxLeft() - railWindow.scrollLeft) <= cardStep();
    page(1);
    if (nearEnd) setTimeout(scrollLastIntoView, 180);
  });

  // Show arrows on hover (desktop) via class toggle
  rail?.addEventListener('mouseenter', ()=> rail.classList.add('show-arrows'));
  rail?.addEventListener('mouseleave', ()=> rail.classList.remove('show-arrows'));

  // Only hijack wheel on non-touch (desktop) so phones keep natural swipe
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (!isTouch) {
    railWindow?.addEventListener('wheel', (e)=>{
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        railWindow.scrollLeft += e.deltaY;
        snapToNearest();
      }
    }, { passive:false });
  }

  // Drag to scroll
  let isDown = false, startX=0, startLeft=0;
  railWindow?.addEventListener('mousedown', (e)=>{
    isDown = true; railWindow.classList.add('dragging');
    startX = e.pageX; startLeft = railWindow.scrollLeft;
    cancelSnap();
  });
  window.addEventListener('mouseup', ()=>{
    if (!isDown) return;
    isDown = false; railWindow.classList.remove('dragging');
    snapToNearest(60);
  });
  window.addEventListener('mousemove', (e)=>{
    if (!isDown) return;
    railWindow.scrollLeft = startLeft - (e.pageX - startX);
  });

  // Keyboard
  railWindow?.addEventListener('keydown', (e)=>{
    if (e.key === 'ArrowRight') { e.preventDefault(); page(1); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); page(-1); }
  });

  // Resize
  let rT = null;
  window.addEventListener('resize', ()=>{
    clearTimeout(rT);
    rT = setTimeout(()=>{
      applyMobilePeek();
      ensureEndcapLast();
      snapToNearest(20);
    }, 100);
  });

  // Image loading strategy: eager first 2, lazy rest
  document.querySelectorAll('.rail-card img').forEach((img,i)=>{
    img.loading = i > 1 ? 'lazy' : 'eager';
    img.decoding = 'async';
  });
})();
