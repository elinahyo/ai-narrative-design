(() => {
  'use strict';
  const routes = ['overview', 'weeks', 'practice', 'assignments', 'resources'];
  const nav = document.querySelector('#course-nav');
  const menuToggle = document.querySelector('.menu-toggle');
  const dialog = document.querySelector('#week-dialog');
  const search = document.querySelector('#week-search');
  const select = document.querySelector('#practice-week');
  const weeks = window.COURSE_WEEKS || [];
  let filter = 'all';
  let previousFocus = null;
  let currentWeek = 1;
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const list = (items, ordered = false) => `<${ordered ? 'ol' : 'ul'} class="detail-list">${items.map(x => `<li>${escape(x)}</li>`).join('')}</${ordered ? 'ol' : 'ul'}>`;
  const sourceLinks = sources => sources.map(s => `<li><a href="${escape(s.url)}" target="_blank" rel="noopener noreferrer">${escape(s.title)} ↗</a><span>${escape(s.location)} · 2026년 참고 원본</span></li>`).join('');
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
      closeMenu(); menuToggle.focus();
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
    document.title = `${route === 'overview' ? 'AI 내러티브 설계' : document.querySelector(`#${route}-title`).textContent} · 2027학년도 1학기`;
    closeMenu();
    if (dialog.open) dialog.close();
    if (moveFocus) {
      document.querySelector('#main').focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }
  window.addEventListener('hashchange', () => navigate(true));
  nav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  document.querySelector('.brand').addEventListener('click', closeMenu);
  document.querySelector('.skip-link').addEventListener('click', event => {
    event.preventDefault(); document.querySelector('#main').focus();
  });

  function openWeek(week, trigger) {
    if (!week) return;
    currentWeek = week.number;
    previousFocus = trigger;
    document.querySelector('#dialog-eyebrow').textContent = `2027 SPRING / WEEK ${String(week.number).padStart(2, '0')}`;
    document.querySelector('#dialog-title').textContent = `${week.number}주차 · ${week.title}`;
    document.querySelector('#dialog-content').innerHTML = `<p class="dialog-desc">${escape(week.description)}</p><h3>수업에서 배우는 내용</h3>${list(week.topics)}<h3>학생 실습</h3>${list(week.steps, true)}<div class="deliverable-box"><h3>이번 주 산출물</h3>${list(week.deliverables)}</div><h3>AI 협업 포인트</h3><p class="detail-copy">${escape(week.ai)}</p>${week.note ? `<p class="source-note">${escape(week.note)}</p>` : ''}<details class="source-details"><summary>구성 근거와 2026년 참고 원본</summary><ul class="source-links">${sourceLinks(week.sources)}</ul><p>원본은 이전 학기 자료입니다. Drive 접근 권한이 필요할 수 있습니다.</p></details><p class="deadline-note">2027년 제출 기한·제출처·평가 배점: 준비 중</p>`;
    dialog.showModal();
    dialog.scrollTop = 0;
  }
  function renderWeeks() {
    const query = search.value.trim().toLowerCase().replace(/\s+/g, '');
    const numberQuery = query.match(/^(?:week)?0?(\d{1,2})(?:주차|주)?$/);
    const matches = weeks.filter(week => {
      const inRange = filter === 'all' || (filter === 'first' ? week.number <= 8 : week.number >= 9);
      const searchable = `${week.number}주차 week${String(week.number).padStart(2,'0')} ${week.title} ${week.description} ${week.topics.join(' ')}`.toLowerCase().replace(/\s+/g, '');
      return inRange && (numberQuery ? week.number === Number(numberQuery[1]) : searchable.includes(query));
    });
    const grid = document.querySelector('#week-grid');
    grid.replaceChildren();
    matches.forEach(week => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'week-card';
      button.setAttribute('aria-haspopup', 'dialog');
      button.setAttribute('aria-label', `${week.number}주차 ${week.title} 안내 보기`);
      button.innerHTML = `<span class="week-top"><span class="week-number">${String(week.number).padStart(2,'0')}</span><span class="pill">${week.number >= 14 ? '프로젝트' : '수업·실습'}</span></span><h2>${escape(week.title)}</h2><p>${escape(week.description)}</p><span class="week-bottom"><span>${week.steps.length}단계 실습 · 산출물 확인</span><span aria-hidden="true">↗</span></span>`;
      button.addEventListener('click', () => openWeek(week, button)); grid.append(button);
    });
    document.querySelector('#result-count').textContent = `전체 ${weeks.length}개 주차 중 ${matches.length}개 표시 · 2027학년도 적용안`;
    document.querySelector('#no-results').hidden = matches.length > 0;
  }
  document.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => {
    filter = button.dataset.filter;
    document.querySelectorAll('.filter').forEach(other => { const active = other === button; other.classList.toggle('active', active); other.setAttribute('aria-pressed', String(active)); });
    renderWeeks();
  }));
  search.addEventListener('input', renderWeeks);
  document.querySelector('#reset-search').addEventListener('click', () => { search.value = ''; document.querySelector('[data-filter="all"]').click(); search.focus(); });
  document.querySelectorAll('.dialog-close,.dialog-confirm').forEach(button => button.addEventListener('click', () => dialog.close()));
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => { if (previousFocus?.isConnected && !previousFocus.closest('[hidden]')) previousFocus.focus({ preventScroll: true }); });
  document.querySelector('#go-practice').addEventListener('click', () => {
    select.value = String(currentWeek); renderPractice(); dialog.close();
    if (location.hash === '#practice') document.querySelector('#practice-content').scrollIntoView({block:'start'});
    else location.hash = 'practice';
  });
  document.querySelectorAll('[data-open-week]').forEach(button => button.addEventListener('click', () => openWeek(weeks.find(w=>w.number===Number(button.dataset.openWeek)),button)));
  weeks.forEach(week => { const option = document.createElement('option'); option.value = week.number; option.textContent = `${week.number}주차 · ${week.title}`; select.append(option); });
  function renderPractice() {
    const week = weeks.find(w => w.number === Number(select.value));
    const download = document.querySelector('#download-worksheet');
    download.href = `./worksheets/week-${String(week.number).padStart(2,'0')}.md`;
    download.download = `2027_AI내러티브설계_${String(week.number).padStart(2,'0')}주차_실습기록지.md`;
    document.querySelector('#practice-content').innerHTML = `<article class="content-panel practice-panel"><p class="eyebrow">WEEK ${String(week.number).padStart(2,'0')} / 2027 SPRING</p><h2>${escape(week.title)}</h2><p>${escape(week.description)}</p><h3>진행 순서</h3>${list(week.steps,true)}<div class="deliverable-box"><h3>완료할 결과물</h3>${list(week.deliverables)}</div><h3>AI 협업 포인트</h3><p>${escape(week.ai)}</p><div class="prompt-box"><div><h3>프롬프트 예시</h3><button class="text-button" id="copy-prompt">예시 복사</button></div><p class="prompt-caption">2027 실습용으로 구성한 예시입니다. 대괄호를 자신의 내용으로 바꾸세요.</p><pre id="prompt-text">${escape(week.prompt)}</pre><p id="copy-result" role="status" aria-live="polite"></p></div><details class="source-details"><summary>참고 원본과 주차 구성 안내</summary>${week.note ? `<p>${escape(week.note)}</p>`:''}<ul class="source-links">${sourceLinks(week.sources)}</ul><p>2026년 원본 · Drive 접근 권한이 필요할 수 있습니다.</p></details><p class="deadline-note">제출 기한·제출처: 준비 중. 아래 양식은 작성 보조용이며 제출 기능은 없습니다.</p></article>`;
    document.querySelector('#copy-prompt').addEventListener('click', async () => {
      const status = document.querySelector('#copy-result');
      try { await navigator.clipboard.writeText(week.prompt); status.textContent = '프롬프트 예시를 복사했습니다.'; }
      catch { status.textContent = '자동 복사를 사용할 수 없습니다. 위 예시를 직접 선택해 복사해 주세요.'; }
    });
  }
  select.addEventListener('change', renderPractice);
  document.querySelector('#source-list').innerHTML = weeks.map(w=>`<article><div><span class="source-week">${String(w.number).padStart(2,'0')}</span><h3>${escape(w.title)}</h3></div><ul class="source-links">${sourceLinks(w.sources)}</ul></article>`).join('');
  navigate(); renderWeeks(); renderPractice();
})();
