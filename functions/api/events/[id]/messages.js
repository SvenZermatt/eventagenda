import {reply,fail,serverError,getDb,readJson,validString,canView} from '../../../../src/_lib.js';
const idRe=/^(?:[0-9a-f]{24}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;
export async function onRequestPost({request,params,env}){
  const db=getDb(env);if(!db)return fail('Datenbank nicht eingerichtet.',503);
  if(!idRe.test(params.id))return fail('Event nicht gefunden.',404);
  try{
    const event=await db.prepare('SELECT password_hash,admin_hash FROM events WHERE id=?').bind(params.id).first();
    if(!event)return fail('Event nicht gefunden.',404);
    if(!(await canView(request,event)))return fail('Passwort erforderlich.',401);
    const b=await readJson(request);
    if(!b||!validString(b.name,100,true)||!validString(b.message,1200,true))return fail('Name und Nachricht eingeben (maximal 1200 Zeichen).');
    const id=crypto.randomUUID();
    await db.prepare('INSERT INTO messages (id,event_id,name,message) VALUES (?,?,?,?)').bind(id,params.id,b.name.trim(),b.message.trim()).run();
    return reply({id},201);
  }catch(e){return serverError(e)}
}
