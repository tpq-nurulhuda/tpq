/**
 * laporan.js - Modul Laporan Donasi & Keuangan Terintegrasi (Filter Bulan, Tahun, Jenis Donasi, RT)
 * Mendukung Cetak PDF Profesional & Export Excel
 * Portal Digital TPQ Nurul Huda
 */
(function (global) {
  'use strict';

  var BULAN_LIST = [
    { val: '', name: 'Semua Bulan' },
    { val: '1', name: 'Januari' }, { val: '2', name: 'Februari' }, { val: '3', name: 'Maret' },
    { val: '4', name: 'April' }, { val: '5', name: 'Mei' }, { val: '6', name: 'Juni' },
    { val: '7', name: 'Juli' }, { val: '8', name: 'Agustus' }, { val: '9', name: 'September' },
    { val: '10', name: 'Oktober' }, { val: '11', name: 'November' }, { val: '12', name: 'Desember' }
  ];

  var lastRows = [];
  var lastMeta = null;

  function renderLaporanModule(container) {
    container.innerHTML =
      '<div class="card" style="margin-bottom:18px;">' +
      '  <div class="card-header"><h2 class="card-title">Filter Laporan Keuangan Donasi</h2></div>' +
      '  <div class="form-grid">' +
      '    <div class="form-group"><label>Tahun</label><input type="number" id="lap-tahun" value="' + new Date().getFullYear() + '" min="2020" max="2100"></div>' +
      '    <div class="form-group"><label>Bulan</label><select id="lap-bulan">' + BULAN_LIST.map(function (b) { return '<option value="' + b.val + '">' + b.name + '</option>'; }).join('') + '</select></div>' +
      '    <div class="form-group"><label>Jenis Donasi / Kategori</label><select id="lap-jenis"><option value="SEMUA">Semua Transaksi Keuangan</option><option value="IURAN_TARGET">Iuran Target</option><option value="SUMBANGAN_INSIDENTAL">Sumbangan Insidental</option><option value="PENGELUARAN">Pengeluaran</option></select></div>' +
      '    <div class="form-group"><label>Filter Wilayah RT</label><select id="lap-rt"><option value="">Semua RT</option></select></div>' +
      '  </div>' +
      '  <div class="toolbar-group">' +
      '    <button class="btn btn-primary" id="btn-lap-load">Tampilkan Laporan</button>' +
      '    <button class="btn btn-gold" id="btn-lap-pdf" disabled>Cetak / Download PDF</button>' +
      '    <button class="btn btn-outline" id="btn-lap-excel" disabled>Export Excel</button>' +
      '  </div>' +
      '</div>' +
      '<div id="lap-preview-host">' + TPQUi.renderEmpty('Klik "Tampilkan Laporan"', 'Seluruh laporan diambil dari satu sumber transaksi keuangan utama sehingga konsisten dengan Saldo Akhir.') + '</div>';

    TPQApi.request('admin_rt_list', {}, { requireAuth: true }).then(function (rts) {
      var sel = document.getElementById('lap-rt');
      if (sel) {
        sel.innerHTML = '<option value="">Semua RT</option>' + (rts || []).map(function (r) {
          return '<option value="' + TPQUi.escapeHtml(r.nomor_rt) + '">' + TPQUi.escapeHtml(r.nomor_rt) + '</option>';
        }).join('');
      }
    }).catch(function () {});

    document.getElementById('btn-lap-load').addEventListener('click', loadLaporan);
    document.getElementById('btn-lap-pdf').addEventListener('click', function () {
      var paper = document.getElementById('lap-paper-box');
      if (paper && lastMeta) TPQExport.printProfessionalReport(paper.innerHTML, 'Laporan_Keuangan_TPQ_' + lastMeta.tahun);
    });
    document.getElementById('btn-lap-excel').addEventListener('click', function () {
      if (!lastRows.length) return;
      TPQExport.exportToExcel('Laporan_Donasi_TPQ_' + lastMeta.tahun, lastMeta.judul, [
        { label: 'ID Keuangan', key: 'id_keuangan' },
        { label: 'Tanggal', key: 'tanggal' },
        { label: 'Sumber Dana', key: 'sumber_dana' },
        { label: 'Jenis', key: 'jenis' },
        { label: 'Deskripsi', key: 'deskripsi' },
        { label: 'Nominal', key: 'nominal' },
        { label: 'Admin', key: 'admin_nama' }
      ], lastRows);
    });
  }

  function loadLaporan() {
    var tahun = document.getElementById('lap-tahun').value;
    var bulan = document.getElementById('lap-bulan').value;
    var jenis = document.getElementById('lap-jenis').value;
    var rt = document.getElementById('lap-rt').value;
    var host = document.getElementById('lap-preview-host');
    host.innerHTML = TPQUi.renderLoading('Menyusun laporan dari database keuangan...');

    Promise.all([
      TPQApi.request('admin_riwayat_keuangan', { tahun: tahun, bulan: bulan || 'SEMUA', sumber_dana: jenis }, { requireAuth: true }),
      TPQApi.request('admin_saldo_get', { tahun: tahun, bulan: bulan || 'SEMUA' }, { requireAuth: true })
    ])
      .then(function (res) {
        var rows = res[0] || [];
        var saldo = res[1] || {};
        if (rt) {
          rows = rows.filter(function (r) { return String(r.deskripsi || '').indexOf(rt) !== -1; });
        }
        lastRows = rows;
        var bLabel = (BULAN_LIST.find(function (b) { return b.val === bulan; }) || {}).name || 'Semua Bulan';
        var judul = 'Laporan Keuangan Donasi (' + jenis + ') — ' + bLabel + ' ' + tahun + (rt ? ' (' + rt + ')' : '');
        lastMeta = { tahun: tahun, judul: judul };

        document.getElementById('btn-lap-pdf').disabled = false;
        document.getElementById('btn-lap-excel').disabled = rows.length === 0;

        var esc = TPQUi.escapeHtml;
        var totMasuk = 0, totKeluar = 0;
        var tbody = rows.map(function (r, idx) {
          if (r.jenis === 'MASUK') totMasuk += Number(r.nominal) || 0;
          else totKeluar += Number(r.nominal) || 0;
          return (
            '<tr>' +
            '  <td class="text-center">' + (idx + 1) + '</td>' +
            '  <td>' + esc(r.tanggal) + '</td>' +
            '  <td>' + esc(r.sumber_dana) + '</td>' +
            '  <td>' + esc(r.deskripsi) + '</td>' +
            '  <td class="text-right">' + (r.jenis === 'MASUK' ? TPQUi.formatRupiah(r.nominal) : '-') + '</td>' +
            '  <td class="text-right">' + (r.jenis === 'KELUAR' ? TPQUi.formatRupiah(r.nominal) : '-') + '</td>' +
            '</tr>'
          );
        }).join('');

        host.innerHTML =
          '<div class="report-paper" id="lap-paper-box">' +
          '  <div class="report-kop">' +
          '    <img src="' + TPQ_CONFIG.DEFAULT_LOGO + '" alt="Logo TPQ">' +
          '    <div><h2>TPQ NURUL HUDA</h2><p>' + esc(judul) + '</p></div>' +
          '  </div>' +
          '  <div class="summary-box" style="margin-bottom:14px;">' +
          '    <strong>Saldo Awal:</strong> ' + TPQUi.formatRupiah(saldo.saldo_awal) + ' &nbsp;|&nbsp; ' +
          '    <strong>Total Iuran Target:</strong> ' + TPQUi.formatRupiah(saldo.total_iuran_target) + ' &nbsp;|&nbsp; ' +
          '    <strong>Total Insidental:</strong> ' + TPQUi.formatRupiah(saldo.total_sumbangan_insidental) + ' &nbsp;|&nbsp; ' +
          '    <strong>Total Pengeluaran:</strong> ' + TPQUi.formatRupiah(saldo.total_pengeluaran) + ' &nbsp;|&nbsp; ' +
          '    <strong>Saldo Akhir:</strong> <strong style="color:var(--primary-dark);">' + TPQUi.formatRupiah(saldo.saldo_akhir) + '</strong>' +
          '  </div>' +
          '  <div class="table-responsive"><table><thead><tr><th class="text-center">No</th><th>Tanggal</th><th>Sumber Dana</th><th>Deskripsi</th><th class="text-right">Masuk</th><th class="text-right">Keluar</th></tr></thead><tbody>' +
          (tbody || '<tr><td colspan="6" class="text-center">Belum ada transaksi pada filter ini.</td></tr>') +
          '  <tr style="font-weight:bold;background:#ECF7F1;"><td colspan="4">TOTAL FILTER</td><td class="text-right">' + TPQUi.formatRupiah(totMasuk) + '</td><td class="text-right">' + TPQUi.formatRupiah(totKeluar) + '</td></tr>' +
          '  </tbody></table></div>' +
          '  <div class="report-signature"><div class="report-sign-box"><div>Dicetak: ' + TPQUi.formatDateID(new Date().toISOString()) + '</div><div>Bendahara TPQ Nurul Huda</div><div class="report-sign-line">Pengurus TPQ</div></div></div>' +
          '</div>';
      })
      .catch(function (err) { host.innerHTML = TPQUi.renderError(err.message); });
  }

  global.TPQAdminLaporan = { render: renderLaporanModule };
})(window);
