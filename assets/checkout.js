
'use strict';
const buy=document.getElementById('buy'),statusEl=document.getElementById('status');
let busy=false;
let attempt=crypto.randomUUID();
try {const old=JSON.parse(sessionStorage.getItem('guide-checkout-attempt')||'null');if(old&&Date.now()-old.created<20*60*1000)attempt=old.id;else sessionStorage.setItem('guide-checkout-attempt',JSON.stringify({id:attempt,created:Date.now()}));}catch{}
async function startCheckout(){
 if(busy)return;busy=true;buy.disabled=true;statusEl.textContent='Ouverture du paiement sécurisé…';
 try{const r=await fetch('https://sarah-guides-test.sarah-777.workers.dev/v1/guest-checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requestId:attempt})});const d=await r.json();if(!r.ok)throw Error(d.error||'Le paiement est indisponible. Réessayez.');if(new URL(d.url).origin!=='https://checkout.stripe.com')throw Error('Lien de paiement invalide.');location.assign(d.url);}catch(e){statusEl.textContent=e.message;buy.disabled=false;busy=false;}
}
buy.onclick=startCheckout;
if(new URLSearchParams(location.search).get('retour')==='annulation'){statusEl.textContent='Votre paiement n’a pas été finalisé. Vous pouvez reprendre quand vous le souhaitez.';}else startCheckout();
