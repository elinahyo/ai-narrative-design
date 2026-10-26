(() => {
  'use strict';
  const routes = ['overview', 'weeks', 'practice', 'assignments', 'resources'];
  const nav = document.querySelector('#course-nav');
  const menuToggle = document.querySelector('.menu-toggle');
  const dialog = document.querySelector('#week-dialog');
  const search = document.querySelector('#week-search');
  const weeks = window.COURSE_WEEKS || [];
  let filter = 'all';
  let previousFocus = null;

  function closeMenu() {
    nav.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
  }
  menuToggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav.classList.contains('open')) {
      closeMenu();
      menuToggle.focus();
    }
  });
  function navigate(moveFocus = false) {
    const requested = window.location.hash.slice(1);
    const route = routes.includes(requested) ? requested : 'overview';
    document.querySelectorAll('.view').forEach(view => { view.hidden = view.id !== route; });
    document.querySelectorAll('[data-route]').forEach(link => {
      const active = link.dataset.route === route;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    document.title = route === 'overview' ? 'AI 내러티브 설계 · 청운대학교' : `${document.querySelector(`#${route}-title`).textContent} · AI 내러티브 설계`;
    closeMenu();
    if (dialog.open) dialog.close();
    if (moveFocus) {
      document.querySelector('#main').focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }
  window.addEventListener('hashchange', () => navigate(true));
  nav.addEventListener('click', event => {
    if (event.target.closest('a')) closeMenu();
  });
  document.querySelector('.brand').addEventListener('click', closeMenu);
  document.querySelector('.skip-link').addEventListener('click', event => {
    event.preventDefault();
    document.querySelector('#main').focus();
  });

  function openWeek(week, trigger) {
    previousFocus = trigger;
    document.querySelector('#dialog-eyebrow').textContent = `WEEK ${String(week.number).padStart(2, '0')}`;
    document.querySelector('#dialog-title').textContent = `${week.number}주차 · ${week.title}`;
    dialog.showModal();
  }
  function renderWeeks() {
    const query = search.value.trim().toLowerCase().replace(/\s+/g, '');
    const matches = weeks.filter(week => {
      const inRange = filter === 'all' || (filter === 'first' ? week.number <= 8 : week.number >= 9);
      const numberQuery = query.match(/^(?:week)?0?(\d{1,2})(?:주차|주)?$/);
      const searchable = `${week.number}주차 week${String(week.number).padStart(2,'0')} ${week.title} ${week.description}`.toLowerCase().replace(/\s+/g, '');
      const matchesQuery = numberQuery ? week.number === Number(numberQuery[1]) : searchable.includes(query);
      return inRange && matchesQuery;
    });
    const grid = document.querySelector('#week-grid');
    grid.replaceChildren();
    matches.forEach(week => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'week-card';
      button.setAttribute('aria-haspopup', 'dialog');
      button.setAttribute('aria-label', `${week.number}주차 안내 보기, 준비 중`);
      // Dynamic course text is inserted via textContent, not interpreted as HTML.
      button.innerHTML = '<span class="week-top"><span class="week-number"></span><span class="pill">준비 중</span></span><h2></h2><p></p><span class="week-bottom"><span>주차 안내 보기</span><span aria-hidden="true">↗</span></span>';
      button.querySelector('.week-number').textContent = String(week.number).padStart(2, '0');
      button.querySelector('h2').textContent = `${week.number}주차`;
      button.querySelector('p').textContent = week.title;
      button.addEventListener('click', () => openWeek(week, button));
      grid.append(button);
    });
    document.querySelector('#result-count').textContent = `전체 ${weeks.length}개 주차 중 ${matches.length}개 표시 · 강의자료 준비 중`;
    document.querySelector('#no-results').hidden = matches.length > 0;
  }
  document.querySelectorAll('.filter').forEach(button => {
    button.addEventListener('click', () => {
      filter = button.dataset.filter;
      document.querySelectorAll('.filter').forEach(other => {
        const active = other === button;
        other.classList.toggle('active', active);
        other.setAttribute('aria-pressed', String(active));
      });
      renderWeeks();
    });
  });
  search.addEventListener('input', renderWeeks);
  document.querySelector('#reset-search').addEventListener('click', () => {
    search.value = '';
    document.querySelector('[data-filter="all"]').click();
    search.focus();
  });
  document.querySelectorAll('.dialog-close,.dialog-confirm').forEach(button => button.addEventListener('click', () => dialog.close()));
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    if (previousFocus?.isConnected && !previousFocus.closest('[hidden]')) previousFocus.focus({ preventScroll: true });
  });
  navigate();
  renderWeeks();
})();
