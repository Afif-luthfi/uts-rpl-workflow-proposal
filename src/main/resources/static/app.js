const $ = (id) => document.getElementById(id);
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date = (value) => value ? new Date(value).toLocaleString('id-ID', {dateStyle:'medium', timeStyle:'short'}) : 'Menunggu';
let currentId;
let routeVersion = 0;
function notify(message, error = false) { $('message').textContent = message; $('message').className = error ? 'error' : ''; $('message').hidden = false; }
async function api(url, body) {
  const response = await fetch(url, body ? {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)} : {});
  const data = await response.json();
  if (!response.ok) throw new Error([data.message || 'Permintaan gagal.', ...(data.errors || [])].join('\n'));
  return data;
}
function safeLink(value) { try { const url = new URL(value); return ['http:','https:'].includes(url.protocol) ? escapeHtml(url.href) : '#'; } catch { return '#'; } }
async function loadList() {
  $('list').textContent = 'Memuat daftar proposal...';
  const entries = await api('/api/proposals');
  $('message').hidden = true;
  const role = $('role').value;
  const filtered = entries.filter(p => role === 'SEMUA' || p.tugas.some(t => t.peran === role));
  if (!filtered.length) { $('list').innerHTML = `<div class="empty"><h2>${entries.length ? 'Tidak ada tugas untuk peran ini' : 'Belum ada pengajuan'}</h2><p>${entries.length ? 'Pilih Semua peran untuk melihat pengajuan lain.' : 'Pilih Ajukan proposal untuk memulai pemeriksaan pertama.'}</p></div>`; return; }
  $('list').innerHTML = `<div class="table-wrap"><table><thead><tr><th>Nomor / mahasiswa</th><th>Judul proposal</th><th>Tahap pemeriksaan</th><th>Tindakan</th></tr></thead><tbody>${filtered.map(p => `<tr><td><strong>${escapeHtml(p.nomor)}</strong><small>${escapeHtml(p.data.nama)}<br>${escapeHtml(p.data.nim)}</small></td><td>${escapeHtml(p.data.judul)}<small>Versi ${escapeHtml(p.data.versi)} · ${date(p.mulai)}</small></td><td class="status">${escapeHtml(p.status)}</td><td><a href="#proposal/${p.id}">Buka detail</a></td></tr>`).join('')}</tbody></table></div>`;
}
function renderDetail(p) {
  const d = p.data, task = p.tugas[0];
  $('detail-view').innerHTML = `<a class="back" href="#daftar">Kembali ke daftar</a><h1>${escapeHtml(d.judul)}</h1><p>${escapeHtml(p.nomor)} · Versi ${escapeHtml(d.versi)} · ${escapeHtml(p.status)}</p>
  <dl class="metadata"><div><dt>Mahasiswa</dt><dd>${escapeHtml(d.nama)} / ${escapeHtml(d.nim)}</dd></div><div><dt>Email</dt><dd>${escapeHtml(d.email)}</dd></div><div><dt>Diajukan</dt><dd>${date(p.mulai)}</dd></div></dl>
  <div class="detail-layout"><div class="paper"><h2>Isi pengajuan</h2><p class="summary">${escapeHtml(d.ringkasan)}</p><a href="${safeLink(d.tautan)}" target="_blank" rel="noopener noreferrer">Buka dokumen proposal</a>
  ${d.pembimbing ? `<p style="margin-top:20px">Calon pembimbing: <strong>${escapeHtml(d.pembimbing)}</strong></p>` : ''}
  <h2 style="margin-top:32px">Riwayat pemeriksaan</h2><ol class="history">${p.riwayat.map(r => `<li><strong>${escapeHtml(r.nama)}</strong><br><time>${date(r.mulai)} · ${r.selesai ? 'Selesai ' + date(r.selesai) : 'Tugas aktif'}</time>${r.catatan.map(c => `<p>${escapeHtml(c)}</p>`).join('')}</li>`).join('')}</ol></div>
  <div class="paper">${task ? taskForm(task, d) : `<h2>Pengajuan ${d.hasil === 'DISETUJUI' ? 'disetujui' : 'ditolak'}</h2><p>Proses selesai pada ${date(p.selesai)}.</p><div class="result"><strong>Catatan notifikasi</strong><p>${escapeHtml(d.notifikasi)}</p></div>${d.hasil === 'DISETUJUI' ? `<a class="button" href="/api/proposals/${p.id}/draft" target="_blank" rel="noopener">Buka draf pembimbingan</a><small>Draf demonstrasi, bukan surat resmi.</small>` : '<p>Lihat alasan penolakan pada riwayat. Proposal baru dapat diajukan melalui formulir pengajuan.</p>'}`}</div></div>`;
  if (task) {
    const decision = $('decision');
    const update = () => { if ($('supervisor-field')) { $('supervisor-field').hidden = decision.value !== 'SETUJU'; $('supervisor').required = decision.value === 'SETUJU'; } };
    decision.addEventListener('change', update); update();
    $('task-form').addEventListener('submit', async event => {
      event.preventDefault(); const button = event.submitter; button.disabled = true; button.textContent = 'Menyimpan keputusan...';
      try { const data = Object.fromEntries(new FormData(event.target)); renderDetail(await api(`/api/tasks/${task.id}/complete`, data)); notify('Keputusan tersimpan. Tahap pemeriksaan sudah diperbarui.'); }
      catch (error) { notify(error.message, true); button.disabled = false; button.textContent = 'Simpan keputusan'; }
    });
  }
}
function taskForm(task, d) {
  const revision = task.key === 'revisi';
  return `<h2>${escapeHtml(task.nama)}</h2><p>Jalankan tugas sebagai <strong>${escapeHtml(task.peran)}</strong> dalam simulasi ini.</p><form id="task-form"><input type="hidden" name="peran" value="${escapeHtml(task.peran)}"><label>Keputusan<select id="decision" name="keputusan">${revision ? '<option value="KIRIM_ULANG">Kirim ulang proposal</option>' : `<option value="SETUJU">${task.key === 'review' ? 'Layak dan bersedia membimbing' : 'Setujui / lanjutkan'}</option>${task.key !== 'persetujuan' ? '<option value="REVISI">Minta revisi</option>' : ''}<option value="TOLAK">Tolak proposal</option>`}</select></label>
  ${task.key === 'review' ? '<label id="supervisor-field">Nama calon pembimbing<input id="supervisor" name="pembimbing" maxlength="100"></label>' : ''}
  ${revision ? `<label>Judul revisi<input name="judul" required minlength="10" maxlength="200" value="${escapeHtml(d.judul)}"></label><label>Ringkasan revisi<textarea name="ringkasan" required minlength="20" maxlength="3000" rows="5">${escapeHtml(d.ringkasan)}</textarea></label><label>Tautan dokumen revisi<input name="tautan" type="url" required maxlength="500" value="${escapeHtml(d.tautan)}"></label>` : ''}
  <label>Catatan pemeriksaan<textarea name="catatan" required maxlength="2000" rows="4"></textarea></label><button type="submit">Simpan keputusan</button></form>`;
}
async function route() {
  const version = ++routeVersion;
  $('message').hidden = true;
  const hash = location.hash || '#daftar';
  ['list-view','create-view','detail-view'].forEach(id => $(id).hidden = true);
  try {
    if (hash === '#ajukan') { $('create-view').hidden = false; }
    else if (hash.startsWith('#proposal/')) {
      currentId = hash.substring(10); $('detail-view').hidden = false; $('detail-view').textContent = 'Memuat detail pengajuan...';
      const p = await api(`/api/proposals/${encodeURIComponent(currentId)}`); if (version === routeVersion) renderDetail(p);
    } else { $('list-view').hidden = false; await loadList(); }
  } catch (error) { notify(error.message + '\nPeriksa apakah server aktif, lalu muat ulang halaman.', true); }
}
$('create-form').addEventListener('submit', async event => {
  event.preventDefault(); const button = event.submitter; button.disabled = true; button.textContent = 'Mengirim pengajuan...';
  try { const p = await api('/api/proposals', Object.fromEntries(new FormData(event.target))); event.target.reset(); location.hash = `#proposal/${p.id}`; }
  catch (error) { notify(error.message, true); }
  finally { button.disabled = false; button.textContent = 'Kirim pengajuan'; }
});
$('role').addEventListener('change', () => loadList().catch(e => notify(e.message, true)));
$('reload').addEventListener('click', () => loadList().catch(e => notify(e.message, true)));
window.addEventListener('hashchange', route);
route();
