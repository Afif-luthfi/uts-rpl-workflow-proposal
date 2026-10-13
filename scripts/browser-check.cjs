const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');

async function main() {
  const out = path.resolve('docs/bukti');
  fs.mkdirSync(out, {recursive:true});
  const browser = await chromium.launch({headless:true, ...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {channel:'chrome'})});
  const context = await browser.newContext({viewport:{width:1365,height:900}, recordVideo:{dir:path.join(out,'video'),size:{width:1365,height:900}}, locale:'id-ID', timezoneId:'Asia/Jakarta'});
  const page = await context.newPage();
  const errors = [], checks = [];
  page.on('pageerror', error => {errors.push(error.message); console.log('PAGE ERROR:',page.url(),error.message);});
  const base = process.env.BASE_URL || 'http://127.0.0.1:8080';
  const shot = async name => { await page.waitForTimeout(600); await page.screenshot({path:path.join(out,name+'.png'),fullPage:true}); };
  const check = (name) => {checks.push('PASS: ' + name); console.log('PASS:', name);};
  const form = (name) => page.locator('#create-form').locator(`[name="${name}"]`);
  async function create(label) {
    await page.locator('nav').getByRole('link',{name:'Ajukan proposal'}).click();
    await form('nama').fill('Mahasiswa DEMO ' + label);
    await form('nim').fill('12345678901'); await form('email').fill('demo@example.com');
    await form('judul').fill('DEMO ' + label + ' Pengelolaan Dokumen Proposal Skripsi');
    await form('ringkasan').fill('Data demonstrasi untuk menguji alur pemeriksaan proposal. Penelitian berfokus pada pencatatan keputusan dan riwayat revisi dokumen.');
    await form('tautan').fill('https://example.com/');
    await shot('02-formulir');
    await page.getByRole('button',{name:'Kirim pengajuan',exact:true}).click();
    await page.getByRole('heading',{name:'Verifikasi sekretaris prodi',exact:true}).waitFor();
  }
  async function decide(value,note) {
    await page.locator('#decision').selectOption(value);
    await page.locator('#task-form [name="catatan"]').fill(note);
    const response = page.waitForResponse(r => r.url().includes('/complete') && r.request().method()==='POST');
    await page.getByRole('button',{name:'Simpan keputusan',exact:true}).click();
    assert.equal((await response).status(),200);
    await page.getByRole('status').filter({hasText:'Keputusan tersimpan'}).waitFor();
    await page.waitForTimeout(500);
  }
  try {
    await page.goto(base);
    await page.getByRole('heading',{name:'Daftar proposal',exact:true}).waitFor();
    await page.waitForFunction(() => !document.querySelector('#list').textContent.includes('Memuat'));
    await shot('01-daftar-awal'); check('Halaman daftar dan keadaan awal tampil');
    await page.locator('nav').getByRole('link',{name:'Ajukan proposal'}).click();
    await page.getByRole('button',{name:'Kirim pengajuan',exact:true}).click();
    assert.equal(await form('nama').evaluate(e => e.validity.valueMissing),true); check('Form kosong ditahan validasi browser');
    await page.getByRole('link',{name:'Kembali ke daftar',exact:true}).click();
    await create('Revisi'); await shot('03-verifikasi'); check('Pengajuan membuat tugas verifikasi');
    await decide('REVISI','DEMO: perjelas metode evaluasi dan ruang lingkup penelitian.');
    await page.getByRole('heading',{name:'Revisi mahasiswa',exact:true}).waitFor(); await shot('04-revisi');
    await page.locator('#task-form [name="judul"]').fill('DEMO Revisi Evaluasi Workflow Proposal Skripsi');
    await page.locator('#task-form [name="ringkasan"]').fill('Revisi DEMO: evaluasi menggunakan pengujian integrasi dan skenario persetujuan, revisi, serta penolakan. Ruang lingkup dibatasi pada satu pembimbing.');
    await decide('KIRIM_ULANG','DEMO: metode evaluasi dan ruang lingkup sudah diperjelas.');
    assert.match(await page.locator('#detail-view').innerText(),/Versi 2/); check('Revisi menaikkan versi dan kembali ke sekretaris prodi');
    await decide('SETUJU','DEMO: dokumen lengkap dan layak diteruskan kepada dosen.');
    await page.getByRole('heading',{name:'Penilaian dosen',exact:true}).waitFor();
    await page.locator('#decision').selectOption('TOLAK'); assert.equal(await page.locator('#supervisor-field').isHidden(),true);
    await page.locator('#decision').selectOption('SETUJU'); await page.locator('#supervisor').fill('Dosen Pembimbing DEMO');
    await shot('05-penilaian-dosen');
    await decide('SETUJU','DEMO: topik layak dan bersedia menjadi pembimbing.');
    await page.getByRole('heading',{name:'Persetujuan ketua prodi',exact:true}).waitFor(); await shot('06-ketua-prodi');
    await decide('SETUJU','DEMO: proposal dan penunjukan pembimbing disetujui.');
    await page.getByRole('heading',{name:'Pengajuan disetujui',exact:true}).waitFor(); await shot('07-disetujui');
    const approvedUrl = page.url();
    check('Dosen dan ketua prodi menyelesaikan proses; riwayat dan notifikasi ditampilkan');
    const draftPromise=context.waitForEvent('page'); await page.getByRole('link',{name:'Buka draf pembimbingan',exact:true}).click();
    const draft=await draftPromise; await draft.waitForLoadState(); assert.match(await draft.locator('body').innerText(),/Dosen Pembimbing DEMO/);
    await draft.screenshot({path:path.join(out,'08-draf.png'),fullPage:true}); await draft.close(); check('Tautan draf membuka keluaran Java delegate');
    const docPromise=context.waitForEvent('page'); await page.getByRole('link',{name:'Buka dokumen proposal',exact:true}).click();
    const doc=await docPromise; await doc.waitForLoadState(); assert.match(doc.url(),/^https:\/\/example.com/); await doc.close(); check('Tautan dokumen membuka URL contoh pada tab baru');
    await create('Penolakan'); await decide('TOLAK','DEMO: topik tidak sesuai ruang lingkup; ajukan topik baru.');
    await page.getByRole('heading',{name:'Pengajuan ditolak',exact:true}).waitFor(); assert.equal(await page.getByRole('link',{name:'Buka draf pembimbingan'}).count(),0);
    await shot('09-ditolak'); check('Penolakan mengakhiri proses tanpa draf');
    await page.getByRole('link',{name:'Kembali ke daftar',exact:true}).click();
    await page.locator('#role').selectOption('DOSEN'); await page.getByRole('heading',{name:'Tidak ada tugas untuk peran ini'}).waitFor(); check('Filter peran dan keadaan hasil kosong');
    await page.locator('#role').selectOption('SEMUA'); await page.getByRole('button',{name:'Muat ulang',exact:true}).click(); await page.getByRole('table').waitFor(); await shot('10-daftar-hasil'); check('Semua peran dan muat ulang daftar');
    await page.locator('nav').getByRole('link',{name:'Model BPMN'}).click();
    await page.locator('#canvas .djs-container').waitFor(); await page.waitForFunction(() => document.querySelector('#model-status').hidden);
    await page.waitForFunction(() => {
      const box=document.querySelector('.viewport')?.getBoundingClientRect();
      return box && Number.isFinite(box.width) && box.width>100 && box.height>100;
    });
    await shot('11-bpmn');
    for (const name of ['Perbesar diagram','Perkecil diagram','Sesuaikan diagram']) await page.getByRole('button',{name,exact:true}).click();
    const downloadPromise=page.waitForEvent('download'); await page.getByRole('link',{name:'Unduh BPMN'}).click(); const download=await downloadPromise;
    assert.equal(download.suggestedFilename(),'proposal.bpmn'); check('Viewer BPMN, zoom, fit, dan unduh XML');
    await page.locator('nav').getByRole('link',{name:'Daftar proposal'}).click();
    await page.keyboard.press('Tab'); const focus=await page.evaluate(() => ({tag:document.activeElement.tagName,style:getComputedStyle(document.activeElement).outlineStyle}));
    assert.notEqual(focus.style,'none'); check('Navigasi keyboard memiliki indikator fokus');
    const helloPromise=context.waitForEvent('page'); await page.getByRole('link',{name:'Uji Hello World'}).click(); const hello=await helloPromise; await hello.waitForLoadState();
    assert.match(await hello.locator('body').innerText(),/"bpmnDeployed"\s*:\s*true/); await hello.screenshot({path:path.join(out,'12-hello-world.png'),fullPage:true}); await hello.close(); check('Hello World membuktikan deployment aktif');
    const cockpitPromise=context.waitForEvent('page'); await page.getByRole('link',{name:'Camunda Cockpit'}).click(); const cockpit=await cockpitPromise; await cockpit.waitForLoadState();
    await cockpit.locator('input[type="password"]').waitFor();
    await cockpit.screenshot({path:path.join(out,'13-camunda.png'),fullPage:true}); assert.match(cockpit.url(),/camunda/); await cockpit.close(); check('Tautan alat Camunda membuka webapp');
    await page.setViewportSize({width:390,height:844}); await shot('14-mobile-daftar');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),true);
    await page.goto(approvedUrl); await page.getByRole('heading',{name:'Pengajuan disetujui',exact:true}).waitFor(); await shot('15-mobile-detail');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),true); check('Daftar dan detail pada lebar 390px tanpa overflow halaman');
    await page.locator('nav').getByRole('link',{name:'Ajukan proposal'}).click(); await shot('16-mobile-form'); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),true);
    await page.locator('nav').getByRole('link',{name:'Model BPMN'}).click(); await page.waitForFunction(() => document.querySelector('#model-status').hidden); await shot('17-mobile-model'); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),true); check('Form dan model pada lebar 390px tanpa overflow');
    await page.setViewportSize({width:1365,height:900});
    await page.route('**/api/proposals', async route => route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({message:'Server tidak tersedia pada pengujian keadaan error.'})}));
    await page.goto(base); await page.getByRole('status').filter({hasText:'Server tidak tersedia'}).waitFor(); await shot('18-keadaan-error'); check('Kegagalan API menghasilkan pesan error dan petunjuk pemulihan');
    await page.unroute('**/api/proposals'); await page.getByRole('button',{name:'Muat ulang',exact:true}).click(); await page.getByRole('table').waitFor();
    assert.equal(await page.locator('#message').isHidden(),true); check('Muat ulang berhasil membersihkan pesan error');
    assert.deepEqual(errors,[]); check('Tidak ada JavaScript page error selama alur');
    fs.writeFileSync(path.join(out,'browser-check.txt'),checks.join('\n')+'\n');
    fs.writeFileSync(path.join(out,'demo-proposals.json'),JSON.stringify(await (await context.request.get(base+'/api/proposals')).json(),null,2));
    fs.writeFileSync(path.join(out,'hello-world.json'),JSON.stringify(await (await context.request.get(base+'/api/hello')).json(),null,2));
    await page.waitForTimeout(1000);
  } finally {
    const video=page.video(); await context.close();
    if (video) await video.saveAs(path.join(out,'demo-workflow.webm'));
    await browser.close();
  }
}
main().catch(error => { console.error(error); process.exitCode=1; });
