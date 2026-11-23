/**
 * profil.js - Halaman Profil Lembaga Publik (profil.html)
 */
(function () {
  'use strict';

  function loadProfil() {
    var host = document.getElementById('profil-content');
    if (host) host.innerHTML = TPQUi.renderLoading('Memuat profil lembaga...');

    TPQApi.request('public_profil', {}, { useCache: true })
      .then(function (p) {
        p = p || {};
        var esc = TPQUi.escapeHtml;
        TPQUi.applyBrandIdentity(p);
        TPQUi.initPublicFooter(p);

        var misiHtml = String(p.misi || '').split(/\n+/).filter(Boolean).map(function (m) {
          return '<li style="margin-bottom:8px;">' + esc(m.replace(/^\d+\.\s*/, '')) + '</li>';
        }).join('');

        var progHtml = String(p.program_pendidikan || '').split(/\n+/).filter(Boolean).map(function (pr) {
          return '<div class="card" style="padding:14px;border-left:3px solid var(--primary);"><strong>' + esc(pr.replace(/^\d+\.\s*/, '')) + '</strong></div>';
        }).join('');

        var dokList = Array.isArray(p.dokumentasi) ? p.dokumentasi : [];
        var dokHtml = dokList.length > 0
          ? '<div class="grid-3">' + dokList.map(function (d) {
              return (
                '<div class="card" style="padding:10px;">' +
                '  <img src="' + esc(d.url || '') + '" alt="' + esc(d.caption || '') + '" loading="lazy" style="width:100%;height:190px;object-fit:cover;border-radius:8px;">' +
                '  <div style="font-size:0.84rem;margin-top:8px;color:var(--text-muted);">' + esc(d.caption || 'Dokumentasi') + '</div>' +
                '</div>'
              );
            }).join('') + '</div>'
          : TPQUi.renderEmpty('Belum ada dokumentasi kegiatan', 'Galeri kegiatan akan muncul setelah diunggah oleh admin.');

        host.innerHTML =
          '<div class="grid-2" style="margin-bottom:24px;">' +
          '  <div class="card">' +
          '    <div class="card-header"><h2 class="card-title">Identitas Lembaga</h2></div>' +
          '    <table><tbody>' +
          '      <tr><td style="width:40%;color:var(--text-muted);">Nama Lembaga</td><td><strong>' + esc(p.nama_lembaga || 'TPQ Nurul Huda') + '</strong></td></tr>' +
          '      <tr><td style="color:var(--text-muted);">Tahun Berdiri</td><td>' + esc(p.tahun_berdiri || '-') + '</td></tr>' +
          '      <tr><td style="color:var(--text-muted);">Nomor Izin Operasional</td><td>' + esc(p.nomor_izin || '-') + '</td></tr>' +
          '      <tr><td style="color:var(--text-muted);">Kepala TPQ</td><td>' + esc(p.nama_kepala || '-') + '</td></tr>' +
          '      <tr><td style="color:var(--text-muted);">Alamat</td><td>' + esc(p.alamat || '-') + '</td></tr>' +
          '      <tr><td style="color:var(--text-muted);">Kontak</td><td>' + esc(p.kontak_telp || '-') + (p.kontak_email ? ' • ' + esc(p.kontak_email) : '') + '</td></tr>' +
          '    </tbody></table>' +
          '  </div>' +
          '  <div class="card">' +
          '    <div class="card-header"><h2 class="card-title">Sejarah Singkat</h2></div>' +
          '    <p style="margin:0;white-space:pre-line;color:var(--text);">' + esc(p.sejarah || 'Informasi sejarah lembaga belum diisi.') + '</p>' +
          '  </div>' +
          '</div>' +

          '<div class="grid-2" style="margin-bottom:24px;">' +
          '  <div class="card" style="border-top:3px solid var(--gold);">' +
          '    <div class="card-header"><h2 class="card-title">Visi</h2></div>' +
          '    <p style="margin:0;font-size:1.05rem;font-weight:600;color:var(--primary-dark);">' + esc(p.visi || '-') + '</p>' +
          '  </div>' +
          '  <div class="card" style="border-top:3px solid var(--primary);">' +
          '    <div class="card-header"><h2 class="card-title">Misi</h2></div>' +
          '    <ul style="margin:0;padding-left:18px;">' + (misiHtml || '<li>-</li>') + '</ul>' +
          '  </div>' +
          '</div>' +

          '<div class="card" style="margin-bottom:24px;">' +
          '  <div class="card-header"><h2 class="card-title">Program Pendidikan</h2></div>' +
          '  <div class="grid-2">' + (progHtml || TPQUi.renderEmpty('Program belum diisi', '')) + '</div>' +
          '</div>' +

          '<div class="card">' +
          '  <div class="card-header"><h2 class="card-title">Dokumentasi Kegiatan</h2></div>' +
          dokHtml +
          '</div>';
      })
      .catch(function (err) {
        TPQUi.initPublicFooter({});
        if (host) host.innerHTML = TPQUi.renderError(err.message, 'window.reloadProfilPage');
      });
  }

  window.reloadProfilPage = loadProfil;

  document.addEventListener('DOMContentLoaded', function () {
    TPQUi.initPublicNavbar('profil');
    loadProfil();
  });
})();
