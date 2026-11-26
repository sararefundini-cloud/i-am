(() => {
'use strict';
const $=id=>document.getElementById(id);
const scene=$('scene'), canvas=$('art'), g=canvas.getContext('2d'), target=$('target'), act=$('act');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const TAU=Math.PI*2;
const quotes={
  owner:['Luke 13:7','these three years I come seeking fruit on this fig tree, and find none'],
  gardener:['Luke 13:8','Lord, let it alone this year also'],
  climb:['Luke 19:4','climbed up into a sycomore tree to see him'],
  supper:['Luke 19:5','I must abide at thy house.'],
  restore:['Luke 19:8','I restore him fourfold.'],
  bare:['Mark 11:13','he found nothing but leaves'],
  speak:['Mark 11:14','No man eat fruit of thee hereafter for ever.'],
  roots:['Mark 11:20','dried up from the roots.'],
  faith:['Mark 11:22','Have faith in God.']
};
const story={
  sun:{land:'grove',role:'YOU ARE THE FIG TREE',title:'One more year',body:'My branches reach for the sun. I feel its warmth and still I have nothing to give. Someone is coming between the rows.', action:'Reach for sunlight',hint:'Press ↑ or Space to lift a branch into each patch of sun.',count:3,arrow:'ArrowUp'},
  owner:{land:'grove',role:'YOU ARE THE FIG TREE',title:'The owner comes looking',body:'He puts his hand among my leaves. For three years he has come looking for figs. I feel the weight of every empty branch. He tells the gardener to cut me down.',action:'Listen to the gardener',verse:'owner'},
  gardener:{land:'grove',role:'YOU ARE THE FIG TREE',title:'Let it stand',body:'The gardener kneels. He asks for another year to dig around me and feed the soil. His hands begin to loosen the earth at my roots.',action:'Take root for another year',verse:'gardener'},
  climb:{land:'split',role:'YOU ARE ZACCHAEUS',title:'A way to see him',body:'In Jericho, shoulders close up ahead of me. Jesus is passing. I catch the lowest limb of a sycomore fig. Beside my climb, the gardener returns to the tree he tended.',action:'Climb one branch',hint:'Press ↑ or Space for each handhold. Watch both trees.',count:3,arrow:'ArrowUp'},
  pluck:{land:'split',role:'YOU ARE THE GARDENER',title:'Something gives',body:'Above the crowd, Zacchaeus can see Jesus. My hand finds a soft fig under a leaf. A year ago, I felt only wood here.',action:'Pick the ripe fig',hint:'Pull the fig down, or press ↓ or Space.',verse:'climb',arrow:'ArrowDown'},
  taste:{land:'split',role:'YOU ARE THE GARDENER',title:'The first taste',body:'I turn the ripe fig in my hand. Across the divide, Jesus stops beneath the sycomore and looks up at the man who climbed it.',action:'Taste the fig'},
  called:{land:'split',role:'YOU ARE ZACCHAEUS',title:'He looked up',body:'The gardener tastes the fruit he waited for. Jesus calls me down by name. This time I am the one who has been found.',action:'Come down to Jesus',verse:'supper',arrow:'ArrowDown'},
  plate:{land:'supper',role:'YOU ARE ZACCHAEUS',title:'At my table',body:'Jesus sits across from me. The figs from the gardener’s hand fall into my supper, one by one. He waits while I gather the words to speak.',action:'Drop a fig onto the plate',hint:'Draw a fig down to the plate, or press ↓ or Space.',count:3,arrow:'ArrowDown'},
  change:{land:'supper',role:'YOU ARE ZACCHAEUS',title:'What I want to say',body:'I look at my guest. I know whose money filled this house. I want the people I took it from to see something change.',action:'Say “I want to change”'},
  repay:{land:'supper',role:'YOU ARE ZACCHAEUS',title:'The fruit of a changed life',body:'I stand and promise half my goods to the poor. I will give back four times what I took by false accusation. The fruit in this room is what I do next.',action:'Leave the table',verse:'restore'},
  walk:{land:'road',role:'YOU ARE JESUS · BETHANY',title:'On the road out of Bethany',body:'Morning. I am hungry. Farther along the road, a different fig tree spreads its green leaves. I go to it to look for a fig for breakfast.',action:'Walk toward the fig tree',hint:'Press ↑ or Space to take each stretch of the road.',count:3,arrow:'ArrowUp',ref:'Mark 11:12–13'},
  leaves:{land:'road',role:'YOU ARE JESUS',title:'Beneath the leaves',body:'I draw a bough toward me. If there is fruit, I will find it where the leaf meets the stem.',action:'Part a leaf',hint:'Sweep each leaf aside, or press ←, → or Space.',count:3,arrow:'either'},
  stem:{land:'road',role:'YOU ARE JESUS',title:'A bare stem',body:'I have searched the branch. There is nothing here for breakfast. Mark says it was not the season for figs. My disciples can hear me.',action:'Speak to the tree',verse:'bare'},
  word:{land:'road',role:'YOU ARE JESUS',title:'A word on the road',body:'My disciples hear the words. We go on to Jerusalem. By the time we leave the city, it is evening.',action:'Return the next morning',verse:'speak'},
  follow:{land:'morning',role:'YOU ARE PETER',title:'The next morning',body:'We pass the tree again. A dry leaf comes loose above me. I follow it down the trunk to the ground.',action:'Follow the falling leaf',hint:'Trace the leaf downward, or press ↓ or Space.',count:3,arrow:'ArrowDown'},
  sweep:{land:'morning',role:'YOU ARE PETER',title:'Where the leaf came to rest',body:'Dry leaves have caught against the trunk. I kneel to see what is underneath them.',action:'Brush leaves away',hint:'Sweep the litter away, or press ←, → or Space.',count:3,arrow:'either'},
  roots:{land:'morning',role:'YOU ARE PETER',title:'All the way to the roots',body:'The leaf was only the first thing I saw. The roots themselves have shrivelled. I remember what Jesus said here yesterday and call his attention to the tree.',action:'Listen to Jesus',verse:'roots',ref:'Mark 11:20–21'},
  faith:{land:'morning',role:'YOU ARE PETER',title:'What he says to us',body:'Yesterday I heard him speak to the tree. Today, standing by its roots, I hear him speak to us.',action:'Finish The Fig Tree',verse:'faith'},
  end:{land:'morning',role:'THE FIG TREE',title:'What did you come looking for?',body:'The owner looked for fruit. Zacchaeus looked for Jesus. Jesus looked beneath the leaves. Carry that question with you when you find another fig tree in Scripture.',action:'Replay The Fig Tree'}
};
const order=Object.keys(story),seen=new Set();
let key='sun',step=0,width=0,height=0,drag=null,shake=0,start=performance.now();
let fall=null,spots=[],clock=0;
function emit(data){if(parent!==window)parent.postMessage({game:'i-am',...data},'*')}
function scripture(which){
  const q=quotes[which],el=$('verse');el.hidden=!q;
  if(q){
    el.firstElementChild.textContent='“'+q[1]+'”';el.lastElementChild.textContent=q[0]+' · KJV';
    if(!seen.has(q[0])){seen.add(q[0]);emit({type:'passage',ref:q[0],text:q[1]})}
  }
}
function panel(){
  const s=story[key];scene.dataset.land=s.land;scene.dataset.detail=['sweep','roots','faith','end'].includes(key)?'roots':'';
  const showSun=key==='sun'||key==='owner';
  sunlight.hidden=!showSun;const light=key==='owner'?3:step;
  sun-meter.value=light;sun-count.textContent=light+' / 3';rooms.hidden=key!=='end'||parent===window;
  $('role').textContent=s.role;$('title').textContent=s.title;
  $('body').textContent=s.body+(s.ref&&!s.verse?'  ('+s.ref+')':'');
  if(key==='roots')$('body').textContent+='  (Mark 11:21)';
  scripture(s.verse);
  $('hint').textContent=s.hint||'Press Space or select the action.';
  act.textContent=s.action;scene.style.setProperty('--climb',(70-Math.min(3,key==='climb'?step:3)*13)+'%');
  let zoom=1;if(key==='walk')zoom=1.04+step*.075;if(['leaves','stem','word'].includes(key))zoom=1.38;
  if(key==='follow')zoom=1.04+step*.07;if(['sweep','roots','faith','end'].includes(key))zoom=1.31;
  scene.style.setProperty('--zoom',zoom);draw(performance.now());
}
function go(next){
  key=next;step=0;start=performance.now();drag=null;fall=null;
  if(next==='end')emit({type:'complete'});
  if(next==='sun')seen.clear();panel();
}
function activate(){
  const s=story[key];
  if(s.count&&step<s.count){
    if(key==='plate')fall={from:spots[0],start:performance.now(),index:step};
    step++;shake=performance.now();if(step<s.count||key==='plate')panel();
    if(step<s.count)return;
    if(key==='sun')return go('owner');
    if(key==='climb')return go('pluck');
    if(key==='walk')return go('leaves');
    if(key==='leaves')return go('stem');
    if(key==='follow')return go('sweep');
    if(key==='sweep')return go('roots');
    if(key==='plate'){
      // The final fig lands before the player speaks. Keep the dish in view.
      act.disabled=true;target.hidden=true;
      setTimeout(()=>{if(key==='plate'){act.disabled=false;go('change')}},reduced?35:440);return;
    }
  }
  if(key==='plate'&&step>=3)return;
  go(order[(order.indexOf(key)+1)%order.length]);
}
function pointerPosition(e){const rect=scene.getBoundingClientRect();return [(e.clientX-rect.left)/width,(e.clientY-rect.top)/height]}
target.addEventListener('pointerdown',e=>{if(e.button!==0||act.disabled)return;e.preventDefault();drag={p:pointerPosition(e),id:e.pointerId};target.setPointerCapture(e.pointerId)});
target.addEventListener('pointermove',e=>{if(drag&&drag.id===e.pointerId){drag.p=pointerPosition(e);draw(performance.now())}});
target.addEventListener('pointerup',e=>{if(!drag||drag.id!==e.pointerId)return;drag=null;activate()});
target.addEventListener('pointercancel',()=>{drag=null;draw(performance.now())});
target.addEventListener('click',e=>{if(e.detail===0&&!act.disabled)activate()});
rooms.addEventListener('click',()=>emit({type:'rooms'}));
act.addEventListener('click',()=>{if(!act.disabled)activate()});
addEventListener('keydown',e=>{
  if(e.target===rooms)return;
  const arrow=story[key].arrow,match=e.code==='Space'||e.key===arrow||arrow==='either'&&['ArrowLeft','ArrowRight'].includes(e.key);
  if(!match)return;e.preventDefault();if(e.repeat||act.disabled)return;activate();
});
function resize(){
  const box=scene.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.8);
  width=box.width;height=box.height;canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);g.setTransform(dpr,0,0,dpr,0,0);draw(performance.now());
}
function photoPoint(x,y,pctX=.5,pctY=.5){
  const scale=Math.max(width/1672,height/941),w=1672*scale,h=941*scale;
  return [(x*w+(width-w)*pctX)/width,(y*h+(height-h)*pctY)/height];
}
function fig(x,y,r,ripe=1,cut=false){
  g.save();g.translate(x,y);g.rotate(-.19);g.scale(r,r);
  const skin=g.createRadialGradient(-.32,-.12,.05,.1,.27,1.32);
  skin.addColorStop(0,ripe>.6?'#a18683':'#a39f65');skin.addColorStop(.46,ripe>.6?'#765566':'#777b45');skin.addColorStop(1,ripe>.6?'#302433':'#464c2c');
  g.beginPath();g.moveTo(-.10,-1.04);g.bezierCurveTo(-.22,-.66,-.97,-.38,-.86,.31);g.bezierCurveTo(-.79,.91,.13,1.08,.61,.62);g.bezierCurveTo(1.05,.18,.56,-.35,.23,-.63);g.quadraticCurveTo(.06,-.82,.05,-1.04);g.closePath();g.fillStyle=skin;g.fill();
  g.lineWidth=.021;for(let i=-3;i<4;i++){g.strokeStyle=i%2?'#cab08c51':'#2a192a66';g.beginPath();g.moveTo(0,-.82);g.bezierCurveTo(i*.12,-.36,i*.30,.16,i*.14,.67);g.stroke()}
  for(let i=0;i<36;i++){let a=i*2.399,rr=.64*Math.sqrt(i/36);g.fillStyle=i%3?'#e4b99159':'#35293980';g.fillRect(Math.cos(a)*rr,Math.sin(a)*rr+.10,.024,.018)}
  g.fillStyle='#8e7949';g.beginPath();g.moveTo(-.10,-.88);g.lineTo(-.09,-1.23);g.lineTo(.07,-1.29);g.lineTo(.06,-.88);g.fill();
  if(cut){g.fillStyle='#c5ad76';g.beginPath();g.ellipse(.15,.08,.46,.58,.3,0,TAU);g.fill();g.fillStyle='#99474d';g.beginPath();g.ellipse(.15,.08,.39,.51,.3,0,TAU);g.fill();for(let i=0;i<47;i++){let a=i*2.4,rr=.32*Math.sqrt(i/47);g.fillStyle='#e9aa7d';g.fillRect(.14+Math.cos(a)*rr,.08+Math.sin(a)*rr*1.4,.032,.033)}}
  g.restore();
}
const leafPhoto=new Image(),leafSheets={};
leafPhoto.onload=()=>{
  const outline=[[325,111],[306,92],[296,71],[282,60],[273,61],[252,54],[247,64],[207,59],[202,62],[181,64],[160,72],[163,82],[174,99],[194,113],[197,120],[178,129],[153,127],[133,135],[121,143],[117,165],[108,174],[103,194],[104,216],[107,238],[114,242],[136,234],[153,234],[171,221],[194,219],[211,210],[222,195],[231,174],[246,156],[260,149],[270,153],[273,159],[267,174],[250,197],[248,213],[253,230],[268,229],[284,242],[291,278],[301,291],[312,299],[321,316],[332,326],[344,315],[350,303],[363,290],[368,276],[375,272],[376,242],[382,242],[394,256],[409,261],[421,268],[426,258],[430,233],[430,213],[423,191],[413,182],[405,172],[405,165],[411,162],[420,169],[425,178],[454,183],[464,178],[456,151],[451,140],[438,129],[419,123],[407,120],[384,112],[374,107],[380,100],[375,94],[359,100],[340,103]];
  for(const dry of [false,true]){
    const c=document.createElement('canvas');c.width=370;c.height=280;const ink=c.getContext('2d');
    ink.save();ink.translate(-99,-51);ink.beginPath();outline.forEach(([x,y],i)=>i?ink.lineTo(x,y):ink.moveTo(x,y));ink.closePath();ink.clip();
    ink.filter=dry?'grayscale(.93) sepia(.96) saturate(1.4) brightness(2.5)':'brightness(1.55) saturate(1.1)';
    ink.drawImage(leafPhoto,1200,214,472,350,0,0,472,350);ink.restore();leafSheets[dry?'dry':'fresh']=c;
  }
  draw(performance.now());
};
leafPhoto.src='assets/fig-grove.jpg';
function leaf(x,y,size,rotation,dry=false){
  const source=leafSheets[dry?'dry':'fresh'];if(source){g.save();g.translate(x,y);g.rotate(rotation);g.drawImage(source,-size,-size*.72,size*2,size*1.52);g.restore();return}
  g.save();g.translate(x,y);g.rotate(rotation);g.scale(size,size);
  const pigment=g.createLinearGradient(-.6,-1,.8,.65);
  pigment.addColorStop(0,dry?'#a08048':'#a3a06a');pigment.addColorStop(.45,dry?'#735e3b':'#596c3d');pigment.addColorStop(1,dry?'#3e3828':'#2b3e26');
  g.strokeStyle=dry?'#3c3726':'#33412a';g.lineWidth=.019;g.beginPath();g.moveTo(0,.79);g.quadraticCurveTo(-.37,.67,-.70,.31);g.lineTo(-.35,.29);g.quadraticCurveTo(-.69,.02,-.72,-.43);g.lineTo(-.24,-.24);g.quadraticCurveTo(-.21,-.68,.04,-1);g.quadraticCurveTo(.34,-.59,.27,-.19);g.lineTo(.72,-.46);g.quadraticCurveTo(.67,.02,.38,.28);g.lineTo(.74,.26);g.quadraticCurveTo(.38,.71,0,.79);g.fillStyle=pigment;g.fill();g.stroke();
  g.strokeStyle=dry?'#c4a26e':'#abc090';g.lineWidth=.018;for(const tip of [[.04,-.88],[-.59,-.32],[.61,-.34],[-.55,.33],[.55,.30]]){g.beginPath();g.moveTo(0,.74);g.quadraticCurveTo(tip[0]*.38,.18,tip[0],tip[1]);g.stroke()}
  g.lineWidth=.036;g.beginPath();g.moveTo(0,.71);g.quadraticCurveTo(-.01,.90,.08,1);g.stroke();g.restore();
}
function twig(ax,ay,bx,by,weight=7,dead=false){
  const x1=ax*width,y1=ay*height,x2=bx*width,y2=by*height;
  g.lineCap='round';g.strokeStyle=dead?'#3a3328':'#423b29';g.lineWidth=weight;g.beginPath();g.moveTo(x1,y1);g.bezierCurveTo(x1+(x2-x1)*.33,y1+(y2-y1)*.15,x1+(x2-x1)*.70,y1+(y2-y1)*.87,x2,y2);g.stroke();
  g.strokeStyle=dead?'#aa9675':'#97835b';g.lineWidth=Math.max(.8,weight*.20);g.stroke();
}
function place(x,y,label){
  x=clamp(x,.095,.90);y=clamp(y,.16,.80);spots=[[x,y]];target.style.left=x*100+'%';target.style.top=y*100+'%';target.hidden=false;target.setAttribute('aria-label',label);target.lastElementChild.textContent=label;
}
function draw(now){
  if(!width||!height)return;g.clearRect(0,0,width,height);
  const unit=Math.min(width,height),s=story[key];target.hidden=true;spots=[];
  const point=(x,y,r,angle,dry)=>leaf(x*width,y*height,r*unit,angle,dry);
  if(key==='sun'){
    const suns=[[.235,.24],[.40,.19],[.58,.23]],spot=suns[step]||suns[2];
    const [x,y]=spot;const glow=g.createRadialGradient(x*width,y*height,1,x*width,y*height,unit*.21);
    glow.addColorStop(0,'#fff1bc99');glow.addColorStop(.17,'#fedc8e55');glow.addColorStop(1,'#ffe3a600');g.fillStyle=glow;g.fillRect(0,0,width,height);
    for(let i=0;i<=step;i++){const p=suns[i];if(!p)continue;let tx=p[0],ty=p[1]+.10;if(drag&&i===step){tx=drag.p[0];ty=drag.p[1]}twig(.14+i*.06,.72,tx,ty,3.6);point(tx,ty,.052,-.65+i*.34,false)}
    place(x,y,'Sunlight');
  }
  if(s.land==='split'){
    const climb=key==='climb'?step:3,grips=[[.17,.68],[.32,.48],[.24,.29]],ripe=climb/3;
    if(key==='climb'){const p=grips[step];if(p)place(...p,'Handhold')}
    const fx=.73,fy=.46;
    if(key==='climb'||key==='pluck'){
      twig(.92,.12,fx,fy-.055,5);point(fx+.035,fy-.091,.073,.58,false);
      const p=key==='pluck'&&drag?drag.p:[fx,fy];fig(p[0]*width,p[1]*height,unit*(.036+.018*ripe),ripe);
      if(key==='pluck')place(fx,fy,'Ripe fig');
    }
    if(key==='taste'||key==='called'){
      fig(.74*width,.59*height,unit*.094,1,key==='called');
      if(key==='taste')place(.74,.59,'Taste');
    }
  }
  if(s.land==='supper'){
    const plate=photoPoint(.5,.78,width<=620?.76:.62,.82),limit=key==='plate'?step:3;
    for(let i=0;i<limit;i++){
      const dest=[plate[0]+[0,-.045,.047][i],plate[1]+[.003,.015,.02][i]];
      let x=dest[0],y=dest[1];if(fall&&fall.index===i){const f=reduced?1:clamp((now-fall.start)/400,0,1);x=fall.from[0]+(x-fall.from[0])*f;y=fall.from[1]+(y-fall.from[1])*f*f;}
      fig(x*width,y*height,unit*.037,1);
    }
    if(key==='plate'&&step<3){
      const pos=[[.36,.41],[.53,.34],[.63,.41]][step],drawPos=drag?drag.p:pos;
      fig(drawPos[0]*width,drawPos[1]*height,unit*.046,1);place(...pos,'Fig');
    }
  }
  if(key==='walk'){const route=[[.54,.73],[.56,.57],[.58,.43]][step];if(route)place(...route,'Walk')}
  if(['leaves','stem','word'].includes(key)){
    twig(.92,.88,.45,.42,12);twig(.61,.59,.54,.36,4.5);
    const cover=[[.50,.46,-.43],[.60,.46,.64],[.55,.49,.02]];
    const gone=key==='leaves'?step:3;
    for(let i=0;i<cover.length;i++){const [x,y,r]=cover[i];if(i<gone){point(x+(i%2?.16:-.17),y+.02,.113,r+(i%2?.7:-.8),false);continue}
      const p=i===gone&&drag?drag.p:[x,y];point(p[0],p[1],.14,r,false)}
    if(key==='leaves')place(cover[step][0],cover[step][1],'Leaf');
  }
  if(key==='follow'){
    const pos=[[.46,.26],[.58,.43],[.52,.66]][step];if(pos){const pt=drag?drag.p:pos;
    const drift=reduced?0:Math.sin(now/830)*.009;point(pt[0]+drift,pt[1],.074,-.76+step*.55,true);place(pt[0]+drift,pt[1],'Falling leaf')}
  }
  if(['sweep','roots','faith','end'].includes(key)){
    const piles=[[.38,.68],[.5,.70],[.61,.67]];
    for(let i=0;i<3;i++){const removed=key==='sweep'?i<step:true;const p=piles[i];let x=p[0]+(removed?(i%2?.23:-.22):0),y=p[1]+(removed?.08:0);
      if(key==='sweep'&&i===step&&drag){x=drag.p[0];y=drag.p[1]}
      for(let j=0;j<7;j++)point(x+Math.cos(j*2.4)*.055,y+Math.sin(j*2.4)*.045,.084+(j%3)*.014,j*1.2,true);
    }
    if(key==='sweep')place(...piles[step],'Dry leaves');
  }
}
function animate(now){
  if(document.visibilityState==='visible'&&(key==='follow'||fall&&now<fall.start+460))draw(now);
  requestAnimationFrame(animate);
}
new ResizeObserver(resize).observe(scene);resize();panel();requestAnimationFrame(animate);
})();