/**
 * donasi.js - Dashboard Transparansi Donasi Publik (donasi.html)
 * Catatan Privasi & Etika:
 * - Menampilkan total sukarela, total insidental, total gabungan, pencapaian target tahunan,
 *   rekap per RT, dan grafik perkembangan donasi.
 * - TIDAK menampilkan nama/nominal individual warga tanpa persetujuan dan TIDAK menampilkan tunggakan.
 */
(function () {
  'use strict';

  var currentYear = '';
  var lastPublicData = null;

  function loadDonasiPublic(tahun) {
    var host = document.getElementById('donasi-public-content');
    if (host) host.innerHTML = TPQUi.renderLoading('Memuat dashboard transparansi donasi...');

    Promise.all([
      TPQApi.request('public_donasi', tahun ? { tahun: tahun } : {}, { useCache: true }),
      TPQApi.request('public_profil', {}, { useCache: true }).catch(function () { return {}; })
    ])
      .then(function (results) {
        var data = results[0] || {};
        lastPublicData = data;
        TPQUi.applyBrandIdentity(results[1]);
        TPQUi.initPublicFooter(results[1]);

        currentYear = String(data.tahun || new Date().getFullYear());
        var sk = data.ringkasan_sukarela || {};
        var ins = data.ringkasan_insidental || {};
        var rtList = data.rekap_rt || [];
        var years = data.available_years || [Number(currentYear)];
        var esc = TPQUi.escapeHtml;

        // Populate year selector
        var yearSel = document.getElementById('public-donasi-year');
        if (yearSel) {
          yearSel.innerHTML = years.map(function (y) {
            return '<option value="' + y + '"' + (String(y) === currentYear ? ' selected' : '') + '>Tahun ' + y + '</option>';
          }).join('');
        }

        var pct = Math.min(100, Number(sk.persentase_target_tahunan) || 0);

        var rtRows = rtList.length > 0
          ? rtList.map(function (r) {
              return (
                '<tr>' +
                '  <td><strong>' + esc(r.nomor_rt) + '</strong>' + (r.nama_wilayah ? '<br><small style="color:var(--text-muted);">' + esc(r.nama_wilayah) + '</small>' : '') + '</td>' +
                '  <td class="text-center">' + TPQUi.formatNumber(r.jumlah_warga) + '</td>' +
                '  <td class="text-center">' + TPQUi.formatNumber(r.peserta_target_tahunan) + '</td>' +
                '  <td class="text-center">' + TPQUi.formatNumber(r.peserta_kesanggupan_bulanan) + '</td>' +
                '  <td class="text-center">' + TPQUi.formatNumber(r.peserta_donasi_bebas) + '</td>' +
                '  <td class="text-right">' + TPQUi.formatRupiah(r.total_sukarela) + '</td>' +
                '  <td class="text-right">' + TPQUi.formatRupiah(r.total_insidental) + '</td>' +
                '  <td class="text-right"><strong>' + TPQUi.formatRupiah(r.total_keseluruhan) + '</strong></td>' +
                '</tr>'
              );
            }).join('')
          : '<tr><td colspan="8" class="text-center" style="color:var(--text-muted);">Belum ada data wilayah RT.</td></tr>';

        var tujuanRows = (ins.by_tujuan && ins.by_tujuan.length > 0)
          ? ins.by_tujuan.map(function (t) {
              return '<tr><td>' + esc(t.tujuan) + '</td><td class="text-right"><strong>' + TPQUi.formatRupiah(t.total) + '</strong></td></tr>';
            }).join('')
          : '<tr><td colspan="2" class="text-center" style="color:var(--text-muted);">Belum ada donasi insidental tercatat.</td></tr>';

        host.innerHTML =
          '<div class="stats-grid-3" style="margin-bottom:22px;">' +
          '  <div class="stat-card">' +
          '    <div class="stat-label">Total Donasi Sukarela (' + esc(currentYear) + ')</div>' +
          '    <div class="stat-value">' + TPQUi.formatRupiah(sk.total_keseluruhan_sukarela) + '</div>' +
          '    <div class="stat-sub">' + TPQUi.formatNumber(sk.jumlah_transaksi_sukarela) + ' transaksi partisipasi warga</div>' +
          '  </div>' +
          '  <div class="stat-card gold">' +
          '    <div class="stat-label">Total Donasi Insidental (' + esc(currentYear) + ')</div>' +
          '    <div class="stat-value">' + TPQUi.formatRupiah(ins.total_donasi_insidental) + '</div>' +
          '    <div class="stat-sub">' + TPQUi.formatNumber(ins.jumlah_transaksi) + ' transaksi spontan / bantuan</div>' +
          '  </div>' +
          '  <div class="stat-card dark">' +
          '    <div class="stat-label">Total Gabungan Donasi</div>' +
          '    <div class="stat-value">' + TPQUi.formatRupiah(data.total_gabungan) + '</div>' +
          '    <div class="stat-sub">Terverifikasi dari seluruh transaksi sah</div>' +
          '  </div>' +
          '</div>' +

          // Breakdown 3 Pola Sukarela
          '<div class="card" style="margin-bottom:22px;">' +
          '  <div class="card-header"><h2 class="card-title">Ringkasan Partisipasi Donasi Sukarela (3 Pola)</h2></div>' +
          '  <div class="grid-3">' +
          '    <div style="padding:14px;background:var(--bg);border-radius:10px;border:1px solid var(--border);">' +
          '      <div class="badge badge-info" style="margin-bottom:8px;">Pola 1: Target Tahunan</div>' +
          '      <div style="font-size:0.84rem;color:var(--text-muted);">Total Target: <strong>' + TPQUi.formatRupiah(sk.total_target_tahunan) + '</strong></div>' +
          '      <div style="font-size:0.84rem;color:var(--text-muted);">Realisasi: <strong style="color:var(--primary-dark);">' + TPQUi.formatRupiah(sk.total_realisasi_target_tahunan) + '</strong></div>' +
          '      <div style="font-size:0.84rem;color:var(--text-muted);margin-bottom:8px;">Sisa Acuan Target: ' + TPQUi.formatRupiah(sk.sisa_target_tahunan) + '</div>' +
          '      <div class="progress-wrap"><div class="progress-bar" style="width:' + pct + '%"></div></div>' +
          '      <div style="font-size:0.78rem;margin-top:4px;font-weight:700;color:var(--primary-dark);">Pencapaian: ' + pct + '%</div>' +
          '    </div>' +
          '    <div style="padding:14px;background:var(--bg);border-radius:10px;border:1px solid var(--border);">' +
          '      <div class="badge badge-gold" style="margin-bottom:8px;">Pola 2: Kesanggupan Bulanan</div>' +
          '      <div style="font-size:0.84rem;color:var(--text-muted);">Acuan Bulanan Warga: <strong>' + TPQUi.formatRupiah(sk.total_kesanggupan_bulanan) + '/bln</strong></div>' +
          '      <div style="font-size:1.15rem;font-weight:800;color:var(--primary-dark);margin:8px 0;">' + TPQUi.formatRupiah(sk.total_realisasi_bulanan) + '</div>' +
          '      <div style="font-size:0.78rem;color:var(--text-muted);">Total realisasi partisipasi bulanan (bukan tagihan/utang).</div>' +
          '    </div>' +
          '    <div style="padding:14px;background:var(--bg);border-radius:10px;border:1px solid var(--border);">' +
          '      <div class="badge badge-neutral" style="margin-bottom:8px;">Pola 3: Donasi Bebas</div>' +
          '      <div style="font-size:0.84rem;color:var(--text-muted);">Partisipasi sesuai kemampuan</div>' +
          '      <div style="font-size:1.15rem;font-weight:800;color:var(--primary-dark);margin:8px 0;">' + TPQUi.formatRupiah(sk.total_donasi_bebas) + '</div>' +
          '      <div style="font-size:0.78rem;color:var(--text-muted);">Total seluruh transaksi donasi bebas tahun ' + esc(currentYear) + '.</div>' +
          '    </div>' +
          '  </div>' +
          '</div>' +

          // Grafik & Tujuan Insidental
          '<div class="grid-2" style="margin-bottom:22px;">' +
          '  <div class="card">' +
          '    <div class="card-header"><h2 class="card-title">Grafik Perkembangan Donasi per Periode</h2></div>' +
          '    <div id="public-donasi-chart"></div>' +
          '  </div>' +
          '  <div class="card">' +
          '    <div class="card-header"><h2 class="card-title">Donasi Insidental Berdasarkan Tujuan</h2></div>' +
          '    <div class="table-responsive"><table><thead><tr><th>Tujuan Donasi</th><th class="text-right">Total</th></tr></thead><tbody>' + tujuanRows + '</tbody></table></div>' +
          '  </div>' +
          '</div>' +

          // Rekap Per Wilayah RT
          '<div class="card">' +
          '  <div class="card-header"><h2 class="card-title">Rekapitulasi Transparansi per Wilayah RT</h2></div>' +
          '  <div class="table-responsive">' +
          '    <table>' +
          '      <thead>' +
          '        <tr>' +
          '          <th>Wilayah RT</th>' +
          '          <th class="text-center">Warga</th>' +
          '          <th class="text-center">Target Thn</th>' +
          '          <th class="text-center">Kesanggupan Bln</th>' +
          '          <th class="text-center">Bebas</th>' +
          '          <th class="text-right">Donasi Sukarela</th>' +
          '          <th class="text-right">Donasi Insidental</th>' +
          '          <th class="text-right">Total Keseluruhan</th>' +
          '        </tr>' +
          '      </thead>' +
          '      <tbody>' + rtRows + '</tbody>' +
          '    </table>' +
          '  </div>' +
          '  <p style="margin:12px 0 0;font-size:0.8rem;color:var(--text-muted);">Catatan: Demi menjaga adab dan privasi masyarakat, identitas dan nominal donasi perorangan tidak ditampilkan secara terbuka pada halaman publik.</p>' +
          '</div>';

        TPQUi.renderLightweightBarChart(document.getElementById('public-donasi-chart'), data.chart_periode || []);
      })
      .catch(function (err) {
        TPQUi.initPublicFooter({});
        if (host) host.innerHTML = TPQUi.renderError(err.message, 'window.reloadDonasiPage');
      });
  }

  window.reloadDonasiPage = function () { loadDonasiPublic(currentYear); };

  document.addEventListener('DOMContentLoaded', function () {
    TPQUi.initPublicNavbar('donasi');
    loadDonasiPublic('');

    var yearSel = document.getElementById('public-donasi-year');
    if (yearSel) {
      yearSel.addEventListener('change', function () {
        loadDonasiPublic(yearSel.value);
      });
    }

    var printBtn = document.getElementById('btn-print-public-donasi');
    if (printBtn) {
      printBtn.addEventListener('click', function () {
        if (!lastPublicData) {
          TPQUi.showToast('Data belum selesai dimuat.', 'warning');
          return;
        }
        var d = lastPublicData;
        var sk = d.ringkasan_sukarela || {};
        var ins = d.ringkasan_insidental || {};
        var esc = TPQUi.escapeHtml;
        var rows = (d.rekap_rt || []).map(function (r) {
          return '<tr><td>' + esc(r.nomor_rt) + '</td><td class="text-center">' + r.jumlah_warga + '</td><td class="text-right">' + TPQUi.formatRupiah(r.total_sukarela) + '</td><td class="text-right">' + TPQUi.formatRupiah(r.total_insidental) + '</td><td class="text-right"><strong>' + TPQUi.formatRupiah(r.total_keseluruhan) + '</strong></td></tr>';
        }).join('');
        var html =
          '<div class="report-kop"><div><h2>TPQ NURUL HUDA</h2><p>Laporan Transparansi Donasi Publik Tahun ' + esc(d.tahun) + '</p></div></div>' +
          '<div class="summary-box"><strong>Total Sukarela:</strong> ' + TPQUi.formatRupiah(sk.total_keseluruhan_sukarela) + ' &nbsp;|&nbsp; <strong>Total Insidental:</strong> ' + TPQUi.formatRupiah(ins.total_donasi_insidental) + ' &nbsp;|&nbsp; <strong>Total Gabungan:</strong> ' + TPQUi.formatRupiah(d.total_gabungan) + '</div>' +
          '<table><thead><tr><th>Wilayah RT</th><th class="text-center">Warga</th><th class="text-right">Donasi Sukarela</th><th class="text-right">Donasi Insidental</th><th class="text-right">Total Keseluruhan</th></tr></thead><tbody>' + rows + '</tbody></table>';
        TPQExport.printProfessionalReport(html, 'Transparansi_Donasi_TPQ_Nurul_Huda_' + d.tahun);
      });
    }
  });
})();
