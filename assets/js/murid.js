/**
 * murid.js - Statistik Publik Data Murid (murid.html)
 * PERLINDUNGAN PRIVASI ANAK: Halaman publik hanya menampilkan statistik agregat,
 * tidak pernah menampilkan identitas, nama, alamat, atau data pribadi murid.
 */
(function () {
  'use strict';

  function loadMuridStats() {
    var host = document.getElementById('murid-public-content');
    if (host) host.innerHTML = TPQUi.renderLoading('Memuat statistik santri TPQ...');

    Promise.all([
      TPQApi.request('public_murid_stats', {}, { useCache: true }),
      TPQApi.request('public_profil', {}, { useCache: true }).catch(function () { return {}; })
    ])
      .then(function (results) {
        var st = results[0] || {};
        TPQUi.applyBrandIdentity(results[1]);
        TPQUi.initPublicFooter(results[1]);

        var esc = TPQUi.escapeHtml;
        var gender = st.by_gender || { L: 0, P: 0 };
        var kelasList = st.by_kelas || [];
        var rtList = st.by_rt || [];

        var kelasRows = kelasList.length > 0
          ? kelasList.map(function (k) {
              return '<tr><td><strong>' + esc(k.kelas) + '</strong></td><td class="text-right">' + TPQUi.formatNumber(k.jumlah) + ' santri</td></tr>';
            }).join('')
          : '<tr><td colspan="2" class="text-center" style="color:var(--text-muted);">Belum ada data kelompok belajar.</td></tr>';

        var rtRows = rtList.length > 0
          ? rtList.map(function (r) {
              return '<tr><td><strong>' + esc(r.rt) + '</strong></td><td class="text-right">' + TPQUi.formatNumber(r.jumlah) + ' santri</td></tr>';
            }).join('')
          : '<tr><td colspan="2" class="text-center" style="color:var(--text-muted);">Belum ada data sebaran wilayah.</td></tr>';

        host.innerHTML =
          '<div class="card" style="background:var(--primary-soft);border-color:var(--primary);margin-bottom:22px;">' +
          '  <strong style="color:var(--primary-dark);">Perlindungan Privasi Anak:</strong> ' +
          '  <span style="font-size:0.9rem;">Demi menjaga privasi dan keamanan data anak, halaman publik hanya menampilkan statistik dan informasi umum kelompok belajar. Data lengkap santri hanya dapat diakses oleh pengurus melalui Dashboard Administrator.</span>' +
          '</div>' +

          '<div class="stats-grid" style="margin-bottom:24px;">' +
          '  <div class="stat-card">' +
          '    <div class="stat-label">Total Santri Aktif</div>' +
          '    <div class="stat-value">' + TPQUi.formatNumber(st.total_aktif) + '</div>' +
          '  </div>' +
          '  <div class="stat-card info">' +
          '    <div class="stat-label">Santri Putra (L)</div>' +
          '    <div class="stat-value">' + TPQUi.formatNumber(gender.L) + '</div>' +
          '  </div>' +
          '  <div class="stat-card gold">' +
          '    <div class="stat-label">Santri Putri (P)</div>' +
          '    <div class="stat-value">' + TPQUi.formatNumber(gender.P) + '</div>' +
          '  </div>' +
          '  <div class="stat-card dark">' +
          '    <div class="stat-label">Jumlah Kelompok / Kelas</div>' +
          '    <div class="stat-value">' + TPQUi.formatNumber(kelasList.length) + '</div>' +
          '  </div>' +
          '</div>' +

          '<div class="grid-2">' +
          '  <div class="card">' +
          '    <div class="card-header"><h2 class="card-title">Sebaran per Kelas / Kelompok Belajar</h2></div>' +
          '    <div class="table-responsive"><table><thead><tr><th>Kelas / Kelompok</th><th class="text-right">Jumlah</th></tr></thead><tbody>' + kelasRows + '</tbody></table></div>' +
          '  </div>' +
          '  <div class="card">' +
          '    <div class="card-header"><h2 class="card-title">Sebaran per Wilayah RT</h2></div>' +
          '    <div class="table-responsive"><table><thead><tr><th>Wilayah RT</th><th class="text-right">Jumlah</th></tr></thead><tbody>' + rtRows + '</tbody></table></div>' +
          '  </div>' +
          '</div>';
      })
      .catch(function (err) {
        TPQUi.initPublicFooter({});
        if (host) host.innerHTML = TPQUi.renderError(err.message, 'window.reloadMuridPage');
      });
  }

  window.reloadMuridPage = loadMuridStats;

  document.addEventListener('DOMContentLoaded', function () {
    TPQUi.initPublicNavbar('murid');
    loadMuridStats();
  });
})();
