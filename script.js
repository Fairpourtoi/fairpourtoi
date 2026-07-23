/* ==========================================================
   Fair Pour Toi — script.js    FAIR POUR TOI  COPYRIGHT 2026.  ALL RIGHTS RESERVED 220726.1
   ========================================================== */

try {
  emailjs.init({ publicKey: "H8Lwq9IIsnMZ2zH0T" });
} catch (error) {
  console.error('EmailJS failed to load — contact form will not work, but the rest of the site will function normally.', error);
}

  // Light-touch content protection: deters casual copying, not a real security measure.
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  document.addEventListener('dragstart', (e) => {
    if (e.target.tagName === 'IMG') e.preventDefault();
  });

  window.addEventListener('scroll', () => {
    document.getElementById('main-nav').classList.toggle('scrolled', window.scrollY > 60);
  });

  function toggleMenu() { document.getElementById('mobile-menu').classList.toggle('open'); }
  function closeMenu() { document.getElementById('mobile-menu').classList.remove('open'); }

  window.addEventListener('scroll', () => {
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu.classList.contains('open')) { closeMenu(); }
  });

  let aboutCurrent = 0;
  let aboutAutoTimer;
  const ABOUT_REAL_SLIDES = 2;

  function aboutGoTo(n, animate = true) {
    const track = document.getElementById('about-track');
    track.style.transition = animate ? 'transform 1.5s cubic-bezier(.4,0,.2,1)' : 'none';
    track.style.transform = `translateX(-${n * 100}%)`;
    aboutCurrent = n;
    document.querySelectorAll('.about-dot').forEach((d,i) => {
      d.style.background = (i === n % ABOUT_REAL_SLIDES) ? 'white' : 'rgba(255,255,255,.4)';
    });
    if (n === ABOUT_REAL_SLIDES) {
      setTimeout(() => {
        track.style.transition = 'none';
        track.style.transform = 'translateX(0%)';
        aboutCurrent = 0;
      }, 1500);
    }
  }

  function hideSwipeHint() {
    const hint = document.querySelector('.swipe-hint');
    if (hint) hint.style.display = 'none';
  }

  function aboutCarousel(direction) {
    if (direction > 0) {
      aboutGoTo(aboutCurrent + 1);
    } else {
      aboutGoTo((aboutCurrent - 1 + ABOUT_REAL_SLIDES) % ABOUT_REAL_SLIDES);
    }
    hideSwipeHint();
  }

  let touchStartX = 0;
  let touchEndX = 0;
  let aboutJustSwiped = false;
  const aboutCarouselEl = document.querySelector('.about-carousel');
  if (aboutCarouselEl) {
    aboutCarouselEl.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
    aboutCarouselEl.addEventListener('touchend', (e) => { touchEndX = e.changedTouches[0].screenX; handleSwipe(); }, { passive: true });
  }
  function handleSwipe() {
    const swipeThreshold = 40;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > swipeThreshold) { aboutJustSwiped = true; aboutCarousel(diff > 0 ? 1 : -1); }
  }
  if (aboutCarouselEl) {
    aboutCarouselEl.addEventListener('click', (e) => {
      if (aboutJustSwiped) { aboutJustSwiped = false; return; }
      if (e.target.closest('button')) return;
      const rect = aboutCarouselEl.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      aboutCarousel(clickX < rect.width / 2 ? -1 : 1);
    });
  }

  let fairEventCurrent = 0;
  const fairEventSlides = document.querySelectorAll('.fair-event-slide');
  function fairEventGoTo(n) {
    if (!fairEventSlides.length) return;
    fairEventSlides[fairEventCurrent].classList.remove('active');
    fairEventCurrent = (n + fairEventSlides.length) % fairEventSlides.length;
    fairEventSlides[fairEventCurrent].classList.add('active');
  }
  function fairEventCarousel(direction) { fairEventGoTo(fairEventCurrent + direction); }

  function scheduleFairEventAdvance() {
    const dwellTime = (fairEventCurrent === 0) ? 7000 : 6000;
    setTimeout(() => {
      fairEventCarousel(1);
      scheduleFairEventAdvance();
    }, dwellTime);
  }

  let fairEventTouchStartX = 0;
  let fairEventTouchEndX = 0;
  let fairEventJustSwiped = false;
  const fairEventCarouselEl = document.querySelector('.fair-event-carousel');
  if (fairEventCarouselEl) {
    fairEventCarouselEl.addEventListener('touchstart', (e) => { fairEventTouchStartX = e.changedTouches[0].screenX; }, { passive: true });
    fairEventCarouselEl.addEventListener('touchend', (e) => {
      fairEventTouchEndX = e.changedTouches[0].screenX;
      const diff = fairEventTouchStartX - fairEventTouchEndX;
      if (Math.abs(diff) > 40) { fairEventJustSwiped = true; fairEventCarousel(diff > 0 ? 1 : -1); }
    }, { passive: true });
    fairEventCarouselEl.addEventListener('click', (e) => {
      if (fairEventJustSwiped) { fairEventJustSwiped = false; return; }
      if (e.target.closest('button')) return;
      const rect = fairEventCarouselEl.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      fairEventCarousel(clickX < rect.width / 2 ? -1 : 1);
    });
  }

  async function sendContactForm(event) {
    event.preventDefault();
    const form = document.getElementById('contact-form');
    const status = document.getElementById('form-status');
    const btn = document.getElementById('submit-btn');
    const formData = new FormData(form);
    const wantsUpdates = formData.has('subscribe');
    const contactEmail = formData.get('email');
    const templateParams = {
      name: formData.get('name'),
      email: contactEmail,
      subject: formData.get('subject'),
      message: formData.get('message'),
      subscribe: wantsUpdates ? 'YES!' : ''
    };
    btn.textContent = 'Sending...';
    btn.disabled = true;
    try {
      await emailjs.send('service_9iwnim1', 'template_hjb8edc', templateParams);
      form.reset();
      status.textContent = '* We have received your inquiry, Thank you. * ';
      btn.textContent = 'Send another message';
      setTimeout(() => { status.textContent = ''; btn.textContent = 'Send message'; btn.disabled = false; }, 5000);

      if (wantsUpdates && contactEmail) {
        addToMailchimp(contactEmail, () => {}, (err) => { console.error('Mailchimp signup (from Contact form) failed:', err); });
      }
    } catch (error) {
      console.error('EmailJS Error:', error);
      status.textContent = 'Something went wrong. Please try again.';
      btn.textContent = 'Send message';
      btn.disabled = false;
    }
  }

  function addToMailchimp(email, onSuccess, onError) {
    const callbackName = 'mcCallback_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
    const params = new URLSearchParams({
      u: '723d9955a559dd14c58cd30b4',
      id: '384c8af3db',
      f_id: '0037c3e1f0',
      EMAIL: email,
      'b_723d9955a559dd14c58cd30b4_384c8af3db': '',
      c: callbackName
    });

    let timeoutId;
    window[callbackName] = function(data) {
      clearTimeout(timeoutId);
      delete window[callbackName];
      script.remove();
      if (data.result === 'success') {
        onSuccess(false);
      } else if (data.msg && data.msg.toLowerCase().includes('already subscribed')) {
        onSuccess(true);
      } else {
        onError(data.msg);
      }
    };

    const script = document.createElement('script');
    script.src = 'https://fairpourtoi.us13.list-manage.com/subscribe/post-json?' + params.toString();
    timeoutId = setTimeout(() => {
      delete window[callbackName];
      script.remove();
      onError('timeout');
    }, 10000);
    document.body.appendChild(script);
  }

  function sendSubscribeForm(event) {
    event.preventDefault();
    const status = document.getElementById('subscribe-status');
    const btn = document.getElementById('subscribe-btn');
    const emailField = document.getElementById('subscribe-email');
    const email = emailField.value;

    btn.textContent = 'Subscribing...';
    btn.disabled = true;

    addToMailchimp(email, (alreadySubscribed) => {
      emailField.value = '';
      status.innerHTML = alreadySubscribed
        ? "Looks like you're already on the list! <a href=\"#hero\" style=\"color:white; text-decoration:underline;\">Back to top &uarr;</a>"
        : "Thank you for subscribing 🥂! <a href=\"#hero\" style=\"color:white; text-decoration:underline;\">Back to top &uarr;</a>";
      btn.textContent = 'Subscribed';
      setTimeout(() => { status.innerHTML = ''; btn.textContent = 'Subscribe'; btn.disabled = false; }, 12000);
    }, () => {
      status.textContent = 'Something went wrong. Please try again.';
      btn.textContent = 'Subscribe';
      setTimeout(() => { status.textContent = ''; btn.disabled = false; }, 6000);
    });
  }

  function sendPopupSubscribeForm(event) {
    event.preventDefault();
    const status = document.getElementById('popup-subscribe-status');
    const btn = document.getElementById('popup-subscribe-btn');
    const emailField = document.getElementById('popup-subscribe-email');
    const email = emailField.value;

    btn.textContent = 'Subscribing...';
    btn.disabled = true;

    addToMailchimp(email, (alreadySubscribed) => {
      emailField.value = '';
      status.textContent = alreadySubscribed
        ? "Looks like you're already on the list!"
        : "Thank you for subscribing 🥂!";
      btn.textContent = 'Subscribed';
      try { localStorage.setItem('fpt_popup_dismissed', 'true'); } catch (e) {}
      setTimeout(closePopup, 2000);
    }, () => {
      status.textContent = 'Something went wrong. Please try again.';
      btn.textContent = 'Subscribe';
      setTimeout(() => { status.textContent = ''; btn.disabled = false; }, 6000);
    });
  }

  function checkPopup() {
    let dismissed = false;
    try { dismissed = localStorage.getItem('fpt_popup_dismissed') === 'true'; } catch (e) {}
    if (dismissed) return;
    document.getElementById('sale-popup').style.display = 'flex';
  }
  function closePopup() { document.getElementById('sale-popup').style.display = 'none'; }
  function dismissPopupForever() {
    try { localStorage.setItem('fpt_popup_dismissed', 'true'); } catch (e) {}
    closePopup();
  }

  const fairEventCarouselWrap = document.querySelector('.fair-event-carousel-wrap');
  if (fairEventCarouselWrap) {
    const fairEventObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          scheduleFairEventAdvance();
          fairEventObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    fairEventObserver.observe(fairEventCarouselWrap);
  }

  window.addEventListener('load', () => {
    aboutAutoTimer = setInterval(() => aboutGoTo((aboutCurrent + 1) % 2), 8000);
    setTimeout(checkPopup, 20000);
  });

/* ===== FADE-IN OBSERVER ===== */
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.fade-in-up').forEach((el) => {
    observer.observe(el);
  });

/* ===== FUTURE SHOP SECTION (JS ready, not yet used in HTML — see future-shop-section.html) ===== */
/* SHOP CARD CAROUSELS (4 cards, 4 images each) */
const shopCardState = { 0:0, 1:0, 2:0, 3:0 };
const SHOP_SLIDES_PER_CARD = 4;

function shopCardGoTo(cardId, slideIndex) {
  shopCardState[cardId] = slideIndex;
  document.getElementById('shop-track-' + cardId).style.transform = `translateX(-${slideIndex * 100}%)`;
  const dots = document.querySelectorAll('#shop-dots-' + cardId + ' .shop-card-dot');
  dots.forEach((d, i) => d.classList.toggle('active', i === slideIndex));
}

function shopCardMove(cardId, direction) {
  const next = (shopCardState[cardId] + direction + SHOP_SLIDES_PER_CARD) % SHOP_SLIDES_PER_CARD;
  shopCardGoTo(cardId, next);
}

document.querySelectorAll('.shop-card-carousel').forEach((carouselEl) => {
  const cardId = parseInt(carouselEl.getAttribute('data-card-id'), 10);
  let startX = 0, endX = 0;
  let touchHandled = false;

  carouselEl.addEventListener('touchstart', (e) => {
    startX = e.changedTouches[0].screenX;
  }, { passive: true });

  carouselEl.addEventListener('touchend', (e) => {
    endX = e.changedTouches[0].screenX;
    const diff = startX - endX;
    touchHandled = true;
    if (Math.abs(diff) > 40) {
      shopCardMove(cardId, diff > 0 ? 1 : -1);
    } else {
      carouselEl.classList.toggle('overlay-active');
    }
    setTimeout(() => { touchHandled = false; }, 500);
  }, { passive: true });

  carouselEl.addEventListener('click', (e) => {
    if (touchHandled) return;
    if (e.target.closest('a, button')) return;
    const rect = carouselEl.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    shopCardMove(cardId, clickX < rect.width / 2 ? -1 : 1);
  });
});
