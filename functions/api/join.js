import {reply,fail,serverError,getDb,readJson,validString,checkSecret} from '../../src/_lib.js';
export async function onRequestPost({request,env}){
  const db=getDb(env);if(!db)return fail('Datenbank nicht eingerichtet.',503);
  try{
    const b=await readJson(request);
    if(!b||!validString(b.joinTitle,120,true)||!validString(b.viewPassword,200,true))return fail('Bitte Einladungscode und Passwort eingeben.');
    // Avoid exposing invitation codes without a valid guest password.
    const result=await db.prepare('SELECT id,password_hash FROM events WHERE lower(join_title)=lower(?) LIMIT 5')
      .bind(b.joinTitle.trim()).all();
    for(const row of result.results||[]){
      if(await checkSecret(b.viewPassword,row.password_hash))return reply({id:row.id});
    }
    return fail('Einladungscode oder Passwort ist nicht korrekt.',403);
  }catch(e){if(e.message==='Ungültige Anfrage'||e.message==='Anfrage zu gross')return fail(e.message);return serverError(e)}
}
