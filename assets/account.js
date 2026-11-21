'use strict';
const accountAPI='https://sarah-guides-test.sarah-777.workers.dev/v1';
const statusEl=document.getElementById('status');
const buy=document.getElementById('buy'),openGuide=document.getElementById('open');
const purchaseMode=document.querySelector('main').dataset.purchase==='true';
let currentUser=null,checking=false,checkoutStarted=false;
if(!purchaseMode&&new URLSearchParams(location.search).has('achat'))location.replace('/acheter/essentiels/');
async function accountRequest(path,method='GET'){
 if(!window.Clerk?.session)throw Error('Connectez-vous pour retrouver votre guide.');
 const token=await Clerk.session.getToken();
 const r=await fetch(accountAPI+path,{method,cache:'no-store',headers:{Authorization:'Bearer '+token}});
 if(!r.ok){const d=await r.json();throw Error(d.error||'Une erreur est survenue. Réessayez.');}return r;
}
async function checkAccess(){
 if(checking)return;checking=true;buy.hidden=true;openGuide.hidden=true;
 statusEl.textContent='Vérification de votre accès…';
 try{
  const d=await(await accountRequest('/status')).json();
  statusEl.textContent=d.paid?'Votre guide vous attend. Bonne lecture.':new URLSearchParams(location.search).get('retour')==='paiement'?'Votre paiement est en cours de vérification. Actualisez votre accès dans quelques instants.':'Connectée à votre espace. Retrouvez ici vos guides après votre achat.';
  buy.hidden=d.paid;openGuide.hidden=!d.paid;
  return d.paid;
 }catch(e){statusEl.textContent='Votre accès ne peut pas être vérifié pour le moment. Réessayez dans quelques instants.';buy.hidden=false;}finally{checking=false;}
}
async function renderAccount(){
 const uid=Clerk.user?.id||null;if(uid===currentUser&&uid)return;currentUser=uid;
 document.getElementById('reader').hidden=true;document.body.style.overflow='';document.getElementById('guide').replaceChildren();
 if(!uid){
  document.getElementById('actions').hidden=true;statusEl.textContent='Connectez-vous ou créez votre compte pour acheter et retrouver vos guides.';
  const base=purchaseMode?'/acheter/essentiels/':'/espace/';
  const target=location.origin+base;
  const signup=new URLSearchParams(location.search).has('inscription');
  Clerk[signup?'mountSignUp':'mountSignIn'](document.getElementById('auth'),{forceRedirectUrl:target,signUpForceRedirectUrl:target,signInUrl:base,signUpUrl:base+'?inscription=1',appearance:{variables:{colorPrimary:'#405043',colorBackground:'#fbf8f2',fontFamily:'Inter, Arial, sans-serif',borderRadius:'6px'}}});return;
 }
 Clerk.unmountSignIn(document.getElementById('auth'));Clerk.unmountSignUp(document.getElementById('auth'));document.getElementById('auth').replaceChildren();document.getElementById('actions').hidden=false;
 if(purchaseMode){buy.hidden=false;await startCheckout();}else await checkAccess();
}
async function bootAccount(){
 try{await Clerk.load({localization:window.sarahClerkFrench,ui:{ClerkUI:window.__internal_ClerkUICtor}});await renderAccount();Clerk.addListener(()=>{if((Clerk.user?.id||null)!==currentUser)renderAccount();});}
 catch{statusEl.textContent='La connexion est indisponible. Rechargez la page.';}
}
document.getElementById('check').onclick=checkAccess;
document.getElementById('logout').onclick=()=>Clerk.signOut({redirectUrl:location.origin+(purchaseMode?'/acheter/essentiels/':'/espace/')});
async function startCheckout(){
 if(checkoutStarted)return;checkoutStarted=true;
 buy.disabled=true;statusEl.textContent='Ouverture du paiement sécurisé…';
 try{const d=await(await accountRequest('/checkout','POST')).json();if(d.paid){await checkAccess();return;}if(new URL(d.url).origin!=='https://checkout.stripe.com')throw Error('Lien de paiement invalide.');location.assign(d.url);}
 catch(e){statusEl.textContent=e.message;}finally{buy.disabled=false;checkoutStarted=false;}
}
buy.onclick=()=>purchaseMode?startCheckout():location.assign('/acheter/essentiels/');
openGuide.onclick=async()=>{
 openGuide.disabled=true;
 try{const html=await(await accountRequest('/guide')).text();const frame=document.createElement('iframe');frame.title='Les essentiels au naturel';frame.setAttribute('sandbox','allow-scripts allow-popups allow-popups-to-escape-sandbox');frame.srcdoc=html;document.getElementById('guide').replaceChildren(frame);document.getElementById('reader').hidden=false;document.body.style.overflow='hidden';document.getElementById('close-reader').focus();}
 catch(e){statusEl.textContent=e.message;}finally{openGuide.disabled=false;}
};
document.getElementById('close-reader').onclick=()=>{document.getElementById('reader').hidden=true;document.getElementById('guide').replaceChildren();document.body.style.overflow='';openGuide.focus();};
