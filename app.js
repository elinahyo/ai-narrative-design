(() => {
  'use strict';
  const routes = ['overview', 'weeks', 'practice', 'assignments', 'resources'];
  const nav = document.querySelector('#course-nav');
  const menuToggle = document.querySelector('.menu-toggle');
  const dialog = document.querySelector('#week-dialog');
  const search = document.querySelector('#week-search');
  const select = document.querySelector('#practice-week');
  const weeks = window.COURSE_WEEKS || [];
  const lectures = window.COURSE_LECTURES || {};
  let readerWeek = 0;
  let readerIndex = 0;
  let touchStart = null;
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
    const match = requested.match(/^lesson\/(\d+)(?:\/(\d+))?$/);
    const isLesson = !!(match && lectures[Number(match[1])]);
    const route = isLesson ? 'lesson' : routes.includes(requested) ? requested : 'overview';
    document.body.classList.toggle('lesson-mode', isLesson);
    if (!isLesson) {document.body.classList.remove('presentation-mode');document.querySelector('#lesson-fullscreen').textContent='전체화면';document.querySelector('#reader-status').textContent='';}
    if (!isLesson && document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    if (isLesson) renderLecture(Number(match[1]), Number(match[2] || 1) - 1);
    document.querySelectorAll('.view').forEach(view => { view.hidden = view.id !== route; });
    document.querySelectorAll('[data-route]').forEach(link => {
      const active = link.dataset.route === (isLesson ? 'weeks' : route);
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    document.title = `${route === 'overview' ? 'AI 내러티브 설계' : document.querySelector(`#${route}-title`).textContent} · 2027학년도 1학기`;
    closeMenu();
    if (dialog.open) dialog.close();
    if (moveFocus) {
      document.querySelector(isLesson ? '#slide-stage' : '#main').focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }
  window.addEventListener('hashchange', () => navigate(true));
  nav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  document.querySelector('.brand').addEventListener('click', closeMenu);
  document.querySelector('.skip-link').addEventListener('click', event => {
    event.preventDefault(); document.querySelector('#main').focus();
  });

  function openWeek(week) {
    if (week) location.hash = `lesson/${week.number}/1`;
  }
  function showWeekGuide(week, trigger) {
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
      button.setAttribute('aria-label', `${week.number}주차 ${week.title} 강의 슬라이드 보기`);
      button.innerHTML = `<span class="week-top"><span class="week-number">${String(week.number).padStart(2,'0')}</span><span class="pill">${week.number >= 14 ? '프로젝트' : '수업·실습'}</span></span><h2>${escape(week.title)}</h2><p>${escape(week.description)}</p><span class="week-bottom"><span>${lectures[week.number].slides.length}장 · 강의 슬라이드 보기</span><span aria-hidden="true">↗</span></span>`;
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
  function renderLecture(number, index) {
    const w = weeks.find(w => w.number === number);
    const deck = lectures[number];
    const changedWeek = readerWeek !== number;
    readerWeek = number;
    currentWeek = number;
    readerIndex = Math.max(0, Math.min(deck.slides.length - 1, Number.isFinite(index) ? index : 0));
    const slide = deck.slides[readerIndex];
    document.querySelector('#lesson-week').textContent = `WEEK ${String(number).padStart(2,'0')} / WEB LECTURE`;
    document.querySelector('#lesson-title').textContent = `${number}주차 · ${w.title}`;
    document.querySelector('#reader-origin').textContent = `${deck.sourceLabel} · PPT 다운로드 없이 보는 웹 강의`;
    const toc = document.querySelector('#slide-toc');
    const picker = document.querySelector('#slide-select');
    if (changedWeek) {
      toc.innerHTML = deck.slides.map((x,i)=>`<a href="#lesson/${number}/${i+1}" data-slide="${i}"><span>${String(i+1).padStart(2,'0')}</span>${escape(x.title)}</a>`).join('');
      picker.replaceChildren();
      deck.slides.forEach((x,i)=> { const option=document.createElement('option'); option.value=String(i); option.textContent=`${i+1}. ${x.title}`; picker.append(option); });
      document.querySelector('#lesson-toc').open = window.matchMedia('(min-width: 1100px)').matches;
    }
    toc.querySelectorAll('a').forEach((link,i)=> { if(i===readerIndex)link.setAttribute('aria-current','step');else link.removeAttribute('aria-current'); });
    picker.value = String(readerIndex);
    document.querySelector('#toc-count').textContent = `${deck.slides.length}장`;
    let content = '';
    if (slide.type === 'cover') {
      content = `<div class="cover-motif" aria-hidden="true"><span>의도</span><i>→</i><span>설계</span><i>→</i><span>선택</span></div><p class="cover-hint">개념을 이해하고, 직접 만들고, 선택의 이유를 기록하세요.</p>`;
    } else if (slide.type === 'prompt') {
      content = `<div class="lecture-prompt"><p>${escape(slide.prompt)}</p></div><div class="lecture-copy"><button id="slide-copy" class="reader-button">프롬프트 복사</button><span id="slide-copy-status" role="status"></span></div><p class="slide-small">대괄호를 자신의 내용으로 바꾸세요. 생성 결과는 사실·의도·맥락을 직접 검토합니다.</p>`;
    } else if (slide.type === 'branch') {
      content = `<div class="branch-diagram"><div class="branch-root">${escape(slide.nodes[0])}</div><div class="branch-arrow" aria-hidden="true">↓</div><div class="branch-choice">${escape(slide.nodes[1])}</div><div class="branch-paths"><div><span class="branch-arrow" aria-hidden="true">↓</span><h3>A · ${escape(slide.nodes[2])}</h3><span class="branch-arrow" aria-hidden="true">↓</span><p>${escape(slide.nodes[4])}</p></div><div><span class="branch-arrow" aria-hidden="true">↓</span><h3>B · ${escape(slide.nodes[3])}</h3><span class="branch-arrow" aria-hidden="true">↓</span><p>${escape(slide.nodes[5])}</p></div></div></div>`;
    } else {
      content = `<div class="slide-items items-${Math.min(slide.items.length,5)}">${slide.items.map((item,i)=>`<section class="slide-item"><span class="item-index" aria-hidden="true">${String(i+1).padStart(2,'0')}</span><h3>${escape(item.title)}</h3><p>${escape(item.text)}</p></section>`).join('')}</div>`;
    }
    const stage = document.querySelector('#slide-stage');
    stage.className = `slide-stage slide-${slide.type}`;
    stage.innerHTML = `<div class="slide-meta"><span>${escape(slide.label || (slide.type === 'flow' ? 'STRUCTURE & PROCESS' : 'CONCEPT & DESIGN'))}</span><span>W${String(number).padStart(2,'0')} · ${String(readerIndex+1).padStart(2,'0')}</span></div><div class="slide-heading"><h2 id="slide-title">${escape(slide.title)}</h2><p>${escape(slide.lead)}</p></div>${content}${slide.question ? `<div class="slide-question"><strong>생각해 보기</strong><p>${escape(slide.question)}</p></div>`:''}<div class="slide-footer"><span>AI 내러티브 설계 · 2027 SPRING</span><span>${readerIndex+1} / ${deck.slides.length}</span></div>`;
    stage.scrollTop=0;
    document.querySelector('#slide-prev').disabled = readerIndex === 0;
    document.querySelector('#slide-next').disabled = readerIndex === deck.slides.length-1;
    document.querySelector('#slide-count').textContent = `${readerIndex+1} / ${deck.slides.length}`;
    document.querySelector('#slide-progress-bar').style.width = `${(readerIndex+1)/deck.slides.length*100}%`;
    document.querySelector('#slide-copy')?.addEventListener('click',async()=> {
      const result=document.querySelector('#slide-copy-status');
      try {await navigator.clipboard.writeText(slide.prompt); result.textContent='복사했습니다.';}
      catch {result.textContent='자동 복사를 사용할 수 없습니다. 위 문장을 선택해 복사해 주세요.';}
    });
    if(!window.matchMedia('(min-width: 1100px)').matches)document.querySelector('#lesson-toc').open=false;
  }
  function moveSlide(index) {
    if (!lectures[readerWeek]) return;
    const last = lectures[readerWeek].slides.length-1;
    const next = Math.max(0,Math.min(last,index));
    if(next!==readerIndex) location.hash=`lesson/${readerWeek}/${next+1}`;
  }
  document.querySelector('#slide-prev').addEventListener('click',()=>moveSlide(readerIndex-1));
  document.querySelector('#slide-next').addEventListener('click',()=>moveSlide(readerIndex+1));
  document.querySelector('#slide-select').addEventListener('change',event=>moveSlide(Number(event.target.value)));
  document.querySelector('#lesson-guide').addEventListener('click',event=>showWeekGuide(weeks.find(w=>w.number===readerWeek),event.currentTarget));
  document.querySelector('#lesson-practice').addEventListener('click',()=> {
    select.value=String(readerWeek);renderPractice();location.hash='practice';
  });
  document.addEventListener('keydown',event=> {
    if(document.querySelector('#lesson').hidden || dialog.open || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.target.closest('input,select,textarea,[contenteditable]'))return;
    if(event.key==='ArrowRight') {event.preventDefault();moveSlide(readerIndex+1);}
    if(event.key==='ArrowLeft') {event.preventDefault();moveSlide(readerIndex-1);}
    if(event.key==='Home') {event.preventDefault();moveSlide(0);}
    if(event.key==='End') {event.preventDefault();moveSlide(lectures[readerWeek].slides.length-1);}
  });
  const stage=document.querySelector('#slide-stage');
  stage.addEventListener('touchstart',event=> { if(event.touches.length===1 && !event.target.closest('button,a,select'))touchStart={x:event.touches[0].clientX,y:event.touches[0].clientY};else touchStart=null; },{passive:true});
  stage.addEventListener('touchend',event=> {
    if(!touchStart)return;
    const start=touchStart;touchStart=null;
    if(event.changedTouches.length!==1 || window.getSelection()?.toString())return;
    const dx=event.changedTouches[0].clientX-start.x,dy=event.changedTouches[0].clientY-start.y;
    if(Math.abs(dx)>75 && Math.abs(dx)>Math.abs(dy)*1.7)moveSlide(readerIndex+(dx<0?1:-1));
  },{passive:true});
  stage.addEventListener('touchcancel',()=>{touchStart=null;},{passive:true});
  const fullscreenButton=document.querySelector('#lesson-fullscreen');

  async function exitPresentation() {
    document.body.classList.remove('presentation-mode');
    if(document.fullscreenElement)await document.exitFullscreen().catch(()=>{});
    fullscreenButton.textContent='전체화면';
    document.querySelector('#reader-status').textContent='';
  }
  fullscreenButton.addEventListener('click',async()=> {
    if(document.body.classList.contains('presentation-mode')) {await exitPresentation();return;}
    document.body.classList.add('presentation-mode');
    fullscreenButton.textContent='확대 보기 종료';
    try {
      if(!document.documentElement.requestFullscreen)throw new Error('unsupported');
      await document.documentElement.requestFullscreen();
      fullscreenButton.textContent='전체화면 종료';
    } catch {document.querySelector('#reader-status').textContent='확대 보기로 전환했습니다. 상단 버튼이나 Esc 키로 돌아갈 수 있습니다.';}
  });
  document.addEventListener('fullscreenchange',()=> {
    if(document.fullscreenElement)fullscreenButton.textContent='전체화면 종료';
    else {document.body.classList.remove('presentation-mode');fullscreenButton.textContent='전체화면';}
  });
  document.addEventListener('keydown',event=> {
    if(event.key==='Escape'&&!dialog.open&&document.body.classList.contains('presentation-mode'))exitPresentation();
  });
  navigate(); renderWeeks(); renderPractice();
})();
