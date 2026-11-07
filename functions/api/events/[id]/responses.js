import {reply,fail,serverError,getDb,hashToken,readJson,validString,canView} from '../../../../src/_lib.js';
const uuidRe=/^(?:[0-9a-f]{24}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;
export async function onRequestPost({request,params,env}){
  const db=getDb(env);if(!db)return fail('Datenbank nicht eingerichtet.',503);
  if(!uuidRe.test(params.id))return fail('Event nicht gefunden.',404);
  try{
    const event=await db.prepare('SELECT options_json,status,password_hash,admin_hash FROM events WHERE id=?').bind(params.id).first();
    if(!event)return fail('Event nicht gefunden.',404);
    if(!(await canView(request,event)))return reply({error:'Passwort erforderlich'},401);
    if(event.status!=='open')return fail('Diese Abstimmung ist bereits abgeschlossen.',409);
    const b=await readJson(request);
    if(!b||!validString(b.name,100,true)||!validString(b.note||'',500)||!b.votes||typeof b.votes!=='object'||Array.isArray(b.votes))return fail('Bitte Name und Antworten korrekt eingeben.');
    const validIds=new Set(JSON.parse(event.options_json).map(o=>o.id));
    const entries=Object.entries(b.votes);
    if(entries.length===0||entries.length>20||entries.some(([id,v])=>!validIds.has(id)||!['yes','maybe','no'].includes(v)))return fail('Mindestens eine gültige Terminantwort ist erforderlich.');
    const token=b.respondentToken;
    if(token&&typeof token==='string'&&token.length<256){
      const tokenHash=await hashToken(token);
      const existing=await db.prepare('SELECT id FROM responses WHERE event_id=? AND respondent_hash=?').bind(params.id,tokenHash).first();
      if(existing){
        await db.prepare('UPDATE responses SET name=?,note=?,votes_json=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(b.name.trim(),b.note||'',JSON.stringify(b.votes),existing.id).run();
        return reply({responseId:existing.id,respondentToken:token,updated:true});
      }
      return fail('Dein bisheriger Bearbeitungszugang wurde nicht gefunden. Lade die Seite neu oder antworte auf einem anderen Gerät.',403);
    }
    const id=crypto.randomUUID(),respondentToken=crypto.randomUUID()+'-'+crypto.randomUUID(),hash=await hashToken(respondentToken);
    await db.prepare('INSERT INTO responses (id,event_id,name,note,votes_json,respondent_hash) VALUES (?,?,?,?,?,?)')
      .bind(id,params.id,b.name.trim(),b.note||'',JSON.stringify(b.votes),hash).run();
    return reply({responseId:id,respondentToken,updated:false},201);
  }catch(e){if(e.message==='Ungültige Anfrage'||e.message==='Anfrage zu gross')return fail(e.message);return serverError(e)}
}
