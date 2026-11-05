const fs = require('fs');
const { chromium } = require('playwright');
const NAVY='#0A1C36', NAVY2='#12305A', AMBER='#F28C00', STEEL='#B9C4D1', WHITE='#FFFFFF';
const FONT = `<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800;900&display=block" rel="stylesheet">`;

// Shield emblem, 1000x1000 viewBox. shield = shield fill, fg = truck colour.
function emblem(shield, fg, ring){
  return `
  <path d="M500 40 L890 160 V500 Q890 790 500 960 Q110 790 110 500 V160 Z" fill="${shield}"/>
  <path d="M500 82 L852 190 V500 Q852 762 500 918 Q148 762 148 500 V190 Z" fill="none" stroke="${ring}" stroke-width="10"/>
  <!-- truck, front view -->
  <g>
    <rect x="378" y="214" width="60" height="22" rx="4" fill="${AMBER}"/>
    <rect x="562" y="214" width="60" height="22" rx="4" fill="${AMBER}"/>
    <path d="M318 278 Q318 240 356 240 H644 Q682 240 682 278 L700 642 H300 Z" fill="${fg}"/>
    <path d="M350 282 H650 L664 452 H336 Z" fill="${shield}"/>
    <!-- mirrors -->
    <rect x="250" y="298" width="34" height="130" rx="8" fill="${fg}"/><rect x="282" y="318" width="40" height="14" fill="${fg}"/>
    <rect x="716" y="298" width="34" height="130" rx="8" fill="${fg}"/><rect x="678" y="318" width="40" height="14" fill="${fg}"/>
    <!-- grille -->
    <path d="M392 486 H608 L600 610 H400 Z" fill="${shield}"/>
    <g fill="${fg}"><rect x="404" y="506" width="192" height="12"/><rect x="404" y="536" width="192" height="12"/><rect x="404" y="566" width="192" height="12"/></g>
    <!-- headlights -->
    <path d="M330 566 H378 V600 H328 Z" fill="${shield}"/><path d="M622 566 H670 L672 600 H622 Z" fill="${shield}"/>
    <rect x="336" y="574" width="34" height="18" fill="${AMBER}"/><rect x="630" y="574" width="34" height="18" fill="${AMBER}"/>
    <!-- bumper + wheels -->
    <rect x="290" y="660" width="420" height="46" rx="6" fill="${fg}"/>
    <rect x="318" y="716" width="80" height="62" rx="10" fill="${fg}"/><rect x="602" y="716" width="80" height="62" rx="10" fill="${fg}"/>
  </g>
  <!-- road line -->
  <rect x="320" y="800" width="360" height="12" rx="6" fill="${AMBER}"/>`;
}

function page(w,h,inner,bg){
  return `<!doctype html><html><head><meta charset="utf-8">${FONT}<style>html,body{margin:0;width:${w}px;height:${h}px;background:${bg};overflow:hidden}svg{display:block}</style></head><body>${inner}</body></html>`;
}
const svg=(w,h,body)=>`<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" font-family="Montserrat">${body}</svg>`;

function wordmark(x,y,fg,sub,scale=1){
  return `<g transform="translate(${x} ${y}) scale(${scale})">
    <text x="0" y="0" font-size="210" font-weight="900" fill="${fg}" letter-spacing="22">LELA</text>
    <rect x="6" y="48" width="96" height="8" fill="${AMBER}"/>
    <text x="126" y="72" font-size="56" font-weight="700" fill="${fg}" letter-spacing="26">COMPANY</text>
    <text x="6" y="150" font-size="34" font-weight="600" fill="${sub}" letter-spacing="11">TRUCKING &amp; TRANSPORT</text>
  </g>`;
}

function logo(dark){
  const fg = dark?WHITE:NAVY, sub = dark?STEEL:'#5A6B80';
  return svg(1800,640, `${dark?`<rect width="1800" height="640" fill="${NAVY}"/>`:''}
    <g transform="translate(90 50) scale(0.54)">${emblem(dark?NAVY2:NAVY, WHITE, dark?AMBER:AMBER)}</g>
    <rect x="690" y="150" width="4" height="340" fill="${dark?'#2A4266':'#D5DCE4'}"/>
    ${wordmark(770,330,fg,sub)}`);
}

function profile(){
  return svg(1080,1080, `
   <defs><radialGradient id="g" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="${NAVY2}"/><stop offset="1" stop-color="${NAVY}"/></radialGradient></defs>
   <rect width="1080" height="1080" fill="url(#g)"/>
   <g transform="translate(330 120) scale(0.42)">${emblem(WHITE, NAVY, AMBER)}</g>
   <g text-anchor="middle">
     <text x="551" y="730" font-size="170" font-weight="900" fill="${WHITE}" letter-spacing="22">LELA</text>
     <rect x="290" y="770" width="64" height="6" fill="${AMBER}"/><rect x="742" y="770" width="64" height="6" fill="${AMBER}"/>
     <text x="552" y="788" font-size="44" font-weight="700" fill="${STEEL}" letter-spacing="14">COMPANY</text>
     <text x="546" y="860" font-size="28" font-weight="600" fill="${STEEL}" opacity=".8" letter-spacing="8">TRUCKING &amp; TRANSPORT</text>
   </g>`);
}

function cover(){
  const phone=(x,y,num)=>`<g transform="translate(${x} ${y})">
     <rect x="0" y="-30" width="60" height="60" rx="8" fill="${AMBER}"/>
     <path transform="translate(15 -15) scale(1.25)" fill="${NAVY}" d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z"/>
     <text x="82" y="15" font-size="42" font-weight="800" fill="${WHITE}" letter-spacing="2">${num}</text></g>`;
  // perspective road on right side, vanishing point at (1250, 250)
  const vp=[1350,250];
  return svg(1640,624, `
   <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${NAVY2}"/><stop offset="1" stop-color="#061327"/></linearGradient>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".09"/></linearGradient>
    <linearGradient id="amb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${AMBER}" stop-opacity="0"/><stop offset="1" stop-color="${AMBER}"/></linearGradient>
   </defs>
   <rect width="1640" height="624" fill="url(#bg)"/>
   <path d="M${vp[0]-6} ${vp[1]} H${vp[0]+6} L1800 624 H960 Z" fill="url(#fade)"/>
   <path d="M${vp[0]-1} ${vp[1]} H${vp[0]+1} L1010 624 H986 Z" fill="url(#amb)"/>
   <path d="M${vp[0]-1} ${vp[1]} H${vp[0]+1} L1760 624 H1736 Z" fill="url(#amb)"/>
   ${[0,1,2,3].map(i=>{const t=[.25,.42,.62,.86][i],y=vp[1]+(624-vp[1])*t,w=6+40*t,x=vp[0]+(1360-vp[0])*t;return `<rect x="${x-w/2}" y="${y}" width="${w}" height="${4+30*t*t}" fill="#fff" opacity=".55"/>`}).join('')}
   <!-- emblem + wordmark, inside the mobile-safe centre and clear of the profile photo -->
   <g transform="translate(290 70) scale(0.3)">${emblem(WHITE, NAVY, AMBER)}</g>
   ${wordmark(620,215,WHITE,STEEL,0.62)}
   <rect x="300" y="400" width="600" height="1" fill="#fff" opacity=".18"/>
   ${phone(300,470,'070-469-039')}
   ${phone(740,470,'070-325-219')}`);
}

(async()=>{
  const out=process.argv[2];
  const jobs=[
    ['lela-logo.png',1800,640,logo(false),'transparent'],
    ['lela-logo-white-bg.png',1800,640,logo(false),'#ffffff'],
    ['lela-logo-dark.png',1800,640,logo(true),NAVY],
    ['lela-emblem.png',1000,1000,svg(1000,1000,emblem(NAVY,WHITE,AMBER)),'transparent'],
    ['facebook-profile-picture.png',1080,1080,profile(),NAVY],
    ['facebook-cover-photo.png',1640,624,cover(),NAVY],
  ];
  const b=await chromium.launch(); const ctx=await b.newContext();
  for(const [name,w,h,s,bg] of jobs){
    const p=await ctx.newPage(); await p.setViewportSize({width:w,height:h});
    await p.setContent(page(w,h,s,bg),{waitUntil:'networkidle'}); await p.evaluate(()=>document.fonts.ready);
    await p.screenshot({path:`${out}/${name}`,omitBackground:bg==='transparent'});
    fs.writeFileSync(`${out}/${name.replace('.png','.svg')}`,s); await p.close();
  }
  await b.close();
})();
