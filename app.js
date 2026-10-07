'use strict';
const viewport = document.querySelector('#viewport');
// Keep the collage intact and fit the complete desktop canvas into the window.
function fitDesktop() {
  const scale = Math.min(window.innerWidth / 1920, (window.innerHeight - (document.documentElement.classList.contains('has-sticker-stats') ? 90 : 0)) / 1080, 1);
  viewport.style.setProperty('--desktop-scale', scale);
  Mobile.fit(viewport);
}
fitDesktop();
window.addEventListener('resize', fitDesktop);
const cards = [
  ['39:2144','39:2142','Работа'],['22:1706','35:2140','О тебе'],
  ['22:1708','39:2149','Друзья'],['22:1709','39:2145','Спорт'],
  ['29:1716','39:2147','Пиво'],['35:2138','35:2139','Игры']
];
const byNode = id => viewport.querySelector(`[data-node-id="${id}"]`);
let activeScreen = '';
function show(route, focus = false) {
  if (Mobile.active() && route.startsWith('intro')) {
    route = 'home';
    history.replaceState(null, '', '#/home');
  }
  const template = document.getElementById('screen-' + route);
  if (!template) return show('welcome', focus);
  activeScreen = route;
  document.body.dataset.route = route;
  if (Mobile.active() && Mobile.needsGate()) {
    Mobile.gate(viewport, () => show(location.hash.replace(/^#\//,'') || 'welcome', true));
    return;
  }
  if (Mobile.active()) Mobile.render(route, template.content.cloneNode(true), viewport);
  else viewport.replaceChildren(template.content.cloneNode(true));
  setupStickerStats(route);
  fitDesktop();
  setupPhotos(route);
  if (route === 'home' && !Mobile.active()) {
    const phrase = document.createElement('p');
    phrase.className = 'home-extra-phrase';
    phrase.textContent = 'вот такая вот фигня, собачка';
    viewport.querySelector('.screen').append(phrase);
    for (const [photoId,titleId,label] of cards) {
      const photo = byNode(photoId), title = byNode(titleId);
      if (!photo || !title) continue;
      photo.classList.add('card-image'); title.classList.add('card-title');
      const activate = on => [photo,title].forEach(n => n.classList.toggle('card-active',on));
      for (const n of [photo,title]) {
        n.setAttribute('aria-label',label);
        n.addEventListener('pointerenter',() => activate(true));
        n.addEventListener('pointerleave',() => activate(false));
        n.addEventListener('focus',() => activate(true));
        n.addEventListener('blur',() => activate(false));
      }
    }
  }
  if (route.startsWith('intro')) {
    for (const a of viewport.querySelectorAll('a[href="#/home"]')) {
      if (a.textContent.trim() === 'ДАЛЬШЕ') a.textContent = 'Назад';
    }
    if (!Mobile.active() && !document.querySelector('.stats-scroll-hint')) {
      const hint = document.createElement('button');
      hint.type = 'button'; hint.className = 'stats-scroll-hint';
      hint.innerHTML = '<span>там еще что-то</span><svg width="72" height="66" viewBox="0 0 72 66" fill="none" aria-hidden="true"><path d="M9 6C46 7 59 22 48 55M34 42L47 58L62 45" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      hint.addEventListener('click', () => document.getElementById('sticker-stats').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'}));
      document.getElementById('sticker-stats').prepend(hint);
    }
  }
  if (route.startsWith('question-')) setupQuestion(viewport, route);
  if (focus) { viewport.tabIndex = -1; viewport.focus({preventScroll:true}); if (Mobile.active()) window.scrollTo(0,0); }
}
function setupQuestion(host, route) {
  const answers = [...host.querySelectorAll('[data-answer]')];
  const panel = document.createElement('div'); panel.className = 'quiz-result';
  const message = document.createElement('p'); message.setAttribute('role','status');
  const next = document.createElement('a'); next.className = 'quiz-next'; next.textContent = 'Дальше'; next.hidden = true;
  panel.append(message,next); host.firstElementChild.append(panel);
  for (let answer of answers) {
    const destination = answer.getAttribute('href');
    if (answer.tagName === 'A') {
      const button = document.createElement('button');
      for (const attr of answer.attributes) if(attr.name !== 'href') button.setAttribute(attr.name,attr.value);
      button.innerHTML = answer.innerHTML; answer.replaceWith(button); answer = button;
    }
    answer.type = 'button'; answer.setAttribute('aria-pressed','false');
    answer.addEventListener('click', () => {
      host.querySelectorAll('[data-answer]').forEach(n=>{n.classList.remove('correct','selected','wrong');n.setAttribute('aria-pressed','false');});
      next.hidden = true; next.removeAttribute('href'); panel.classList.remove('is-correct');
      answer.setAttribute('aria-pressed','true');
      if (destination) {
        answer.classList.add('correct'); message.textContent = ['Всё так :)','чтоб еще раз...','Мы за итаалиюююю!','наблюдается твое позитивное влияние)','все верно☺️'][Number(route.split('-')[1])-1];
        panel.classList.add('is-correct'); next.href = destination; next.hidden = false;

      } else {
        answer.classList.add('wrong'); message.textContent = 'попробуем еще раз';
        answer.addEventListener('animationend',()=>answer.classList.remove('wrong'),{once:true});
      }
    });
  }
}
function navigate() { show(location.hash.replace(/^#\//,'') || 'welcome',true); }
window.addEventListener('hashchange',navigate);
Mobile.query.addEventListener('change', () => { navigate(); fitDesktop(); });
// Match the elliptical chart's five sectors; the supplied SVG layers remain unchanged.
viewport.addEventListener('pointermove',event => {
  if (Mobile.active() || !activeScreen.startsWith('intro')) return;
  const rect = viewport.getBoundingClientRect();
  const x = (event.clientX-rect.left) * 1920 / rect.width;
  const y = (event.clientY-rect.top) * 1080 / rect.height;
  const nx = (x-926)/507, ny = (y-540)/372;
  let route = 'intro';
  if (nx*nx+ny*ny <= 1) {
    const angle = (Math.atan2(ny,nx)*180/Math.PI+360)%360;
    route = angle<61.2?'intro-trips':angle<115.2?'intro-dota':angle<144?'intro-work':angle<237.6?'intro-sport':'intro-humor';
  }
  if (route !== activeScreen) show(route);
});
viewport.addEventListener('pointerleave',() => { if(!Mobile.active() && activeScreen.startsWith('intro-')) show('intro'); });
show(location.hash.replace(/^#\//,'') || 'welcome');

// Native modal stays outside the scaled desktop canvas.
function setupPhotos(route) {
  const photos = [...viewport.querySelectorAll('img[src$=".webp"]')].filter(photo => !photo.closest('[data-page-background]'));
  const gallery = ['about','games','work','beer','sport','friends','gift'].includes(route) && !Mobile.active();
  photos.forEach((photo, index) => {
    let frame = photo.parentElement;
    if (!Mobile.active() && !frame.hasAttribute('data-node-id') && frame.parentElement.hasAttribute('data-node-id')) frame = frame.parentElement;
    if (photo.getAttribute('src').endsWith('3c568242d3f89ca5faac.webp')) {
      frame.classList.add('photo-cutout');
      return;
    }
    frame.classList.add('photo-depth');
    if (!gallery) return;
    frame.classList.add('photo-open');
    frame.tabIndex = 0;
    frame.setAttribute('role','button');
    frame.setAttribute('aria-label',`Открыть изображение ${index + 1}`);
    frame.setAttribute('aria-haspopup','dialog');
    const open = () => openPhotoGallery(photos,index);
    frame.addEventListener('click',open);
    frame.addEventListener('keydown',event => {
      if(event.key === 'Enter' || event.key === ' ') {event.preventDefault();open();}
    });
  });
}
function openPhotoGallery(photos, initialIndex) {
  if (Mobile.active() || document.querySelector('.photo-viewer')) return;
  const previousFocus = document.activeElement;
  const dialog = document.createElement('dialog'); dialog.className='photo-viewer';
  dialog.setAttribute('aria-label','Просмотр фотографий');
  dialog.innerHTML='<button class="photo-close" aria-label="Закрыть">×</button><button class="photo-prev" aria-label="Предыдущее изображение">‹</button><img class="photo-full" alt=""><button class="photo-next" aria-label="Следующее изображение">›</button><p class="photo-count" aria-live="polite"></p>';
  const image = dialog.querySelector('img');
  let index = initialIndex;
  const render = () => {
    const source = photos[index];
    image.alt=source.alt || `Изображение ${index+1}`;
    image.src=source.currentSrc || source.src;
    const size = () => {
      // Keep natural size; modestly enlarge only small originals.
      const w=image.naturalWidth, h=image.naturalHeight;
      if (!w || !h) return;
      const enlargement=Math.max(1,Math.min(1.5,520/Math.max(w,h)));
      const scale=Math.min(enlargement,(innerWidth-160)/w,(innerHeight-140)/h);
      image.style.width=`${Math.round(w*scale)}px`;
      image.style.height=`${Math.round(h*scale)}px`;
    };
    image.onload=size; if(image.complete) size();
    dialog.querySelector('.photo-count').textContent=`${index+1} / ${photos.length}`;
  };
  const step = delta => {index=(index+delta+photos.length)%photos.length;render();};
  dialog.querySelector('.photo-close').onclick=()=>dialog.close();
  dialog.querySelector('.photo-prev').onclick=()=>step(-1);
  dialog.querySelector('.photo-next').onclick=()=>step(1);
  dialog.addEventListener('click',event=>{if(event.target===dialog) dialog.close();});
  dialog.addEventListener('keydown',event=>{
    if(event.key==='ArrowLeft'){event.preventDefault();step(-1);}
    if(event.key==='ArrowRight'){event.preventDefault();step(1);}
  });
  const resize = () => {if(Mobile.active()) dialog.close();else render();};
  const close = () => dialog.close();
  dialog.addEventListener('close',()=>{
    window.removeEventListener('resize',resize);
    window.removeEventListener('hashchange',close);
    dialog.remove();
    if(previousFocus?.isConnected) previousFocus.focus({preventScroll:true});
  },{once:true});
  document.body.append(dialog);render();dialog.showModal();
  window.addEventListener('resize',resize);
  window.addEventListener('hashchange',close);
}

// Separate unscaled section keeps the interactive chart and its hover states intact.
function setupStickerStats(route) {
  const visible = route.startsWith('intro') && !Mobile.active();
  document.documentElement.classList.toggle('has-sticker-stats', visible);
  let section = document.getElementById('sticker-stats');
  if (!visible) { section?.remove(); return; }
  if (section) return;
  const entries = [
    [[4,5], 'В любой непонятной ситуации шлет букет'],
    [[3], 'Нихрена непонятно, но очень интересно'],
    [[1], 'Ставится, когда реакций уже недостаточно. Ощущается как мега лайк пошученной шутке'],
    [[6], 'Лягух вместе с Сашей пытается понять, что происходит'],
    [[2], 'все вроде бы плохо но не очень плохо, но уже вроде поныл, но еще нужно как-то завершить минуту страданий']
  ];
  section = document.createElement('section');
  section.id = 'sticker-stats';
  section.setAttribute('aria-labelledby','sticker-stats-title');
  section.innerHTML = '<h2 id="sticker-stats-title">Топ-5 стикеров</h2><ol class="sticker-ranking"></ol><a class="sticker-back" href="#/home">К другим территориям →</a>';
  const list = section.querySelector('ol');
  entries.forEach(([images,caption],index) => {
    const item = document.createElement('li');
    const rank = document.createElement('span'); rank.className='sticker-rank'; rank.textContent='Топ '+(index+1);
    const art = document.createElement('div'); art.className='sticker-art';
    images.forEach(number => {
      const image=document.createElement('img'); image.src='assets/stats-sticker-'+number+'.webp';
      image.alt=number===4?'Саша с букетом':number===5?'Смайлик с букетом':number===3?'Заинтересованный кот':number===1?'Экскаватор смеха':number===6?'Лягух с формулами':'Уставший смайлик на стуле';
      image.loading='lazy'; art.append(image);
    });
    const text=document.createElement('p'); text.textContent=caption;
    item.append(rank,art,text);list.append(item);
  });
  document.body.append(section);
}
