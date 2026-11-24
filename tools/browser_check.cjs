// Optional UI smoke checks. Install Playwright or set PLAYWRIGHT_MODULE to its package path.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || 'msedge' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:8765', { waitUntil: 'networkidle' });
  await page.locator('#tax-exact').filter({hasText:'976/976'}).waitFor();
  await page.screenshot({path:'reports/preview.png',fullPage:true});
  await page.getByRole('button',{name:'Tax laboratory'}).click();
  await page.locator('#calculate').click();
  await page.locator('#tax-status').filter({hasText:'Calculated with versioned rules'}).waitFor();
  if (!(await page.locator('#tax-result').innerText()).includes('97,500')) throw Error('Tax result did not match expected INR 97,500');
  await page.locator('#example').selectOption('hra');
  await page.locator('#calculate').click();
  await page.locator('#tax-status').filter({hasText:'Calculated with versioned rules'}).waitFor();
  await page.locator('#example').selectOption('unclear');
  await page.locator('#calculate').click();
  await page.locator('#tax-status').filter({hasText:'More information needed'}).waitFor();
  if (await page.locator('.result-box').count()) throw Error('Ambiguous input returned a tax amount');
  await page.getByRole('button',{name:'Data quality'}).click();
  if (await page.locator('#quality-rows tr').count() !== 12) throw Error('Expected 12 corruption scenarios');
  await page.locator('#family').selectOption('llm');
  if (!(await page.locator('#quality-rows').innerText()).includes('Not measured')) throw Error('Pending LLM must remain visible');
  await page.getByRole('button',{name:'Evidence',exact:false}).click();
  const links = await page.locator('.link-list a').evaluateAll(els=>els.map(el=>el.getAttribute('href')));
  for (const url of links) {
    const response = await page.request.get('http://127.0.0.1:8765'+url);
    if (!response.ok()) throw Error('Broken evidence link: '+url);
  }
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('button',{name:'Overview'}).click();
  const overflow = await page.evaluate(()=>document.documentElement.scrollWidth > window.innerWidth);
  if (overflow) throw Error('Mobile viewport has horizontal overflow');
  await page.screenshot({path:'reports/preview-mobile.png',fullPage:true});
  if (errors.length) throw Error(errors.join('\n'));
  const result = {status:'passed',checks:['overview metrics','salary calculation','HRA calculation','clarification without tax','12 quality checks','pending LLM state','evidence links','mobile layout','no browser exceptions'],browser:'Chromium / '+(process.env.BROWSER_CHANNEL||'msedge')};
  fs.writeFileSync(path.join('artifacts','browser_checks.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result,null,2));
  await browser.close();
})().catch(err=>{console.error(err);process.exit(1)});
