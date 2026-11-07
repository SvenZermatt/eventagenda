// Cloudflare Workers adapter for the existing EventAgenda Pages Functions.
// Keep API routes and validation logic in functions/api/events/.
import { onRequestPost as createEvent, onRequestGet as listEvents } from "../functions/api/events/index.js";
import { onRequestGet as getEvent, onRequestPatch as updateEvent, onRequestDelete as deleteEvent } from "../functions/api/events/[id].js";
import { onRequestPost as submitResponse } from "../functions/api/events/[id]/responses.js";
import { onRequestPost as submitMessage } from "../functions/api/events/[id]/messages.js";

const apiHeaders = {"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"};
const error = (status,message)=>new Response(JSON.stringify({error:message}),{status,headers:apiHeaders});

export default {
  async fetch(request,env,ctx){
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    if(!path.startsWith("/api/")) return env.ASSETS.fetch(request);
    const method=request.method.toUpperCase();
    const handlers={GET:getEvent,PATCH:updateEvent,DELETE:deleteEvent};

    if(path==="/api/events"){
      if(method==="POST")return createEvent({request,env});
      if(method==="GET")return listEvents({request,env});
      return error(405,"Methode nicht unterstützt.");
    }

    const match=path.match(/^\/api\/events\/([^/]+)(?:\/(responses|messages))?$/);
    if(!match)return error(404,"API-Endpunkt nicht gefunden.");
    const params={id:match[1]};

    if(match[2]==="responses"&&method==="POST")
      return submitResponse({request,env,params});
    if(match[2]==="messages"&&method==="POST")
      return submitMessage({request,env,params});
    if(match[2])return error(405,"Methode nicht unterstützt.");
    const handler=handlers[method];
    if(!handler)return error(405,"Methode nicht unterstützt.");
    return handler({request,env,params});
  }
};
