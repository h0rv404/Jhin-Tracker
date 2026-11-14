import {owner,reply,failure,keyFor} from '../../../lib/connection';
import {fetchLane} from '../../../lib/riot.mjs';

export async function POST(request:Request){
 try {
  const user=owner(request);
  const body=await request.json();
  return reply(await fetchLane(body,await keyFor(user)));
 } catch(e){return failure(e);}
}
