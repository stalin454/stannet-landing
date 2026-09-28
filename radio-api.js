export const radioProgramClock = Object.freeze([
  { time:"00:00", type:"MUSIC", title:"Night Sessions", description:"Ambient, electrónica y sesiones nocturnas del catálogo autorizado.", mode:"music", durationMinutes:360 },
  { time:"06:00", type:"TECH", title:"Tech Sunrise", description:"Arranque del día con titulares tecnológicos y contexto.", mode:"bulletin", durationMinutes:30 },
  { time:"06:30", type:"MUSIC", title:"Morning Rotation", description:"Selección musical para primera hora.", mode:"music", durationMinutes:90 },
  { time:"08:00", type:"CYBER", title:"Cybersecurity Daily", description:"Boletín defensivo: vulnerabilidades, incidentes y contexto SOC.", mode:"bulletin", durationMinutes:30 },
  { time:"08:30", type:"MUSIC", title:"StanNet Electronic", description:"Electrónica propia y catálogo autorizado.", mode:"music", durationMinutes:90 },
  { time:"10:00", type:"AI", title:"AI Update", description:"Modelos, herramientas, agentes y aplicaciones de IA.", mode:"bulletin", durationMinutes:30 },
  { time:"10:30", type:"MUSIC", title:"Guitar Zone", description:"Rock instrumental, guitarra y sesiones seleccionadas.", mode:"music", durationMinutes:90 },
  { time:"12:00", type:"TECH", title:"Tech Flash", description:"Resumen breve de tecnología antes del mediodía.", mode:"bulletin", durationMinutes:30 },
  { time:"12:30", type:"MUSIC", title:"Lunch Rotation", description:"Bloque musical de mediodía.", mode:"music", durationMinutes:30 },
  { time:"13:00", type:"DEV", title:"Programming Sessions", description:"JavaScript, Python, web, Linux y fundamentos técnicos.", mode:"bulletin", durationMinutes:30 },
  { time:"13:30", type:"MUSIC", title:"StanNet Electronic", description:"Rotación musical autorizada.", mode:"music", durationMinutes:150 },
  { time:"16:00", type:"CYBER", title:"Cybersecurity News", description:"Actualización de seguridad y defensa digital.", mode:"bulletin", durationMinutes:30 },
  { time:"16:30", type:"MUSIC", title:"Afternoon Rotation", description:"Música para la tarde.", mode:"music", durationMinutes:30 },
  { time:"17:00", type:"AI", title:"AI News", description:"Segunda actualización de inteligencia artificial.", mode:"bulletin", durationMinutes:30 },
  { time:"17:30", type:"MUSIC", title:"StanNet Electronic", description:"Electrónica y sesiones StanNet.", mode:"music", durationMinutes:150 },
  { time:"20:00", type:"MUSIC", title:"Guitar Zone", description:"Guitarra eléctrica, instrumental y rock.", mode:"music", durationMinutes:60 },
  { time:"21:00", type:"CYBER", title:"Cyber Night Brief", description:"Cierre defensivo del día con los temas más relevantes.", mode:"bulletin", durationMinutes:30 },
  { time:"21:30", type:"MUSIC", title:"Night Sessions", description:"Música nocturna hasta el siguiente ciclo.", mode:"music", durationMinutes:150 }
]);

export const radioSchedule = radioProgramClock;

export function radioStatus(env = {}, date = new Date()) {
  const streamUrl = typeof env.RADIO_STREAM_URL === "string" ? env.RADIO_STREAM_URL.trim() : "";
  const safeStream = /^https:\/\//i.test(streamUrl) ? streamUrl : "";
  const program = resolveRadioProgram(date);
  return {
    station:"StanNet Radio",
    tagline:"Music · Tech · Cyber · AI",
    stage:5,
    live:Boolean(safeStream),
    streamUrl:safeStream,
    now:{ title:program.current.title, meta:program.current.type+" · "+program.current.mode.toUpperCase() },
    schedule:radioProgramClock,
    program
  };
}

export function resolveRadioProgram(date = new Date(), timeZone = "Europe/Madrid") {
  const parts = new Intl.DateTimeFormat("en-GB",{
    timeZone,hour:"2-digit",minute:"2-digit",hourCycle:"h23"
  }).formatToParts(date);
  const hour=Number(parts.find(p=>p.type==="hour")?.value||0);
  const minute=Number(parts.find(p=>p.type==="minute")?.value||0);
  const nowMinutes=hour*60+minute;
  const withMinutes=radioProgramClock.map((slot,index)=>({...slot,index,startMinutes:toMinutes(slot.time)}));
  let current=withMinutes[0];
  for(const slot of withMinutes){if(slot.startMinutes<=nowMinutes)current=slot;else break}
  const next=withMinutes[(current.index+1)%withMinutes.length];
  const untilNext=(next.startMinutes>nowMinutes?next.startMinutes:1440+next.startMinutes)-nowMinutes;
  return {
    timeZone,
    localTime:String(hour).padStart(2,"0")+":"+String(minute).padStart(2,"0"),
    current:stripInternal(current),
    next:stripInternal(next),
    minutesUntilNext:untilNext,
    queue:Array.from({length:4},(_,offset)=>stripInternal(withMinutes[(current.index+offset)%withMinutes.length]))
  };
}

function toMinutes(value){
  const [h,m]=String(value).split(":").map(Number);
  return h*60+m;
}
function stripInternal(slot){
  const {index,startMinutes,...safe}=slot;
  return safe;
}
