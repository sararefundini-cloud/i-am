(() => {
  'use strict';
  const el = id => document.getElementById(id);
  const make = (tag, text, cls) => {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (cls) node.className = cls;
    return node;
  };
  const action = (label, fn, cls) => {
    const button = make('button', label, cls);
    button.addEventListener('click', fn);
    return button;
  };
  const rooms = [
    {id:'stoned', title:'The Mason', file:'Stoned/index.html', place:'The looping hallway', motif:'Stone'},
    {id:'baptism', title:'The Jordan River', file:'mason.html', place:'The dwelling and the river', motif:'Water'},
    {id:'baker', title:'The Baker', file:'The Baker.html', place:'The house of bread', motif:'Bread'},
    {id:'fig', title:'The Fig Tree', file:'fig-3d.html', place:'The vineyard', motif:'Fig'}
  ];
  const panel = el('panel'), body = el('panel-body'), stage = el('stage');
  const storageKey = 'iam.passage-journal.v1';
  let book = {entries:[], finished:[]}, room, frame, filter='All', storageFailed=false;
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (Array.isArray(saved?.entries) && Array.isArray(saved?.finished)) book = saved;
  } catch { /* The journal also works in memory. */ }
  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify(book)); } catch { storageFailed=true; }
    el('count').textContent = book.entries.length ? '· ' + book.entries.length : '';
  }
  function find({ref, text='', motif, note=''}) {
    if (typeof ref !== 'string' || !ref.trim() || !room) return;
    motif = motif || room.motif;
    const existing = book.entries.find(entry => entry.ref===ref && entry.motif===motif);
    if (existing) {
      if (text && !existing.lines.includes(text)) existing.lines.push(text);
      if (!existing.observation && note) existing.observation=note;
    } else {
      book.entries.push({ref,motif,lines:text?[text]:[],observation:note,personal:''});
    }
    save();
  }
  function completed() {
    if (!room || book.finished.includes(room.id)) return;
    book.finished.push(room.id);
    save();
  }
  function showPanel(title) {
    body.replaceChildren(make('h2',title));
    if (!panel.open) panel.showModal();
    panel.scrollTop=0;
  }
  function home() {
    panel.close();
    stage.replaceChildren(); stage.className='';
    room=null; frame=null;
    el('play').hidden=true; el('entrance').hidden=false; el('home-journal').hidden=false;
    el('enter').focus();
  }
  function play(next) {
    if (panel.open) panel.close();
    room=next; frame=null;
    el('entrance').hidden=true; el('home-journal').hidden=true; el('play').hidden=false;
    el('now-playing').textContent=room.title;
    stage.replaceChildren(); stage.className=room.file?'':'study';
    if (room.file) {
      frame=make('iframe');
      frame.title=room.title; frame.allow='autoplay; fullscreen'; frame.src=room.file;
      frame.addEventListener('load',()=>{if(!panel.open) frame?.focus()});
      stage.append(frame);const curtain=make('div','','chapter-curtain');curtain.append(make('small','I AM · '+String(rooms.indexOf(room)+1).padStart(2,'0')),make('h2',room.title),make('p',room.motif));stage.append(curtain);setTimeout(()=>curtain.remove(),2600);
    } else {
      window.IAMEncounters.open(room.id,{root:stage,onFind:find,onComplete:()=>{completed();choose();}});
      stage.querySelector('button')?.focus();
    }
  }
  window.addEventListener('message',event=>{
    if (!frame || event.source!==frame.contentWindow || event.data?.game!=='i-am') return;
    if (event.data.type==='passage') find(event.data);
    if (event.data.type==='complete') { completed(); if(room.id==='baptism'||room.id==='baker'){const next=rooms[rooms.indexOf(room)+1];showPanel('Continue to '+next.title+'?');body.append(action('Continue',()=>play(next),'primary'),action('Keep playing',()=>panel.close()));} }
    if (event.data.type==='rooms') choose();
    if (event.data.type==='next-jordan') {completed();play(rooms[1]);}
  });
  function choose() {
    showPanel('Choose a chapter');
    rooms.forEach((item,i)=>{
      if (i===4) body.append(make('h3','Future chapters'));
      if (i>=4) return;
      const btn=action('',()=>{
        if (room===item) {panel.close();return;}
        if (room?.file && !book.finished.includes(room.id)) {
          showPanel('Leave '+room.title+'?');
          body.append(make('p','Your passage journal stays with you. Returning to this chapter starts a new walk.'));
          body.append(action('Keep playing',()=>panel.close()),action('Enter '+item.title,()=>play(item),'primary'));
        } else play(item);
      },'room-row');
      btn.append(make('strong',item.title),make('span',room===item?'Playing':book.finished.includes(item.id)?'Completed · Play again':item.place));
      body.append(btn);
    });
    if (room) body.append(action('Back to title',()=>{
      showPanel('Return to the title?');body.append(make('p','This walk will close. Your journal stays with you.'),action('Keep playing',()=>panel.close()),action('Return to title',home));
    }));
    body.querySelector('button')?.focus();
  }
  function exportBook() {
    const content=['I AM — Passage journal', ...book.entries.map(e=>[e.motif+' · '+e.ref,...e.lines,e.observation,e.personal].filter(Boolean).join('\n'))].join('\n\n');
    const url=URL.createObjectURL(new Blob([content],{type:'text/plain;charset=utf-8'}));
    const a=make('a');a.href=url;a.download='I AM - passage journal.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function journal() {
    showPanel('Passage journal');
    if (!book.entries.length) {
      body.append(make('p','Your first entry appears when you encounter a passage. Follow stone, water, bread, and fig through the chapters and keep the questions you want to return to.'));
      body.append(action(room?'Return to '+room.title:'Choose a chapter',room?()=>panel.close():choose,'primary'));
      return;
    }
    const controls=make('div','','toolbar');
    for(const motif of ['All','Stone','Water','Bread','Fig']) {
      const btn=action(motif,()=>{filter=motif;journal();});
      btn.setAttribute('aria-pressed',String(motif===filter));controls.append(btn);
    }
    body.append(controls);
    const items=book.entries.filter(entry=>filter==='All'||filter===entry.motif);
    if (!items.length) body.append(make('p','Your '+filter.toLowerCase()+' passages will appear here as you find them.'));
    for(const entry of items) {
      const article=make('article','','journal-item');
      article.append(make('small',entry.motif),make('h3',entry.ref));
      for(const line of entry.lines) article.append(make('p',line));
      if(entry.observation) article.append(make('p',entry.observation));
      const link=make('a','Read in context · KJV');link.href='https://www.biblegateway.com/passage/?search='+encodeURIComponent(entry.ref)+'&version=KJV';link.target='_blank';link.rel='noopener';
      const label=make('label','My question or observation');
      const input=make('textarea');input.rows=2;input.value=entry.personal;
      input.addEventListener('input',()=>{entry.personal=input.value;save();});label.append(input);
      article.append(link,label);body.append(article);
    }
    body.append(make('p',storageFailed?'Saving is unavailable in this browser. Download your journal to keep it.':'Your journal is saved in this browser.','sup'),action('Download journal',exportBook));
  }
  el('enter').onclick=()=>play(rooms[0]);el('chapters').onclick=choose;el('rooms').onclick=choose;
  el('home-journal').onclick=journal;el('play-journal').onclick=journal;el('close').onclick=()=>panel.close();
  panel.addEventListener('close',()=>{if(frame)frame.focus();});
  window.addEventListener('keydown',e=>{
    if (e.altKey||e.ctrlKey||e.metaKey||e.target.matches('input,textarea,select')) return;
    const scope=panel.open?panel:document;
    const options=Array.from(scope.querySelectorAll('button,a[href]')).filter(b=>b.offsetWidth>0 && !b.disabled);
    if (!options.length) return;
    if (['ArrowDown','ArrowRight','ArrowLeft','ArrowUp'].includes(e.key)) {
      e.preventDefault();
      const inc=['ArrowDown','ArrowRight'].includes(e.key)?1:-1;
      const index=options.indexOf(document.activeElement);
      options[(index<0?0:(index+inc+options.length)%options.length)].focus();
    } else if (e.code==='Space' && !e.repeat && !['BUTTON','A'].includes(e.target.tagName)) {
      e.preventDefault();options[0].click();
    }
  });
  el('count').textContent=book.entries.length?'· '+book.entries.length:'';
})();
