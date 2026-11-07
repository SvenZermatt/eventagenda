import {reply,fail,serverError,getDb,hashToken,readJson,mapEvent,mapResponse,canView} from '../../../src/_lib.js';
const uuidRe=/^(?:[0-9a-f]{24}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;
const fetchEvent=async(db,id)=>db.prepare('SELECT * FROM events WHERE id=?').bind(id).first();
async function authorize(request,row){const token=request.headers.get('X-Admin-Token');return token&&token.length<256&&(await hashToken(token))===row.admin_hash}

export async function onRequestGet({request,params,env}){
  const db=getDb(env);if(!db)return fail('Datenbank nicht eingerichtet. Bitte zuerst Cloudflare D1 anbinden.',503);
  if(!uuidRe.test(params.id))return fail('Event nicht gefunden.',404);
  try{
    const row=await fetchEvent(db,params.id);if(!row)return fail('Event nicht gefunden.',404);
    if(!(await canView(request,row)))return reply({error:'Passwort erforderlich',requiresPassword:true},401);
    const results=await db.prepare('SELECT id,name,note,votes_json,respondent_hash,created_at FROM responses WHERE event_id=? ORDER BY created_at ASC').bind(params.id).all();
    const messages=await db.prepare('SELECT id,name,message,created_at FROM messages WHERE event_id=? ORDER BY created_at ASC LIMIT 200').bind(params.id).all();
    const permitted = row.show_results || !!(request.headers.get('X-Admin-Token') && await authorize(request,row));
    let visibleResponses=(results.results||[]);
    if(!permitted){
      const rt=request.headers.get('X-Respondent-Token');
      const h=rt&&rt.length<256?await hashToken(rt):null;
      visibleResponses=h?visibleResponses.filter(r=>r.respondent_hash===h):[];
    }
    return reply({event:mapEvent(row),responses:visibleResponses.map(mapResponse),participantCount:(results.results||[]).length,resultsVisible:!!permitted,messages:messages.results||[]});
  }catch(e){return serverError(e)}
}
export async function onRequestPatch({request,params,env}){
  const db=getDb(env);if(!db)return fail('Datenbank nicht eingerichtet.',503);
  if(!uuidRe.test(params.id))return fail('Event nicht gefunden.',404);
  try{
    const row=await fetchEvent(db,params.id);if(!row)return fail('Event nicht gefunden.',404);
    if(!(await authorize(request,row)))return fail('Verwaltungszugang fehlt oder ist ungültig.',403);
    const b=await readJson(request);if(!['open','closed'].includes(b?.status))return fail('Status ungültig.');
    await db.prepare('UPDATE events SET status=? WHERE id=?').bind(b.status,params.id).run();
    return reply({ok:true,status:b.status});
  }catch(e){return serverError(e)}
}
export async function onRequestDelete({request,params,env}){
  const db=getDb(env);if(!db)return fail('Datenbank nicht eingerichtet.',503);
  if(!uuidRe.test(params.id))return fail('Event nicht gefunden.',404);
  try{
    const row=await fetchEvent(db,params.id);if(!row)return fail('Event nicht gefunden.',404);
    if(!(await authorize(request,row)))return fail('Verwaltungszugang fehlt oder ist ungültig.',403);
    await db.prepare('DELETE FROM messages WHERE event_id=?').bind(params.id).run();
    await db.prepare('DELETE FROM responses WHERE event_id=?').bind(params.id).run();
    await db.prepare('DELETE FROM events WHERE id=?').bind(params.id).run();
    return reply({ok:true});
  }catch(e){return serverError(e)}
}
