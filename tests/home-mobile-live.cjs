'use strict';
const puppeteer=require('puppeteer-core');
const widths=[320,360,375,390,430,768,820,1024];
const issues=[];
(async()=>{
 const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-setuid-sandbox','--disable-gpu','--disable-dev-shm-usage']});
 try{
  for(const width of widths){
   const page=await browser.newPage();
   await page.setViewport({width,height:width<=430?780:1024,deviceScaleFactor:2,isMobile:width<=430,hasTouch:width<=430});
   const errors=[];
   page.on('pageerror',e=>errors.push(String(e)));
   const response=await page.goto('https://stannet.space/',{waitUntil:'domcontentloaded',timeout:45000});
   await new Promise(resolve=>setTimeout(resolve,1900));
   const result=await page.evaluate(()=>{
    const rect=s=>{const e=document.querySelector(s);if(!e)return null;const b=e.getBoundingClientRect();const c=getComputedStyle(e);return {x:Math.round(b.left),y:Math.round(b.top),w:Math.round(b.width),h:Math.round(b.height),color:c.color,font:c.fontSize,display:c.display,visible:c.display!=='none'&&c.visibility!=='hidden'&&b.width>0&&b.height>0,scrollW:e.scrollWidth,clientW:e.clientWidth}};
    const sels=['#stannet-canonical-nav','.brand-mark','#stannet-canonical-nav .brand','#stannet-canonical-nav .menu-toggle','#stannet-canonical-nav .site-nav','.home-hero-portrait','.home-hero-copy','.home-hero-split h1','.hero-tech','.hero-knowledge','.gradient-word','.home-hero-actions','.home-project-directory','.directory-filters','.directory-group:not([hidden])','.home-contact-panel','footer'];
    const objects=Object.fromEntries(sels.map(s=>[s,rect(s)]));
    const heading=[...document.querySelectorAll('.home-hero-split h1 span')].map(e=>({text:e.textContent,rect:(()=>{let b=e.getBoundingClientRect();return{left:Math.round(b.left),right:Math.round(b.right),width:Math.round(b.width)}})()}));
    const main=document.querySelector('main');
    const overflow= document.documentElement.scrollWidth-innerWidth;
    const heroBox=rect('.home-hero-split');
    const headerBox=rect('#stannet-canonical-nav');
    const image=document.querySelector('.home-android-glow');
    const interactive=[...document.querySelectorAll('.home-hero-actions a,.home-rail-controls button,.directory-filters button')].map(e=>({name:e.textContent.trim().slice(0,40),w:Math.round(e.getBoundingClientRect().width),h:Math.round(e.getBoundingClientRect().height)}));
    return {viewport:innerWidth,overflow,docW:document.documentElement.scrollWidth,objects,heading,heroBox,headerBox,image:{naturalWidth:image?.naturalWidth,loaded:image?.complete},interactive:interactive.slice(0,17),heroInViewport:heroBox?.h,navCount:document.querySelectorAll('#stannet-canonical-nav .nav-group').length};
   });
   if(response.status()!==200)issues.push('HTTP '+response.status()+' at '+width);
   if(result.overflow>2)issues.push('Horizontal page overflow '+result.overflow+'px at '+width);
   const q=result.objects;
   if(width<=430){
    if(!q['#stannet-canonical-nav .menu-toggle']?.visible)issues.push('Hamburger hidden at '+width);
    if(q['.home-hero-split h1']?.w>width+2)issues.push('Hero title too wide at '+width);
    const menu=q['#stannet-canonical-nav .menu-toggle'],brand=q['#stannet-canonical-nav .brand'];
    if(brand&&menu&&brand.x+brand.w>menu.x+3)issues.push('Logo and hamburger overlap at '+width);
    const hero=q['.home-hero-split h1'];
    if(hero&&hero.x<0)issues.push('Hero text left clipped at '+width);
    for(const row of result.heading){if(row.rect.right>width+2||row.rect.left<0)issues.push('Heading span '+JSON.stringify(row.text)+' clipped at '+width+' x='+row.rect.left+'..'+row.rect.right)}
    for(const o of result.interactive){if(o.h>0&&o.h<42)issues.push('Small tap target '+o.name+' '+o.h+'px at '+width)}
    if(!result.image.loaded||result.image.naturalWidth<100)issues.push('Hero image not loaded at '+width);
   }
   if(errors.length)issues.push('Page errors at '+width+': '+errors.slice(0,3).join(' || '));
   console.log('VIEWPORT '+width+' '+JSON.stringify(result));
   if(width<=430){
    const toggle=await page.$('#stannet-canonical-nav .menu-toggle');
    if(toggle){
      await toggle.click();await new Promise(resolve=>setTimeout(resolve,150));
      const state=await page.evaluate(()=>({expanded:document.querySelector('#stannet-canonical-nav .menu-toggle')?.getAttribute('aria-expanded'),navVisible:getComputedStyle(document.querySelector('#stannet-canonical-nav .site-nav')).display,navBox:(()=>{let e=document.querySelector('#stannet-canonical-nav .site-nav');let r=e.getBoundingClientRect();return{left:r.left,right:r.right,bottom:r.bottom}})()}));
      console.log('MOBILE_MENU '+width+' '+JSON.stringify(state));
      if(state.expanded!=='true'||state.navVisible==='none')issues.push('Menu fails to open at '+width);
      if(state.navBox.right>width+2||state.navBox.left<-1)issues.push('Open menu off-screen at '+width);
      const trigger=await page.$('#stannet-canonical-nav .nav-group .nav-trigger');
      if(trigger){
        await trigger.click();await new Promise(resolve=>setTimeout(resolve,100));
        const drop=await page.evaluate(()=>({expanded:document.querySelector('#stannet-canonical-nav .nav-trigger')?.getAttribute('aria-expanded'),display:getComputedStyle(document.querySelector('#stannet-canonical-nav .nav-group .nav-dropdown')).display}));
        console.log('MOBILE_SUBMENU '+width+' '+JSON.stringify(drop));
        if(drop.expanded!=='true'||drop.display==='none')issues.push('Submenu fails to expand at '+width);
      }
    }
   }
   await page.close();
  }
 }finally{await browser.close()}
 console.log('MOBILE_AUDIT_FINDINGS '+JSON.stringify(issues));
 if(issues.length)process.exitCode=1;
})().catch(e=>{console.error('AUDIT_ERROR '+e.stack);process.exitCode=1});
