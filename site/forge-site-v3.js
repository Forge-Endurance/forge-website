// Forge marketing site v2 — dock nav, reveals, email CTA mock
(function () {
  // seamless ticker
  var track = document.getElementById('ticker-track');
  if (track) {
    // repeat enough copies to fill wide desktop viewports seamlessly
    track.innerHTML += track.innerHTML;
    track.innerHTML += track.innerHTML;
    track.innerHTML += track.innerHTML;
  }

  // topbar bg after scroll
  var topbar = document.getElementById('topbar');
  var dock = document.getElementById('dock');
  var hero = document.querySelector('.hero');
  var onScroll = function () {
    topbar.classList.toggle('scrolled', window.scrollY > 40);
    // dock appears once you're past ~70% of the hero
    dock.classList.toggle('show', window.scrollY > hero.offsetHeight * 0.7);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // scroll-spy: highlight the section in view
  var spyLinks = {};
  dock.querySelectorAll('a[data-spy]').forEach(function (a) { spyLinks[a.getAttribute('data-spy')] = a; });
  var spy = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        Object.keys(spyLinks).forEach(function (k) { spyLinks[k].classList.remove('active'); });
        var link = spyLinks[e.target.id];
        if (link) link.classList.add('active');
      }
    });
  }, { rootMargin: '-35% 0px -45% 0px' });
  ['discover', 'races', 'forge', 'together', 'meet'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) spy.observe(el);
  });

  // reveal on scroll
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('.rv').forEach(function (el) { io.observe(el); });

  // ── waitlist capture → Netlify Forms ──────────────────────────────
  var submitted = false;          // one submission per visitor
  var pendingLine = null;         // line awaiting completion (mobile step2)

  function encode(data) {
    return Object.keys(data).map(function (k) {
      return encodeURIComponent(k) + '=' + encodeURIComponent(data[k] || '');
    }).join('&');
  }

  function payload(line) {
    var emailEl = line.querySelector('.cta-field input');
    var mores = line.querySelectorAll('.more-input');
    return {
      'form-name': 'waitlist',
      email: emailEl ? (emailEl.value || '').trim() : '',
      name: mores[0] ? (mores[0].value || '').trim() : '',
      city: mores[1] ? (mores[1].value || '').trim() : '',
      source: window.location.pathname,
      'bot-field': ''
    };
  }

  function submitWaitlist(line, beacon) {
    if (submitted || !line) return;
    var data = payload(line);
    if (!data.email) return;
    submitted = true;
    pendingLine = null;
    var body = encode(data);
    var type = 'application/x-www-form-urlencoded';
    if (beacon && navigator.sendBeacon) {
      try { navigator.sendBeacon('/', new Blob([body], { type: type })); return; } catch (e) { /* fall through */ }
    }
    fetch('/', { method: 'POST', headers: { 'Content-Type': type }, body: body })
      .catch(function () { /* never block the UI on a failed capture */ });
  }

  // if they enter an email then leave without finishing step 2, still capture it
  window.addEventListener('pagehide', function () {
    if (pendingLine) submitWaitlist(pendingLine, true);
  });

  // email forms — progressive: email → optional name+city → done
  document.querySelectorAll('.cta-line').forEach(function (line) {
    var form = line.querySelector('form');
    if (!form) return;
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var input = form.querySelector('input');
      var val = (input.value || '').trim();
      if (!val || val.indexOf('@') < 1 || val.indexOf('.') < 0) {
        var field = form.querySelector('.cta-field');
        field.style.borderColor = 'rgba(224,116,88,0.8)';
        input.focus();
        setTimeout(function () { field.style.borderColor = ''; }, 1600);
        return;
      }
      if (window.matchMedia('(min-width: 1024px)').matches) {
        // desktop shows name + city upfront — submit completes directly
        submitWaitlist(line);
        line.classList.add('done');
        return;
      }
      pendingLine = line;   // safety net if they bail before tapping Done/Skip
      line.classList.add('step2');
      var first = line.querySelector('.more-input');
      if (first) first.focus();
    });
    var finish = function () {
      submitWaitlist(line);
      line.classList.remove('step2');
      line.classList.add('done');
    };
    var btn = line.querySelector('.more-btn');
    var skip = line.querySelector('.more-skip');
    if (btn) btn.addEventListener('click', finish);
    if (skip) skip.addEventListener('click', finish);
    // Enter in step-2 inputs = Done
    line.querySelectorAll('.more-input').forEach(function (mi) {
      mi.addEventListener('keydown', function (e) { if (e.key === 'Enter') finish(); });
    });
  });
})();
