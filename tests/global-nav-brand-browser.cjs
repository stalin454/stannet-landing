'use strict';
const assert = require('node:assert/strict');
const puppeteer = require('puppeteer-core');

const base = process.env.STANNET_AUDIT_URL || 'http://127.0.0.1:8765/';
const paths = ['/', '/pages/ruta-dinamarca.html', '/pages/ett-dinamarca.html', '/pages/english.html', '/pages/programming.html', '/pages/radio.html', '/pages/cybersecurity.html'];
const widths = [360, 393, 1280];
const expected = {
  bg: 'rgba(10, 10, 12, 0.97)',
  stan: 'rgb(255, 255, 255)',
  net: 'rgb(83, 229, 245)',
  space: 'rgb(186, 140, 255)',
  mark: '/assets/brand/stannet-sn-cutout-20261005.png',
  dropdown: 'rgb(24, 24, 27)',
  mobile: 'rgb(21, 21, 24)'
};

(async () => {
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
  });
  try {
    for (const width of widths) for (const path of paths) {
      const page = await browser.newPage();
      try {
        await page.setViewport({width,height:850});
        const response = await page.goto(new URL(path,base).href,{waitUntil:'domcontentloaded',timeout:45000});
        assert.ok([200,304].includes(response.status()),path+' HTTP status '+response.status());
        await page.waitForSelector('#stannet-canonical-nav .brand-mark',{timeout:15000});
        await page.waitForFunction(() => document.querySelector('#stannet-canonical-nav .brand-mark')?.naturalWidth > 0,{timeout:12000});
        const state = await page.evaluate(() => {
          const header = document.querySelector('#stannet-canonical-nav');
          const $ = s => header.querySelector(s);
          const color = e => getComputedStyle(e).color;
          const box = e => {const r=e.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width}};
          return {
            headers: document.querySelectorAll('#stannet-canonical-nav').length,
            bg:getComputedStyle(header).backgroundColor,
            stan:color($('.brand-stan')),net:color($('.brand-net')),space:color($('.brand>i')),
            logo:new URL($('.brand-mark').src).pathname,logoLoaded:$('.brand-mark').naturalWidth>0,
            brandBox:box($('.brand')),menuBox:box($('.menu-toggle')),
            menuDisplay:getComputedStyle($('.menu-toggle')).display
          };
        });
        assert.equal(state.headers,1,path+' duplicate global header');
        for (const key of ['bg','stan','net','space']) assert.equal(state[key],expected[key],path+' '+width+' '+key);
        assert.equal(state.logo,expected.mark,path+' official mark');
        assert.ok(state.logoLoaded,path+' logo failed to load');
        if(width<=850){
          assert.notEqual(state.menuDisplay,'none',path+' mobile hamburger');
          assert.ok(state.brandBox.right<=state.menuBox.left+3,path+' logo overlaps hamburger at '+width);
          await page.click('#stannet-canonical-nav .menu-toggle');
          const mobileBg=await page.$eval('#stannet-canonical-nav .site-nav',e=>getComputedStyle(e).backgroundColor);
          assert.equal(mobileBg,expected.mobile,path+' mobile menu');
        }
        await page.click('#stannet-canonical-nav .nav-group[data-group="/pages/guitar"] .nav-trigger');
        const dropdown=await page.evaluate(()=>{
          const group=document.querySelector('#stannet-canonical-nav .nav-group[data-group="/pages/guitar"]');
          return {expanded:group.querySelector('button').getAttribute('aria-expanded'),
            bg:getComputedStyle(group.querySelector('.nav-dropdown')).backgroundColor,
            radio:group.querySelector('a[href="/pages/radio.html"]')?.textContent.trim()};
        });
        assert.equal(dropdown.expanded,'true',path+' music dropdown does not open');
        assert.equal(dropdown.bg,expected.dropdown,path+' dropdown background');
        assert.equal(dropdown.radio,'StanNet Radio',path+' radio link');
        console.log('PASS nav match: '+path+' @ '+width+'px');
      } finally {await page.close()}
    }
  } finally {await browser.close()}
})().catch(error=>{console.error(error.stack||error);process.exitCode=1});
