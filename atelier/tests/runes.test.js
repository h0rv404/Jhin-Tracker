import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {validateRunePage} from '../public/runes.js';
const catalog=JSON.parse(fs.readFileSync(new URL('../public/catalog.json',import.meta.url)));
const page=()=>({primary:8000,secondary:8200,primaryRunes:[8021,8009,9103,8014],secondaryRunes:[8234,8236],shards:[5008,5008,5001]});
test('current catalog validates complete six-rune page plus three shards',()=>{assert.deepEqual(validateRunePage(page(),catalog),page());});
test('secondary tree must differ and use two different non-keystone rows',()=>{for(const edit of [p=>p.secondary=8000,p=>p.secondaryRunes=[8234,8210],p=>p.secondaryRunes=[8234]]){const p=page();edit(p);assert.throws(()=>validateRunePage(p,catalog));}});
test('primary page requires one legal rune per slot',()=>{const p=page();p.primaryRunes[0]=8236;assert.throws(()=>validateRunePage(p,catalog));});
test('shards respect offense/flex/defense rows',()=>{const p=page();p.shards[0]=5013;assert.throws(()=>validateRunePage(p,catalog));});
