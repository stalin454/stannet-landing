'use strict';
const assert = require('node:assert/strict');
const puppeteer = require('puppeteer-core');

(async () => {
  const base = (process.env.STANNET_ACADEMY_BASE_URL || 'https://academy.stannet.dev').replace(/\/$/, '');
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '/pages/programming-coach.html', { waitUntil: 'networkidle2', timeout: 40000 });
    await page.waitForSelector('#coach-notes', { timeout: 10000 });

    // Focusing from a different tab/window must NOT redraw the currently edited form.
    const notes = page.locator('#coach-notes');
    await notes.fill('Mi código guarda el nombre de StanNet, muestra un mensaje y así puedo verificar la salida en la consola.');
    const noteText = await page.$eval('#coach-notes', element => element.value);
    assert.ok(noteText.startsWith('Mi código guarda'), 'Notes input must accept typing');

    const title = page.locator('#coach-source-title');
    await title.fill('Curso JavaScript personal');
    assert.equal(await page.$eval('#coach-source-title', element => element.value), 'Curso JavaScript personal');

    const before = await page.$eval('#coach-lesson', element => element.childElementCount);
    const radio = await page.$('.coach-question input[type=radio][name=q0][value="1"]');
    assert.ok(radio, 'First quiz question must have a selectable choice');
    await radio.click();
    const result = await page.evaluate(() => {
      const input = document.querySelector('.coach-question input[type=radio][name=q0][value="1"]');
      const appearance = getComputedStyle(input).appearance;
      const row = input.closest('label');
      return {
        selected: input.checked,
        appearance,
        rowBorder: getComputedStyle(row).borderTopColor,
        rowBackground: getComputedStyle(row).backgroundColor,
        value: document.getElementById('coach-notes').value
      };
    });
    assert.equal(result.selected, true, 'Radio choice must become selected after clicking');
    assert.notEqual(result.appearance, 'none', 'Native radios must not be visually hidden');
    assert.ok(result.value.startsWith('Mi código guarda'), 'Selecting a choice must not clear typed notes');
    assert.ok(result.rowBackground !== 'rgba(0, 0, 0, 0)', 'Selected choice must be visibly highlighted');
    assert.ok(before > 1);

    // Use keyboard for second question: Tab focus + space.
    await page.focus('input[name=q1][value="0"]');
    await page.keyboard.press('Space');
    assert.equal(await page.$eval('input[name=q1][value="0"]', el => el.checked), true,
      'Radio selection must work with the keyboard');
    await page.reload({ waitUntil: 'networkidle2' });
    await page.waitForSelector('#coach-notes');
    assert.equal(await page.$eval('input[name=q0][value="1"]', el => el.checked), true,
      'Chosen answer must persist after page reload');
    assert.ok((await page.$eval('#coach-notes', el => el.value)).startsWith('Mi código guarda'),
      'Typed notes must persist after reload');

    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.waitForSelector('#coach-notes');
    await page.locator('#coach-notes').fill('Puedo escribir desde el móvil, ver el texto y conservar mis respuestas en la academia.');
    assert.match(await page.$eval('#coach-notes', el => el.value), /escribir desde el móvil/);
    assert.deepEqual(errors, [], 'There should be no uncaught browser errors');
    console.log('PASS: Academy real-browser inputs, radio highlighting, keyboard, persistence and mobile typing.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
