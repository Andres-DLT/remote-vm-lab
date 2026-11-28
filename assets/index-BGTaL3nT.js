var e=(e,t)=>()=>(t||(e((t={exports:{}}).exports,t,t.exports),e=null),t.exports);(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var t=e((e=>{var t=Object.defineProperty;(e=>t(e,`__esModule`,{value:!0}))(e),((e,n)=>{for(var r in n)t(e,r,{get:n[r],enumerable:!0})})(e,{GIFEncoder:()=>A,applyPalette:()=>S,default:()=>ee,nearestColor:()=>k,nearestColorIndex:()=>D,nearestColorIndexWithDistance:()=>O,prequantize:()=>x,quantize:()=>_,snapColorsToPalette:()=>T});var n={signature:`GIF`,version:`89a`,trailer:59,extensionIntroducer:33,applicationExtensionLabel:255,graphicControlExtensionLabel:249,imageSeparator:44,signatureSize:3,versionSize:3,globalColorTableFlagMask:128,colorResolutionMask:112,sortFlagMask:8,globalColorTableSizeMask:7,applicationIdentifierSize:8,applicationAuthCodeSize:3,disposalMethodMask:28,userInputFlagMask:2,transparentColorFlagMask:1,localColorTableFlagMask:128,interlaceFlagMask:64,idSortFlagMask:32,localColorTableSizeMask:7};function r(e=256){let t=0,n=new Uint8Array(e);return{get buffer(){return n.buffer},reset(){t=0},bytesView(){return n.subarray(0,t)},bytes(){return n.slice(0,t)},writeByte(e){r(t+1),n[t]=e,t++},writeBytes(e,i=0,a=e.length){r(t+a);for(let r=0;r<a;r++)n[t++]=e[r+i]},writeBytesView(e,i=0,a=e.byteLength){r(t+a),n.set(e.subarray(i,i+a),t),t+=a}};function r(e){var r=n.length;if(r>=e)return;e=Math.max(e,r*(r<1048576?2:1.125)>>>0),r!=0&&(e=Math.max(e,256));let i=n;n=new Uint8Array(e),t>0&&n.set(i.subarray(0,t),0)}}var i=12,a=5003,o=[0,1,3,7,15,31,63,127,255,511,1023,2047,4095,8191,16383,32767,65535];function s(e,t,n,s,c=r(512),l=new Uint8Array(256),u=new Int32Array(a),d=new Int32Array(a)){let f=u.length,p=Math.max(2,s);l.fill(0),d.fill(0),u.fill(-1);let m=0,h=0,g=p+1,_=g,v=!1,y=_,b=(1<<y)-1,x=1<<g-1,S=x+1,C=x+2,w=0,T=n[0],E=0;for(let e=f;e<65536;e*=2)++E;E=8-E,c.writeByte(p),O(x);let D=n.length;for(let e=1;e<D;e++)e:{let t=n[e],r=(t<<i)+T,a=t<<E^T;if(u[a]===r){T=d[a];break e}let o=a===0?1:f-a;for(;u[a]>=0;)if(a-=o,a<0&&(a+=f),u[a]===r){T=d[a];break e}O(T),T=t,C<1<<i?(d[a]=C++,u[a]=r):(u.fill(-1),C=x+2,v=!0,O(x))}return O(T),O(S),c.writeByte(0),c.bytesView();function O(e){for(m&=o[h],h>0?m|=e<<h:m=e,h+=y;h>=8;)l[w++]=m&255,w>=254&&(c.writeByte(w),c.writeBytesView(l,0,w),w=0),m>>=8,h-=8;if((C>b||v)&&(v?(y=_,b=(1<<y)-1,v=!1):(++y,b=y===i?1<<y:(1<<y)-1)),e==S){for(;h>0;)l[w++]=m&255,w>=254&&(c.writeByte(w),c.writeBytesView(l,0,w),w=0),m>>=8,h-=8;w>0&&(c.writeByte(w),c.writeBytesView(l,0,w),w=0)}}}var c=s;function l(e,t,n){return e<<8&63488|t<<2&992|n>>3}function u(e,t,n,r){return e>>4|t&240|(n&240)<<4|(r&240)<<8}function d(e,t,n){return e>>4<<8|t&240|n>>4}function f(e,t,n){return e<t?t:e>n?n:e}function p(e){return e*e}function m(e,t,n){var r=0,i=1e100;let a=e[t],o=a.cnt,s=a.ac,c=a.rc,l=a.gc,u=a.bc;for(var d=a.fw;d!=0;d=e[d].fw){let t=e[d],a=t.cnt,m=o*a/(o+a);if(!(m>=i)){var f=0;n&&(f+=m*p(t.ac-s),f>=i)||(f+=m*p(t.rc-c),f>=i||(f+=m*p(t.gc-l),f>=i||(f+=m*p(t.bc-u),f>=i||(i=f,r=d))))}}a.err=i,a.nn=r}function h(){return{ac:0,rc:0,gc:0,bc:0,cnt:0,nn:0,fw:0,bk:0,tm:0,mtm:0,err:0}}function g(e,t){let n=Array(t===`rgb444`?4096:65536),r=e.length;if(t===`rgba4444`)for(let t=0;t<r;++t){let r=e[t],i=r>>24&255,a=r>>16&255,o=r>>8&255,s=r&255,c=u(s,o,a,i),l=c in n?n[c]:n[c]=h();l.rc+=s,l.gc+=o,l.bc+=a,l.ac+=i,l.cnt++}else if(t===`rgb444`)for(let t=0;t<r;++t){let r=e[t],i=r>>16&255,a=r>>8&255,o=r&255,s=d(o,a,i),c=s in n?n[s]:n[s]=h();c.rc+=o,c.gc+=a,c.bc+=i,c.cnt++}else for(let t=0;t<r;++t){let r=e[t],i=r>>16&255,a=r>>8&255,o=r&255,s=l(o,a,i),c=s in n?n[s]:n[s]=h();c.rc+=o,c.gc+=a,c.bc+=i,c.cnt++}return n}function _(e,t,n={}){let{format:r=`rgb565`,clearAlpha:i=!0,clearAlphaColor:a=0,clearAlphaThreshold:o=0,oneBitAlpha:s=!1}=n;if(!e||!e.buffer||!(e instanceof Uint8Array)&&!(e instanceof Uint8ClampedArray))throw Error(`quantize() expected RGBA Uint8Array data`);let c=new Uint32Array(e.buffer),l=n.useSqrt!==!1,u=r===`rgba4444`,d=g(c,r),h=d.length,_=h-1,y=new Uint32Array(h+1);for(var b=0,x=0;x<h;++x){let e=d[x];if(e!=null){var S=1/e.cnt;u&&(e.ac*=S),e.rc*=S,e.gc*=S,e.bc*=S,d[b++]=e}}p(t)/b<.022&&(l=!1);for(var x=0;x<b-1;++x)d[x].fw=x+1,d[x+1].bk=x,l&&(d[x].cnt=Math.sqrt(d[x].cnt));l&&(d[x].cnt=Math.sqrt(d[x].cnt));var C,w,T;for(x=0;x<b;++x){m(d,x,!1);var E=d[x].err;for(w=++y[0];w>1&&(T=w>>1,!(d[C=y[T]].err<=E));w=T)y[w]=C;y[w]=x}var D=b-t;for(x=0;x<D;){for(var O;;){var k=y[1];if(O=d[k],O.tm>=O.mtm&&d[O.nn].mtm<=O.tm)break;O.mtm==_?k=y[1]=y[y[0]--]:(m(d,k,!1),O.tm=x);var E=d[k].err;for(w=1;(T=w+w)<=y[0]&&(T<y[0]&&d[y[T]].err>d[y[T+1]].err&&T++,!(E<=d[C=y[T]].err));w=T)y[w]=C;y[w]=k}var A=d[O.nn],j=O.cnt,M=A.cnt,S=1/(j+M);u&&(O.ac=S*(j*O.ac+M*A.ac)),O.rc=S*(j*O.rc+M*A.rc),O.gc=S*(j*O.gc+M*A.gc),O.bc=S*(j*O.bc+M*A.bc),O.cnt+=A.cnt,O.mtm=++x,d[A.bk].fw=A.fw,d[A.fw].bk=A.bk,A.mtm=_}let N=[];var P=0;for(x=0;;++P){let e=f(Math.round(d[x].rc),0,255),t=f(Math.round(d[x].gc),0,255),n=f(Math.round(d[x].bc),0,255),r=255;u&&(r=f(Math.round(d[x].ac),0,255),s&&(r=r<=(typeof s==`number`?s:127)?0:255),i&&r<=o&&(e=t=n=a,r=0));let c=u?[e,t,n,r]:[e,t,n];if(v(N,c)||N.push(c),(x=d[x].fw)==0)break}return N}function v(e,t){for(let n=0;n<e.length;n++){let r=e[n],i=r[0]===t[0]&&r[1]===t[1]&&r[2]===t[2],a=r.length>=4&&t.length>=4?r[3]===t[3]:!0;if(i&&a)return!0}return!1}function y(e,t){for(var n=0,r=0;r<e.length;r++){let i=e[r]-t[r];n+=i*i}return n}function b(e,t){return t>1?Math.round(e/t)*t:e}function x(e,{roundRGB:t=5,roundAlpha:n=10,oneBitAlpha:r=null}={}){let i=new Uint32Array(e.buffer);for(let e=0;e<i.length;e++){let a=i[e],o=a>>24&255,s=a>>16&255,c=a>>8&255,l=a&255;o=b(o,n),r&&(o=o<=(typeof r==`number`?r:127)?0:255),l=b(l,t),c=b(c,t),s=b(s,t),i[e]=o<<24|s<<16|c<<8|l}}function S(e,t,n=`rgb565`){if(!e||!e.buffer||!(e instanceof Uint8Array)&&!(e instanceof Uint8ClampedArray))throw Error(`quantize() expected RGBA Uint8Array data`);if(t.length>256)throw Error(`applyPalette() only works with 256 colors or less`);let r=new Uint32Array(e.buffer),i=r.length,a=n===`rgb444`?4096:65536,o=new Uint8Array(i),s=Array(a);if(n===`rgba4444`)for(let e=0;e<i;e++){let n=r[e],i=n>>24&255,a=n>>16&255,c=n>>8&255,l=n&255,d=u(l,c,a,i),f=d in s?s[d]:s[d]=C(l,c,a,i,t);o[e]=f}else{let e=n===`rgb444`?d:l;for(let n=0;n<i;n++){let i=r[n],a=i>>16&255,c=i>>8&255,l=i&255,u=e(l,c,a),d=u in s?s[u]:s[u]=w(l,c,a,t);o[n]=d}}return o}function C(e,t,n,r,i){let a=0,o=1e100;for(let s=0;s<i.length;s++){let c=i[s],l=E(c[3]-r);if(l>o)continue;let u=c[0];if(l+=E(u-e),l>o)continue;let d=c[1];if(l+=E(d-t),l>o)continue;let f=c[2];l+=E(f-n),l>o||(o=l,a=s)}return a}function w(e,t,n,r){let i=0,a=1e100;for(let o=0;o<r.length;o++){let s=r[o],c=E(s[0]-e);if(c>a)continue;let l=s[1];if(c+=E(l-t),c>a)continue;let u=s[2];c+=E(u-n),c>a||(a=c,i=o)}return i}function T(e,t,n=5){if(!e.length||!t.length)return;let r=e.map(e=>e.slice(0,3)),i=n*n,a=e[0].length;for(let n=0;n<t.length;n++){let o=t[n];o=o.length<a?[o[0],o[1],o[2],255]:o.length>a?o.slice(0,3):o.slice();let s=O(r,o.slice(0,3),y),c=s[0],l=s[1];l>0&&l<=i&&(e[c]=o)}}function E(e){return e*e}function D(e,t,n=y){let r=1/0,i=-1;for(let a=0;a<e.length;a++){let o=n(t,e[a]);o<r&&(r=o,i=a)}return i}function O(e,t,n=y){let r=1/0,i=-1;for(let a=0;a<e.length;a++){let o=n(t,e[a]);o<r&&(r=o,i=a)}return[i,r]}function k(e,t,n=y){return e[D(e,t,n)]}function A(e={}){let{initialCapacity:t=4096,auto:i=!0}=e,a=r(t),o=5003,s=new Uint8Array(256),c=new Int32Array(o),l=new Int32Array(o),u=!1;return{reset(){a.reset(),u=!1},finish(){a.writeByte(n.trailer)},bytes(){return a.bytes()},bytesView(){return a.bytesView()},get buffer(){return a.buffer},get stream(){return a},writeHeader:d,writeFrame(e,t,n,r={}){let{transparent:o=!1,transparentIndex:f=0,delay:p=0,palette:m=null,repeat:h=0,colorDepth:g=8,dispose:_=-1}=r,v=!1;if(i?u||=(v=!0,d(),!0):v=!!r.first,t=Math.max(0,Math.floor(t)),n=Math.max(0,Math.floor(n)),v){if(!m)throw Error(`First frame must include a { palette } option`);M(a,t,n,m,g),P(a,m),h>=0&&N(a,h)}let y=Math.round(p/10);j(a,_,y,o,f);let b=!!m&&!v;F(a,t,n,b?m:null),b&&P(a,m),I(a,e,t,n,g,s,c,l)}};function d(){R(a,`GIF89a`)}}function j(e,t,n,r,i){e.writeByte(33),e.writeByte(249),e.writeByte(4),i<0&&(i=0,r=!1);var a,o;r?(a=1,o=2):(a=0,o=0),t>=0&&(o=t&7),o<<=2,e.writeByte(o|0|a),L(e,n),e.writeByte(i||0),e.writeByte(0)}function M(e,t,n,r,i=8){let a=z(r.length)-1,o=i-1<<4|128|a;L(e,t),L(e,n),e.writeBytes([o,0,0])}function N(e,t){e.writeByte(33),e.writeByte(255),e.writeByte(11),R(e,`NETSCAPE2.0`),e.writeByte(3),e.writeByte(1),L(e,t),e.writeByte(0)}function P(e,t){let n=1<<z(t.length);for(let r=0;r<n;r++){let n=[0,0,0];r<t.length&&(n=t[r]),e.writeByte(n[0]),e.writeByte(n[1]),e.writeByte(n[2])}}function F(e,t,n,r){if(e.writeByte(44),L(e,0),L(e,0),L(e,t),L(e,n),r){let t=z(r.length)-1;e.writeByte(128|t)}else e.writeByte(0)}function I(e,t,n,r,i=8,a,o,s){c(n,r,t,i,e,a,o,s)}function L(e,t){e.writeByte(t&255),e.writeByte(t>>8&255)}function R(e,t){for(var n=0;n<t.length;n++)e.writeByte(t.charCodeAt(n))}function z(e){return Math.max(Math.ceil(Math.log2(e)),1)}var ee=A}))(),n=[`01 │ import cv2, numpy as np, sys`,`02 │ img = cv2.imread('public/ave-del-paraiso.jpg')`,`03 │ resized = cv2.resize(img, (WIDTH, ROWS), cv2.INTER_AREA)`,`04 │ hsv = cv2.cvtColor(resized, cv2.COLOR_BGR2HSV) * [1, SAT, VAL]`,`05 │ gray = cv2.GaussianBlur(cv2.cvtColor(resized, BGR2GRAY), (3,3), 0)`,`06 │ gx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=KSIZE)  # ∂I/∂x -> |`,`07 │ gy = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=KSIZE)  # ∂I/∂y -> -`,`08 │ mag = np.hypot(gx, gy) / np.hypot(gx, gy).max() * 255.0`,`09 │ angle = (np.degrees(np.arctan2(gy, gx)) + 180.0) % 180.0`,`10 │ edge_ch = np.select([angle<22.5,...], ['|','/','-','\\\\'], '|')`,`11 │ glyph = np.where(mag >= THRESH, edge_ch, DENSITY_RAMP[lum_idx])`,`12 │ sys.stdout.write(f"\\033[38;2;{r};{g};{b}m{glyph}\\033[0m")`],r=[{badge:`PASO 1/5 • FOTO REAL`,title:`Fotografía real del Ave del Paraíso antes de convertirla`,codeExplain:`Cargamos la foto real y realzamos sus colores botánicos (naranja, azul cobalto y verde).`},{badge:`PASO 2/5 • ESCÁNER HORIZONTAL Gx`,title:`cv2.Sobel(dx=1, dy=0) detecta bordes verticales y los traza con "|"`,codeExplain:`La derivada horizontal Gx mide cambios de luz izquierda↔derecha para hallar tallos y pétalos verticales.`},{badge:`PASO 3/5 • ESCÁNER VERTICAL Gy`,title:`cv2.Sobel(dx=0, dy=1) detecta el pico horizontal y lo traza con "-"`,codeExplain:`La derivada vertical Gy mide cambios arriba↔abajo para detectar la espata y bordes horizontales.`},{badge:`PASO 4/5 • BRÚJULA VECTORIAL (| / - \\)`,title:`arctan2(Gy, Gx) calcula el ángulo exacto de cada pétalo (→ ↗ ↑ ↖)`,codeExplain:`El ángulo θ° elige el carácter cuyo trazo sigue la curva exacta del pétalo: |, /, - o \\.`},{badge:`PASO 5/5 • FLORACIÓN VIVA + CORTINA RAYOS X`,title:`Flor Ave del Paraíso en movimiento con cortina Foto↔ASCII y polen vivo`,codeExplain:`Combinamos bordes direccionales + relleno de luz en 24 bits con floración cinética y brisa.`}];function i(e,t,i,a,o={}){let{storyAct:s=5,actProgress:c=1,phase:l=0,curtainRatio:u=null,refCanvas:d=null,activeCodeLine:f=11}=o;e.fillStyle=`#04060b`,e.fillRect(0,0,t,i);let p=Math.round(i*.044);e.fillStyle=`#0c1220`,e.fillRect(0,0,t,p);let m=Math.round(p*.5);[`#ef4444`,`#f59e0b`,`#22c55e`].forEach((t,n)=>{e.beginPath(),e.arc(18+n*15,m,4.5,0,Math.PI*2),e.fillStyle=t,e.fill()}),e.fillStyle=`#e2e8f0`,e.font=`700 ${Math.round(t*.022)}px "JetBrains Mono", monospace`,e.textBaseline=`middle`,e.fillText(`Ave del Paraíso — cv2.Sobel ASCII Vivo (${a.cols}×${a.rows})`,70,m);let h=r[Math.max(0,Math.min(4,(s||5)-1))],g=p+6,_=Math.round(i*.072);e.fillStyle=`#111827`,e.fillRect(10,g,t-20,_),e.strokeStyle=`rgba(250, 204, 46, 0.55)`,e.lineWidth=1.2,e.strokeRect(10,g,t-20,_),e.fillStyle=`#facc15`,e.font=`700 ${Math.round(t*.02)}px "JetBrains Mono", monospace`,e.fillText(h.badge,20,g+_*.32),e.fillStyle=`#f8fafc`,e.font=`600 ${Math.round(t*.022)}px "Plus Jakarta Sans", sans-serif`,e.fillText(h.title,20,g+_*.72);let v=g+_+8,y=Math.round(i*.555),b=t-20,{grid:x,cols:S,rows:C}=a,w=b/S,T=y/C,E=Math.max(7,Math.floor(Math.min(T*.94,w*1.78))),D=-1;s===1?D=10+b*(1-c*.45):typeof u==`number`&&u>.01&&(D=10+b*u),d&&D>10&&(e.save(),e.beginPath(),e.rect(10,v,D-10,y),e.clip(),e.drawImage(d,10,v,b,y),e.fillStyle=`rgba(4, 6, 11, 0.18)`,e.fillRect(10,v,D-10,y),e.restore()),e.font=`600 ${E}px "JetBrains Mono", monospace`,e.textBaseline=`top`;let O=l*18%(Math.hypot(S,C)*.9),k=S*.44,A=C*.52;for(let t=0;t<C;t++){let n=x[t],r=v+t*T;for(let i=0;i<S;i++){let a=10+i*w;if(D>10&&a<D-w*.5)continue;let o=n[i];if(o.char===` `&&o.edgeChar===` `)continue;let l=o.char,u=o.r,d=o.g,f=o.b;if(s===2)Math.abs(o.gx)>=38&&(o.edgeChar===`|`||Math.abs(o.gx)>=Math.abs(o.gy))?(l=`|`,u=255,d=148,f=42):(l=`·`,u=Math.trunc(o.r*.25),d=Math.trunc(o.g*.25),f=Math.trunc(o.b*.25));else if(s===3)Math.abs(o.gy)>=38&&(o.edgeChar===`-`||Math.abs(o.gy)>Math.abs(o.gx))?(l=`-`,u=82,d=178,f=255):(l=`·`,u=Math.trunc(o.r*.25),d=Math.trunc(o.g*.25),f=Math.trunc(o.b*.25));else if(s===4){let e=S*(.15+.75*c);if(o.edgeChar!==` `)l=i<e?o.edgeChar:o.arrowChar||o.edgeChar,u=Math.min(255,o.r+28),d=Math.min(255,o.g+28),f=Math.min(255,o.b+28);else continue}else{let e=Math.hypot(i-k,t-A),n=Math.abs(e-O);if(n<3.2&&o.isEdge){let e=(1-n/3.2)*75;u=Math.min(255,Math.round(u+e)),d=Math.min(255,Math.round(d+e)),f=Math.min(255,Math.round(f+e))}}l!==` `&&(e.fillStyle=`rgb(${u}, ${d}, ${f})`,e.fillText(l,a,r))}}D>18&&D<10+b-8&&(e.strokeStyle=`#facc15`,e.lineWidth=2,e.beginPath(),e.moveTo(D,v),e.lineTo(D,v+y),e.stroke(),e.fillStyle=`rgba(15, 23, 42, 0.88)`,e.fillRect(D-68,v+10,62,20),e.fillRect(D+6,v+10,66,20),e.fillStyle=`#fde047`,e.font=`700 ${Math.round(t*.018)}px "JetBrains Mono", monospace`,e.textBaseline=`middle`,e.fillText(`FOTO HD`,D-62,v+20),e.fillStyle=`#38bdf8`,e.fillText(`cv2.Sobel`,D+11,v+20));let j=[`*`,`+`,`·`,`°`],M=[`#fde047`,`#fb923c`,`#60a5fa`,`#4ade80`];e.font=`700 ${Math.max(10,Math.round(E*1.15))}px "JetBrains Mono", monospace`;for(let t=0;t<16;t++){let n=t*1.731,r=(l*.16+n)%1,i=10+b*(.2+.62*((Math.sin(n*3.7)+1)*.5))+Math.sin(l*1.5+n)*18,a=v+y*(.58-r*.54);i>D+6&&a>v+4&&a<v+y-12&&(e.fillStyle=M[t%M.length],e.fillText(j[(t+Math.floor(l*2))%j.length],i,a))}let N=v+y+6,P=i-N;e.fillStyle=`#080c14`,e.fillRect(0,N,t,P);let F=Math.round(P*.17);e.fillStyle=`#172033`,e.fillRect(0,N,t,F),e.fillStyle=`#fde047`,e.font=`600 ${Math.round(t*.0195)}px "Plus Jakarta Sans", sans-serif`,e.textBaseline=`middle`,e.fillText(h.codeExplain,14,N+F*.5);let I=N+F+4,L=(P-F-8)/n.length;e.font=`500 ${Math.max(8,Math.floor(L*.74))}px "JetBrains Mono", monospace`,e.textBaseline=`middle`,n.forEach((n,r)=>{let i=I+r*L;r===f?(e.fillStyle=`rgba(250, 122, 37, 0.22)`,e.fillRect(6,i,t-12,L-1),e.fillStyle=`#fde047`,e.fillText(`▶ ${n}`,12,i+L*.5)):(e.fillStyle=r<f?`#94e2d5`:`#64748b`,e.fillText(`  ${n}`,12,i+L*.5))})}function a(e,t){let n=URL.createObjectURL(e),r=document.createElement(`a`);r.href=n,r.download=t,document.body.appendChild(r),r.click(),r.remove(),setTimeout(()=>URL.revokeObjectURL(n),5e3)}function o(e,t){let n=e*Math.PI*4.5,r=5,i=1,a=1,o=null,s=11;e<.16?(r=1,i=e/.16,s=1):e<.32?(r=2,i=(e-.16)/.16,s=5):e<.48?(r=3,i=(e-.32)/.16,s=6):e<.66?(r=4,i=(e-.48)/.18,s=9):(r=5,i=(e-.66)/.34,a=.45+.55*Math.min(1,i*1.4),o=i>.35?Math.sin((i-.35)/.65*Math.PI)*.62:null,s=11);let{gridData:c,refCanvas:l}=t(n,a);return{gridData:c,refCanvas:l,options:{storyAct:r,actProgress:i,phase:n,curtainRatio:o,refCanvas:l,activeCodeLine:s}}}async function s(e,n){let r=document.createElement(`canvas`);r.width=432,r.height=768;let s=r.getContext(`2d`,{willReadFrequently:!0}),c=(0,t.GIFEncoder)();for(let r=0;r<36;r++){let{gridData:a,options:l}=o(r/35,e);i(s,432,768,a,l);let{data:u}=s.getImageData(0,0,432,768),d=(0,t.quantize)(u,128),f=(0,t.applyPalette)(u,d);c.writeFrame(f,432,768,{palette:d,delay:110}),n&&n(Math.round((r+1)/36*100)),await new Promise(e=>setTimeout(e,0))}c.finish();let l=c.bytes();a(new Blob([l],{type:`image/gif`}),`ave-del-paraiso-sobel-9x16.gif`)}async function c(e,t){if(typeof MediaRecorder>`u`)throw Error(`MediaRecorder no está disponible en este navegador. Usa Exportar GIF.`);let n=document.createElement(`canvas`);n.width=540,n.height=960;let r=n.getContext(`2d`),s=[`video/webm;codecs=vp9`,`video/webm;codecs=vp8`,`video/webm`].find(e=>MediaRecorder.isTypeSupported(e))||``,c=n.captureStream(30),l=s?new MediaRecorder(c,{mimeType:s,videoBitsPerSecond:48e5}):new MediaRecorder(c),u=[];l.ondataavailable=e=>{e.data&&e.data.size>0&&u.push(e.data)};let d=new Promise(e=>{l.onstop=e});l.start();for(let n=0;n<135;n++){let{gridData:a,options:s}=o(n/134,e);i(r,540,960,a,s),t&&t(Math.round((n+1)/135*100)),await new Promise(e=>setTimeout(e,33))}l.stop(),await d,c.getTracks().forEach(e=>e.stop()),a(new Blob(u,{type:s||`video/webm`}),`ave-del-paraiso-sobel-9x16.webm`)}var l={classic:{name:`Sobel + Clásica ( .:-=+*#%@)`,ramp:` .:-=+*#%@`},highContrast:{name:`Alto Contraste ( .:+#@)`,ramp:` .:+#@`},botanical:{name:`Botánica Fina ( .·:;!i1tfLCG08@)`,ramp:` .·:;!i1tfLCG08@`},blocks:{name:`Bloques ANSI ( ░▒▓█)`,ramp:` ░▒▓█`}},u={3:{label:`cv2.Sobel (ksize=3)`,pyArg:`ksize=3`,cliArg:`--ksize 3`,ksize:3,size:3,gx:[[-1,0,1],[-2,0,2],[-1,0,1]],gy:[[-1,-2,-1],[0,0,0],[1,2,1]]},5:{label:`cv2.Sobel (ksize=5)`,pyArg:`ksize=5`,cliArg:`--ksize 5`,ksize:5,size:5,gx:[[-1,-2,0,2,1],[-4,-8,0,8,4],[-6,-12,0,12,6],[-4,-8,0,8,4],[-1,-2,0,2,1]],gy:[[-1,-4,-6,-4,-1],[-2,-8,-12,-8,-2],[0,0,0,0,0],[2,8,12,8,2],[1,4,6,4,1]]},scharr:{label:`cv2.Sobel (ksize=cv2.FILTER_SCHARR)`,pyArg:`ksize=-1`,cliArg:`--ksize -1`,ksize:-1,size:3,gx:[[-3,0,3],[-10,0,10],[-3,0,3]],gy:[[-3,-10,-3],[0,0,0],[3,10,3]]}};function d(e,t){if(t<=1)return 0;let n=e;for(;n<0||n>=t;)n<0&&(n=-n),n>=t&&(n=2*(t-1)-n);return n}function f(e){return e<22.5||e>=157.5?`|`:e<67.5?`/`:e<112.5?`-`:`\\`}function p(e,t){let n=(Math.atan2(-t,e)*180/Math.PI+360)%360;return[`→`,`↗`,`↑`,`↖`,`←`,`↙`,`↓`,`↘`][Math.round(n/45)%8]}function m(e,t,n,r,i,a,o){let s=e/255,c=t/255,l=n/255,u=Math.max(s,c,l),d=u-Math.min(s,c,l),f=0,p=u===0?0:d/u,m=u;d!==0&&(f=u===s?(c-l)/d+(c<l?6:0):u===c?(l-s)/d+2:(s-c)/d+4,f/=6);let h=Math.min(1,Math.max(0,p*r)),g=Math.min(1,Math.max(0,m*i)),_=Math.floor(f*6),v=f*6-_,y=g*(1-h),b=g*(1-v*h),x=g*(1-(1-v)*h),S=0,C=0,w=0;switch(_%6){case 0:S=g,C=x,w=y;break;case 1:S=b,C=g,w=y;break;case 2:S=y,C=g,w=x;break;case 3:S=y,C=b,w=g;break;case 4:S=x,C=y,w=g;break;case 5:S=g,C=y,w=b}a[o]=Math.min(255,Math.round(S*255)),a[o+1]=Math.min(255,Math.round(C*255)),a[o+2]=Math.min(255,Math.round(w*255))}function h(e,t=0,n=1){e.width!==640&&(e.width=640),e.height!==800&&(e.height=800);let r=e.getContext(`2d`);r.fillStyle=`#000000`,r.fillRect(0,0,640,800);let i=Math.max(.08,Math.min(1.08,n)),a=Math.sin(t)*22+Math.cos(t*1.7)*7,o=Math.cos(t*.85)*10,s=275.2+a*.38,c=408+o*.38;r.save(),r.beginPath(),r.moveTo(640*.33,790),r.quadraticCurveTo(204.8+a*.15,544,s,c+20),r.lineWidth=30,r.lineCap=`round`,r.strokeStyle=`#1f6e32`,r.stroke(),r.beginPath(),r.moveTo(206.72,790),r.quadraticCurveTo(199.68+a*.15,544,s-4,c+20),r.lineWidth=10,r.strokeStyle=`#52c468`,r.stroke(),r.restore(),[{angle:-156,len:295,width:34,c1:`#e6480f`,c2:`#ff9e1b`,c3:`#ffe066`},{angle:-139,len:320,width:38,c1:`#f05412`,c2:`#ffad24`,c3:`#ffeb82`},{angle:-120,len:345,width:42,c1:`#f76314`,c2:`#ffb829`,c3:`#fff099`},{angle:-97,len:360,width:44,c1:`#fa6b16`,c2:`#ffc42e`,c3:`#fff3ad`},{angle:-72,len:315,width:36,c1:`#f25c13`,c2:`#ffb024`,c3:`#ffe680`}].forEach((e,n)=>{let a=1-(1-Math.max(.12,Math.min(1,(i-n*.09)/.64)))**3,o=Math.sin(t*1.25+n*.62)*5.8+Math.cos(t*2.1-n*.4)*2.2,l=-20+(e.angle- -20)*a+o,u=e.len*(.28+.72*a),d=e.width*(.35+.65*a),f=l*Math.PI/180,p=s+Math.cos(f)*u,m=c+Math.sin(f)*u,h=-Math.sin(f),g=Math.cos(f),_=s+u*.46*Math.cos(f)+d*.32*h,v=c+u*.46*Math.sin(f)+d*.32*g,y=r.createLinearGradient(s,c,p,m);y.addColorStop(0,e.c1),y.addColorStop(.58,e.c2),y.addColorStop(1,e.c3),r.beginPath(),r.moveTo(s,c),r.quadraticCurveTo(_+h*d,v+g*d,p,m),r.quadraticCurveTo(_-h*d*.65,v-g*d*.65,s,c),r.closePath(),r.fillStyle=y,r.fill(),r.lineWidth=2.4,r.strokeStyle=e.c3,r.stroke(),r.beginPath(),r.moveTo(s,c),r.quadraticCurveTo(_+h*4,v+g*4,p,m),r.lineWidth=3.2,r.strokeStyle=`#fff5bd`,r.stroke();for(let e of[.38,.68]){let t=s+u*e*Math.cos(f),n=c+u*e*Math.sin(f),i=d*(1-e*.55)*.65;r.beginPath(),r.moveTo(t-h*i*.45,n-g*i*.45),r.lineTo(t+h*i+Math.cos(f)*16,n+g*i+Math.sin(f)*16),r.lineWidth=1.6,r.strokeStyle=`rgba(255, 248, 198, 0.8)`,r.stroke()}}),[{angle:-61,len:310,barb:24},{angle:-21,len:295,barb:26}].forEach((e,n)=>{let a=1-(1-Math.max(.15,Math.min(1,(i-.15-n*.12)/.65)))**3,o=Math.cos(t*1.4+n*.85)*4.5,l=-14+(e.angle+14)*a+o,u=e.len*(.25+.75*a),d=e.barb*(.35+.65*a),f=l*Math.PI/180,p=s+14+Math.cos(f)*u,m=c-4+Math.sin(f)*u,h=-Math.sin(f),g=Math.cos(f),_=s+14+u*.54*Math.cos(f)+h*d,v=c-4+u*.54*Math.sin(f)+g*d,y=s+14+u*.48*Math.cos(f)-d*.45*h,b=c-4+u*.48*Math.sin(f)-d*.45*g,x=r.createLinearGradient(s,c,p,m);x.addColorStop(0,`#1742b5`),x.addColorStop(.55,`#2b6df8`),x.addColorStop(1,`#85bcff`),r.beginPath(),r.moveTo(s+8,c),r.quadraticCurveTo(_,v,p,m),r.quadraticCurveTo(y,b,s+8,c),r.closePath(),r.fillStyle=x,r.fill(),r.lineWidth=2.4,r.strokeStyle=`#99c9ff`,r.stroke()});let l=595.2+a*.45,u=384+o*.65,d=r.createLinearGradient(s-25,c,l,u+45);d.addColorStop(0,`#a3243b`),d.addColorStop(.22,`#226b34`),d.addColorStop(.75,`#339c4c`),d.addColorStop(1,`#8be07b`),r.beginPath(),r.moveTo(s-32,c+28),r.quadraticCurveTo(s+25,c-10,640*.68,380),r.lineTo(l,u),r.quadraticCurveTo(416,800*.56,s-18,c+56),r.closePath(),r.fillStyle=d,r.fill(),r.lineWidth=2.4,r.strokeStyle=`#75d468`,r.stroke(),r.beginPath(),r.moveTo(s-24,c+16),r.quadraticCurveTo(s+30,c-8,l-10,u),r.lineWidth=7,r.strokeStyle=`#f23051`,r.stroke()}var g=null;function _(e,t=null){let n=e.naturalWidth||e.width||640,r=e.naturalHeight||e.height||800;!g&&typeof document<`u`&&(g=document.createElement(`canvas`));let i=g||t;i.width!==n&&(i.width=n),i.height!==r&&(i.height=r);let a=i.getContext(`2d`,{willReadFrequently:!0});a.drawImage(e,0,0,n,r);let o=a.getImageData(0,0,n,r).data,s=n,c=r,l=0,u=0,d=!1;for(let e=0;e<r;e+=2)for(let t=0;t<n;t+=2){let r=(e*n+t)*4;9798*o[r]+19235*o[r+1]+3735*o[r+2]+16384>>15>14&&o[r+3]>30&&(t<s&&(s=t),e<c&&(c=e),t>l&&(l=t),e>u&&(u=e),d=!0)}if(!d)return i;let f=Math.max(32,l-s),p=Math.max(32,u-c),m=Math.round(f*.05),h=Math.round(p*.05),_=Math.max(0,s-m),v=Math.max(0,c-h),y=Math.min(n,l+m),b=Math.min(r,u+h),x=y-_,S=b-v,C=t||document.createElement(`canvas`);return C.width!==x&&(C.width=x),C.height!==S&&(C.height=S),C.getContext(`2d`).drawImage(i,_,v,x,S,0,0,x,S),C}var v={size:0,gray:null,blurred:null,rgbBoosted:null,edgeRgb:null,gxArr:null,gyArr:null,magRaw:null,angleArr:null};function y(e){return v.size!==e&&(v.size=e,v.gray=new Uint8Array(e),v.blurred=new Uint8Array(e),v.rgbBoosted=new Uint8Array(e*3),v.edgeRgb=new Uint8Array(e*3),v.gxArr=new Float64Array(e),v.gyArr=new Float64Array(e),v.magRaw=new Float64Array(e),v.angleArr=new Float64Array(e)),v}var b=[[1,2,1],[2,4,2],[1,2,1]];function x(e,t,n,r={},i=!1){let{edgeThreshold:a=52,kernelKey:o=`3`,saturationBoost:s=1.35,contrastBoost:c=1.15,rampKey:h=`classic`,viewMode:g=`combined`,bgCutoff:_=14}=r,v=t*n,{gray:x,blurred:S,rgbBoosted:C,edgeRgb:w,gxArr:T,gyArr:E,magRaw:D,angleArr:O}=y(v);if(!i){for(let t=0;t<v;t++){let n=e[t*4],r=e[t*4+1],i=e[t*4+2];x[t]=9798*n+19235*r+3735*i+16384>>15,m(n,r,i,s,c,C,t*3)}for(let e=0;e<n;e++)for(let r=0;r<t;r++){let i=0;for(let a=-1;a<=1;a++){let o=d(e+a,n)*t,s=b[a+1];for(let e=-1;e<=1;e++){let n=d(r+e,t);i+=x[o+n]*s[e+1]}}S[e*t+r]=i+8>>4}for(let e=0;e<n;e++)for(let r=0;r<t;r++){let i=0,a=0,o=0;for(let s=-1;s<=1;s++){let c=Math.min(n-1,Math.max(0,e+s));for(let e=-1;e<=1;e++){let n=Math.min(t-1,Math.max(0,r+e)),s=(c*t+n)*3;C[s]>i&&(i=C[s]),C[s+1]>a&&(a=C[s+1]),C[s+2]>o&&(o=C[s+2])}}let s=(e*t+r)*3;w[s]=i,w[s+1]=a,w[s+2]=o}}let k=u[o]||u[3],A=k.gx,j=k.gy,M=(k.size||A.length)-1>>1,N=0;for(let e=0;e<n;e++)for(let r=0;r<t;r++){let i=0,a=0;for(let o=-M;o<=M;o++){let s=d(e+o,n)*t,c=A[o+M],l=j[o+M];for(let e=-M;e<=M;e++){let n=S[s+d(r+e,t)],o=e+M;i+=n*c[o],a+=n*l[o]}}let o=e*t+r;T[o]=i,E[o]=a;let s=Math.hypot(i,a);D[o]=s,s>N&&(N=s),O[o]=(Math.atan2(a,i)*180/Math.PI+180)%180}let P=(N>0?N:1)+1e-6,F=(l[h]||l.classic).ramp,I=F.length,L=Array(n),R=0,z=0;for(let e=0;e<n;e++){let n=Array(t);for(let r=0;r<t;r++){let i=e*t+r,o=x[i],s=D[i]/P*255,c=O[i],l=T[i],u=E[i],d=f(c);if(o<_&&s<a){n[r]={char:` `,edgeChar:` `,arrowChar:` `,r:0,g:0,b:0,gx:0,gy:0,mag:0,angle:0,lum:0,isEdge:!1};continue}z++;let m=i*3,h=C[m],v=C[m+1],y=C[m+2],b=w[m],S=w[m+1],k=w[m+2],A=p(l,u),j=` `,M=!1;if(g===`edges`)s>=a*.72?(j=d,M=!0,R++,h=Math.min(255,Math.trunc(b*1.12+14)),v=Math.min(255,Math.trunc(S*1.12+14)),y=Math.min(255,Math.trunc(k*1.12+14))):j=` `;else if(g===`vectors`)s>=a*.68?(j=A,M=!0,R++,h=Math.min(255,Math.trunc(b*1.15+18)),v=Math.min(255,Math.trunc(S*1.15+18)),y=Math.min(255,Math.trunc(k*1.15+18))):(j=`·`,h=Math.trunc(h*.42),v=Math.trunc(v*.42),y=Math.trunc(y*.42));else if(g===`magnitude`){j=F[Math.min(I-1,Math.trunc(s/255*(I-1)))],M=s>=a,M&&R++;let e=s/255;h=Math.min(255,Math.trunc(255*e*1.25)),v=Math.min(255,Math.trunc(190*e**1.3)),y=e>.08?Math.min(255,Math.trunc(95+160*(1-e))):0}else s>=a?(j=d,M=!0,R++,h=Math.min(255,Math.trunc(b*1.12+14)),v=Math.min(255,Math.trunc(S*1.12+14)),y=Math.min(255,Math.trunc(k*1.12+14))):j=F[Math.min(I-1,Math.max(1,Math.trunc(o/255*(I-1))))];n[r]={char:j,edgeChar:s>=a*.65?d:` `,arrowChar:s>=a*.65?A:` `,r:h,g:v,b:y,gx:Math.round(l),gy:Math.round(u),mag:Math.round(s),angle:Math.round(c*10)/10,lum:Math.round(o),isEdge:M}}L[e]=n}return{grid:L,cols:t,rows:n,stats:{cols:t,rows:n,maxMag:Math.round(N*10)/10,edgeCount:R,activeCount:z,edgeRatio:(R/Math.max(1,z)*100).toFixed(1)}}}var S=null,C=null,w=``;function T(){return S}function E(e,t={}){let{cols:n=88,saturationBoost:r=1.35,contrastBoost:i=1.15,breezePhase:a=null,bloomFactor:o=1,pointerWind:s=null,charAspect:c=.5,sourceVersion:l=0}=t,u=e.width,d=e.height,f=Math.max(16,Math.trunc(d/u*n*c));S||(S=document.createElement(`canvas`),C=S.getContext(`2d`,{willReadFrequently:!0})),S.width!==n&&(S.width=n),S.height!==f&&(S.height=f);let p=a===null&&Math.abs(o-1)<.001&&!s,m=p?`${l}:${u}x${d}:${n}x${f}:${r}:${i}`:``,h=m!==``&&m===w,g=null;if(!h){if(C.fillStyle=`#000000`,C.fillRect(0,0,n,f),p)C.drawImage(e,0,0,n,f);else{let t=a||0,r=f,i=Math.max(.25,Math.min(1.12,o));for(let a=0;a<r;a++){let o=a/r,c=(1-o)**1.3,l=Math.sin(t*1.15+o*3.2)*(n*.042)*c+Math.cos(t*2.4-a*.28)*(n*.015)*(1-o)**1.8,p=n*(1-(1-i)*.58*c),m=(n-p)*.46;if(s&&s.active){let e=Math.abs(o-s.normY);if(e<.35){let t=(1-e/.35)**2;l+=s.forceX*n*.075*t}}let h=Math.max(0,Math.min(d-1,o*d)),g=Math.max(1,d/r),_=Math.sin(t*.9+o*2.5)*1.35*c+(1-i)*f*.14*c;C.drawImage(e,0,h,u,g,m+l,a+_,p,1.25)}}g=C.getImageData(0,0,n,f).data,w=m}return x(g,n,f,t,h)}function D(e){return e.grid.map(e=>e.map(e=>e.char).join(``)).join(`
`)}function O(e){return e.grid.map(e=>e.map(e=>e.char===` `?` `:`\x1b[38;2;${e.r};${e.g};${e.b}m${e.char}\x1b[0m`).join(``)).join(`
`)}var k=`modulepreload`,A=function(e,t){return new URL(e,t).href},j={},M={},N=function(e){return e.pathname.endsWith(`.css`)},P=function(e,t,n){if(t in e)return e[t];let r=n();if(!r){e[t]=void 0;return}let i=r.then(()=>{e[t]=void 0},n=>{throw delete e[t],n});return e[t]=i,i},F=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e,i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}function s(e){return import.meta.resolve?new URL(import.meta.resolve(e)):new URL(e,import.meta.url)}r=o(t.map(t=>{t=A(t,n);let r=s(t),i=N(r);return P(j,r.href,()=>{if(e===void 0){e={all:new Set,styles:new Set};let t=document.getElementsByTagName(`link`);for(let n=t.length-1;n>=0;n--){let r=t[n];e.all.add(r.href),r.rel===`stylesheet`&&e.styles.add(r.href)}}let t=i?e.styles:e.all,n=i?M[r.href]:void 0;if(!n&&t.has(r.href))return;let o=document.createElement(`link`);if(o.rel=i?`stylesheet`:k,i||(o.as=`script`),o.crossOrigin=``,o.href=r.href,a&&o.setAttribute(`nonce`,a),n&&delete M[r.href],n?.isConnected?n.replaceWith(o):document.head.appendChild(o),i)return new Promise((e,t)=>{let n=i=>{o.removeEventListener(`load`,n),o.removeEventListener(`error`,n),i.type===`error`?(M[r.href]=o,t(Error(`Unable to preload CSS for ${r}`))):e(i)};o.addEventListener(`load`,n),o.addEventListener(`error`,n)})})}).filter(e=>e!==void 0))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},I=`https://cdn.jsdelivr.net/pyodide/v0.27.7/full/`,L=null,R=null;function z(){return!!L}async function ee(e){return L||R||(R=(async()=>{try{e&&e(`Descargando runtime Pyodide (WebAssembly)...`);let{loadPyodide:t}=await F(async()=>{let{loadPyodide:e}=await import(`${I}pyodide.mjs`);return{loadPyodide:e}},[],import.meta.url),n=await t({indexURL:I});e&&e(`Cargando paquetes OpenCV (cv2) y NumPy en WASM...`),await n.loadPackage([`numpy`,`opencv-python`]),e&&e(`Importando ave_del_paraiso_sobel.py...`);let r=await fetch(`./ave_del_paraiso_sobel.py`);if(!r.ok)throw Error(`No se pudo cargar ave_del_paraiso_sobel.py (${r.status})`);let i=await r.text();return n.FS.writeFile(`/home/pyodide/ave_del_paraiso_sobel.py`,i,{encoding:`utf8`}),await n.runPythonAsync(`
import sys, json, cv2, numpy as np
if '/home/pyodide' not in sys.path:
    sys.path.insert(0, '/home/pyodide')
import ave_del_paraiso_sobel as sobel_mod

def run_browser_sobel(rgba_bytes, cols, rows, edge_threshold, ksize, sat_boost, contrast_boost, mode, ramp_key):
    arr = np.frombuffer(bytes(rgba_bytes), dtype=np.uint8).reshape((rows, cols, 4))
    bgr = cv2.cvtColor(arr, cv2.COLOR_RGBA2BGR)
    out = sobel_mod.sobel_ascii_arrays_from_resized(
        bgr,
        edge_threshold=float(edge_threshold),
        ksize=int(ksize),
        saturation_boost=float(sat_boost),
        contrast_boost=float(contrast_boost),
        mode=str(mode),
        ramp=str(ramp_key),
    )
    return json.dumps({
        "chars": out["chars"].tolist(),
        "edge_chars": out["edge_chars"].tolist(),
        "rgb": out["rgb"].tolist(),
        "gx": np.rint(out["gx"]).astype(int).tolist(),
        "gy": np.rint(out["gy"]).astype(int).tolist(),
        "mag": np.rint(out["mag"]).astype(int).tolist(),
        "angle": np.round(out["angle"], 1).tolist(),
        "lum": out["lum"].tolist(),
        "is_edge": out["is_edge"].tolist(),
        "stats": out["stats"],
    })
`),L=n,n}catch(e){throw R=null,e}})(),R)}async function te(e,t,n){let r=await ee(n),{cols:i=88,edgeThreshold:a=52,kernelKey:o=`3`,saturationBoost:s=1.38,contrastBoost:c=1.16,rampKey:l=`classic`,viewMode:d=`combined`,charAspect:f=.5}=t,p=e.width,m=e.height,h=Math.max(16,Math.trunc(m/p*i*f)),g=document.createElement(`canvas`);g.width=i,g.height=h;let _=g.getContext(`2d`,{willReadFrequently:!0});_.fillStyle=`#000000`,_.fillRect(0,0,i,h),_.drawImage(e,0,0,i,h);let v=_.getImageData(0,0,i,h).data,y=u[o]||u[3],b=performance.now(),x=r.globals.get(`run_browser_sobel`),S=x(v,i,h,a,y.ksize,s,c,d,l);x.destroy?.();let C=Math.round((performance.now()-b)*10)/10,w=JSON.parse(S),T=Array(h);for(let e=0;e<h;e++){let t=Array(i);for(let n=0;n<i;n++){let[r,i,a]=w.rgb[e][n];t[n]={char:w.chars[e][n],edgeChar:w.edge_chars[e][n],r,g:i,b:a,gx:w.gx[e][n],gy:w.gy[e][n],mag:w.mag[e][n],angle:w.angle[e][n],lum:w.lum[e][n],isEdge:!!w.is_edge[e][n]}}T[e]=t}return{grid:T,cols:i,rows:h,elapsedMs:C,stats:{cols:i,rows:h,maxMag:w.stats.max_mag,edgeCount:w.stats.edge_cells,activeCount:w.stats.active_cells,edgeRatio:w.stats.edge_ratio.toFixed(1)}}}var B=[{act:1,shortLabel:`1. Foto Real`,badge:`PASO 1 DE 5 • LA FLOR REAL`,title:`Empezamos con la fotografía real del Ave del Paraíso (Strelitzia reginae)`,subtitle:`Mira cómo la cortina escanea la foto original: cada pétalo naranja, lengua azul y pico verde se mide píxel a píxel.`,codeLine:1},{act:2,shortLabel:`2. Escáner Gx (|)`,badge:`PASO 2 DE 5 • DERIVADA HORIZONTAL Gx`,title:`cv2.Sobel(dx=1, dy=0) detecta cambios de luz de izquierda a derecha → traza "|"`,subtitle:`Donde la luz salta horizontalmente (como en el tallo y los pétalos verticales), Sobel dibuja barras verticales "|".`,codeLine:5},{act:3,shortLabel:`3. Escáner Gy (-)`,badge:`PASO 3 DE 5 • DERIVADA VERTICAL Gy`,title:`cv2.Sobel(dx=0, dy=1) detecta cambios de luz de arriba a abajo → traza "-"`,subtitle:`Donde la luz salta verticalmente (como en el pico horizontal del ave), Sobel dibuja guiones horizontales "-".`,codeLine:6},{act:4,shortLabel:`4. Brújula (/ | \\ -)`,badge:`PASO 4 DE 5 • BRÚJULA DE ÁNGULOS arctan2(Gy, Gx)`,title:`Combinamos Gx y Gy para obtener el ángulo exacto θ° de cada pétalo (→ ↗ ↑ ↖)`,subtitle:`En vez de usar letras al azar, el ángulo del borde elige el carácter que sigue la curva del pétalo: |  /  -  \\.`,codeLine:9},{act:5,shortLabel:`5. Floración Viva`,badge:`PASO 5 DE 5 • ARTE ASCII VIVO + CORTINA RAYOS X`,title:`Relleno de luz + color botánico 24-bit + floración cinética y polen vivo`,subtitle:`Toca o mueve el cursor sobre la flor para empujar los pétalos con viento, lanzar ondas de choque o deslizar la cortina.`,codeLine:11}],ne={bloom:{badge:`MODO FLORACIÓN`,title:`La flor abre y cierra sus sépalos mientras suelta polen ASCII`,subtitle:`Mueve el cursor para soplar viento sobre los pétalos; haz clic en uno para lanzar una onda vectorial.`},curtain:{badge:`MODO CORTINA`,title:`Izquierda: foto real · Derecha: lo que ve cv2.Sobel. Arrastra el asa ↔`,subtitle:`Arrastra el asa amarilla ↔ para comparar; un clic fuera del asa lanza una onda vectorial.`},pulse:{badge:`MODO PULSO`,title:`Un pulso de luz recorre solo los bordes detectados por cv2.Sobel`,subtitle:`Los anillos iluminan los contornos (/ | \\ -) para que se vea qué celdas son borde y cuáles relleno.`}},V={sourceType:`photo`,viewMode:`combined`,renderTarget:`canvas`,verticalFraming:!1,pipExpanded:!1,cols:88,edgeThreshold:52,kernelKey:`3`,saturationBoost:1.38,contrastBoost:1.16,rampKey:`classic`,choreography:`story`,motionPlaying:!0,storyAutoCycle:!0,storyAct:1,storyActProgress:0,phase:0,bloomFactor:1,curtainEnabled:!1,curtainPos:.42,isDraggingCurtain:!1,pointerWind:{active:!1,normX:.5,normY:.5,forceX:0},shockwaves:[],pollenParticles:[],activeCodeLine:0,flashedStages:new Set,codeFocus:!1,mobileTab:`escena`,lastPointer:null,curtainHintSeen:!1,pyodideBusy:!1,lastPyodideMs:null,exportBusy:!1,hoveredCell:null,sourceCanvas:null,sourceVersion:0,gridData:null},H=null,re=0,ie=0,ae=``,oe=``,U=null,W=null,se=[2900,2900,2900,3200,6500],ce=16,le=22,ue=`ave-sobel-onboarding-v1`,de=`ave-sobel-curtain-hint-v1`;function fe(e){try{return window.localStorage?.getItem(e)}catch{return null}}function pe(e,t){try{window.localStorage?.setItem(e,t)}catch{}}function me(){return typeof window<`u`&&window.matchMedia?.(`(prefers-reduced-motion: reduce)`).matches}var G=me();function he(e=28){let t=[`*`,`+`,`·`,`°`],n=[[253,224,71],[251,146,60],[96,165,250],[74,222,128],[244,63,94]];V.pollenParticles=Array.from({length:e},(e,r)=>({x:.18+Math.random()*.68,y:.15+Math.random()*.65,vx:(Math.random()-.5)*.0025,vy:-.0022-Math.random()*.0032,glyph:t[r%t.length],rgb:n[r%n.length],phase:Math.random()*Math.PI*2,sizeBoost:r%3*.15}))}function ge(e,t,n=7){let r=[`*`,`+`,`·`],i=[[253,224,71],[251,146,60],[96,165,250]];for(let a=0;a<n;a++){let o=Math.PI*2*a/n+Math.random()*.5,s=.004+Math.random()*.005;V.pollenParticles.push({x:e,y:t,vx:Math.cos(o)*s,vy:Math.sin(o)*s-.002,glyph:r[a%r.length],rgb:i[a%i.length],phase:Math.random()*Math.PI*2,sizeBoost:.35,ttl:55})}V.pollenParticles.length>64&&V.pollenParticles.splice(0,V.pollenParticles.length-64)}function _e(){let e=document.getElementById(`app`);e.innerHTML=`
    <div class="studio-shell" id="studio-view">
      <header class="studio-header">
        <div class="brand-group">
          <div class="brand-emblem" aria-hidden="true">/|\\</div>
          <div class="brand-titles">
            <h1>
              Ave del Paraíso — Arte ASCII Vivo con cv2.Sobel
              <span class="species-tag">Strelitzia reginae</span>
            </h1>
            <p class="brand-subtitle">
              De la fotografía real a vectores direccionales <code>(| / - \\)</code> y floración cinética en tiempo real
            </p>
          </div>
        </div>

        <div class="header-actions">
          <button
            type="button"
            class="btn btn-breeze active"
            id="btn-toggle-motion"
            aria-pressed="true"
            title="Activar/Pausar todo el movimiento de la flor"
          >
            Flor Viva
          </button>
          <button type="button" class="btn btn-vertical" id="btn-toggle-framing" aria-pressed="false" title="Encuadre vertical 9:16 para móvil y redes">
            9:16
          </button>

          <div class="menu-wrap" id="export-menu-wrap">
            <button
              type="button"
              class="btn btn-primary"
              id="btn-export-menu"
              aria-haspopup="menu"
              aria-expanded="false"
              aria-controls="export-menu"
            >
              Exportar <span class="menu-caret" aria-hidden="true">▾</span>
            </button>
            <div class="menu-popover" id="export-menu" role="menu" hidden>
              <div class="menu-section-label">Video vertical 9:16</div>
              <button type="button" class="menu-item" role="menuitem" id="btn-export-webm">
                Grabar video WebM <small>historia completa</small>
              </button>
              <button type="button" class="menu-item" role="menuitem" id="btn-export-gif">
                Exportar GIF animado <small>432×768</small>
              </button>
              <div class="menu-section-label">Copiar</div>
              <button type="button" class="menu-item" role="menuitem" id="btn-copy-ascii">
                Arte ASCII (texto plano)
              </button>
              <button type="button" class="menu-item" role="menuitem" id="btn-copy-ansi">
                ASCII con color ANSI <small>para terminal</small>
              </button>
              <button type="button" class="menu-item" role="menuitem" id="btn-copy-python">
                Script Python <small>con tus parámetros</small>
              </button>
              <div class="menu-section-label">Descargar</div>
              <a
                class="menu-item"
                role="menuitem"
                id="btn-download-py"
                href="./ave_del_paraiso_sobel.py"
                download="ave_del_paraiso_sobel.py"
              >
                ave_del_paraiso_sobel.py
              </a>
            </div>
          </div>
        </div>
      </header>

      <main class="studio-workspace" id="studio-workspace" data-mobile-tab="escena">
        <!-- LEFT / MAIN: Split Stage (Story Explainer + Top ASCII Flower + Bottom Live Python Code) -->
        <section class="sobel-split-stage" id="sobel-split-stage" aria-label="Terminal de Arte ASCII y Código en Vivo">
          <!-- UNIFIED STAGE CONTROL BAR: choreography + story steps + playback -->
          <div class="stage-control-bar" id="stage-control-bar">
            <div class="choreo-segment" role="radiogroup" aria-label="Modo de animación">
              <button type="button" class="seg-btn active" data-choreo="story" role="radio" aria-checked="true" title="Explicación guiada en 5 pasos">
                <span class="seg-label">Historia</span>
              </button>
              <button type="button" class="seg-btn" data-choreo="bloom" role="radio" aria-checked="false" title="Floración cinética + polen">
                <span class="seg-label">Floración</span>
              </button>
              <button type="button" class="seg-btn" data-choreo="curtain" role="radio" aria-checked="false" title="Compara Foto real ↔ Arte ASCII arrastrando ↔">
                <span class="seg-label">Cortina</span>
              </button>
              <button type="button" class="seg-btn" data-choreo="pulse" role="radio" aria-checked="false" title="Pulso bioluminiscente por las nervaduras">
                <span class="seg-label">Pulso</span>
              </button>
            </div>

            <div class="story-transport" id="story-transport">
              <button type="button" class="icon-btn" id="btn-story-prev" aria-label="Paso anterior" title="Paso anterior">Ant.</button>
              <div class="story-steps-pills" role="tablist" aria-label="Pasos de cómo funciona cv2.Sobel">
                ${B.map(e=>`
                  <button
                    type="button"
                    class="story-step-pill ${e.act===1?`active`:``}"
                    data-story-act="${e.act}"
                    id="btn-story-act-${e.act}"
                    role="tab"
                    aria-selected="${e.act===1}"
                    title="${e.shortLabel}"
                  >
                    <span class="pill-num">${e.act}</span><span class="pill-text">${e.shortLabel.replace(/^\d+\.\s*/,``)}</span>
                  </button>
                `).join(``)}
              </div>
              <button type="button" class="icon-btn" id="btn-story-next" aria-label="Paso siguiente" title="Paso siguiente">Sig.</button>
              <button
                type="button"
                class="icon-btn icon-btn-accent"
                id="btn-story-autoplay"
                aria-label="Pausar avance automático"
                aria-pressed="true"
                title="Pausar / reanudar el avance automático de pasos"
              >Pausa</button>
            </div>

            <button type="button" class="icon-btn" id="btn-trigger-shockwave" aria-label="Lanzar onda de choque vectorial" title="Lanzar onda de choque vectorial">Onda</button>
          </div>

          <!-- ONE-LINE STORY CAPTION -->
          <div class="story-caption" id="story-explainer-banner" aria-live="polite">
            <span class="story-badge" id="story-banner-badge">${B[0].badge}</span>
            <strong class="story-title" id="story-banner-title">${B[0].title}</strong>
            <p class="story-subtitle" id="story-banner-subtitle">${B[0].subtitle}</p>
            <div class="story-progress-track" aria-hidden="true">
              <div class="story-progress-fill" id="story-progress-fill" style="width: 15%"></div>
            </div>
          </div>

          <div class="stage-topbar">
            <div class="window-dots">
              <span class="win-dot crimson"></span>
              <span class="win-dot gold"></span>
              <span class="win-dot emerald"></span>
              <span class="terminal-title" id="terminal-dim-label">python3 ave_del_paraiso_sobel.py — 88×53</span>
            </div>

            <div class="view-mode-tabs" role="tablist">
              <button type="button" class="mode-tab active" data-view-mode="combined" id="tab-mode-combined">
                Sobel + Color
              </button>
              <button type="button" class="mode-tab" data-view-mode="edges" id="tab-mode-edges">
                Trazos (/ | \\ -)
              </button>
              <button type="button" class="mode-tab" data-view-mode="vectors" id="tab-mode-vectors">
                Flechas ∇I (→ ↗ ↑)
              </button>
              <button type="button" class="mode-tab" data-view-mode="magnitude" id="tab-mode-magnitude">
                Magnitud |G|
              </button>
              <button type="button" class="mode-tab" id="btn-toggle-selectable">
                Seleccionar Texto
              </button>
            </div>
          </div>

          <!-- UPPER VIEWPORT: ASCII Art Canvas + X-Ray Magnifier Lens + Reference PiP -->
          <div class="ascii-viewport-wrapper" id="ascii-viewport-wrapper">
            <canvas
              class="ascii-canvas"
              id="ascii-canvas"
              role="img"
              aria-label="Arte ASCII direccional vivo de la flor Ave del Paraíso generado con cv2.Sobel"
            ></canvas>
            <div class="sr-only" id="ascii-sr-summary" aria-live="polite"></div>
            <pre class="ascii-pre-selectable" id="ascii-pre" hidden></pre>

            <!-- Floating X-Ray Magnifier Lens on Hover/Touch -->
            <div class="xray-lens-card" id="xray-lens-card" hidden>
              <div class="xray-lens-header">
                <span>Lupa Rayos X cv2.Sobel</span>
                <code id="xray-coord-label">(0, 0)</code>
              </div>
              <div class="xray-lens-body">
                <canvas id="xray-patch-canvas" width="76" height="76"></canvas>
                <div class="xray-lens-math">
                  <div class="xray-glyph-row">
                    <span class="xray-big-arrow" id="xray-arrow-char">↗</span>
                    <span class="xray-equals">→</span>
                    <span class="xray-big-glyph" id="xray-edge-char">/</span>
                  </div>
                  <div class="xray-angle-line" id="xray-angle-text">Ángulo: 45°</div>
                  <div class="xray-plain-explain" id="xray-plain-explain">
                    Borde diagonal detectado
                  </div>
                </div>
              </div>
            </div>

            <div class="coach-mark" id="coach-mark" hidden>
              <div class="coach-row"><span class="coach-ico">1.</span> Pasa el cursor <em>(o toca)</em> la flor: lupa Rayos X + viento</div>
              <div class="coach-row"><span class="coach-ico">2.</span> Clic en un pétalo = onda vectorial</div>
              <div class="coach-row"><span class="coach-ico">3.</span> En modo Cortina, arrastra el asa amarilla ↔</div>
              <button type="button" class="btn btn-sm" id="btn-coach-dismiss">Entendido</button>
            </div>

            <div class="reference-pip" id="reference-pip" title="Haz clic para ampliar/reducir la foto original">
              <div class="reference-pip-header">
                <span>Foto Original</span>
                <span id="pip-toggle-label">+/-</span>
              </div>
              <canvas id="pip-canvas" aria-label="Miniatura de la imagen de referencia original"></canvas>
            </div>
          </div>

          <!-- MATHEMATICAL SOBEL CELL INSPECTOR HUD -->
          <div class="sobel-hud-bar" id="sobel-hud-bar">
            <div class="hud-metrics" id="hud-metrics-content">
              <span class="hud-pill"><strong>Interactivo:</strong> Mueve el cursor para crear viento y ver la Lupa Rayos X • Haz clic en la flor para lanzar una <strong>Onda Vectorial</strong></span>
            </div>
            <div class="hud-metrics">
              <span class="hud-pill" id="pyodide-runtime-pill" hidden>
                WASM cv2.Sobel: <strong id="stat-pyodide-ms">-- ms</strong>
              </span>
              <span class="hud-pill">Bordes Sobel: <strong id="stat-edge-ratio">--%</strong></span>
              <span class="hud-pill">Celdas activas: <strong id="stat-active-cells">--</strong></span>
            </div>
          </div>

          <!-- LOWER VIEWPORT: LIVE PYTHON CODE DOCK ("con código en vivo abajo") -->
          <div class="live-code-dock" id="live-code-dock">
            <div class="code-dock-header">
              <div class="code-dock-title">
                <span class="code-live-indicator"></span>
                <span>ave_del_paraiso_sobel.py — Código en Vivo Sincronizado</span>
              </div>
              <div class="header-actions">
                <button
                  type="button"
                  class="btn btn-sm btn-pyodide"
                  id="btn-run-pyodide"
                  title="Ejecuta el script real con OpenCV (cv2.Sobel) compilado a WebAssembly mediante Pyodide"
                >
                  Ejecutar Python Real
                </button>
                <button
                  type="button"
                  class="btn btn-sm"
                  id="btn-toggle-code-focus"
                  aria-pressed="false"
                  aria-controls="live-code-lines"
                  title="Alternar entre ver solo la línea activa o las 12 líneas"
                >
                  ▾ Ver 12 líneas
                </button>
                <button type="button" class="btn btn-sm sheet-close" data-close-sheet aria-label="Cerrar panel de código">Cerrar</button>
              </div>
            </div>

            <!-- PLAIN-SPANISH TRANSLATION OF ACTIVE CODE LINE -->
            <div class="code-plain-explainer" id="code-plain-explainer">
              <span class="explainer-icon">Nota:</span>
              <span id="code-plain-explainer-text">
                Haz clic en cualquier línea de código para ver qué hace en español sencillo y resaltar su efecto en la flor.
              </span>
            </div>

            <div class="code-lines-container" id="live-code-lines"></div>

            <div class="cli-command-bar">
              <code class="cli-prompt" id="live-cli-command">$ python3 ave_del_paraiso_sobel.py --width 88 --threshold 52 --ksize 3</code>
              <button type="button" class="btn btn-sm" id="btn-copy-cli">Copiar CLI</button>
            </div>
          </div>
        </section>

        <!-- RIGHT SIDEBAR: Image Source, Interactive Parameters & Sobel Kernel Matrices -->
        <aside class="controls-sidebar" id="controls-sidebar" aria-label="Ajustes del Pipeline cv2.Sobel">
          <div class="sheet-header">
            <strong>Ajustes cv2.Sobel</strong>
            <button type="button" class="btn btn-sm sheet-close" data-close-sheet aria-label="Cerrar ajustes">Cerrar</button>
          </div>

          <div class="panel-card">
            <div class="panel-heading">
              <h2>Fuente Botánica</h2>
              <span class="panel-tag">Strelitzia</span>
            </div>
            <div class="source-grid">
              <button type="button" class="source-btn active" data-source="photo" id="btn-src-photo">
                Foto Estudio HD
              </button>
              <button type="button" class="source-btn" data-source="procedural" id="btn-src-procedural">
                Flor Cinética 2D
              </button>
            </div>
            <label class="upload-label" for="input-upload-image">
              <span>Subir otra flor / imagen...</span>
              <input type="file" id="input-upload-image" accept="image/*" hidden />
            </label>
          </div>

          <div class="panel-card">
            <div class="panel-heading">
              <h2>Parámetros cv2.Sobel</h2>
              <span class="panel-tag">Tiempo Real</span>
            </div>

            <div class="control-group">
              <div class="control-item">
                <div class="control-label">
                  <label for="slider-cols">Resolución Columnas (<code>WIDTH</code>)</label>
                  <code id="val-cols">88 cols</code>
                </div>
                <input type="range" id="slider-cols" min="48" max="140" step="2" value="88" />
              </div>

              <div class="control-item">
                <div class="control-label">
                  <label for="slider-threshold">Umbral de Borde (<code>EDGE_THRESH</code>)</label>
                  <code id="val-threshold">52</code>
                </div>
                <input type="range" id="slider-threshold" min="14" max="150" step="1" value="52" />
              </div>

              <div class="control-item">
                <div class="control-label">
                  <label for="select-kernel">Operador Derivativo (<code>ksize</code>)</label>
                </div>
                <select class="select-input" id="select-kernel">
                  <option value="3">cv2.Sobel (ksize=3) — Estándar 3×3</option>
                  <option value="5">cv2.Sobel (ksize=5) — Suavizado 5×5 Real</option>
                  <option value="scharr">cv2.Sobel (ksize=-1) — Filtro Scharr</option>
                </select>
              </div>

              <div class="control-item">
                <div class="control-label">
                  <label for="slider-saturation">Saturación Botánica HSV</label>
                  <code id="val-saturation">1.38×</code>
                </div>
                <input type="range" id="slider-saturation" min="0.5" max="2.2" step="0.02" value="1.38" />
              </div>

              <div class="control-item">
                <div class="control-label">
                  <label for="slider-contrast">Contraste / Brillo</label>
                  <code id="val-contrast">1.16×</code>
                </div>
                <input type="range" id="slider-contrast" min="0.7" max="1.8" step="0.02" value="1.16" />
              </div>

              <div class="control-item">
                <div class="control-label">
                  <label for="select-ramp">Rampa de Densidad ASCII</label>
                </div>
                <select class="select-input" id="select-ramp">
                  ${Object.entries(l).map(([e,t])=>`<option value="${e}">${t.name}</option>`).join(``)}
                </select>
              </div>
            </div>
          </div>

          <div class="panel-card">
            <div class="panel-heading">
              <h2>¿Por qué cv2.Sobel?</h2>
              <span class="panel-tag" id="kernel-tag-label">ksize=3</span>
            </div>
            <p style="font-size: 0.76rem; color: var(--text-secondary);">
              Un ASCII común solo mide brillo. <strong>cv2.Sobel</strong> mide hacia dónde apunta cada borde (<code style="color: var(--strelitzia-orange);">Gx</code>, <code style="color: var(--strelitzia-blue);">Gy</code>) para dibujar la silueta exacta:
            </p>
            <div class="compass-legend" style="margin-bottom: 10px;">
              <div class="compass-item">
                <div class="compass-glyph">|</div>
                <div class="compass-angle">Vertical</div>
              </div>
              <div class="compass-item">
                <div class="compass-glyph">/</div>
                <div class="compass-angle">Diagonal 45°</div>
              </div>
              <div class="compass-item">
                <div class="compass-glyph">-</div>
                <div class="compass-angle">Horizontal</div>
              </div>
              <div class="compass-item">
                <div class="compass-glyph">\\</div>
                <div class="compass-angle">Diagonal 135°</div>
              </div>
            </div>
            <div class="kernels-grid" id="kernels-matrix-view"></div>
          </div>
        </aside>
      </main>

      <nav class="mobile-tabbar" id="mobile-tabbar" aria-label="Secciones">
        <button type="button" class="mobile-tab active" data-mobile-tab="escena" aria-pressed="true">
          Escena
        </button>
        <button type="button" class="mobile-tab" data-mobile-tab="ajustes" aria-pressed="false">
          Ajustes
        </button>
        <button type="button" class="mobile-tab" data-mobile-tab="codigo" aria-pressed="false">
          Código
        </button>
      </nav>

      <div class="toast-msg" id="toast-msg" role="status" aria-live="polite"></div>
    </div>
  `}var ve=null;function K(e,t=2600){let n=document.getElementById(`toast-msg`);n&&(n.textContent=e,n.classList.add(`visible`),clearTimeout(ve),t>0&&(ve=setTimeout(()=>n.classList.remove(`visible`),t)))}function ye(){let e=document.getElementById(`kernels-matrix-view`),t=document.getElementById(`kernel-tag-label`),n=u[V.kernelKey]||u[3],r=n.size||n.gx.length;t&&(t.textContent=`${n.pyArg} (${r}×${r})`);let i=(e,t)=>`
    <div class="kernel-box">
      <div class="kernel-title"><span>${t}</span><span>${r}×${r}</span></div>
      <div class="matrix-grid matrix-${r}x${r}" style="grid-template-columns: repeat(${r}, 1fr);">
        ${e.flat().map(e=>`<div class="matrix-cell ${r===5?`cell-5x5`:``} ${e<0?`neg`:e>0?`pos`:``}">${e>0?`+${e}`:e}</div>`).join(``)}
      </div>
    </div>
  `;e.innerHTML=i(n.gx,`Gx (Horizontal)`)+i(n.gy,`Gy (Vertical)`)}function be(){let e=u[V.kernelKey]||u[3],t=(l[V.rampKey]||l.classic).ramp;return[{num:`01`,stage:`import`,badge:`import`,explain:`Importamos OpenCV (cv2) para visión artificial y NumPy (np) para cálculo matricial rápido.`,html:`<span class="tok-kw">import</span> cv2, numpy <span class="tok-kw">as</span> np, sys`},{num:`02`,stage:`input`,badge:`foto real`,explain:`Cargamos la fotografía real de la flor Ave del Paraíso (o el modelo cinético 2D).`,html:`img = cv2.<span class="tok-fn">imread</span>(<span class="tok-str">${V.sourceType===`procedural`?`procedural_strelitzia()`:V.sourceType===`upload`?`'custom_flower.jpg'`:`'public/ave-del-paraiso.jpg'`}</span>)  <span class="tok-cmt"># Strelitzia reginae</span>`},{num:`03`,stage:`resize`,badge:`rejilla`,explain:`Ajustamos la imagen a una cuadrícula de ${V.cols} columnas × ${V.gridData?V.gridData.rows:53} filas de caracteres ASCII.`,html:`resized = cv2.<span class="tok-fn">resize</span>(img, (<span class="tok-live-val">${V.cols}</span>, <span class="tok-num">${V.gridData?V.gridData.rows:53}</span>), interpolation=cv2.INTER_AREA)`},{num:`04`,stage:`hsv`,badge:`color vivo`,explain:`Multiplicamos la saturación (${V.saturationBoost.toFixed(2)}×) y el brillo (${V.contrastBoost.toFixed(2)}×) para encender el naranja y azul cobalto.`,html:`hsv = cv2.<span class="tok-fn">cvtColor</span>(resized, cv2.COLOR_BGR2HSV) * [<span class="tok-num">1</span>, <span class="tok-live-val">${V.saturationBoost.toFixed(2)}</span>, <span class="tok-live-val">${V.contrastBoost.toFixed(2)}</span>]`},{num:`05`,stage:`blur`,badge:`suavizado`,explain:`Convertimos a escala de grises y aplicamos un filtro Gaussiano 3×3 para limpiar ruido antes de medir bordes.`,html:`gray = cv2.<span class="tok-fn">GaussianBlur</span>(cv2.<span class="tok-fn">cvtColor</span>(resized, cv2.COLOR_BGR2GRAY), (<span class="tok-num">3</span>, <span class="tok-num">3</span>), <span class="tok-num">0</span>)`},{num:`06`,stage:`sobel_x`,badge:`Sobel Gx (|)`,explain:`Derivada horizontal Gx: detecta dónde cambia la luz de izquierda a derecha (bordes verticales "|").`,html:`gx = cv2.<span class="tok-fn">Sobel</span>(gray, cv2.CV_64F, <span class="tok-num">1</span>, <span class="tok-num">0</span>, <span class="tok-live-val">${e.pyArg}</span>)  <span class="tok-cmt"># ∂I/∂x → |</span>`},{num:`07`,stage:`sobel_y`,badge:`Sobel Gy (-)`,explain:`Derivada vertical Gy: detecta dónde cambia la luz de arriba a abajo (bordes horizontales "-").`,html:`gy = cv2.<span class="tok-fn">Sobel</span>(gray, cv2.CV_64F, <span class="tok-num">0</span>, <span class="tok-num">1</span>, <span class="tok-live-val">${e.pyArg}</span>)  <span class="tok-cmt"># ∂I/∂y → -</span>`},{num:`08`,stage:`mag`,badge:`fuerza |G|`,explain:`Teorema de Pitágoras hypot(Gx, Gy): calcula qué tan fuerte es el borde de cada pétalo de 0 a 255.`,html:`mag = np.<span class="tok-fn">hypot</span>(gx, gy) / np.<span class="tok-fn">hypot</span>(gx, gy).<span class="tok-fn">max</span>() * <span class="tok-num">255.0</span>`},{num:`09`,stage:`angle`,badge:`ángulo θ°`,explain:`Arcotangente arctan2(Gy, Gx): calcula el ángulo exacto (0° a 180°) hacia donde se inclina cada pétalo.`,html:`angle = (np.<span class="tok-fn">degrees</span>(np.<span class="tok-fn">arctan2</span>(gy, gx)) + <span class="tok-num">180.0</span>) % <span class="tok-num">180.0</span>`},{num:`10`,stage:`map_edge`,badge:`brújula /|\\-`,explain:`Traduce el ángulo θ° al símbolo ASCII que dibuja la inclinación real del pétalo: '|', '/', '-' o '\\'.`,html:`edge_ch = np.<span class="tok-fn">select</span>([angle&lt;<span class="tok-num">22.5</span>, angle&lt;<span class="tok-num">67.5</span>, angle&lt;<span class="tok-num">112.5</span>, angle&lt;<span class="tok-num">157.5</span>], [<span class="tok-str">'|'</span>,<span class="tok-str">'/'</span>,<span class="tok-str">'-'</span>,<span class="tok-str">'\\\\'</span>], <span class="tok-str">'|'</span>)`},{num:`11`,stage:`compose`,badge:`contorno+luz`,explain:`Si la fuerza del borde supera ${V.edgeThreshold}, dibuja el trazo direccional (/|\\-); si es interior, sombrea por brillo.`,html:`glyph = np.<span class="tok-fn">where</span>(mag &gt;= <span class="tok-live-val">${V.edgeThreshold}</span>, edge_ch, <span class="tok-str">"${t}"</span>[lum_idx])`},{num:`12`,stage:`render`,badge:`ANSI 24-bit`,explain:`Imprime cada carácter coloreado con su código RGB real de 24 bits y anima la flor en tiempo real.`,html:`sys.stdout.<span class="tok-fn">write</span>(<span class="tok-str">f"\\033[38;2;{r};{g};{b}m{glyph}\\033[0m"</span>)  <span class="tok-cmt"># modo=${V.viewMode}</span>`}]}function xe(){let e=V.kernelKey===`5`?` --ksize 5`:V.kernelKey===`scharr`?` --ksize -1`:``,t=Math.abs(V.contrastBoost-1.15)>.005?` --contrast ${V.contrastBoost}`:``,n=V.rampKey===`classic`?``:` --ramp ${V.rampKey}`,r=V.viewMode===`combined`?``:` --mode ${V.viewMode}`;return`--width ${V.cols} --threshold ${V.edgeThreshold}${e} --saturation ${V.saturationBoost}${t}${n}${r}`}var Se=0;function Ce(){let e=B[Math.max(0,Math.min(4,V.storyAct-1))],t=Math.round((V.storyAct-1+V.storyActProgress)/5*100),n=`${V.storyAct}|${t}|${V.choreography}|${V.storyAutoCycle}`;if(n===oe)return;oe=n;let r=document.getElementById(`story-progress-fill`);r&&(r.style.width=`${Math.max(6,Math.min(100,t))}%`);let i=document.getElementById(`stage-control-bar`);i&&i.classList.toggle(`is-story`,V.choreography===`story`);let a=document.getElementById(`btn-story-autoplay`);if(a){let e=V.storyAutoCycle&&V.choreography===`story`;a.textContent=e?`Pausa`:`Auto`,a.setAttribute(`aria-pressed`,String(e)),a.setAttribute(`aria-label`,e?`Pausar avance automático`:`Reanudar avance automático`)}let o=V.choreography===`story`?`story-${V.storyAct}`:V.choreography;if(o===Se)return;Se=o,document.querySelectorAll(`[data-story-act]`).forEach(e=>{let t=Number(e.getAttribute(`data-story-act`))===V.storyAct;e.classList.toggle(`active`,t),e.setAttribute(`aria-selected`,String(t))});let s=V.choreography===`story`?e:ne[V.choreography]||e,c=document.getElementById(`story-banner-badge`),l=document.getElementById(`story-banner-title`),u=document.getElementById(`story-banner-subtitle`);c&&(c.textContent=s.badge.replace(/\s•.*$/,``)),l&&(l.textContent=s.title,l.title=s.subtitle),u&&(u.textContent=s.subtitle)}function we(){document.querySelectorAll(`[data-choreo]`).forEach(e=>{let t=e.getAttribute(`data-choreo`)===V.choreography;e.classList.toggle(`active`,t),e.setAttribute(`aria-checked`,String(t))});let e=document.getElementById(`ascii-viewport-wrapper`);e&&e.classList.toggle(`curtain-mode`,V.choreography===`curtain`),oe=``,Ce()}function q(e=!1){let t=document.getElementById(`live-code-lines`);if(!t)return;let n=V.gridData?V.gridData.rows:53,r=Array.from(V.flashedStages).sort().join(`,`),i=`${V.sourceType}|${V.cols}x${n}|${V.edgeThreshold}|${V.kernelKey}|${V.saturationBoost}|${V.contrastBoost}|${V.rampKey}|${V.viewMode}|${V.activeCodeLine}|${r}|${V.codeFocus}`;if(!e&&i===ae)return;ae=i;let a=be(),o=a[Math.max(0,Math.min(a.length-1,V.activeCodeLine))],s=document.getElementById(`code-plain-explainer-text`);s&&o&&(s.innerHTML=`<strong>Línea ${o.num} (${o.badge}):</strong> ${o.explain}`),t.classList.toggle(`is-focus`,V.codeFocus),t.innerHTML=a.map((e,t)=>{let n=t===V.activeCodeLine,r=V.flashedStages.has(e.stage),i=V.codeFocus&&Math.abs(t-V.activeCodeLine)>1;return`
        <div
          class="code-line ${n?`active-step`:``} ${r?`param-flash`:``} ${i?`out-of-focus`:``}"
          data-code-idx="${t}"
          data-stage="${e.stage}"
        >
          <span class="line-num">${n?`▶ `:``}${e.num}</span>
          <span class="line-content">${e.html}</span>
          <span class="line-badge">${e.badge}</span>
        </div>
      `}).join(``);let c=document.getElementById(`live-cli-command`);c&&(c.innerHTML=`$ python3 ave_del_paraiso_sobel.py <span>${xe()}</span>`)}function J(e){e.forEach(e=>V.flashedStages.add(e)),q(!0),setTimeout(()=>{e.forEach(e=>V.flashedStages.delete(e)),q(!0)},420)}function Te(){if(V.curtainEnabled||V.choreography===`curtain`)return V.isDraggingCurtain||V.curtainEnabled?V.curtainPos:.18+(Math.sin(V.phase*.55)+1)*.5*.64;if(V.choreography===`story`){if(V.storyAct===1)return Math.max(.18,.92-V.storyActProgress*.55);if(V.storyAct===5&&V.storyActProgress>.35){let e=(V.storyActProgress-.35)/.65;return Math.sin(e*Math.PI)*.58}}return 0}function Y(){return window.matchMedia?.(`(max-width: 1080px)`).matches}function Ee(){return window.matchMedia?.(`(max-width: 720px)`).matches}function De(){let e=window.innerHeight||900;if(V.verticalFraming)return Math.max(420,e-120);if(Ee()){let t=document.getElementById(`ascii-viewport-wrapper`),n=t?t.getBoundingClientRect().top:180,r=n>40&&n<e*.55?n:180;return V.mobileTab===`escena`?Math.max(190,e-r-165):Math.max(125,e*.52-r-16)}return Y()?Math.max(240,e*.5):Math.max(320,e-400)}function X(){if(!V.gridData)return;let{grid:e,cols:t,rows:n}=V.gridData,r=document.getElementById(`ascii-canvas`);if(!r)return;let i=Ee(),a=i?6:10,o=i?6:10,s=document.getElementById(`ascii-viewport-wrapper`),c=s&&s.clientWidth>120?s.clientWidth-(i?12:28):960,l=Math.min(2,window.devicePixelRatio||1),d=t>110?7.2:t>85?8.6:10.2,f=i&&V.mobileTab!==`escena`?1.5:2.6,p=Math.max(f,(c-a*2)/t),m=De(),h=Math.max(f,(m-o*2)/n/1.92),g=Math.min(d,p,h),_=g*1.92,v=Math.ceil(t*g+a*2),y=Math.ceil(n*_+o*2),b=Math.round(v*l),x=Math.round(y*l);r.width!==b&&(r.width=b),r.height!==x&&(r.height=x),r.style.width=`${v}px`,r.style.height=`${y}px`;let S=r.getContext(`2d`);S.save(),S.scale(l,l),S.fillStyle=`#04060a`,S.fillRect(0,0,v,y);let C=t*g,w=n*_,E=T()||V.sourceCanvas,D=Te(),O=D>.01?a+C*D:-1;if(E&&V.choreography===`story`&&(V.storyAct===2||V.storyAct===3)&&(S.save(),S.globalAlpha=.22,S.drawImage(E,a,o,C,w),S.restore()),E&&O>a+2){S.save(),S.beginPath(),S.rect(a,o,O-a,w),S.clip(),S.drawImage(E,a,o,C,w);let r=Math.max(a,O-g*7);S.font=`700 ${Math.max(7,Math.round(_*.78))}px "JetBrains Mono", monospace`,S.textBaseline=`top`;for(let i=0;i<n;i+=2){let n=e[i],s=o+i*_;for(let e=0;e<t;e+=2){let t=a+e*g;if(t>=r&&t<O-2){let r=n[e];r.isEdge&&r.arrowChar!==` `&&(S.fillStyle=`rgba(253, 224, 71, 0.9)`,S.fillText(r.arrowChar,t,s))}}}S.restore()}S.font=`600 ${Math.max(6,Math.round(_*.82))}px "JetBrains Mono", ui-monospace, monospace`,S.textBaseline=`top`;let k=t*.44,A=n*.52,j=Math.hypot(t,n)*.85,M=V.phase*16%j,N=V.choreography===`pulse`?115:65;for(let r=0;r<n;r++){let i=e[r],s=o+r*_;for(let e=0;e<t;e++){let o=a+e*g;if(O>a&&o<O-g*.45)continue;let c=i[e];if(c.char===` `&&c.edgeChar===` `)continue;let l=c.char,u=c.r,d=c.g,f=c.b;if(V.choreography===`story`){if(V.storyAct===2){let n=t*(.1+.9*V.storyActProgress);if(e>n)continue;Math.abs(c.gx)>=36&&(c.edgeChar===`|`||Math.abs(c.gx)>=Math.abs(c.gy))?(l=`|`,u=255,d=152,f=46):(l=`·`,u=Math.trunc(u*.25),d=Math.trunc(d*.25),f=Math.trunc(f*.25))}else if(V.storyAct===3){let e=n*(.1+.9*V.storyActProgress);if(r>e)continue;Math.abs(c.gy)>=36&&(c.edgeChar===`-`||Math.abs(c.gy)>Math.abs(c.gx))?(l=`-`,u=76,d=175,f=255):(l=`·`,u=Math.trunc(u*.25),d=Math.trunc(d*.25),f=Math.trunc(f*.25))}else if(V.storyAct===4){if(c.edgeChar===` `)continue;let n=t*V.storyActProgress;e<n?(l=c.edgeChar,u=Math.min(255,u+30),d=Math.min(255,d+30),f=Math.min(255,f+30)):(l=c.arrowChar||c.edgeChar,u=253,d=224,f=71)}}for(let t=0;t<V.shockwaves.length;t++){let n=V.shockwaves[t],i=Math.hypot(e-n.col,r-n.row),a=Math.abs(i-n.radius);if(a<3.5){let e=1-a/3.5;c.edgeChar!==` `&&(l=c.arrowChar||c.edgeChar),u=Math.min(255,Math.round(u+120*e)),d=Math.min(255,Math.round(d+110*e)),f=Math.min(255,Math.round(f+140*e))}}if(c.isEdge){let t=Math.hypot(e-k,r-A),n=Math.abs(t-M);if(n<3.4){let e=(1-n/3.4)*N;u=Math.min(255,Math.round(u+e)),d=Math.min(255,Math.round(d+e*.9)),f=Math.min(255,Math.round(f+e))}}l!==` `&&(S.fillStyle=`rgb(${u}, ${d}, ${f})`,S.fillText(l,o,s))}}if(V.pollenParticles.length>0){S.font=`700 ${Math.max(9,Math.round(_*.92))}px "JetBrains Mono", monospace`;for(let e=0;e<V.pollenParticles.length;e++){let t=V.pollenParticles[e],n=a+t.x*C,r=o+t.y*w;if(n<O+6)continue;let i=.45+.55*Math.sin(V.phase*2.4+t.phase);S.fillStyle=`rgba(${t.rgb[0]}, ${t.rgb[1]}, ${t.rgb[2]}, ${i.toFixed(2)})`,S.fillText(t.glyph,n,r)}}if(O>a+4&&O<a+C-4){let e=S.createLinearGradient(0,o,0,o+w);e.addColorStop(0,`rgba(250, 122, 37, 0.2)`),e.addColorStop(.5,`rgba(250, 204, 46, 0.98)`),e.addColorStop(1,`rgba(59, 130, 246, 0.2)`),S.strokeStyle=e,S.lineWidth=2.2,S.beginPath(),S.moveTo(O,o),S.lineTo(O,o+w),S.stroke(),S.font=`700 11px "JetBrains Mono", monospace`,S.textBaseline=`middle`,O>a+95&&(S.fillStyle=`rgba(15, 23, 42, 0.88)`,S.fillRect(O-78,o+10,70,22),S.strokeStyle=`rgba(250, 204, 46, 0.6)`,S.lineWidth=1,S.strokeRect(O-78,o+10,70,22),S.fillStyle=`#fde047`,S.fillText(`FOTO HD`,O-68,o+21)),O<a+C-125&&(S.fillStyle=`rgba(15, 23, 42, 0.88)`,S.fillRect(O+8,o+10,96,22),S.strokeStyle=`rgba(56, 189, 248, 0.6)`,S.lineWidth=1,S.strokeRect(O+8,o+10,96,22),S.fillStyle=`#38bdf8`,S.fillText(`ASCII Sobel`,O+16,o+21));let t=o+w*.5,n=ce;if(!V.curtainHintSeen&&(V.choreography===`curtain`||V.curtainEnabled)){let e=performance.now()%1400/1400;S.beginPath(),S.arc(O,t,20+e*16,0,Math.PI*2),S.strokeStyle=`rgba(250, 204, 21, ${(.75*(1-e)).toFixed(2)})`,S.lineWidth=2.5,S.stroke()}S.beginPath(),S.arc(O,t,n,0,Math.PI*2),S.fillStyle=V.isDraggingCurtain?`#facc15`:`#0f172a`,S.fill(),S.strokeStyle=`#facc15`,S.lineWidth=2.2,S.stroke(),S.fillStyle=V.isDraggingCurtain?`#0f172a`:`#fde047`,S.font=`800 14px "JetBrains Mono", monospace`,S.textAlign=`center`,S.fillText(`↔`,O,t+.5),S.textAlign=`start`}if(r.dataset.splitX=String(O>a+4&&O<a+C-4?O:-1),r.dataset.handleY=String(o+w*.5),V.hoveredCell){let{col:e,row:r}=V.hoveredCell,i=(u[V.kernelKey]||u[3]).size||3,s=i-1>>1;if(e>=0&&e<t&&r>=0&&r<n){let t=a+(e-s)*g-1,n=o+(r-s)*_-1;S.strokeStyle=`rgba(250, 204, 46, 0.9)`,S.lineWidth=1.4,S.strokeRect(t,n,g*i+2,_*i+2)}}S.restore(),r.dataset.charW=String(g),r.dataset.charH=String(_),r.dataset.padX=String(a),r.dataset.padY=String(o)}function Oe(e,t,n=!1){if(!V.gridData)return null;let{grid:r,cols:i,rows:a}=V.gridData,o=Math.max(0,Math.min(i-1,e)),s=Math.max(0,Math.min(a-1,t)),c=r[s][o];if(c.char!==` `||c.edgeChar!==` `)return{col:o,row:s,cell:c};let l=n?3:1,u=null,d=1/0;for(let e=-l;e<=l;e++){let t=s+e;if(!(t<0||t>=a))for(let n=-l;n<=l;n++){let a=o+n;if(a<0||a>=i)continue;let s=r[t][a];if(s.char!==` `||s.edgeChar!==` `){let r=n*n+e*e-(s.isEdge?.35:0);r<d&&(d=r,u={col:a,row:t,cell:s})}}}return u||{col:o,row:s,cell:c}}function ke(){if(!V.gridData)return null;let{cols:e,rows:t}=V.gridData;return Oe(Math.round(e*.46),Math.round(t*.44),!0)}function Ae(e){let t=document.getElementById(`ascii-viewport-wrapper`),n=V.lastPointer,r=!!(!n||n.isTouch||Y());if(e.classList.toggle(`is-docked`,r),r||!t){e.style.left=``,e.style.top=``;return}let i=t.getBoundingClientRect(),a=e.offsetWidth||248,o=e.offsetHeight||120,s=n.clientX-i.left,c=n.clientY-i.top,l=s+22;l+a>i.width-8&&(l=s-22-a);let u=c+22;u+o>i.height-8&&(u=c-22-o),l=Math.max(8,Math.min(i.width-a-8,l)),u=Math.max(8,Math.min(i.height-o-8,u)),e.style.left=`${Math.round(l)}px`,e.style.top=`${Math.round(u)}px`}function je(e){let t=document.getElementById(`xray-lens-card`);if(!t)return;let n=Y()||!!V.lastPointer?.isTouch,r=e||(n?ke():null);if(!r){t.hidden=!0;return}t.hidden=!1,Ae(t);let{col:i,row:a,cell:o}=r,s=!e&&n,c=document.getElementById(`xray-coord-label`),l=document.getElementById(`xray-arrow-char`),u=document.getElementById(`xray-edge-char`),d=document.getElementById(`xray-angle-text`),f=document.getElementById(`xray-plain-explain`),p=o.char===` `?o.edgeChar===` `?`·`:o.edgeChar:o.char,m=o.char!==` `||o.edgeChar!==` `?`rgb(${o.r}, ${o.g}, ${o.b})`:`#94a3b8`;c&&(c.textContent=s?`Desliza sobre la flor`:`celda (${i}, ${a})`),l&&(l.textContent=o.arrowChar===` `?`•`:o.arrowChar,l.style.color=m),u&&(u.textContent=p,u.style.color=m),d&&(d.textContent=`Gx:${o.gx}  Gy:${o.gy}  θ:${o.angle}°`),f&&(f.textContent=s?`Toca o arrastra el dedo por los pétalos para inspeccionar y crear viento`:o.isEdge?`${o.edgeChar===`|`?`Borde vertical`:o.edgeChar===`-`?`Borde horizontal`:`Borde diagonal`} (|G|=${o.mag}) → traza '${o.edgeChar}'`:o.char===` `?`Fondo oscuro (|G|=${o.mag}) → toca un pétalo`:`Interior de pétalo (luz=${o.lum}) → sombrea '${o.char}'`);let h=document.getElementById(`xray-patch-canvas`),g=T()||V.sourceCanvas;if(h&&g&&V.gridData){let e=h.getContext(`2d`),t=h.width,n=h.height;e.fillStyle=`#04060a`,e.fillRect(0,0,t,n),e.imageSmoothingEnabled=!1;let r=Math.max(0,i-3),o=Math.max(0,a-3);e.drawImage(g,r,o,7,7,0,0,t,n),e.strokeStyle=`rgba(250, 204, 46, 0.85)`,e.lineWidth=1.5;let s=t/7;e.strokeRect(s*3,s*3,s,s)}}function Me(){let e=document.getElementById(`ascii-pre`);e&&V.gridData&&(e.innerHTML=V.gridData.grid.map(e=>e.map(e=>{if(e.char===` `)return` `;let t=e.char===`<`?`&lt;`:e.char===`>`?`&gt;`:e.char===`&`?`&amp;`:e.char;return`<span style="color:rgb(${e.r},${e.g},${e.b})">${t}</span>`}).join(``)).join(`
`))}function Ne(){if(!V.gridData)return;let{stats:e,cols:t,rows:n}=V.gridData,r=document.getElementById(`terminal-dim-label`);r&&(r.textContent=`python3 ave_del_paraiso_sobel.py — ${t}×${n}`);let i=document.getElementById(`stat-edge-ratio`);i&&(i.textContent=`${e.edgeRatio}% (${e.edgeCount})`);let a=document.getElementById(`stat-active-cells`);a&&(a.textContent=String(e.activeCount));let o=`Flor Ave del Paraíso en arte ASCII vivo (${t} columnas por ${n} filas), operador ${(u[V.kernelKey]||u[3]).label}, ${e.activeCount} celdas activas y ${e.edgeRatio}% de bordes direccionales.`,s=document.getElementById(`ascii-canvas`);s&&s.setAttribute(`aria-label`,o)}function Pe(e){let t=document.getElementById(`hud-metrics-content`);if(je(e),!t)return;if(!e){t.innerHTML=`
      <span class="hud-pill"><strong>Interactivo:</strong> Mueve el cursor o desliza el dedo para crear viento y ver la Lupa Rayos X • Toca la flor para lanzar una <strong>Onda Vectorial</strong></span>
    `;return}let{col:n,row:r,cell:i}=e,a=i.char===` `?i.edgeChar===` `?`·`:i.edgeChar:i.char,o=`#${[i.r,i.g,i.b].map(e=>e.toString(16).padStart(2,`0`)).join(``)}`,s=i.isEdge?`Borde cv2.Sobel`:i.char===` `?`Fondo`:`Relleno Luminancia`;t.innerHTML=`
    <span class="hud-pill">Celda: <strong>(${n}, ${r})</strong></span>
    <span class="hud-pill">Vector: <strong>${i.arrowChar||`•`}</strong> → <span class="hud-glyph-badge">${a}</span> <span>${s}</span></span>
    <span class="hud-pill">Gx: <strong>${i.gx}</strong></span>
    <span class="hud-pill">Gy: <strong>${i.gy}</strong></span>
    <span class="hud-pill">|G|: <strong>${i.mag}</strong>/255</span>
    <span class="hud-pill">θ: <strong>${i.angle}°</strong></span>
    <span class="hud-pill">
      <span class="hud-swatch" style="background:${o}"></span>
      <strong>\\033[38;2;${i.r};${i.g};${i.b}m</strong>
    </span>
  `}function Fe(e=null,t=1){if(!V.sourceCanvas)return null;let n=V.sourceCanvas;return V.sourceType===`procedural`&&(e!==null||t!==1)&&(U||=document.createElement(`canvas`),W||=document.createElement(`canvas`),h(U,e||0,t),n=_(U,W)),E(n,{cols:V.cols,edgeThreshold:V.edgeThreshold,kernelKey:V.kernelKey,saturationBoost:V.saturationBoost,contrastBoost:V.contrastBoost,rampKey:V.rampKey,viewMode:V.viewMode,breezePhase:V.sourceType===`procedural`?null:e,bloomFactor:V.sourceType===`procedural`?1:t,pointerWind:V.pointerWind.active?V.pointerWind:null,sourceVersion:V.sourceVersion})}function Z(e=null,t=1){if(V.sourceCanvas){if(V.sourceType===`procedural`&&(e!==null||t!==1)&&(U||=document.createElement(`canvas`),W||=document.createElement(`canvas`),h(U,e||0,t),V.sourceCanvas=_(U,W),V.sourceVersion++,Ie()),V.gridData=Fe(e,t),Ne(),V.hoveredCell&&V.gridData){let e=Oe(V.hoveredCell.col,V.hoveredCell.row,!!V.lastPointer?.isTouch);e&&je(e)}else Y()&&je(null);V.renderTarget===`canvas`?X():Me(),q()}}function Ie(){let e=document.getElementById(`pip-canvas`);e&&V.sourceCanvas&&(e.width!==V.sourceCanvas.width&&(e.width=V.sourceCanvas.width),e.height!==V.sourceCanvas.height&&(e.height=V.sourceCanvas.height),e.getContext(`2d`).drawImage(V.sourceCanvas,0,0))}function Le(){for(let e=V.pollenParticles.length-1;e>=0;e--){let t=V.pollenParticles[e];t.x+=t.vx+Math.sin(V.phase*1.4+t.phase)*.0018,t.y+=t.vy,V.pointerWind.active&&Math.abs(t.y-V.pointerWind.normY)<.25&&(t.x+=V.pointerWind.forceX*.006),typeof t.ttl==`number`&&(t.ttl--,t.ttl<=0)?V.pollenParticles.splice(e,1):(t.y<.03||t.x<.04||t.x>.96)&&(t.y=.48+Math.random()*.22,t.x=.22+Math.random()*.54)}for(let e=V.shockwaves.length-1;e>=0;e--){let t=V.shockwaves[e];t.radius+=1.45,t.radius>t.maxRadius&&V.shockwaves.splice(e,1)}V.pointerWind.active&&(V.pointerWind.forceX*=.9,Math.abs(V.pointerWind.forceX)<.01&&(V.pointerWind.active=!1))}function Q(){H&&cancelAnimationFrame(H),re=performance.now(),ie||=re;let e=t=>{let n=Math.min(64,t-re);if(re=t,V.motionPlaying&&V.renderTarget===`canvas`){if(V.phase+=n*(G?.0011:.0032),V.choreography===`story`&&V.storyAutoCycle){let e=se[V.storyAct-1]||3200,n=t-ie;V.storyActProgress=Math.min(1,n/e);let r=B[V.storyAct-1];r&&(V.activeCodeLine=r.codeLine),n>=e&&(V.storyAct=V.storyAct%5+1,V.storyActProgress=0,ie=t),Ce()}if(V.choreography===`bloom`){let e=V.phase*.32%(Math.PI*2);V.bloomFactor=.42+.62*Math.sin(e*.5)**2}else V.bloomFactor=V.choreography===`story`&&V.storyAct===5?.48+.54*Math.min(1,V.storyActProgress*1.45):.96+Math.sin(V.phase*.85)*.06;Le(),Z(V.phase,V.bloomFactor),H=requestAnimationFrame(e)}else V.shockwaves.length>0?(Le(),X(),H=requestAnimationFrame(e)):H=null};H=requestAnimationFrame(e)}function $(e,t=!1){V.choreography=`story`,V.curtainEnabled=!1,V.storyAct=Math.max(1,Math.min(5,e)),V.storyActProgress=t?.02:.72,V.storyAutoCycle=t,ie=performance.now();let n=B[V.storyAct-1];n&&(V.activeCodeLine=n.codeLine),we(),q(!0),V.renderTarget!==`canvas`&&Ue(!1),V.motionPlaying?Q():Z(V.phase,1)}function Re(e){$((V.storyAct-1+e+5)%5+1,!1)}function ze(e){V.motionPlaying=e;let t=document.getElementById(`btn-toggle-motion`);t&&(t.classList.toggle(`active`,e),t.setAttribute(`aria-pressed`,String(e)),t.textContent=e?`Flor Viva`:`Flor en pausa`)}function Be(e){V.choreography=e,V.curtainEnabled=!1,we(),e===`story`?$(1,!0):e===`bloom`?(V.storyAct=5,V.storyActProgress=1):e===`curtain`?(V.storyAct=5,V.storyActProgress=1,V.curtainHintSeen||K(`Arrastra el asa amarilla ↔ para comparar la foto con el arte ASCII`,3600)):e===`pulse`&&(V.storyAct=5,V.storyActProgress=1,Ve()),V.motionPlaying||ze(!0),Q()}function Ve(e=null,t=null){if(!V.gridData)return;let n=e===null?Math.round(V.gridData.cols*.45):e,r=t===null?Math.round(V.gridData.rows*.5):t;V.shockwaves.push({col:n,row:r,radius:1,maxRadius:Math.hypot(V.gridData.cols,V.gridData.rows)*.85}),G||ge(n/V.gridData.cols,r/V.gridData.rows,9),H||Q()}function He(e){V.viewMode=e,document.querySelectorAll(`[data-view-mode]`).forEach(t=>{t.classList.toggle(`active`,t.getAttribute(`data-view-mode`)===e)}),Z(V.motionPlaying?V.phase:null,V.bloomFactor)}function Ue(e){let t=document.getElementById(`ascii-canvas`),n=document.getElementById(`ascii-pre`),r=document.getElementById(`btn-toggle-selectable`),i=typeof e==`boolean`?e:V.renderTarget===`canvas`;V.renderTarget=i?`pre`:`canvas`,i?(t.hidden=!0,n.hidden=!1,r?.classList.add(`active`),Me()):(t.hidden=!1,n.hidden=!0,r?.classList.remove(`active`),X(),V.motionPlaying&&Q())}function We(e=!me()){let t=new Image;t.crossOrigin=`anonymous`,t.onload=()=>{V.sourceType=`photo`,V.sourceCanvas=_(t),V.sourceVersion++,Ie(),Z(V.phase,V.bloomFactor),e&&(V.motionPlaying=!0,$(1,!0))},t.onerror=()=>{Ge(e)},t.src=`./ave-del-paraiso.jpg`}function Ge(e=!me()){V.sourceType=`procedural`,U||=document.createElement(`canvas`),W||=document.createElement(`canvas`),h(U,V.phase,V.bloomFactor),V.sourceCanvas=_(U,W),V.sourceVersion++,Ie(),Z(V.phase,V.bloomFactor),e&&(V.motionPlaying=!0,Be(`bloom`))}function Ke(){let e=u[V.kernelKey]||u[3],t=(l[V.rampKey]||l.classic).ramp;return`#!/usr/bin/env python3
"""
Ave del Paraíso (Strelitzia reginae) — Arte ASCII con cv2.Sobel
Configuración exportada en vivo desde Sobel ASCII Studio
"""
import sys
import cv2
import numpy as np

WIDTH = ${V.cols}
EDGE_THRESHOLD = ${V.edgeThreshold}
SOBEL_KSIZE = ${e.ksize}  # ${e.label}
SATURATION_BOOST = ${V.saturationBoost}
CONTRAST_BOOST = ${V.contrastBoost}
DENSITY_RAMP = ${JSON.stringify(t)}
VIEW_MODE = ${JSON.stringify(V.viewMode)}

def render_strelitzia_sobel(image_path="public/ave-del-paraiso.jpg"):
    img = cv2.imread(image_path)
    if img is None:
        raise FileNotFoundError(f"No se encontró la imagen: {image_path}")

    h, w = img.shape[:2]
    rows = max(16, int((h / w) * WIDTH * 0.5))
    resized = cv2.resize(img, (WIDTH, rows), interpolation=cv2.INTER_AREA)

    # Realce botánico HSV
    hsv = cv2.cvtColor(resized, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[:, :, 1] = np.clip(hsv[:, :, 1] * SATURATION_BOOST, 0, 255)
    hsv[:, :, 2] = np.clip(hsv[:, :, 2] * CONTRAST_BOOST, 0, 255)
    rgb = cv2.cvtColor(cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR), cv2.COLOR_BGR2RGB)
    edge_rgb = cv2.dilate(rgb, np.ones((3, 3), dtype=np.uint8))

    # Derivadas direccionales con cv2.Sobel
    gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (3, 3), 0)
    gx = cv2.Sobel(blurred, cv2.CV_64F, 1, 0, ksize=SOBEL_KSIZE)
    gy = cv2.Sobel(blurred, cv2.CV_64F, 0, 1, ksize=SOBEL_KSIZE)

    mag_raw = np.hypot(gx, gy)
    mag = (mag_raw / (float(mag_raw.max()) + 1e-6)) * 255.0
    angle = (np.degrees(np.arctan2(gy, gx)) + 180.0) % 180.0

    glyphs = np.select(
        [angle < 22.5, angle < 67.5, angle < 112.5, angle < 157.5],
        ["|", "/", "-", "\\\\"],
        default="|",
    )
    ramp_arr = np.array(list(DENSITY_RAMP))
    lum = gray.astype(np.int32)
    active = ~((lum < 14) & (mag < EDGE_THRESHOLD))
    edge_boost = np.minimum(255, (edge_rgb.astype(np.float64) * 1.12 + 14).astype(np.int32))

    is_edge = active & (mag >= EDGE_THRESHOLD)
    idx = np.minimum(len(DENSITY_RAMP) - 1, np.maximum(1, (lum / 255.0 * (len(DENSITY_RAMP) - 1)).astype(np.int32)))
    chars = np.where(active, np.where(is_edge, glyphs, ramp_arr[idx]), " ")
    out_rgb = np.where(active[..., None], np.where(is_edge[..., None], edge_boost, rgb.astype(np.int32)), 0)

    for char_row, rgb_row in zip(chars.tolist(), out_rgb.tolist()):
        sys.stdout.write(
            "".join(" " if c == " " else f"\\033[38;2;{r};{g};{b}m{c}\\033[0m" for c, (r, g, b) in zip(char_row, rgb_row))
            + "\\n"
        )

if __name__ == "__main__":
    render_strelitzia_sobel(sys.argv[1] if len(sys.argv) > 1 else "public/ave-del-paraiso.jpg")
`}async function qe(){if(V.pyodideBusy||!V.sourceCanvas)return;let e=document.getElementById(`btn-run-pyodide`);V.pyodideBusy=!0,e&&(e.disabled=!0,e.textContent=z()?`Ejecutando cv2.Sobel...`:`Cargando Pyodide + OpenCV...`);try{let e=await te(V.sourceCanvas,{cols:V.cols,edgeThreshold:V.edgeThreshold,kernelKey:V.kernelKey,saturationBoost:V.saturationBoost,contrastBoost:V.contrastBoost,rampKey:V.rampKey,viewMode:V.viewMode},e=>K(e,0));V.gridData=e,V.lastPyodideMs=e.elapsedMs,Ne();let t=document.getElementById(`pyodide-runtime-pill`),n=document.getElementById(`stat-pyodide-ms`);t&&n&&(t.hidden=!1,n.textContent=`${e.elapsedMs} ms`),V.renderTarget===`canvas`?X():Me(),J([`sobel_x`,`sobel_y`,`mag`,`angle`,`compose`]),K(`Ejecutado en Python real (Pyodide + OpenCV WASM) en ${e.elapsedMs} ms`,3600)}catch(e){K(`Error en Pyodide: ${e.message||e}`,4e3)}finally{V.pyodideBusy=!1,e&&(e.disabled=!1,e.textContent=`Ejecutar Python Real`)}}async function Je(e){if(V.exportBusy||!V.sourceCanvas)return;V.exportBusy=!0;let t=document.getElementById(`btn-export-menu`),n=t?.innerHTML||``;t&&(t.disabled=!0);try{let n=e===`webm`?c:s,r=e===`webm`?`WebM 9:16`:`GIF 9:16`;K(`Generando ${r} con historia en 5 pasos... 0%`,0),await n((e,t)=>({gridData:Fe(e,t),refCanvas:T()||V.sourceCanvas}),e=>{t&&(t.textContent=`${r} ${e}%`),K(`Exportando ${r}... ${e}%`,0)}),K(`${r} descargado correctamente`,3200)}catch(e){K(`Error al exportar: ${e.message||e}`,4e3)}finally{V.exportBusy=!1,t&&(t.disabled=!1,t.innerHTML=n)}}function Ye(e){let t=document.getElementById(`export-menu`),n=document.getElementById(`btn-export-menu`);t&&n&&(t.hidden=!e,n.setAttribute(`aria-expanded`,String(e)),e&&t.querySelector(`.menu-item`)?.focus())}function Xe(e){V.codeFocus=e;let t=document.getElementById(`btn-toggle-code-focus`);t&&(t.textContent=e?`▾ Ver 12 líneas`:`▴ Solo línea activa`,t.setAttribute(`aria-pressed`,String(!e))),q(!0)}function Ze(e){V.mobileTab=e;let t=document.getElementById(`studio-workspace`);t&&(t.dataset.mobileTab=e),document.querySelectorAll(`.mobile-tab[data-mobile-tab]`).forEach(t=>{let n=t.getAttribute(`data-mobile-tab`)===e;t.classList.toggle(`active`,n),t.setAttribute(`aria-pressed`,String(n))}),X(),e!==`escena`&&Y()&&document.getElementById(`sobel-split-stage`)?.scrollIntoView({block:`start`,behavior:G?`auto`:`smooth`})}function Qe(){let e=document.getElementById(`coach-mark`);e&&!e.hidden&&(e.hidden=!0,pe(ue,`1`))}function $e(){if(fe(ue))return;let e=document.getElementById(`coach-mark`);e&&(e.hidden=!1,setTimeout(Qe,5e3))}function et(){window.addEventListener(`resize`,()=>{V.renderTarget===`canvas`&&!V.motionPlaying&&X()}),window.matchMedia?.(`(prefers-reduced-motion: reduce)`).addEventListener?.(`change`,e=>{G=e.matches,he(G?8:28)}),document.getElementById(`btn-export-menu`)?.addEventListener(`click`,e=>{e.stopPropagation(),Ye(document.getElementById(`export-menu`)?.hidden??!1)}),document.getElementById(`export-menu`)?.addEventListener(`click`,e=>{e.target.closest(`.menu-item`)&&Ye(!1)}),document.addEventListener(`click`,e=>{e.target.closest(`#export-menu-wrap`)||Ye(!1)}),document.getElementById(`export-menu-wrap`)?.addEventListener(`keydown`,e=>{let t=Array.from(document.querySelectorAll(`#export-menu .menu-item`)),n=t.indexOf(document.activeElement);e.key===`Escape`?(Ye(!1),document.getElementById(`btn-export-menu`)?.focus()):e.key===`ArrowDown`&&t.length?(e.preventDefault(),document.getElementById(`export-menu`).hidden?Ye(!0):t[(n+1)%t.length].focus()):e.key===`ArrowUp`&&t.length&&(e.preventDefault(),t[(n-1+t.length)%t.length].focus())}),document.querySelectorAll(`[data-story-act]`).forEach(e=>{e.addEventListener(`click`,()=>{$(Number(e.getAttribute(`data-story-act`)),!1)})}),document.getElementById(`btn-story-prev`)?.addEventListener(`click`,()=>Re(-1)),document.getElementById(`btn-story-next`)?.addEventListener(`click`,()=>Re(1)),document.getElementById(`btn-story-autoplay`)?.addEventListener(`click`,()=>{V.motionPlaying||ze(!0),$(V.storyAct,!V.storyAutoCycle)}),document.addEventListener(`keydown`,e=>{e.target.closest(`input, select, textarea, [role="menu"]`)||V.choreography===`story`&&(e.key===`ArrowRight`?Re(1):e.key===`ArrowLeft`&&Re(-1))}),document.querySelectorAll(`[data-choreo]`).forEach(e=>{e.addEventListener(`click`,()=>{Be(e.getAttribute(`data-choreo`))})}),document.getElementById(`btn-trigger-shockwave`)?.addEventListener(`click`,()=>{Ve()}),document.getElementById(`btn-toggle-motion`)?.addEventListener(`click`,()=>{ze(!V.motionPlaying),V.motionPlaying?(V.renderTarget!==`canvas`&&Ue(!1),Q()):Z(null,1)}),document.getElementById(`btn-toggle-code-focus`)?.addEventListener(`click`,()=>{Xe(!V.codeFocus)}),document.querySelectorAll(`.mobile-tab[data-mobile-tab]`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.getAttribute(`data-mobile-tab`);Ze(V.mobileTab===t?`escena`:t)})}),document.querySelectorAll(`[data-close-sheet]`).forEach(e=>{e.addEventListener(`click`,()=>Ze(`escena`))}),document.getElementById(`btn-coach-dismiss`)?.addEventListener(`click`,Qe),document.getElementById(`btn-toggle-framing`)?.addEventListener(`click`,e=>{V.verticalFraming=!V.verticalFraming,e.currentTarget.classList.toggle(`active`,V.verticalFraming),e.currentTarget.setAttribute(`aria-pressed`,String(V.verticalFraming)),document.getElementById(`studio-workspace`)?.classList.toggle(`vertical-framing`,V.verticalFraming),X()}),document.getElementById(`btn-export-webm`)?.addEventListener(`click`,()=>Je(`webm`)),document.getElementById(`btn-export-gif`)?.addEventListener(`click`,()=>Je(`gif`)),document.getElementById(`btn-run-pyodide`)?.addEventListener(`click`,()=>qe()),document.querySelectorAll(`[data-view-mode]`).forEach(e=>{e.addEventListener(`click`,()=>{He(e.getAttribute(`data-view-mode`))})}),document.getElementById(`btn-toggle-selectable`)?.addEventListener(`click`,()=>{Ue()}),document.getElementById(`reference-pip`)?.addEventListener(`click`,e=>{V.pipExpanded=!V.pipExpanded,e.currentTarget.classList.toggle(`expanded`,V.pipExpanded)}),document.getElementById(`live-code-lines`)?.addEventListener(`click`,e=>{let t=e.target.closest(`[data-code-idx]`);if(!t)return;let n=Number(t.getAttribute(`data-code-idx`)),r=t.getAttribute(`data-stage`);V.activeCodeLine=n,r===`sobel_x`?$(2,!1):r===`sobel_y`?$(3,!1):r===`angle`||r===`map_edge`?$(4,!1):r===`mag`?He(`magnitude`):(r===`compose`||r===`render`)&&(He(`combined`),$(5,!1)),q(!0)}),document.querySelectorAll(`[data-source]`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.getAttribute(`data-source`);document.querySelectorAll(`[data-source]`).forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`),t===`photo`?We(!0):Ge(!0),J([`input`])})}),document.getElementById(`input-upload-image`)?.addEventListener(`change`,e=>{let t=e.target.files?.[0];if(!t)return;let n=new FileReader;n.onload=e=>{let t=new Image;t.onload=()=>{V.sourceType=`upload`,document.querySelectorAll(`[data-source]`).forEach(e=>e.classList.remove(`active`)),V.sourceCanvas=_(t),V.sourceVersion++,Ie(),Z(V.phase,V.bloomFactor),$(1,!0),J([`input`]),K(`Imagen cargada: iniciando transformación cv2.Sobel en 5 pasos`)},t.src=e.target.result},n.readAsDataURL(t)}),document.getElementById(`slider-cols`)?.addEventListener(`input`,e=>{V.cols=Number(e.target.value),document.getElementById(`val-cols`).textContent=`${V.cols} cols`,V.activeCodeLine=2,Z(V.motionPlaying?V.phase:null,V.bloomFactor),J([`resize`])}),document.getElementById(`slider-threshold`)?.addEventListener(`input`,e=>{V.edgeThreshold=Number(e.target.value),document.getElementById(`val-threshold`).textContent=String(V.edgeThreshold),V.activeCodeLine=10,Z(V.motionPlaying?V.phase:null,V.bloomFactor),J([`compose`])}),document.getElementById(`select-kernel`)?.addEventListener(`change`,e=>{V.kernelKey=e.target.value,V.activeCodeLine=5,ye(),Z(V.motionPlaying?V.phase:null,V.bloomFactor),J([`sobel_x`,`sobel_y`])}),document.getElementById(`slider-saturation`)?.addEventListener(`input`,e=>{V.saturationBoost=Number(e.target.value),document.getElementById(`val-saturation`).textContent=`${V.saturationBoost.toFixed(2)}×`,V.activeCodeLine=3,Z(V.motionPlaying?V.phase:null,V.bloomFactor),J([`hsv`])}),document.getElementById(`slider-contrast`)?.addEventListener(`input`,e=>{V.contrastBoost=Number(e.target.value),document.getElementById(`val-contrast`).textContent=`${V.contrastBoost.toFixed(2)}×`,V.activeCodeLine=3,Z(V.motionPlaying?V.phase:null,V.bloomFactor),J([`hsv`])}),document.getElementById(`select-ramp`)?.addEventListener(`change`,e=>{V.rampKey=e.target.value,V.activeCodeLine=10,Z(V.motionPlaying?V.phase:null,V.bloomFactor),J([`compose`])}),document.getElementById(`code-plain-explainer`)?.addEventListener(`click`,()=>{Y()&&Ze(V.mobileTab===`codigo`?`escena`:`codigo`)});let e=document.getElementById(`ascii-canvas`);if(e){let t=null,n=null,r=t=>{let n=e.getBoundingClientRect(),r=(parseFloat(e.style.width)||n.width)/Math.max(1,n.width);return{lx:(t.x-n.left)*r,ly:(t.y-n.top)*r}},i=(t,n=!1)=>{let i=Number(e.dataset.splitX||-1);if(i<0)return!1;let{lx:a}=r(t),o=n?44:le;return Math.abs(a-i)<=o},a=(i,a)=>{if(!V.gridData)return;V.lastPointer={clientX:i.x,clientY:i.y,isTouch:a};let o=Number(e.dataset.charW||8.6),s=Number(e.dataset.charH||16.5),c=Number(e.dataset.padX||10),l=Number(e.dataset.padY||10),{lx:u,ly:d}=r(i),f=u-c,p=d-l,m=V.gridData.cols*o,h=V.gridData.rows*s,g=Math.max(0,Math.min(1,f/Math.max(1,m))),_=Math.max(0,Math.min(1,p/Math.max(1,h)));if(V.isDraggingCurtain)V.curtainPos=Math.max(.05,Math.min(.95,g));else if(!G&&t!==null){let e=g-t;Math.abs(e)>.002&&(V.pointerWind.active=!0,V.pointerWind.normX=g,V.pointerWind.normY=_,V.pointerWind.forceX=Math.max(-1.2,Math.min(1.2,e*18)))}t=g;let v=Math.floor(f/o),y=Math.floor(p/s);if(v>=0&&v<V.gridData.cols&&y>=0&&y<V.gridData.rows||a||n){let e=Oe(Math.max(0,Math.min(V.gridData.cols-1,v)),Math.max(0,Math.min(V.gridData.rows-1,y)),a);e&&(V.hoveredCell={col:e.col,row:e.row},Pe(e),V.motionPlaying||X())}},o=null,s=(t,r,o=null)=>{Qe();let s=i(t,r);if(n={x:t.x,y:t.y,onHandle:s,moved:!1},o!==null)try{e.setPointerCapture?.(o)}catch{}s&&(V.isDraggingCurtain=!0,V.curtainEnabled=!0,V.curtainHintSeen||(V.curtainHintSeen=!0,pe(de,`1`))),a(t,r)},c=(t,r)=>{if(n){let e=t.x-n.x,r=t.y-n.y;Math.hypot(e,r)>8&&(n.moved=!0,!V.isDraggingCurtain&&V.choreography===`curtain`&&Math.abs(e)>=Math.abs(r)&&(V.isDraggingCurtain=!0,V.curtainEnabled=!0,n.onHandle=!0))}!V.isDraggingCurtain&&!r&&e.classList.toggle(`over-handle`,i(t,!1)),(!r||n)&&a(t,r)},l=(e,r=!1)=>{if(!n&&!V.isDraggingCurtain)return;let i=n&&!n.onHandle&&!n.moved&&!r;V.isDraggingCurtain=!1,n=null,i&&V.hoveredCell&&Ve(V.hoveredCell.col,V.hoveredCell.row),e&&(clearTimeout(o),o=setTimeout(()=>{t=null,V.motionPlaying||X()},2500)),V.motionPlaying||X()};e.addEventListener(`touchstart`,e=>{if(e.touches.length===1){e.preventDefault();let t=e.touches[0];s({x:t.clientX,y:t.clientY},!0)}},{passive:!1}),e.addEventListener(`touchmove`,e=>{if(e.touches.length===1){e.preventDefault();let t=e.touches[0];c({x:t.clientX,y:t.clientY},!0)}},{passive:!1}),e.addEventListener(`touchend`,()=>l(!0,!1)),e.addEventListener(`touchcancel`,()=>l(!0,!0)),e.addEventListener(`pointerdown`,e=>{s({x:e.clientX,y:e.clientY},e.pointerType!==`mouse`,e.pointerId)}),e.addEventListener(`pointermove`,e=>{c({x:e.clientX,y:e.clientY},e.pointerType!==`mouse`)}),e.addEventListener(`pointerup`,e=>l(e.pointerType!==`mouse`,!1)),e.addEventListener(`pointercancel`,e=>l(e.pointerType!==`mouse`,!0)),e.addEventListener(`pointerleave`,n=>{V.isDraggingCurtain||n.pointerType===`mouse`&&(V.hoveredCell=null,t=null,e.classList.remove(`over-handle`),Pe(null),V.motionPlaying||X())})}document.getElementById(`btn-copy-ascii`)?.addEventListener(`click`,async()=>{V.gridData&&(await navigator.clipboard.writeText(D(V.gridData)),K(`Arte ASCII copiado al portapapeles`))}),document.getElementById(`btn-copy-ansi`)?.addEventListener(`click`,async()=>{V.gridData&&(await navigator.clipboard.writeText(O(V.gridData)),K(`Arte ASCII con color ANSI 24-bit copiado para terminal`))}),document.getElementById(`btn-copy-python`)?.addEventListener(`click`,async()=>{await navigator.clipboard.writeText(Ke()),K(`Script Python cv2.Sobel copiado con tus parámetros actuales`)}),document.getElementById(`btn-copy-cli`)?.addEventListener(`click`,async()=>{let e=document.getElementById(`live-cli-command`)?.textContent?.replace(/^\$\s*/,``)||``;await navigator.clipboard.writeText(e),K(`Comando de terminal copiado`)})}function tt(){he(G?8:28),V.curtainHintSeen=!!fe(de),_e(),ye(),Xe((window.innerHeight||900)<1e3||Y()),we(),et(),We(),$e()}tt();