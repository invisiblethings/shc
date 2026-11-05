const fs = require('fs');
const { chromium } = require('playwright');
const NAVY='#0B1F3A', NAVY2='#132E55', AMBER='#FF8A00', STEEL='#C9D3DE', WHITE='#FFFFFF';
const FONT = `<link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,500;0,600;0,700;0,800;0,900;1,800;1,900&display=block" rel="stylesheet">`;

// Original stylised tipper semi, facing right, in a 400x150 box.
// body = main colour, cut = colour of background (used for details), accent = amber
function truck(body, cut, accent){
  const wheel = (x)=>`<circle cx="${x}" cy="122" r="17" fill="${body}"/><circle cx="${x}" cy="122" r="8.5" fill="${cut}"/><circle cx="${x}" cy="122" r="3.5" fill="${body}"/>`;
  return `
  <!-- tipper trailer body -->
  <path d="M28 34 H262 V98 H74 Q44 98 32 78 Z" fill="${body}"/>
  <path d="M28 34 H262 V42 H30 Z" fill="${accent}"/>
  <g stroke="${cut}" stroke-width="3" opacity=".55">
    <line x1="80" y1="48" x2="80" y2="92"/><line x1="125" y1="48" x2="125" y2="92"/>
    <line x1="170" y1="48" x2="170" y2="92"/><line x1="215" y1="48" x2="215" y2="92"/>
  </g>
  <!-- chassis -->
  <rect x="44" y="100" width="318" height="7" rx="2" fill="${body}"/>
  <!-- cab -->
  <path d="M276 106 V30 Q276 16 290 16 H336 Q348 16 351 28 L362 76 V106 Z" fill="${body}"/>
  <path d="M312 26 H335 Q340 26 341.5 31 L349 62 H312 Z" fill="${cut}"/>
  <rect x="286" y="26" width="18" height="36" rx="3" fill="${cut}"/>
  <rect x="326" y="8" width="12" height="8" rx="2" fill="${accent}"/>
  <rect x="352" y="84" width="10" height="6" rx="1.5" fill="${accent}"/>
  ${[66,102,138,240,274,336].map(wheel).join('')}
  `;
}
function speed(color){ return `<g fill="${color}"><rect x="-40" y="50" width="56" height="7" rx="3.5"/><rect x="-62" y="66" width="70" height="7" rx="3.5"/><rect x="-28" y="82" width="44" height="7" rx="3.5"/></g>`; }

function page(w,h,inner,bg='transparent'){
  return `<!doctype html><html><head><meta charset="utf-8">${FONT}<style>html,body{margin:0;width:${w}px;height:${h}px;background:${bg};overflow:hidden}svg{display:block}</style></head><body>${inner}</body></html>`;
}

// ---------- Horizontal logo ----------
function logo(dark){
  const fg = dark?WHITE:NAVY, cut = dark?NAVY:WHITE, sub = dark?STEEL:'#4A5D75';
  return `<svg width="1600" height="600" viewBox="0 0 1600 600" xmlns="http://www.w3.org/2000/svg">
   ${dark?`<rect width="1600" height="600" fill="${NAVY}"/>`:''}
   <g transform="translate(150 150) scale(1.95)">${speed(AMBER)}${truck(fg,cut,AMBER)}</g>
   <g font-family="Montserrat">
     <text x="960" y="335" font-size="230" font-weight="900" font-style="italic" fill="${fg}" letter-spacing="-4">LELA</text>
     <rect x="972" y="370" width="520" height="10" rx="5" fill="${AMBER}"/>
     <text x="978" y="455" font-size="68" font-weight="700" fill="${fg}" letter-spacing="30">COMPANY</text>
   </g>
  </svg>`;
}

// ---------- Square badge (icon / profile) ----------
function badge(size){
  const s=size/1000;
  return `<svg width="${size}" height="${size}" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
   <defs>
    <radialGradient id="g" cx="50%" cy="38%" r="70%"><stop offset="0" stop-color="${NAVY2}"/><stop offset="1" stop-color="${NAVY}"/></radialGradient>
   </defs>
   <rect width="1000" height="1000" fill="url(#g)"/>
   <circle cx="500" cy="500" r="430" fill="none" stroke="${AMBER}" stroke-width="10"/>
   <circle cx="500" cy="500" r="405" fill="none" stroke="${STEEL}" stroke-width="2" opacity=".35"/>
   <g transform="translate(205 225) scale(1.45)">${speed(AMBER)}${truck(WHITE,NAVY,AMBER)}</g>
   <g font-family="Montserrat" text-anchor="middle">
     <text x="500" y="650" font-size="190" font-weight="900" font-style="italic" fill="${WHITE}" letter-spacing="-3">LELA</text>
     <rect x="330" y="680" width="340" height="8" rx="4" fill="${AMBER}"/>
     <text x="512" y="752" font-size="54" font-weight="700" fill="${STEEL}" letter-spacing="22">COMPANY</text>
   </g>
  </svg>`;
}

// ---------- Facebook cover 1640x624 ----------
function cover(){
  const phone = (x,y,num)=>`<g transform="translate(${x} ${y})">
     <circle cx="0" cy="0" r="30" fill="${AMBER}"/>
     <path transform="translate(-14 -14) scale(1.17)" fill="${NAVY}" d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z"/>
     <text x="50" y="13" font-size="40" font-weight="800" fill="${WHITE}" letter-spacing="1">${num}</text></g>`;
  return `<svg width="1640" height="624" viewBox="0 0 1640 624" xmlns="http://www.w3.org/2000/svg">
   <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${NAVY2}"/><stop offset="1" stop-color="#06142A"/></linearGradient>
    <linearGradient id="road" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1B3866"/><stop offset="1" stop-color="#0A1A33"/></linearGradient>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0V48" fill="none" stroke="#fff" stroke-opacity=".04"/></pattern>
   </defs>
   <rect width="1640" height="624" fill="url(#bg)"/>
   <rect width="1640" height="624" fill="url(#grid)"/>
   <!-- diagonal accent bands -->
   <path d="M1180 0 H1640 V624 H900 Z" fill="#fff" opacity=".035"/>
   <path d="M1420 0 H1460 L1180 624 H1140 Z" fill="${AMBER}" opacity=".9"/>
   <path d="M1480 0 H1492 L1212 624 H1200 Z" fill="${AMBER}" opacity=".45"/>
   <!-- road -->
   <rect y="470" width="1640" height="154" fill="url(#road)"/>
   <rect y="470" width="1640" height="4" fill="${AMBER}"/>
   <g fill="#fff" opacity=".5">${Array.from({length:18},(_,i)=>`<rect x="${i*100-20}" y="545" width="56" height="6" rx="3"/>`).join('')}</g>
   <!-- truck sitting on the road -->
   <ellipse cx="1125" cy="497" rx="235" ry="10" fill="#000" opacity=".35"/>
   <g transform="translate(880 322) scale(1.25)">${speed(AMBER)}${truck(WHITE,'#0E2548',AMBER)}</g>
   <!-- text block (kept inside the mobile-safe centre, clear of the profile picture) -->
   <g font-family="Montserrat">
     <text x="282" y="172" font-size="150" font-weight="900" font-style="italic" fill="${WHITE}" letter-spacing="-3">LELA</text>
     <rect x="290" y="196" width="400" height="8" rx="4" fill="${AMBER}"/>
     <text x="292" y="256" font-size="50" font-weight="700" fill="${WHITE}" letter-spacing="17">COMPANY</text>
     <text x="292" y="302" font-size="24" font-weight="600" fill="${STEEL}" letter-spacing="6">TRUCKING · TRANSPORT · HAULAGE</text>
     ${phone(322,362,'070-469-039')}
     ${phone(322,428,'070-325-219')}
   </g>
  </svg>`;
}

(async()=>{
  const out = process.argv[2];
  const jobs = [
    ['lela-logo.png',1600,600,logo(false),'transparent'],
    ['lela-logo-white-bg.png',1600,600,logo(false),'#ffffff'],
    ['lela-logo-dark.png',1600,600,logo(true),NAVY],
    ['facebook-profile-picture.png',1080,1080,badge(1080),NAVY],
    ['facebook-cover-photo.png',1640,624,cover(),NAVY],
  ];
  const b = await chromium.launch(); const ctx = await b.newContext({deviceScaleFactor:1});
  for (const [name,w,h,svg,bg] of jobs){
    const p = await ctx.newPage(); await p.setViewportSize({width:w,height:h});
    await p.setContent(page(w,h,svg,bg),{waitUntil:'networkidle'}); await p.evaluate(()=>document.fonts.ready);
    await p.screenshot({path:`${out}/${name}`, omitBackground: bg==='transparent'});
    fs.writeFileSync(`${out}/${name.replace('.png','.svg')}`, svg.replace('<svg ',`<svg font-family="Montserrat" `));
    await p.close();
  }
  await b.close();
})();
