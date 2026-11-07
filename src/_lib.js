export const reply = (payload, status = 200) => new Response(JSON.stringify(payload), {
  status, headers: {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}
});
export const fail = (message, status = 400) => reply({error:message}, status);
export const serverError = err => { console.error('EventAgenda API:',err);return fail('Serverfehler. Bitte später erneut versuchen.',500) };
export const getDb = env => env.DB && typeof env.DB.prepare === 'function' ? env.DB : null;
export const hashToken = async token => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return [...new Uint8Array(buf)].map(x=>x.toString(16).padStart(2,'0')).join('');
};
export const validString = (v,max,required=false) => typeof v==='string' && v.length <= max && (!required || v.trim().length>0);
export async function readJson(request){
  if(Number(request.headers.get('content-length')||'0')>20000)throw new Error('Anfrage zu gross');
  const text=await request.text();if(text.length>20000)throw new Error('Anfrage zu gross');
  try { return JSON.parse(text) } catch {throw new Error('Ungültige Anfrage')}
}
export function ensureOptions(input){
  if(!Array.isArray(input)||input.length<1||input.length>20)throw new Error('Bitte 1 bis 20 Terminvorschläge angeben.');
  const datePattern=/^\d{4}-\d{2}-\d{2}$/;
  return input.map(o=>{
    if(!o||typeof o!=='object'||!datePattern.test(o.startDate)||!datePattern.test(o.endDate)||!validString(o.label??'',100))throw new Error('Ein Terminvorschlag ist ungültig.');
    const a=new Date(o.startDate+'T12:00:00Z'),b=new Date(o.endDate+'T12:00:00Z');
    if(Number.isNaN(+a)||Number.isNaN(+b)||a.toISOString().slice(0,10)!==o.startDate||b.toISOString().slice(0,10)!==o.endDate||b<a||(b-a)>1000*60*60*24*90)throw new Error('Termin-Ende muss nach dem Anfang liegen (max. 90 Tage).');
    return {id:crypto.randomUUID(),startDate:o.startDate,endDate:o.endDate,label:o.label||''};
  });
}
export function ensureProgram(input){
  if(input===undefined||input===null)return [];
  if(!Array.isArray(input)||input.length>40)throw new Error('Maximal 40 Programmpunkte erlaubt.');
  return input.map(p=>{
    if(!p||!Number.isInteger(Number(p.day))||Number(p.day)<1||Number(p.day)>30||!validString(p.title||'',120,true)||!validString(p.description||'',600)||!validString(p.notes||'',600)||!validString(p.link||'',400)||!Number.isFinite(Number(p.price||0))||Number(p.price||0)<0||Number(p.price||0)>1000000|| !/^([01]\d|2[0-3]):[0-5]\d$/.test(p.timeFrom||'')||!/^([01]\d|2[0-3]):[0-5]\d$/.test(p.timeTo||''))throw new Error('Ein Programmpunkt ist ungültig.');
    if(p.link&& !/^https?:\/\//.test(p.link))throw new Error('Programmlink muss mit https:// oder http:// beginnen.');
    return {day:Number(p.day),title:p.title.trim(),description:p.description||'',notes:p.notes||'',link:p.link||'',price:Number(p.price||0),timeFrom:p.timeFrom,timeTo:p.timeTo};
  });
}
export async function canView(request,row){
  if(!row.password_hash)return true;
  const admin=request.headers.get('X-Admin-Token');
  if(admin&&admin.length<256&&(await hashToken(admin))===row.admin_hash)return true;
  const pass=request.headers.get('X-Event-Password');
  return !!(pass&&pass.length<256&&(await hashToken(pass))===row.password_hash);
}
export const mapEvent = row => ({
  id:row.id, title:row.title, organizer:row.organizer,description:row.description||'',
  location:row.location||'',joinTitle:row.join_title||'',showResults:!!row.show_results,currency:row.currency||'CHF',program:JSON.parse(row.program_json||'[]'),options:JSON.parse(row.options_json),status:row.status,createdAt:row.created_at
});
export const mapResponse = row => ({id:row.id,name:row.name,note:row.note||'',votes:JSON.parse(row.votes_json),createdAt:row.created_at});
export const noCache = { 'Cache-Control':'no-store' };
