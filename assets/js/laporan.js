/**
 * laporan.js - Modul 10 Jenis Laporan Profesional, Cetak PDF, dan Export Excel
 * Portal Digital TPQ Nurul Huda
 */
(function (global) {
  'use strict';

  var lastReportData = null;

  var REPORT_TYPES = [
    { id: 'KESELURUHAN', label: '1. Laporan Keseluruhan / Tahunan' },
    { id: 'DONASI_SUKARELA', label: '2. Laporan Donasi Sukarela (Semua Pola)' },
    { id: 'TARGET_TAHUNAN', label: '3. Laporan Pola Target Tahunan' },
    { id: 'KESANGGUPAN_BULANAN', label: '4. Laporan Pola Kesanggupan Bulanan' },
    { id: 'DONASI_BEBAS', label: '5. Laporan Pola Donasi Bebas' },
    { id: 'DONASI_INSIDENTAL', label: '6. Laporan Donasi Insidental' },
    { id: 'PER_RT', label: '7. Laporan Rekap Per Wilayah RT' },
    { id: 'PER_WARGA', label: '8. Laporan Riwayat Per Warga' },
    { id: 'PER_BULAN', label: '9. Laporan Berdasarkan Periode / Bulan' }
  ];

  function renderLaporanModule(container) {
    container.innerHTML =
      '<div class="card" style="margin-bottom:18px;">' +
      '  <div class="card-header"><h2 class="card-title">Filter &amp; Jenis Laporan</h2></div>' +
      '  <div class="form-grid">' +
      '    <div class="form-group">' +
      '      <label for="rep-jenis">Jenis Laporan</label>' +
      '      <select id="rep-jenis">' +
             REPORT_TYPES.map(function (r) { return '<option value="' + r.id + '">' + r.label + '</option>'; }).join('') +
      '      </select>' +
      '    </div>' +
      '    <div class="form-group">' +
      '      <label for="rep-tahun">Tahun</label>' +
      '      <input type="number" id="rep-tahun" value="' + new Date().getFullYear() + '" min="2020" max="2100">' +
      '    </div>' +
      '    <div class="form-group" id="rep-rt-wrap" style="display:none;">' +
      '      <label for="rep-rt">Wilayah RT</label>' +
      '      <select id="rep-rt"><option value="">Semua RT</option></select>' +
      '    </div>' +
      '    <div class="form-group" id="rep-warga-wrap" style="display:none;">' +
      '      <label for="rep-warga">Pilih Warga</label>' +
      '      <select id="rep-warga"><option value="">-- Pilih Warga --</option></select>' +
      '    </div>' +
      '    <div class="form-group" id="rep-periode-wrap" style="display:none;">' +
      '      <label for="rep-periode">Pilih Periode / Bulan</label>' +
      '      <select id="rep-periode"><option value="">Semua Periode</option></select>' +
      '    </div>' +
      '  </div>' +
      '  <div class="toolbar-group">' +
      '    <button class="btn btn-primary" id="btn-generate-report">Tampilkan Laporan</button>' +
      '    <button class="btn btn-gold" id="btn-print-report" disabled>Cetak / Simpan PDF</button>' +
      '    <button class="btn btn-outline" id="btn-excel-report" disabled>Export Excel</button>' +
      '  </div>' +
      '</div>' +
      '<div id="report-preview-host">' +
      TPQUi.renderEmpty('Pilih jenis laporan lalu klik "Tampilkan Laporan"', 'Laporan akan disusun secara akurat dari data transaksi database.') +
      '</div>';

    // Muat referensi dropdown RT, Warga, dan Periode secara paralel
    Promise.all([
      TPQApi.request('admin_rt_list', {}, { requireAuth: true }).catch(function () { return []; }),
      TPQApi.request('admin_warga_list', {}, { requireAuth: true }).catch(function () { return []; }),
      TPQApi.request('admin_periode_list', { tahun: new Date().getFullYear() }, { requireAuth: true }).catch(function () { return []; })
    ]).then(function (res) {
      var rtSel = document.getElementById('rep-rt');
      if (rtSel) {
        rtSel.innerHTML = '<option value="">Semua RT</option>' + (res[0] || []).map(function (r) {
          return '<option value="' + TPQUi.escapeHtml(r.id_rt) + '">' + TPQUi.escapeHtml(r.nomor_rt) + '</option>';
        }).join('');
      }
      var wargaSel = document.getElementById('rep-warga');
      if (wargaSel) {
        wargaSel.innerHTML = '<option value="">-- Pilih Warga --</option>' + (res[1] || []).map(function (w) {
          return '<option value="' + TPQUi.escapeHtml(w.id_warga) + '">' + TPQUi.escapeHtml(w.nama_lengkap + ' (' + w.nomor_rt + ')') + '</option>';
        }).join('');
      }
      var perSel = document.getElementById('rep-periode');
      if (perSel) {
        perSel.innerHTML = '<option value="">Semua Periode</option>' + (res[2] || []).map(function (p) {
          return '<option value="' + TPQUi.escapeHtml(p.id_periode) + '">' + TPQUi.escapeHtml(p.nama_periode + ' ' + p.tahun) + '</option>';
        }).join('');
      }
    });

    var jenisSel = document.getElementById('rep-jenis');
    jenisSel.addEventListener('change', function () {
      var v = jenisSel.value;
      document.getElementById('rep-rt-wrap').style.display = (v === 'PER_RT' || v === 'DONASI_INSIDENTAL') ? 'flex' : 'none';
      document.getElementById('rep-warga-wrap').style.display = (v === 'PER_WARGA') ? 'flex' : 'none';
      document.getElementById('rep-periode-wrap').style.display = (v === 'PER_BULAN' || v === 'DONASI_INSIDENTAL') ? 'flex' : 'none';
    });

    document.getElementById('rep-tahun').addEventListener('change', function () {
      var yr = document.getElementById('rep-tahun').value;
      TPQApi.request('admin_periode_list', { tahun: yr }, { requireAuth: true }).then(function (list) {
        var perSel = document.getElementById('rep-periode');
        if (perSel) {
          perSel.innerHTML = '<option value="">Semua Periode</option>' + (list || []).map(function (p) {
            return '<option value="' + TPQUi.escapeHtml(p.id_periode) + '">' + TPQUi.escapeHtml(p.nama_periode + ' ' + p.tahun) + '</option>';
          }).join('');
        }
      }).catch(function () {});
    });

    document.getElementById('btn-generate-report').addEventListener('click', fetchAndRenderReport);
    document.getElementById('btn-print-report').addEventListener('click', function () {
      var paper = document.getElementById('printable-report-paper');
      if (paper && lastReportData) {
        TPQExport.printProfessionalReport(paper.innerHTML, lastReportData.judul);
      }
    });
    document.getElementById('btn-excel-report').addEventListener('click', exportCurrentReportExcel);
  }

  function fetchAndRenderReport() {
    var host = document.getElementById('report-preview-host');
    var jenis = document.getElementById('rep-jenis').value;
    var tahun = document.getElementById('rep-tahun').value;
    var idRt = document.getElementById('rep-rt').value;
    var idWarga = document.getElementById('rep-warga').value;
    var idPeriode = document.getElementById('rep-periode').value;

    if (jenis === 'PER_WARGA' && !idWarga) {
      TPQUi.showToast('Pilih warga terlebih dahulu untuk laporan per warga.', 'warning');
      return;
    }

    host.innerHTML = TPQUi.renderLoading('Menyusun laporan dari database...');

    TPQApi.request('admin_report', {
      jenis_laporan: jenis,
      tahun: tahun,
      id_rt: idRt,
      id_warga: idWarga,
      id_periode: idPeriode
    }, { requireAuth: true })
      .then(function (rep) {
        lastReportData = rep;
        document.getElementById('btn-print-report').disabled = false;
        document.getElementById('btn-excel-report').disabled = false;
        host.innerHTML = '<div class="report-paper" id="printable-report-paper">' + buildReportHtml(rep) + '</div>';
      })
      .catch(function (err) {
        host.innerHTML = TPQUi.renderError(err.message);
      });
  }

  function buildReportHtml(rep) {
    var esc = TPQUi.escapeHtml;
    var logo = (rep.profil && rep.profil.logo_url) || TPQ_CONFIG.DEFAULT_LOGO;
    var tableHtml = '';
    var summaryHtml = '';

    if (rep.jenis_laporan === 'KESELURUHAN' || rep.jenis_laporan === 'PER_RT') {
      var rows = rep.rows || [];
      var grandSuk = 0, grandIns = 0, grandAll = 0;
      var body = rows.map(function (r, idx) {
        grandSuk += Number(r.total_sukarela) || 0;
        grandIns += Number(r.total_insidental) || 0;
        grandAll += Number(r.total_keseluruhan) || 0;
        return (
          '<tr>' +
          '  <td class="text-center">' + (idx + 1) + '</td>' +
          '  <td>' + esc(r.nomor_rt) + (r.nama_wilayah ? ' - ' + esc(r.nama_wilayah) : '') + '</td>' +
          '  <td class="text-center">' + r.jumlah_warga + '</td>' +
          '  <td class="text-center">' + r.peserta_target_tahunan + '</td>' +
          '  <td class="text-center">' + r.peserta_kesanggupan_bulanan + '</td>' +
          '  <td class="text-center">' + r.peserta_donasi_bebas + '</td>' +
          '  <td class="text-right">' + TPQUi.formatRupiah(r.total_sukarela) + '</td>' +
          '  <td class="text-right">' + TPQUi.formatRupiah(r.total_insidental) + '</td>' +
          '  <td class="text-right"><strong>' + TPQUi.formatRupiah(r.total_keseluruhan) + '</strong></td>' +
          '</tr>'
        );
      }).join('');
      tableHtml =
        '<div class="table-responsive"><table><thead><tr>' +
        '<th>No</th><th>Wilayah RT</th><th class="text-center">Warga</th><th class="text-center">Target Thn</th><th class="text-center">Bulanan</th><th class="text-center">Bebas</th>' +
        '<th class="text-right">Sukarela</th><th class="text-right">Insidental</th><th class="text-right">Total</th>' +
        '</tr></thead><tbody>' + (body || '<tr><td colspan="9" class="text-center">Belum ada data</td></tr>') +
        '<tr style="font-weight:bold;background:#ECF7F1;"><td colspan="6">TOTAL KESELURUHAN</td><td class="text-right">' + TPQUi.formatRupiah(grandSuk) + '</td><td class="text-right">' + TPQUi.formatRupiah(grandIns) + '</td><td class="text-right">' + TPQUi.formatRupiah(grandAll) + '</td></tr>' +
        '</tbody></table></div>';
    } else if (rep.jenis_laporan === 'DONASI_INSIDENTAL') {
      var insRows = rep.rows || [];
      var totIns = 0;
      var bodyIns = insRows.map(function (t, idx) {
        totIns += Number(t.nominal) || 0;
        return (
          '<tr>' +
          '  <td class="text-center">' + (idx + 1) + '</td>' +
          '  <td>' + esc(t.tanggal) + '</td>' +
          '  <td>' + esc(t.nama_donatur) + '</td>' +
          '  <td>' + esc(t.nomor_rt) + '</td>' +
          '  <td>' + esc(t.tujuan_donasi) + '</td>' +
          '  <td>' + esc(t.metode_pembayaran) + '</td>' +
          '  <td class="text-right"><strong>' + TPQUi.formatRupiah(t.nominal) + '</strong></td>' +
          '</tr>'
        );
      }).join('');
      tableHtml =
        '<div class="table-responsive"><table><thead><tr><th>No</th><th>Tanggal</th><th>Donatur</th><th>Wilayah</th><th>Tujuan</th><th>Metode</th><th class="text-right">Nominal</th></tr></thead><tbody>' +
        (bodyIns || '<tr><td colspan="7" class="text-center">Belum ada transaksi insidental.</td></tr>') +
        '<tr style="font-weight:bold;background:#ECF7F1;"><td colspan="6">TOTAL DONASI INSIDENTAL</td><td class="text-right">' + TPQUi.formatRupiah(totIns) + '</td></tr>' +
        '</tbody></table></div>';
    } else if (rep.jenis_laporan === 'PER_WARGA') {
      var w = rep.warga;
      if (w) {
        summaryHtml =
          '<div class="summary-box">' +
          '<strong>Nama Warga:</strong> ' + esc(w.nama_lengkap) + ' (' + esc(w.nomor_rt) + ') &nbsp;|&nbsp; ' +
          '<strong>Pola:</strong> ' + esc(w.jenis_pola) + ' &nbsp;|&nbsp; ' +
          '<strong>Total Realisasi:</strong> ' + TPQUi.formatRupiah(w.total_realisasi) +
          (w.jenis_pola === 'TARGET_TAHUNAN' ? ' &nbsp;|&nbsp; <strong>Target:</strong> ' + TPQUi.formatRupiah(w.nominal_target) + ' (' + w.persentase_target + '%)' : '') +
          (w.jenis_pola === 'KESANGGUPAN_BULANAN' ? ' &nbsp;|&nbsp; <strong>Kesanggupan Bulanan:</strong> ' + TPQUi.formatRupiah(w.nominal_bulanan) + '/bln' : '') +
          '</div>';
      }
      var trxRows = rep.rows || [];
      var totW = 0;
      var bodyW = trxRows.map(function (t, idx) {
        totW += Number(t.nominal) || 0;
        return '<tr><td class="text-center">' + (idx + 1) + '</td><td>' + esc(t.tanggal) + '</td><td>' + esc(t.nama_periode) + '</td><td>' + esc(t.metode_pembayaran) + '</td><td>' + esc(t.keterangan || '-') + '</td><td class="text-right">' + TPQUi.formatRupiah(t.nominal) + '</td></tr>';
      }).join('');
      tableHtml =
        '<div class="table-responsive"><table><thead><tr><th>No</th><th>Tanggal</th><th>Periode</th><th>Metode</th><th>Keterangan</th><th class="text-right">Nominal</th></tr></thead><tbody>' +
        (bodyW || '<tr><td colspan="6" class="text-center">Belum ada catatan transaksi pada tahun ini.</td></tr>') +
        '<tr style="font-weight:bold;background:#ECF7F1;"><td colspan="5">TOTAL REALISASI</td><td class="text-right">' + TPQUi.formatRupiah(totW) + '</td></tr>' +
        '</tbody></table></div>';
    } else if (rep.jenis_laporan === 'PER_BULAN') {
      var bRows = rep.rows || [];
      var totB = 0;
      var bodyB = bRows.map(function (t, idx) {
        totB += Number(t.nominal) || 0;
        return '<tr><td class="text-center">' + (idx + 1) + '</td><td>' + esc(t.tanggal) + '</td><td>' + esc(t.kategori) + '</td><td>' + esc(t.nama_donatur) + '</td><td>' + esc(t.tujuan_donasi) + '</td><td class="text-right">' + TPQUi.formatRupiah(t.nominal) + '</td></tr>';
      }).join('');
      tableHtml =
        '<div class="table-responsive"><table><thead><tr><th>No</th><th>Tanggal</th><th>Kategori</th><th>Donatur / Warga</th><th>Tujuan</th><th class="text-right">Nominal</th></tr></thead><tbody>' +
        (bodyB || '<tr><td colspan="6" class="text-center">Belum ada transaksi pada periode ini.</td></tr>') +
        '<tr style="font-weight:bold;background:#ECF7F1;"><td colspan="5">TOTAL PERIODE</td><td class="text-right">' + TPQUi.formatRupiah(totB) + '</td></tr>' +
        '</tbody></table></div>';
    } else {
      // DONASI_SUKARELA / TARGET_TAHUNAN / KESANGGUPAN_BULANAN / DONASI_BEBAS
      var wRows = rep.rows || [];
      var totReal = 0;
      var bodySk = wRows.map(function (w, idx) {
        totReal += Number(w.total_realisasi) || 0;
        var acuan = w.jenis_pola === 'TARGET_TAHUNAN'
          ? 'Target: ' + TPQUi.formatRupiah(w.nominal_target) + ' (' + w.persentase_target + '%)'
          : (w.jenis_pola === 'KESANGGUPAN_BULANAN'
              ? 'Kesanggupan: ' + TPQUi.formatRupiah(w.nominal_bulanan) + '/bln (' + w.bulan_sudah_berpartisipasi + ' bln penuh, ' + w.bulan_partisipasi_sebagian + ' sebagian)'
              : 'Bebas sesuai kemampuan');
        return (
          '<tr>' +
          '  <td class="text-center">' + (idx + 1) + '</td>' +
          '  <td><strong>' + esc(w.nama_lengkap) + '</strong></td>' +
          '  <td>' + esc(w.nomor_rt) + '</td>' +
          '  <td>' + esc(w.jenis_pola) + '</td>' +
          '  <td>' + esc(acuan) + '</td>' +
          '  <td class="text-right"><strong>' + TPQUi.formatRupiah(w.total_realisasi) + '</strong></td>' +
          '  <td>' + esc(w.status_partisipasi) + '</td>' +
          '</tr>'
        );
      }).join('');
      tableHtml =
        '<div class="table-responsive"><table><thead><tr><th>No</th><th>Nama Warga</th><th>RT</th><th>Pola</th><th>Acuan Partisipasi</th><th class="text-right">Total Realisasi</th><th>Status</th></tr></thead><tbody>' +
        (bodySk || '<tr><td colspan="7" class="text-center">Belum ada data warga pada kategori ini.</td></tr>') +
        '<tr style="font-weight:bold;background:#ECF7F1;"><td colspan="5">TOTAL REALISASI</td><td class="text-right">' + TPQUi.formatRupiah(totReal) + '</td><td></td></tr>' +
        '</tbody></table></div>';
    }

    return (
      '<div class="report-kop">' +
      '  <img src="' + esc(logo) + '" alt="Logo TPQ">' +
      '  <div>' +
      '    <h2>' + esc((rep.profil && rep.profil.nama_lembaga) || 'TPQ NURUL HUDA') + '</h2>' +
      '    <p>' + esc((rep.profil && rep.profil.alamat) || '') + '</p>' +
      '  </div>' +
      '</div>' +
      '<div style="margin-bottom:14px;">' +
      '  <h3 style="margin:0 0 4px;">' + esc(rep.judul) + '</h3>' +
      '  <div style="font-size:0.82rem;color:var(--text-muted);">Tahun Anggaran: ' + esc(rep.tahun) + ' &nbsp;|&nbsp; Tanggal Cetak: ' + TPQUi.formatDateID(rep.dicetak_pada) + ' &nbsp;|&nbsp; Petugas: ' + esc(rep.petugas) + '</div>' +
      '</div>' +
      summaryHtml +
      tableHtml +
      '<div class="report-signature">' +
      '  <div class="report-sign-box">' +
      '    <div>Dicetak pada ' + TPQUi.formatDateID(rep.dicetak_pada) + '</div>' +
      '    <div>Petugas Pencatat / Bendahara</div>' +
      '    <div class="report-sign-line">' + esc(rep.petugas) + '</div>' +
      '  </div>' +
      '</div>'
    );
  }

  function exportCurrentReportExcel() {
    if (!lastReportData) return;
    var rep = lastReportData;
    var rows = rep.rows || [];
    var cols = [];

    if (rep.jenis_laporan === 'KESELURUHAN' || rep.jenis_laporan === 'PER_RT') {
      cols = [
        { label: 'Wilayah RT', key: 'nomor_rt' },
        { label: 'Nama Wilayah', key: 'nama_wilayah' },
        { label: 'Jumlah Warga', key: 'jumlah_warga' },
        { label: 'Peserta Target Tahunan', key: 'peserta_target_tahunan' },
        { label: 'Peserta Kesanggupan Bulanan', key: 'peserta_kesanggupan_bulanan' },
        { label: 'Peserta Donasi Bebas', key: 'peserta_donasi_bebas' },
        { label: 'Total Sukarela', key: 'total_sukarela' },
        { label: 'Total Insidental', key: 'total_insidental' },
        { label: 'Total Keseluruhan', key: 'total_keseluruhan' }
      ];
    } else if (rep.jenis_laporan === 'DONASI_INSIDENTAL') {
      cols = [
        { label: 'ID Transaksi', key: 'id_transaksi' },
        { label: 'Tanggal', key: 'tanggal' },
        { label: 'Donatur', key: 'nama_donatur' },
        { label: 'Wilayah RT', key: 'nomor_rt' },
        { label: 'Tujuan', key: 'tujuan_donasi' },
        { label: 'Metode', key: 'metode_pembayaran' },
        { label: 'Nominal', key: 'nominal' },
        { label: 'Petugas', key: 'petugas_nama' }
      ];
    } else if (rep.jenis_laporan === 'PER_WARGA' || rep.jenis_laporan === 'PER_BULAN') {
      cols = [
        { label: 'ID Transaksi', key: 'id_transaksi' },
        { label: 'Tanggal', key: 'tanggal' },
        { label: 'Kategori', key: 'kategori' },
        { label: 'Donatur', key: 'nama_donatur' },
        { label: 'Periode', key: 'nama_periode' },
        { label: 'Nominal', key: 'nominal' },
        { label: 'Metode', key: 'metode_pembayaran' },
        { label: 'Keterangan', key: 'keterangan' }
      ];
    } else {
      cols = [
        { label: 'Nama Warga', key: 'nama_lengkap' },
        { label: 'Wilayah RT', key: 'nomor_rt' },
        { label: 'Pola Partisipasi', key: 'jenis_pola' },
        { label: 'Target Tahunan', key: 'nominal_target' },
        { label: 'Kesanggupan Bulanan', key: 'nominal_bulanan' },
        { label: 'Total Realisasi', key: 'total_realisasi' },
        { label: 'Status', key: 'status_partisipasi' }
      ];
    }

    TPQExport.exportToExcel('Laporan_' + rep.jenis_laporan + '_' + rep.tahun, rep.judul, cols, rows);
  }

  global.TPQAdminLaporan = {
    render: renderLaporanModule
  };
})(window);
