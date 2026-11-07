import {reply,fail,serverError,getDb,secureHash,readJson,ensureOptions,ensureProgram,validString} from '../../../src/_lib.js';

export async function onRequestPost({request,env}){
  const db=getDb(env);if(!db)return fail('Datenbank nicht eingerichtet. Bitte zuerst Cloudflare D1 anbinden.',503);
  try{
    const b=await readJson(request);
    if(!b||!validString(b.title,120,true)||!validString(b.organizer,100,true)||!validString(b.description||'',3000)||!validString(b.location||'',200)||!validString(b.joinTitle||'',120)||!validString(b.viewPassword||'',200))return fail('Bitte Titel und Organisator korrekt ausfüllen.');
    // Two independent credentials: invitation password for guests and administrator password for the organizer.
    if(!validString(b.joinTitle,120,true)||b.joinTitle.trim().length<3)return fail('Bitte einen Einladungscode mit mindestens 3 Zeichen eingeben.');
    if(!validString(b.viewPassword,200,true)||b.viewPassword.length<6)return fail('Das Gäste-Passwort muss mindestens 6 Zeichen lang sein.');
    if(!validString(b.organizerPassword,200,true)||b.organizerPassword.length<10)return fail('Das Veranstalter-Passwort muss mindestens 10 Zeichen lang sein.');
    if(b.organizerPassword===b.viewPassword)return fail('Bitte unterschiedliche Passwörter für Gäste und Veranstalter verwenden.');
    const existing=await db.prepare('SELECT id FROM events WHERE lower(join_title)=lower(?) LIMIT 1').bind(b.joinTitle.trim()).first();
    if(existing)return fail('Dieser Einladungscode ist bereits vergeben. Bitte einen anderen wählen.');
    const options=ensureOptions(b.options),program=ensureProgram(b.program);
    const passwordHash=await secureHash(b.viewPassword);
    const id=crypto.randomUUID(),adminToken=b.organizerPassword,hash=await secureHash(adminToken);
    await db.prepare(`INSERT INTO events (id,title,organizer,description,location,join_title,password_hash,show_results,currency,program_json,options_json,status,admin_hash) VALUES (?,?,?,?,?,?,?,?,?,?,?,'open',?)`)
      .bind(id,b.title.trim(),b.organizer.trim(),b.description||'',b.location||'',b.joinTitle.trim(),passwordHash,b.showResults===false?0:1,['CHF','EUR','USD','GBP'].includes(b.currency)?b.currency:'CHF',JSON.stringify(program),JSON.stringify(options),hash).run();
    return reply({id,adminToken},201);
  }catch(e){if(e.message==='Ungültige Anfrage'||e.message==='Anfrage zu gross'||e.message.includes('Termin')||e.message.startsWith('Bitte 1 bis')||e.message.includes('Vorschlag')||e.message.includes('Programm'))return fail(e.message);return serverError(e)}
}
export async function onRequestGet(){return fail('Eventliste ist aus Datenschutzgründen nicht öffentlich.',403)}
