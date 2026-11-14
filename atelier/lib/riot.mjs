export const ROUTES={LAN:['la1','americas'],LAS:['la2','americas'],NA:['na1','americas'],BR:['br1','americas'],EUW:['euw1','europe'],EUNE:['eun1','europe'],TR:['tr1','europe'],RU:['ru','europe'],KR:['kr','asia'],JP:['jp1','asia'],OCE:['oc1','sea'],SEA:['sg2','sea'],TW:['tw2','sea'],VN:['vn2','sea'],ME:['me1','europe']};
export async function riotFetch(host,path,key,fetcher=fetch){const r=await fetcher(`https://${host}.api.riotgames.com${path}`,{headers:{'X-Riot-Token':key},signal:AbortSignal.timeout(18000)});if(!r.ok){const messages={401:'Riot rejected the API key. Update it in Connect Riot.',403:'Riot rejected the API key or its permissions. Development keys expire every 24 hours; replace or renew your key.',404:'Riot could not find this account or match. Check the Riot ID, tag and server.',429:`Riot rate limit reached. Wait ${r.headers.get('Retry-After')||'a little'} seconds and try again.`,503:'Riot is temporarily unavailable. Try again later.'};const e=new Error(messages[r.status]||`Riot request failed (${r.status}).`);e.status=r.status===429?429:502;e.retryAfter=r.status===429?Number(r.headers.get('Retry-After'))||15:undefined;throw e;}return r.json();}
export function parseIdentity(body){const route=ROUTES[body.region];if(!Object.hasOwn(ROUTES,body.region))throw Error('Choose a supported server.');const id=String(body.riotId||'').trim(),at=id.lastIndexOf('#');if(at<1||at===id.length-1||id.length>150)throw Error('Enter the complete Riot ID, including #tag.');return {platform:route[0],routing:route[1],gameName:id.slice(0,at),tagLine:id.slice(at+1)};}
export function mapMatch(raw,puuid){const info=raw?.info,p=info?.participants?.find(p=>p.puuid===puuid);if(!p||p.championName!=='Jhin'||info.queueId!==420)return null;const list=info.participants,enemy=list.find(x=>x.teamId!==p.teamId&&x.teamPosition==='BOTTOM'),support=list.find(x=>x.teamId===p.teamId&&x.teamPosition==='UTILITY'),styles=p.perks?.styles||[],main=styles.find(s=>s.description==='primaryStyle')||styles[0],secondary=styles.find(s=>s.description==='subStyle')||styles[1];const end=info.gameEndTimestamp||(info.gameStartTimestamp+info.gameDuration*1000);return {matchId:raw.metadata.matchId,result:info.gameDuration<300&&p.gameEndedInEarlySurrender?'remake':p.win?'win':'loss',ts:end,patch:info.gameVersion.split('.').slice(0,2).join('.'),enemy:enemy?.championName||'',support:support?.championName||'',kills:p.kills,deaths:p.deaths,assists:p.assists,cs:p.totalMinionsKilled+p.neutralMinionsKilled,duration:Math.round(info.gameDuration/6)/10,itemIds:Array.from({length:7},(_,i)=>p['item'+i]).filter(Boolean),runePage:{primary:main?.style||0,secondary:secondary?.style||0,primaryRunes:main?.selections?.map(x=>x.perk)||[],secondaryRunes:secondary?.selections?.map(x=>x.perk)||[],shards:[p.perks?.statPerks?.offense,p.perks?.statPerks?.flex,p.perks?.statPerks?.defense].filter(Boolean)},keystoneId:main?.selections?.[0]?.perk||0};}
export async function fetchAccount(body,key,fetcher=fetch){const {platform,routing,gameName,tagLine}=parseIdentity(body);const user=await riotFetch(routing,body.puuid&&typeof body.puuid==='string'&&body.puuid.length<150?`/riot/account/v1/accounts/by-puuid/${encodeURIComponent(body.puuid)}`:`/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,key,fetcher);const summoner=await riotFetch(platform,`/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(user.puuid)}`,key,fetcher);const ranks=await riotFetch(platform,`/lol/league/v4/entries/by-puuid/${encodeURIComponent(user.puuid)}`,key,fetcher);const rank=ranks.find(x=>x.queueType==='RANKED_SOLO_5x5')||null;const rankName=rank?rank.tier.charAt(0)+rank.tier.slice(1).toLowerCase():'Unranked';const division={IV:4,III:3,II:2,I:1};const fullRank=rank&&division[rank.rank]&&!['Master','Grandmaster','Challenger'].includes(rankName)?`${rankName} ${division[rank.rank]}`:rankName;const offset=Math.max(0,Math.min(1000,Math.floor(Number(body.offset)||0)));const ids=await riotFetch(routing,`/lol/match/v5/matches/by-puuid/${encodeURIComponent(user.puuid)}/ids?queue=420&count=10&start=${offset}`,key,fetcher);const known=new Set(Array.isArray(body.known)?body.known.slice(0,500):[]),matches=[],warnings=[];let processed=0,retryAfter;for(const id of ids){if(known.has(id)){processed++;continue;}try{const raw=await riotFetch(routing,`/lol/match/v5/matches/${encodeURIComponent(id)}`,key,fetcher);const m=mapMatch(raw,user.puuid);if(m)matches.push(m);processed++;}catch(e){if(e.status===429)retryAfter=e.retryAfter;warnings.push(e.message);break;}}return {puuid:user.puuid,riotId:`${user.gameName}#${user.tagLine}`,level:summoner.summonerLevel,rank:fullRank,lp:rank?.leaguePoints??null,wins:rank?.wins??null,losses:rank?.losses??null,matches,warnings,retryAfter,checkedAt:Date.now(),nextOffset:offset+processed,hasMore:ids.length===10,fetchedIds:ids.length};}

export function mapLane(match,timeline,puuid){
 const players=match.info?.participants||[], me=players.find(p=>p.puuid===puuid);
 if(!me||me.championName!=='Jhin'||match.info.queueId!==420)throw Error('This match is not a ranked solo/duo Jhin game for this account.');
 const opposing=players.filter(p=>p.teamId!==me.teamId&&p.teamPosition==='BOTTOM');
 const enemy=me.teamPosition==='BOTTOM'&&opposing.length===1?opposing[0]:null;
 const frames=timeline.info?.frames||[];
 const points=enemy?frames.flatMap(f=>{
  const a=f.participantFrames?.[me.participantId],b=f.participantFrames?.[enemy.participantId];
  return [f.timestamp,a?.totalGold,b?.totalGold,a?.minionsKilled,b?.minionsKilled].every(Number.isFinite)?
   [{ms:f.timestamp,gold:a.totalGold-b.totalGold,cs:a.minionsKilled-b.minionsKilled}]:[];
 }):[];
 const events=frames.flatMap(f=>f.events||[]).sort((a,b)=>a.timestamp-b.timestamp);
 const death=events.find(e=>e.type==='CHAMPION_KILL'&&e.victimId===me.participantId);
 const purchases=events.filter(e=>e.type==='ITEM_PURCHASED'&&e.participantId===me.participantId).map(e=>({id:e.itemId,ms:e.timestamp}));
 return {enemy:enemy?.championName||'',points,firstDeath:death?.timestamp??null,purchases,patch:match.info.gameVersion.split('.').slice(0,2).join('.')};
}
export async function fetchLane(body,key,fetcher=fetch){
 const route=Object.hasOwn(ROUTES,body?.region)?ROUTES[body.region]:null;
 if(!route||typeof body.matchId!=='string'||!new RegExp('^'+route[0].toUpperCase()+'_[0-9]{1,20}$').test(body.matchId)||typeof body.puuid!=='string'||!body.puuid||body.puuid.length>150)throw Error('Sync this account and match before reviewing its lane.');
 const path='/lol/match/v5/matches/'+body.matchId;
 const match=await riotFetch(route[1],path,key,fetcher);
 if(!mapMatch(match,body.puuid))throw Error('This match is not linked to this Jhin account.');
 const lane=mapLane(match,await riotFetch(route[1],path+'/timeline',key,fetcher),body.puuid);
 let firstItem=null,itemTimingAvailable=false;
 try{
  const get=async path=>{const r=await fetcher('https://ddragon.leagueoflegends.com'+path,{signal:AbortSignal.timeout(5000)});if(!r.ok)throw Error('Catalog unavailable');return r.json();};
  const versions=await get('/api/versions.json'),v=versions.find(v=>/^\d+\.\d+\.\d+$/.test(v)&&v.startsWith(lane.patch+'.'));
  if(v){const {data}=await get('/cdn/'+v+'/data/en_US/item.json');itemTimingAvailable=true;
   const purchase=lane.purchases.find(({id})=>{const item=data[id];return item?.maps?.['11']&&item.gold?.purchasable&&item.depth>=2&&!item.into?.some(next=>data[next]?.maps?.['11']&&data[next]?.gold?.purchasable);});
   if(purchase)firstItem={name:data[purchase.id].name,ms:purchase.ms};
  }
 }catch{}
 delete lane.purchases;
 return {...lane,firstItem,itemTimingAvailable};
}
