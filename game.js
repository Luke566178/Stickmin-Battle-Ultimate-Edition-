// ==========================
// GAME.JS — LUIGI, FIREBALL, AND ALL HATS
// ==========================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let game = { players: [], projectiles: [], particles: [], t: 0 };

// ==========================
// SOUNDS
// ==========================
const sounds = {
  sword: new Audio('sounds/sword.wav'),
  jump: new Audio('sounds/jump.wav'),
  meteor: new Audio('sounds/meteor.wav'),
  snap: new Audio('sounds/snap.wav'),
  fireball: new Audio('sounds/fireball.wav'),
  hit: new Audio('sounds/hit.wav')
};
function playSound(name){ if(sounds[name]){ sounds[name].currentTime=0; sounds[name].play(); } }

// ==========================
// PRE-MADE STICKMEN
// ==========================
const preMadeStickmen = [
  {id:'luigi', color:'green', hat:'green', weapon:'fireball'},
  {id:'mario', color:'red', hat:'red', weapon:'sword'},
  {id:'pikachu', color:'yellow', hat:null, weapon:'sword'},
  {id:'ironMan', color:'red', hat:'gold', weapon:'ironGauntlet'},
  {id:'spiderman', color:'red', hat:null, weapon:'sword'},
  {id:'sonic', color:'blue', hat:null, weapon:'sword'},
  {id:'captainAmerica', color:'blue', hat:null, weapon:'shield'},
  {id:'thanos', color:'purple', hat:null, weapon:'thanosGauntlet'}
];

// ==========================
// WEAPONS
// ==========================
const weapons = [
  {id:'sword', name:'Sword', damage:10, cooldown:30, ability:()=>{}},
  {id:'meteorStaff', name:'Meteor Staff', damage:20, cooldown:180, ability:function(player){spawnMeteor(player.x+rand(-100,100),player.y-400);}},
  {id:'thanosGauntlet', name:'Thanos Gauntlet', damage:25, cooldown:300, ability:function(player){game.players.forEach(p=>{if(p!==player)p.takeDamage(50);spawnParticle(p.x,p.y,'purple');}); playSound('snap');}},
  {id:'ironGauntlet', name:'Iron Gauntlet', damage:15, cooldown:120, ability:function(player){spawnProjectile(player.x,player.y-20,10,10,'repulsor',player.id);}},
  {id:'fireball', name:'Fireball', damage:15, cooldown:40, ability:function(player){
    const fireX = player.x + player.facing*20;
    const fireY = player.y - 30;
    game.projectiles.push({x:fireX,y:fireY,w:15,h:15,vx:player.facing*10,vy:-2,ownerId:player.id,weapon:'fireball',life:150,onHit:function(p){if(p.id!==player.id){p.takeDamage(15);spawnParticle(p.x,p.y,'orange');spawnParticle(p.x,p.y,'red');}}});
    playSound('fireball');
  }}
];

// ==========================
// PLAYER CLASS
// ==========================
class Player{
  constructor(x,y,color='blue',id='P1',hat=null){
    this.id=id; this.x=x; this.y=y; this.vx=0; this.vy=0;
    this.color=color; this.hat=hat; this.size=40;
    this.hp=100; this.maxHp=100; this.weapon='sword';
    this.controls={left:false,right:false,up:false,attack:false,ability:false};
    this.state='idle'; this.facing=1; this.cooldown=0;
  }
  update(){
    if(this.controls.left){ this.vx-=1; this.facing=-1; this.state='walk'; }
    else if(this.controls.right){ this.vx+=1; this.facing=1; this.state='walk'; }
    else{ this.vx*=0.85; if(Math.abs(this.vx)<0.1)this.state='idle'; }
    if(this.controls.up && this.onGround()){ this.vy=-18; playSound('jump'); this.state='jump'; }
    this.vy+=1; this.x+=this.vx; this.y+=this.vy;
    if(this.y>canvas.height-50){this.y=canvas.height-50; this.vy=0; if(this.state==='jump') this.state='idle';}
    if(this.cooldown>0) this.cooldown--;
  }
  attack(){ if(this.cooldown===0){ spawnHitbox(this.x,this.y-20,60,30,this.id,this.weapon); playSound('sword'); this.cooldown=30; this.state='attack';}}
  ability(){ const w=weapons.find(w=>w.id===this.weapon); if(w && this.cooldown===0){ w.ability(this); this.cooldown=w.cooldown; this.state='ability'; }}
  takeDamage(d){this.hp-=d; spawnParticle(this.x,this.y,'red'); playSound('hit'); if(this.hp<=0)this.die();}
  die(){ for(let i=0;i<15;i++) spawnParticle(this.x,this.y,this.color); this.x=-1000; this.y=-1000;}
  onGround(){return this.y>=canvas.height-50;}
  draw(){
    ctx.fillStyle=this.color; ctx.fillRect(this.x-10,this.y-40,20,40);
    if(this.hat){ ctx.fillStyle=this.hat; ctx.fillRect(this.x-10,this.y-50,20,10); }
    if(this.state==='attack'){ ctx.fillStyle='yellow'; ctx.fillRect(this.x+this.facing*10,this.y-35,10,5); }
  }
}

// ==========================
// PROJECTILES & PARTICLES
// ==========================
function spawnProjectile(x,y,w,h,type,ownerId){ game.projectiles.push({x,y,w,h,type,ownerId,vy:0,life:200});}
function spawnHitbox(x,y,w,h,ownerId,weapon){ game.projectiles.push({x,y,w,h,ownerId,weapon,life:8,onHit:function(p){p.takeDamage(weapon==='sword'?10:weapon==='meteorStaff'?20:weapon==='fireball'?15:15);}});}
function spawnMeteor(targetX,startY){ game.projectiles.push({x:targetX,y:startY,w:30,h:30,vy:10,ownerId:null,weapon:'meteorStaff',life:200,onHit:function(p){ p.takeDamage(20); spawnParticle(p.x,p.y,'orange'); spawnParticle(p.x,p.y,'red'); }});} 
function spawnParticle(x,y,color){ game.particles.push({x,y,vx:rand(-3,3),vy:rand(-3,3),life:30,color});}

// ==========================
// UPDATE & DRAW
// ==========================
function update(){
  game.t++;
  for(const p of game.players)p.update();
  for(const proj of game.projectiles){ proj.x += proj.vx; proj.y += proj.vy; for(const p of game.players){ if(p.id!==proj.ownerId && proj.onHit && overlap(proj,p)){ proj.onHit(p); proj.life=0; }}} 
  game.projectiles = game.projectiles.filter(p=>p.life>0);
  for(const pa of game.particles){ pa.x+=pa.vx; pa.y+=pa.vy; pa.life--; }
  game.particles = game.particles.filter(p=>p.life>0);
  draw(); requestAnimationFrame(update);
}
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  for(const p of game.players)p.draw();
  for(const proj of game.projectiles){ ctx.fillStyle=proj.weapon==='fireball'?'orange':'white'; ctx.fillRect(proj.x,proj.y,proj.w,proj.h); }
  for(const pa of game.particles){ ctx.fillStyle=pa.color; ctx.fillRect(pa.x,pa.y,4,4); }
  let y=20; for(const p of game.players){ ctx.fillStyle='black'; ctx.fillRect(20,y,102,12); ctx.fillStyle='green'; ctx.fillRect(21,y+1, p.hp,10); ctx.fillStyle='black'; ctx.fillText(p.id, 20, y-2); y+=20; }
}

// ==========================
// CONTROLS
// ==========================
window.addEventListener('keydown',e=>controlSet(e.key,true));
window.addEventListener('keyup',e=>controlSet(e.key,false));
function controlSet(k,v){ let p1=game.players[0], p2=game.players[1]; if(k==='a')p1.controls.left=v;if(k==='d')p1.controls.right=v;if(k==='w')p1.controls.up=v;if(k===' ')p1.controls.attack=v;if(k==='Shift')p1.controls.ability=v;if(k==='ArrowLeft')p2.controls.left=v;if(k==='ArrowRight')p2.controls.right=v;if(k==='ArrowUp')p2.controls.up=v;if(k==='0')p2.controls.attack=v;if(k==='Enter')p2.controls.ability=v;}

// ==========================
// INIT
// ==========================
function startLocal(){ game.players=[ new Player(300,300,'blue','P1'), new Player(600,300,'red','P2') ]; update();}
startLocal();
