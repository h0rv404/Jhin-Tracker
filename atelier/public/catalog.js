import {validateRunePage} from './runes.js';
export const SHARDS={5008:'Adaptive force',5005:'Attack speed',5007:'Ability haste',5010:'Movement speed',5001:'Scaling health',5011:'Flat health',5013:'Tenacity / slow resist'};
export const SHARD_ROWS=[[5008,5005,5007],[5008,5010,5001],[5011,5013,5001]];
export const catalog=await (await fetch('./catalog.json')).json();
export function rune(id){for(const tree of catalog.trees)for(const slot of tree.slots){const r=slot.runes.find(r=>r.id===Number(id));if(r)return r;}return null;}
export function championName(raw){return catalog.champions.find(c=>c.id===raw||c.name===raw)?.name||raw;}
export function runeSignature(p){return p?JSON.stringify([p.primary,p.secondary,...p.primaryRunes,...[...p.secondaryRunes].sort((a,b)=>a-b),...(p.shards||[])]):'';}
export function validatePage(p){return validateRunePage(p,catalog);}
export async function refreshCatalog(){const r=await fetch('/api/catalog');const next=await r.json();if(!r.ok||!Array.isArray(next.champions)||!Array.isArray(next.trees))throw Error(next.error||'Catalog could not be refreshed.');Object.assign(catalog,next);try{localStorage.setItem('jhin_catalog',JSON.stringify(next));}catch{}return next;}
try{const saved=JSON.parse(localStorage.getItem('jhin_catalog')||'null');if(saved?.version&&Array.isArray(saved.champions)&&Array.isArray(saved.trees)&&Array.isArray(saved.trees[0]?.slots)){const v=x=>x.split('.').reduce((n,x)=>n*1000+Number(x),0);if(v(saved.version)>=v(catalog.version))Object.assign(catalog,saved);}}catch{}
