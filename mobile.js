'use strict';
const Mobile = (() => {
  const query = matchMedia('(max-width: 767px), (max-width: 1023px) and (pointer: coarse)');
  let accepted = false;
  try { accepted = sessionStorage.getItem('sasha-mobile-continue') === 'yes'; } catch {}
  const node = (tag, cls, text) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text !== undefined) el.textContent = text;
    return el;
  };
  const find = (root, id) => root.querySelector(`[data-node-id="${id}"]`);
  const link = (text, href, cls = 'm-button') => {
    const el = node('a', cls, text); el.href = href; return el;
  };
  function cleanCopy(source) {
    const copy = source.cloneNode(true);
    copy.querySelectorAll('img').forEach(el => el.remove());
    for (const el of [copy, ...copy.querySelectorAll('*')]) {
      el.removeAttribute('class'); el.removeAttribute('style');
      el.removeAttribute('data-node-id'); el.removeAttribute('data-name');
    }
    return copy;
  }
  const gameCrops = {
    '35:2131': [409,245,100,113.71,0,-13.85],
    '420:9': [220,129,274.09,100,0,0],
    '450:20': [305,406,126.15,116.59,0,-16.67],
    '35:2132': [465,95,129.68,1380,0,-777.89],
    '451:33': [301,287,100,186.05,0,-30.81]
  };
  function figure(source, caption = '') {
    const el = node('figure', 'm-photo');
    const img = node('img'); img.src = source.getAttribute('src');
    for (const key of ['width','height']) if(source.hasAttribute(key)) img.setAttribute(key,source.getAttribute(key));
    img.alt = caption; img.loading = 'lazy'; img.decoding = 'async';
    const frame = source.closest('[data-node-id]');
    const crop = gameCrops[frame?.getAttribute('data-node-id')];
    if (crop) {
      const [w,h,iw,ih,left,top] = crop;
      el.style.aspectRatio = `${w}/${h}`;
      el.style.position = 'relative';
      Object.assign(img.style,{position:'absolute',width:`${iw}%`,height:`${ih}%`,left:`${left}%`,top:`${top}%`,objectFit:'fill'});
    }
    el.append(img); return el;
  }
  function unit(source) {
    const el = node('section', 'm-unit');
    const pictures = [...source.querySelectorAll('img')].filter(im => !im.getAttribute('src').endsWith('.svg'));
    const copy = cleanCopy(source);
    const text = copy.textContent.replace(/\u200b/g, '').trim();
    if (text) {
      const rich = node('div', text.length < 110 ? 'm-copy m-note' : 'm-copy');
      rich.append(copy); el.append(rich);
      if(source.getAttribute('data-node-id') !== '204:6657' && text.length < 110 && (source.hasAttribute('data-italic') || source.querySelector('[data-italic]'))) el.classList.add('m-quote');
    }
    pictures.forEach(im => el.append(figure(im)));
    return el;
  }
  function gate(host, continueFlow) {
    const page = node('section', 'm-page m-gate');
    page.append(node('h1', 'm-title', 'На большом экране — ещё лучше'));
    page.append(node('p', 'm-gate-copy', 'Здесь много фотографий, мелких подписей и всяких штук. Для лучшего просмотра открой эту ссылку на компьютере. Или продолжай на телефоне — всё тоже работает.'));
    const copy = node('button', 'm-button', 'Скопировать ссылку'); copy.type = 'button';
    const next = node('button', 'm-button m-button-secondary', 'Продолжить на телефоне'); next.type = 'button';
    const status = node('p', 'm-status'); status.setAttribute('role', 'status');
    const field = node('input', 'm-link-field'); field.type = 'text'; field.readOnly = true;
    field.value = location.origin + location.pathname; field.hidden = true;
    field.setAttribute('aria-label', 'Ссылка на сайт');
    copy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(field.value);
        status.textContent = 'Ссылка скопирована';
      } catch {
        field.hidden = false; field.focus(); field.select();
        let ok = false;
        try { ok = document.execCommand('copy'); } catch {}
        status.textContent = ok ? 'Ссылка скопирована' : 'Выдели и скопируй ссылку ниже';
        if (ok) field.hidden = true;
      }
    });
    next.addEventListener('click', () => {
      accepted = true;
      try { sessionStorage.setItem('sasha-mobile-continue', 'yes'); } catch {}
      continueFlow();
    });
    page.append(copy, next, status, field); host.replaceChildren(page);
  }
  const pages = {
    beer: ['39:4995','39:5005',['410:837','39:5099','66:5785','46:5126','65:5781','66:5784']],
    friends: ['60:5731','60:5733',['62:5777','35:2129','8:23','60:5767','8:39','74:6487','61:5769','61:5770','392:656','61:5772','62:5775','392:657','62:5774']],
    sport: ['60:5515','60:5517',['60:5545','70:6482','70:6483','70:6470','194:6517','70:6472','175:6493','177:6506','194:6522','177:6502','35:2130']],
    games: ['60:5634','60:5636',['450:13','420:7','35:2131','450:15','451:33','450:17','450:22','451:35']],
    work: ['49:5228','49:5230',['51:5418','49:5262','51:5366','35:2126','51:5421','51:5264','8:30','49:5261','392:654','8:32','8:17']],
    about: ['51:5353','51:5355',['51:5416','394:781','51:5381','51:5397','51:5382','51:5403','51:5387','51:5392','51:5410','204:6657']]
  };
  function render(route, fragment, host) {
    const root = fragment.querySelector('.screen');
    const page = node('article', 'm-page'); page.dataset.route = route;
    if (route === 'welcome') {
      page.classList.add('m-welcome');
      page.append(node('p','m-disclaimer',find(root,'194:6645').textContent.trim()));
      const copy = node('div','m-welcome-copy');
      copy.append(cleanCopy(find(root,'204:6654')));
      page.append(copy,link('что же там','#/home'));
    } else if (pages[route]) {
      const [title, subtitle, units] = pages[route];
      page.append(link('← Назад', '#/home', 'm-back'));
      page.append(node('h1', 'm-title', find(root,title).textContent.trim()));
      page.append(node('p', 'm-subtitle', find(root,subtitle).textContent.trim()));
      for (const id of units) page.append(unit(find(root,id)));
      page.append(link('К другим территориям', '#/home'));
    } else if (route === 'home') {
      page.append(node('p','m-caption',find(root,'70:6462').textContent.trim()));
      const grid = node('div','m-menu');
      const entries = [
        ['22:1706','О тебе','68:6352'], ['35:2138','Игры','68:6353'],
        ['39:2144','Работа','68:6351'], ['29:1716','Пиво','68:6356'],
        ['22:1709','Спорт','68:6355'], ['22:1708','Друзья','68:6354']
      ];
      for (const [id,label,noteId] of entries) {
        const original = find(root,id);
        const card = link('',original.getAttribute('href'),'m-menu-card');
        card.append(node('span','m-menu-label',label),figure(original.querySelector('img'),label));
        grid.append(card);
      }
      for (const [i,id] of ['68:6351','68:6354','68:6353','68:6356','68:6355','68:6352'].entries()) {
        const phrase = node('aside','m-scribble',find(root,id).textContent.trim());
        phrase.dataset.phrase = i + 1; grid.append(phrase);
      }
      const extraPhrase = node('aside','m-scribble','вот такая вот фигня, собачка');
      extraPhrase.dataset.phrase = '7'; grid.append(extraPhrase);
      page.append(grid,node('p','m-note m-extra','тут ещё что-то ↓'),link('ТЫК','#/quiz','m-secret'));
      page.append(node('p','m-disclaimer',find(root,'70:6464').textContent.trim()));
    } else if (route.startsWith('intro')) {
      const intro = document.getElementById('screen-intro').content;
      page.append(node('p','m-disclaimer',find(intro,'32:1851').textContent.trim()));
      const chart = node('div','m-chart');
      const canvas = node('div','m-chart-canvas');
      canvas.append(find(intro,'32:1830').cloneNode(true)); chart.append(canvas);
      chart.setAttribute('role','img'); chart.setAttribute('aria-label','Из чего состоит Саша: юмор, спорт, работа, Дота и трипы');
      page.append(chart);
      const chips = node('div','m-chart-options');
      for (const [label,id] of [['34% юмор','35:2033'],['26% спорт','35:2035'],['8% работа','35:2037'],['15% дота 2','35:2039'],['17% трипы','35:2041']]) {
        const button = node('button','m-chip',label); button.type='button'; button.setAttribute('aria-pressed','false');
        button.addEventListener('click', () => {
          const wasSelected = button.getAttribute('aria-pressed') === 'true';
          chips.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed','false'));
          canvas.querySelectorAll('[data-highlight]').forEach(n=>n.removeAttribute('data-highlight'));
          if (!wasSelected) { button.setAttribute('aria-pressed','true');find(canvas,id).setAttribute('data-highlight',''); }
        });
        chips.append(button);
      }
      page.append(chips,node('p','m-intro-note','100% пива, крутости, мемов, авантюр, опозданий и кофе'),link('Назад','#/home'));
    } else if (route === 'quiz') {
      page.append(node('h1','m-title',[...find(root,'66:5902').children].map(p=>p.textContent.trim()).join(' — ')));
      const actions=node('div','m-quiz-actions');
      actions.append(link('пупупу','#/question-1'),link('зайду позже…','#/home','m-button m-button-secondary'));
      page.append(actions,unit(find(root,'70:6469')));
    } else if (route === 'gift') {
      for (const id of ['392:774','451:48','451:47','451:37','451:39']) page.append(unit(find(root,id)));
      page.append(link('Все, на главную','#/home'));
    } else if (route.startsWith('question-')) {
      const back = [...root.querySelectorAll('a')].find(a=>!a.hasAttribute('data-answer'));
      page.append(link('← Назад',back.getAttribute('href'),'m-back'),link('На главную','#/home','m-back m-home-link'));
      const heading = [...root.children].find(n=>n.tagName === 'P');
      page.append(node('h1','m-question',heading.textContent.trim()));
      const answers = node('div','m-answers');
      root.querySelectorAll('[data-answer]').forEach(original=>{
        const text = original.getAttribute('aria-label');
        const answer = original.tagName === 'A' ? link(text,original.getAttribute('href'),'m-answer') : node('button','m-answer',text);
        if (answer.tagName === 'BUTTON') answer.type = 'button';
        answer.setAttribute('data-answer',''); answer.setAttribute('aria-label',text);
        answers.append(answer);
      });
      page.append(answers);

    }
    host.replaceChildren(page); fit(host);
  }
  function fit(host) {
    const chart=host.querySelector('.m-chart');
    if(chart) chart.style.setProperty('--chart-scale',chart.clientWidth/1100);
  }
  return {query,active:()=>query.matches,needsGate:()=>!accepted,gate,render,fit};
})();
