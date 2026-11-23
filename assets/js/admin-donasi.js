/**
 * admin-donasi.js - Modul Admin Donasi Sukarela (3 Pola), Donasi Insidental, dan Periode Dinamis
 * Portal Digital TPQ Nurul Huda
 */
(function (global) {
  'use strict';

  var state = {
    tahun: new Date().getFullYear(),
    id_rt: 'SEMUA',
    jenis_pola: 'SEMUA',
    search: '',
    overview: null,
    rtList: [],
    insidentalList: []
  };

  /* ==================== 1. DONASI SUKARELA ==================== */

  function renderDonasiSukarela(container) {
    container.innerHTML = TPQUi.renderLoading('Memuat data Donasi Sukarela...');
    Promise.all([
      TPQApi.request('admin_donasi_overview', {
        tahun: state.tahun,
        id_rt: state.id_rt,
        jenis_pola: state.jenis_pola,
        search: state.search
      }, { requireAuth: true }),
      TPQApi.request('admin_rt_list', {}, { requireAuth: true })
    ])
      .then(function (res) {
        state.overview = res[0];
        state.rtList = res[1] || [];
        paintSukarela(container);
      })
      .catch(function (err) {
        container.innerHTML = TPQUi.renderError(err.message);
      });
  }

  function paintSukarela(container) {
    var d = state.overview;
    var sk = d.ringkasan_sukarela || {};
    var periodes = d.periode_aktif || [];
    var wargaList = d.warga_donasi || [];
    var years = d.available_years || [state.tahun];
    var esc = TPQUi.escapeHtml;

    var dynamicTh = periodes.map(function (p) {
      return '<th class="text-right">' + esc(p.nama_periode.slice(0, 3)) + '</th>';
    }).join('');

    var rowsHtml = wargaList.length > 0
      ? wargaList.map(function (w) {
          var acuanHtml = '';
          if (w.jenis_pola === 'TARGET_TAHUNAN') {
            acuanHtml =
              '<div>Target: <strong>' + TPQUi.formatRupiah(w.nominal_target) + '</strong></div>' +
              '<div style="font-size:0.76rem;color:var(--text-muted);">Sisa: ' + TPQUi.formatRupiah(w.sisa_target) + ' (' + w.persentase_target + '%)</div>';
          } else if (w.jenis_pola === 'KESANGGUPAN_BULANAN') {
            acuanHtml =
              '<div>Kesanggupan: <strong>' + TPQUi.formatRupiah(w.nominal_bulanan) + '/bln</strong></div>' +
              '<div style="font-size:0.76rem;color:var(--text-muted);">' + w.bulan_sudah_berpartisipasi + ' penuh • ' + w.bulan_partisipasi_sebagian + ' sebagian • ' + w.bulan_belum_ada_catatan + ' blm catatan</div>';
          } else {
            acuanHtml = '<span style="font-size:0.8rem;color:var(--text-muted);">Bebas sesuai kemampuan</span>';
          }

          var perCells = periodes.map(function (p) {
            var val = (w.realisasi_per_periode && w.realisasi_per_periode[p.id_periode]) || 0;
            return '<td class="text-right" style="font-size:0.8rem;">' + (val > 0 ? TPQUi.formatNumber(val) : '<span style="color:#CBD5E1;">-</span>') + '</td>';
          }).join('');

          return (
            '<tr>' +
            '  <td><strong>' + esc(w.nama_lengkap) + '</strong><br><small style="color:var(--text-muted);">' + esc(w.nomor_rt) + '</small></td>' +
            '  <td>' + TPQUi.polaBadge(w.jenis_pola) + '</td>' +
            '  <td>' + acuanHtml + '</td>' +
            perCells +
            '  <td class="text-right"><strong>' + TPQUi.formatRupiah(w.total_realisasi) + '</strong></td>' +
            '  <td>' + TPQUi.statusBadge(w.status_partisipasi) + '</td>' +
            '  <td style="white-space:nowrap;">' +
            '    <button class="btn btn-primary btn-sm" data-act="pay" data-id="' + esc(w.id_warga) + '">+ Bayar</button> ' +
            '    <button class="btn btn-outline btn-sm" data-act="pola" data-id="' + esc(w.id_warga) + '">Pola</button> ' +
            '    <button class="btn btn-outline btn-sm" data-act="hist" data-id="' + esc(w.id_warga) + '">Riwayat</button>' +
            '  </td>' +
            '</tr>'
          );
        }).join('')
      : '<tr><td colspan="' + (7 + periodes.length) + '" class="text-center" style="padding:24px;color:var(--text-muted);">Belum ada data warga pada filter ini. Tambahkan warga di menu Data Warga terlebih dahulu.</td></tr>';

    container.innerHTML =
      '<div class="stats-grid" style="margin-bottom:18px;">' +
      '  <div class="stat-card"><div class="stat-label">Total Sukarela (' + esc(d.tahun) + ')</div><div class="stat-value" style="font-size:1.3rem;">' + TPQUi.formatRupiah(sk.total_keseluruhan_sukarela) + '</div></div>' +
      '  <div class="stat-card info"><div class="stat-label">Realisasi Target Tahunan</div><div class="stat-value" style="font-size:1.3rem;">' + TPQUi.formatRupiah(sk.total_realisasi_target_tahunan) + '</div><div class="stat-sub">Dari target ' + TPQUi.formatRupiah(sk.total_target_tahunan) + '</div></div>' +
      '  <div class="stat-card gold"><div class="stat-label">Realisasi Kesanggupan Bulanan</div><div class="stat-value" style="font-size:1.3rem;">' + TPQUi.formatRupiah(sk.total_realisasi_bulanan) + '</div><div class="stat-sub">Acuan ' + TPQUi.formatRupiah(sk.total_kesanggupan_bulanan) + '/bln</div></div>' +
      '  <div class="stat-card dark"><div class="stat-label">Realisasi Donasi Bebas</div><div class="stat-value" style="font-size:1.3rem;">' + TPQUi.formatRupiah(sk.total_donasi_bebas) + '</div></div>' +
      '</div>' +

      '<div class="card">' +
      '  <div class="toolbar">' +
      '    <div class="toolbar-group">' +
      '      <select id="skr-year">' + years.map(function (y) { return '<option value="' + y + '"' + (Number(y) === Number(state.tahun) ? ' selected' : '') + '>Tahun ' + y + '</option>'; }).join('') + '</select>' +
      '      <select id="skr-rt"><option value="SEMUA">Semua RT</option>' + state.rtList.map(function (r) { return '<option value="' + esc(r.id_rt) + '"' + (state.id_rt === r.id_rt ? ' selected' : '') + '>' + esc(r.nomor_rt) + '</option>'; }).join('') + '</select>' +
      '      <select id="skr-pola">' +
      '        <option value="SEMUA"' + (state.jenis_pola === 'SEMUA' ? ' selected' : '') + '>Semua Pola</option>' +
      '        <option value="TARGET_TAHUNAN"' + (state.jenis_pola === 'TARGET_TAHUNAN' ? ' selected' : '') + '>Pola 1: Target Tahunan</option>' +
      '        <option value="KESANGGUPAN_BULANAN"' + (state.jenis_pola === 'KESANGGUPAN_BULANAN' ? ' selected' : '') + '>Pola 2: Kesanggupan Bulanan</option>' +
      '        <option value="DONASI_BEBAS"' + (state.jenis_pola === 'DONASI_BEBAS' ? ' selected' : '') + '>Pola 3: Donasi Bebas</option>' +
      '      </select>' +
      '      <input type="search" id="skr-search" value="' + esc(state.search) + '" placeholder="Cari nama warga..." style="min-width:180px;">' +
      '      <button class="btn btn-primary btn-sm" id="skr-apply-filter">Terapkan</button>' +
      '    </div>' +
      '    <button class="btn btn-outline btn-sm" id="skr-export-excel">Export Excel</button>' +
      '  </div>' +
      '  <div class="table-responsive">' +
      '    <table>' +
      '      <thead><tr><th>Warga</th><th>Pola</th><th>Acuan Partisipasi</th>' + dynamicTh + '<th class="text-right">Total</th><th>Status</th><th>Aksi</th></tr></thead>' +
      '      <tbody id="skr-tbody">' + rowsHtml + '</tbody>' +
      '    </table>' +
      '  </div>' +
      '</div>';

    document.getElementById('skr-apply-filter').addEventListener('click', function () {
      state.tahun = Number(document.getElementById('skr-year').value);
      state.id_rt = document.getElementById('skr-rt').value;
      state.jenis_pola = document.getElementById('skr-pola').value;
      state.search = document.getElementById('skr-search').value.trim();
      renderDonasiSukarela(container);
    });

    document.getElementById('skr-export-excel').addEventListener('click', function () {
      var cols = [
        { label: 'Nama Warga', key: 'nama_lengkap' },
        { label: 'RT', key: 'nomor_rt' },
        { label: 'Pola', key: 'jenis_pola' },
        { label: 'Target Tahunan', key: 'nominal_target' },
        { label: 'Kesanggupan Bulanan', key: 'nominal_bulanan' }
      ].concat(periodes.map(function (p) {
        return {
          label: p.nama_periode,
          value: function (w) { return (w.realisasi_per_periode && w.realisasi_per_periode[p.id_periode]) || 0; }
        };
      })).concat([
        { label: 'Total Realisasi', key: 'total_realisasi' },
        { label: 'Status', key: 'status_partisipasi' }
      ]);
      TPQExport.exportToExcel('Donasi_Sukarela_' + state.tahun, 'Laporan Donasi Sukarela ' + state.tahun, cols, wargaList);
    });

    document.getElementById('skr-tbody').addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-act]');
      if (!btn) return;
      var idWarga = btn.getAttribute('data-id');
      var act = btn.getAttribute('data-act');
      var warga = (state.overview.warga_donasi || []).find(function (w) { return w.id_warga === idWarga; });
      if (!warga) return;

      if (act === 'pola') openSetPolaModal(warga, container);
      else if (act === 'pay') openCatatBayarModal(warga, null, container);
      else if (act === 'hist') openRiwayatWargaModal(warga, container);
    });
  }

  function openSetPolaModal(warga, container) {
    var periodes = (state.overview && state.overview.periode_aktif) || [];
    var esc = TPQUi.escapeHtml;
    var perOpts = '<option value="">-- Tidak dibatasi --</option>' + periodes.map(function (p) {
      return '<option value="' + esc(p.id_periode) + '">' + esc(p.nama_periode + ' ' + p.tahun) + '</option>';
    }).join('');

    var body =
      '<div style="margin-bottom:12px;padding:10px 12px;background:var(--primary-soft);border-radius:8px;font-size:0.86rem;">' +
      '  <strong>' + esc(warga.nama_lengkap) + '</strong> (' + esc(warga.nomor_rt) + ') — Tahun <strong>' + state.tahun + '</strong><br>' +
      '  <span style="color:var(--text-muted);">Perubahan pola tidak akan menghapus transaksi pembayaran sebelumnya.</span>' +
      '</div>' +
      '<form id="form-set-pola">' +
      '  <div class="form-group">' +
      '    <label for="pola-jenis">Pilih Pola Partisipasi</label>' +
      '    <select id="pola-jenis">' +
      '      <option value="TARGET_TAHUNAN"' + (warga.jenis_pola === 'TARGET_TAHUNAN' ? ' selected' : '') + '>Pola 1: Target Tahunan</option>' +
      '      <option value="KESANGGUPAN_BULANAN"' + (warga.jenis_pola === 'KESANGGUPAN_BULANAN' ? ' selected' : '') + '>Pola 2: Kesanggupan Bulanan (Tanpa Target Tahunan)</option>' +
      '      <option value="DONASI_BEBAS"' + (warga.jenis_pola === 'DONASI_BEBAS' ? ' selected' : '') + '>Pola 3: Donasi Bebas Sesuai Kemampuan</option>' +
      '    </select>' +
      '  </div>' +
      '  <div id="pola-target-fields" style="display:none;">' +
      '    <div class="form-group"><label for="pola-nominal-target">Nominal Target Tahunan (Rp)</label><input type="number" id="pola-nominal-target" min="1000" step="1000" value="' + (warga.nominal_target || 1200000) + '"></div>' +
      '  </div>' +
      '  <div id="pola-bulanan-fields" style="display:none;">' +
      '    <div class="form-group"><label for="pola-nominal-bulanan">Nominal Kesanggupan Bulanan (Rp)</label><input type="number" id="pola-nominal-bulanan" min="1000" step="1000" value="' + (warga.nominal_bulanan || 100000) + '"><div class="form-hint">Bukan merupakan tagihan/utang; hanya acuan partisipasi bulanan.</div></div>' +
      '    <div class="form-grid">' +
      '      <div class="form-group"><label for="pola-mulai">Periode Mulai</label><select id="pola-mulai">' + perOpts + '</select></div>' +
      '      <div class="form-group"><label for="pola-akhir">Periode Akhir (Opsional)</label><select id="pola-akhir">' + perOpts + '</select></div>' +
      '    </div>' +
      '  </div>' +
      '  <div class="form-group"><label for="pola-catatan">Catatan</label><input type="text" id="pola-catatan" placeholder="Catatan opsional"></div>' +
      '</form>';

    var footer = '<button class="btn btn-outline" onclick="TPQUi.closeModal()">Batal</button><button class="btn btn-primary" id="btn-save-pola">Simpan Pola</button>';
    TPQUi.openModal('Atur Pola Donasi Sukarela', body, footer);

    var jenisEl = document.getElementById('pola-jenis');
    function syncFields() {
      document.getElementById('pola-target-fields').style.display = jenisEl.value === 'TARGET_TAHUNAN' ? 'block' : 'none';
      document.getElementById('pola-bulanan-fields').style.display = jenisEl.value === 'KESANGGUPAN_BULANAN' ? 'block' : 'none';
    }
    syncFields();
    if (warga.id_periode_mulai) document.getElementById('pola-mulai').value = warga.id_periode_mulai;
    if (warga.id_periode_akhir) document.getElementById('pola-akhir').value = warga.id_periode_akhir;
    jenisEl.addEventListener('change', syncFields);

    document.getElementById('btn-save-pola').addEventListener('click', function () {
      var btn = this;
      btn.disabled = true;
      TPQApi.request('admin_donasi_set_pola', {
        id_warga: warga.id_warga,
        tahun: state.tahun,
        jenis_pola: jenisEl.value,
        nominal_target: document.getElementById('pola-nominal-target').value,
        nominal_bulanan: document.getElementById('pola-nominal-bulanan').value,
        id_periode_mulai: document.getElementById('pola-mulai').value,
        id_periode_akhir: document.getElementById('pola-akhir').value,
        catatan: document.getElementById('pola-catatan').value
      }, { requireAuth: true })
        .then(function () {
          TPQUi.closeModal();
          TPQUi.showToast('Pola partisipasi berhasil disimpan.');
          renderDonasiSukarela(container);
        })
        .catch(function (err) {
          btn.disabled = false;
          TPQUi.showToast(err.message, 'error');
        });
    });
  }

  function openCatatBayarModal(warga, editTrx, container) {
    var periodes = (state.overview && state.overview.periode_aktif) || [];
    var esc = TPQUi.escapeHtml;
    var today = new Date().toISOString().slice(0, 10);

    var perOpts = periodes.map(function (p) {
      var sel = editTrx && editTrx.id_periode === p.id_periode ? ' selected' : '';
      return '<option value="' + esc(p.id_periode) + '"' + sel + '>' + esc(p.nama_periode + ' ' + p.tahun) + '</option>';
    }).join('');

    var defaultNom = editTrx ? editTrx.nominal : (warga.jenis_pola === 'KESANGGUPAN_BULANAN' && warga.nominal_bulanan ? warga.nominal_bulanan : '');

    var body =
      '<div style="margin-bottom:12px;padding:10px 12px;background:var(--primary-soft);border-radius:8px;font-size:0.86rem;">' +
      '  <strong>' + esc(warga.nama_lengkap) + '</strong> (' + esc(warga.nomor_rt) + ') &nbsp;' + TPQUi.polaBadge(warga.jenis_pola) +
      '</div>' +
      '<form id="form-trx-sukarela">' +
      '  <div class="form-grid">' +
      '    <div class="form-group"><label for="trx-periode">Periode / Bulan</label><select id="trx-periode" required>' + perOpts + '</select></div>' +
      '    <div class="form-group"><label for="trx-tanggal">Tanggal Bayar</label><input type="date" id="trx-tanggal" value="' + esc(editTrx ? editTrx.tanggal : today) + '" required></div>' +
      '    <div class="form-group"><label for="trx-nominal">Nominal (Rp)</label><input type="number" id="trx-nominal" min="1000" step="500" value="' + esc(defaultNom) + '" required placeholder="Contoh: 100000"></div>' +
      '    <div class="form-group"><label for="trx-metode">Metode Pembayaran</label><select id="trx-metode"><option value="Tunai">Tunai</option><option value="Transfer Bank">Transfer Bank</option><option value="QRIS">QRIS</option></select></div>' +
      '    <div class="form-group full"><label for="trx-ket">Keterangan</label><input type="text" id="trx-ket" value="' + esc(editTrx ? editTrx.keterangan : '') + '" placeholder="Catatan opsional"></div>' +
      '  </div>' +
      '</form>';

    var footer = '<button class="btn btn-outline" onclick="TPQUi.closeModal()">Batal</button><button class="btn btn-primary" id="btn-save-trx-skr">Simpan Transaksi</button>';
    TPQUi.openModal(editTrx ? 'Edit Transaksi Donasi Sukarela' : 'Catat Pembayaran Donasi Sukarela', body, footer);

    if (editTrx && editTrx.metode_pembayaran) {
      document.getElementById('trx-metode').value = editTrx.metode_pembayaran;
    }

    document.getElementById('btn-save-trx-skr').addEventListener('click', function () {
      var btn = this;
      btn.disabled = true;
      TPQApi.request('admin_donasi_trx_save', {
        id_transaksi: editTrx ? editTrx.id_transaksi : '',
        kategori: 'SUKARELA',
        id_warga: warga.id_warga,
        id_periode: document.getElementById('trx-periode').value,
        tanggal: document.getElementById('trx-tanggal').value,
        nominal: document.getElementById('trx-nominal').value,
        metode_pembayaran: document.getElementById('trx-metode').value,
        keterangan: document.getElementById('trx-ket').value
      }, { requireAuth: true })
        .then(function () {
          TPQUi.closeModal();
          TPQUi.showToast('Transaksi donasi sukarela berhasil disimpan.');
          renderDonasiSukarela(container);
        })
        .catch(function (err) {
          btn.disabled = false;
          TPQUi.showToast(err.message, 'error');
        });
    });
  }

  function openRiwayatWargaModal(warga, container) {
    var periodes = (state.overview && state.overview.periode_aktif) || [];
    var perMap = {};
    periodes.forEach(function (p) { perMap[p.id_periode] = p.nama_periode; });
    var esc = TPQUi.escapeHtml;

    var rekapBulanHtml = '';
    if (warga.jenis_pola === 'KESANGGUPAN_BULANAN' && warga.rekap_bulanan && warga.rekap_bulanan.length > 0) {
      rekapBulanHtml =
        '<h4 style="margin:0 0 8px;color:var(--primary-dark);">Rekap Partisipasi per Periode (Kesanggupan ' + TPQUi.formatRupiah(warga.nominal_bulanan) + '/bln)</h4>' +
        '<div class="table-responsive" style="margin-bottom:16px;"><table><thead><tr><th>Periode</th><th class="text-right">Realisasi</th><th>Status</th></tr></thead><tbody>' +
        warga.rekap_bulanan.map(function (rb) {
          return '<tr><td>' + esc(rb.nama_periode) + '</td><td class="text-right">' + TPQUi.formatRupiah(rb.realisasi) + '</td><td>' + TPQUi.statusBadge(rb.status) + '</td></tr>';
        }).join('') +
        '</tbody></table></div>';
    }

    var trxList = warga.transaksi || [];
    var trxRows = trxList.length > 0
      ? trxList.map(function (t) {
          return (
            '<tr>' +
            '  <td>' + esc(t.tanggal) + '</td>' +
            '  <td>' + esc(perMap[t.id_periode] || t.id_periode) + '</td>' +
            '  <td class="text-right"><strong>' + TPQUi.formatRupiah(t.nominal) + '</strong></td>' +
            '  <td>' + esc(t.metode_pembayaran) + '</td>' +
            '  <td>' + esc(t.keterangan || '-') + '</td>' +
            '  <td style="white-space:nowrap;">' +
            '    <button class="btn btn-outline btn-sm" data-hact="edit" data-tid="' + esc(t.id_transaksi) + '">Edit</button> ' +
            '    <button class="btn btn-danger btn-sm" data-hact="del" data-tid="' + esc(t.id_transaksi) + '">Hapus</button>' +
            '  </td>' +
            '</tr>'
          );
        }).join('')
      : '<tr><td colspan="6" class="text-center" style="color:var(--text-muted);">Belum ada riwayat transaksi.</td></tr>';

    var body =
      '<div style="margin-bottom:14px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;align-items:center;">' +
      '  <div><strong>' + esc(warga.nama_lengkap) + '</strong> (' + esc(warga.nomor_rt) + ') &nbsp;' + TPQUi.polaBadge(warga.jenis_pola) + '</div>' +
      '  <div>Total Realisasi: <strong style="color:var(--primary-dark);">' + TPQUi.formatRupiah(warga.total_realisasi) + '</strong></div>' +
      '</div>' +
      rekapBulanHtml +
      '<h4 style="margin:0 0 8px;color:var(--primary-dark);">Daftar Transaksi Tahun ' + state.tahun + '</h4>' +
      '<div class="table-responsive"><table><thead><tr><th>Tanggal</th><th>Periode</th><th class="text-right">Nominal</th><th>Metode</th><th>Ket</th><th>Aksi</th></tr></thead><tbody id="hist-warga-tbody">' + trxRows + '</tbody></table></div>';

    var footer =
      '<button class="btn btn-gold" id="btn-print-riwayat-warga">Cetak Riwayat Individual</button>' +
      '<button class="btn btn-outline" onclick="TPQUi.closeModal()">Tutup</button>';

    TPQUi.openModal('Riwayat Donasi Warga', body, footer, true);

    document.getElementById('hist-warga-tbody').addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-hact]');
      if (!btn) return;
      var tid = btn.getAttribute('data-tid');
      var hact = btn.getAttribute('data-hact');
      var trx = trxList.find(function (t) { return t.id_transaksi === tid; });
      if (!trx) return;

      if (hact === 'edit') {
        openCatatBayarModal(warga, trx, container);
      } else if (hact === 'del') {
        if (!confirm('Hapus transaksi sebesar ' + TPQUi.formatRupiah(trx.nominal) + ' ini?')) return;
        TPQApi.request('admin_donasi_trx_delete', { id_transaksi: tid }, { requireAuth: true })
          .then(function () {
            TPQUi.closeModal();
            TPQUi.showToast('Transaksi berhasil dihapus.');
            renderDonasiSukarela(container);
          })
          .catch(function (err) { TPQUi.showToast(err.message, 'error'); });
      }
    });

    document.getElementById('btn-print-riwayat-warga').addEventListener('click', function () {
      var html =
        '<div class="report-kop"><div><h2>TPQ NURUL HUDA</h2><p>Riwayat Donasi Sukarela Individual Tahun ' + state.tahun + '</p></div></div>' +
        '<div class="summary-box"><strong>Nama Warga:</strong> ' + esc(warga.nama_lengkap) + ' (' + esc(warga.nomor_rt) + ') | <strong>Pola:</strong> ' + esc(warga.jenis_pola) + ' | <strong>Total Realisasi:</strong> ' + TPQUi.formatRupiah(warga.total_realisasi) + '</div>' +
        '<table><thead><tr><th>Tanggal</th><th>Periode</th><th>Metode</th><th>Keterangan</th><th class="text-right">Nominal</th></tr></thead><tbody>' +
        trxList.map(function (t) {
          return '<tr><td>' + esc(t.tanggal) + '</td><td>' + esc(perMap[t.id_periode] || '-') + '</td><td>' + esc(t.metode_pembayaran) + '</td><td>' + esc(t.keterangan || '-') + '</td><td class="text-right">' + TPQUi.formatRupiah(t.nominal) + '</td></tr>';
        }).join('') +
        '</tbody></table>';
      TPQExport.printProfessionalReport(html, 'Riwayat_Donasi_' + warga.nama_lengkap);
    });
  }

  /* ==================== 2. DONASI INSIDENTAL ==================== */

  function renderDonasiInsidental(container) {
    container.innerHTML = TPQUi.renderLoading('Memuat data Donasi Insidental...');
    Promise.all([
      TPQApi.request('admin_donasi_insidental_list', { tahun: state.tahun }, { requireAuth: true }),
      TPQApi.request('admin_rt_list', {}, { requireAuth: true }),
      TPQApi.request('admin_periode_list', { tahun: state.tahun, only_active: true }, { requireAuth: true })
    ])
      .then(function (res) {
        state.insidentalList = res[0] || [];
        state.rtList = res[1] || [];
        var periodes = res[2] || [];
        paintInsidental(container, periodes);
      })
      .catch(function (err) {
        container.innerHTML = TPQUi.renderError(err.message);
      });
  }

  function paintInsidental(container, periodes) {
    var list = state.insidentalList;
    var total = list.reduce(function (acc, t) { return acc + (Number(t.nominal) || 0); }, 0);
    var esc = TPQUi.escapeHtml;

    var rowsHtml = list.length > 0
      ? list.map(function (t) {
          return (
            '<tr>' +
            '  <td>' + esc(t.tanggal) + '<br><small style="color:var(--text-muted);">' + esc(t.id_transaksi) + '</small></td>' +
            '  <td><strong>' + esc(t.nama_donatur) + '</strong></td>' +
            '  <td>' + esc(t.nomor_rt) + '</td>' +
            '  <td>' + esc(t.tujuan_donasi) + '</td>' +
            '  <td>' + esc(t.metode_pembayaran) + '</td>' +
            '  <td class="text-right"><strong>' + TPQUi.formatRupiah(t.nominal) + '</strong></td>' +
            '  <td>' + esc(t.petugas_nama || '-') + '</td>' +
            '  <td style="white-space:nowrap;">' +
            '    <button class="btn btn-outline btn-sm" data-iact="print" data-id="' + esc(t.id_transaksi) + '">Bukti</button> ' +
            '    <button class="btn btn-outline btn-sm" data-iact="edit" data-id="' + esc(t.id_transaksi) + '">Edit</button> ' +
            '    <button class="btn btn-danger btn-sm" data-iact="del" data-id="' + esc(t.id_transaksi) + '">Hapus</button>' +
            '  </td>' +
            '</tr>'
          );
        }).join('')
      : '<tr><td colspan="8" class="text-center" style="padding:24px;color:var(--text-muted);">Belum ada transaksi donasi insidental tahun ' + state.tahun + '.</td></tr>';

    container.innerHTML =
      '<div class="stats-grid-3" style="margin-bottom:18px;">' +
      '  <div class="stat-card gold"><div class="stat-label">Total Donasi Insidental (' + state.tahun + ')</div><div class="stat-value">' + TPQUi.formatRupiah(total) + '</div></div>' +
      '  <div class="stat-card"><div class="stat-label">Jumlah Transaksi</div><div class="stat-value">' + list.length + '</div></div>' +
      '  <div class="stat-card dark"><div class="stat-label">Keterangan</div><div class="stat-sub" style="margin-top:0;">Sumbangan spontan tanpa target individual &amp; terpisah dari donasi sukarela.</div></div>' +
      '</div>' +
      '<div class="card">' +
      '  <div class="toolbar">' +
      '    <div class="toolbar-group">' +
      '      <input type="number" id="ins-year" value="' + state.tahun + '" style="width:110px;">' +
      '      <button class="btn btn-outline btn-sm" id="ins-reload">Muat Tahun</button>' +
      '    </div>' +
      '    <div class="toolbar-group">' +
      '      <button class="btn btn-outline btn-sm" id="ins-export-excel">Export Excel</button>' +
      '      <button class="btn btn-primary btn-sm" id="ins-btn-add">+ Tambah Donasi Insidental</button>' +
      '    </div>' +
      '  </div>' +
      '  <div class="table-responsive"><table><thead><tr><th>Tanggal</th><th>Donatur</th><th>Wilayah</th><th>Tujuan</th><th>Metode</th><th class="text-right">Nominal</th><th>Petugas</th><th>Aksi</th></tr></thead><tbody id="ins-tbody">' + rowsHtml + '</tbody></table></div>' +
      '</div>';

    document.getElementById('ins-reload').addEventListener('click', function () {
      state.tahun = Number(document.getElementById('ins-year').value) || new Date().getFullYear();
      renderDonasiInsidental(container);
    });
    document.getElementById('ins-btn-add').addEventListener('click', function () {
      openInsidentalModal(null, periodes, container);
    });
    document.getElementById('ins-export-excel').addEventListener('click', function () {
      TPQExport.exportToExcel('Donasi_Insidental_' + state.tahun, 'Laporan Donasi Insidental ' + state.tahun, [
        { label: 'ID Transaksi', key: 'id_transaksi' },
        { label: 'Tanggal', key: 'tanggal' },
        { label: 'Donatur', key: 'nama_donatur' },
        { label: 'Wilayah RT', key: 'nomor_rt' },
        { label: 'Tujuan', key: 'tujuan_donasi' },
        { label: 'Metode', key: 'metode_pembayaran' },
        { label: 'Nominal', key: 'nominal' },
        { label: 'Keterangan', key: 'keterangan' },
        { label: 'Petugas', key: 'petugas_nama' }
      ], list);
    });

    document.getElementById('ins-tbody').addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-iact]');
      if (!btn) return;
      var id = btn.getAttribute('data-id');
      var act = btn.getAttribute('data-iact');
      var trx = list.find(function (t) { return t.id_transaksi === id; });
      if (!trx) return;

      if (act === 'edit') {
        openInsidentalModal(trx, periodes, container);
      } else if (act === 'del') {
        if (!confirm('Hapus transaksi donasi insidental ini?')) return;
        TPQApi.request('admin_donasi_trx_delete', { id_transaksi: id }, { requireAuth: true })
          .then(function () {
            TPQUi.showToast('Transaksi insidental dihapus.');
            renderDonasiInsidental(container);
          })
          .catch(function (err) { TPQUi.showToast(err.message, 'error'); });
      } else if (act === 'print') {
        var html =
          '<div class="report-kop"><div><h2>TPQ NURUL HUDA</h2><p>Bukti Penerimaan Donasi Insidental</p></div></div>' +
          '<table><tbody>' +
          '<tr><td style="width:35%;">No. Transaksi</td><td><strong>' + esc(trx.id_transaksi) + '</strong></td></tr>' +
          '<tr><td>Tanggal</td><td>' + esc(trx.tanggal) + '</td></tr>' +
          '<tr><td>Nama Donatur</td><td>' + esc(trx.nama_donatur) + '</td></tr>' +
          '<tr><td>Wilayah</td><td>' + esc(trx.nomor_rt) + '</td></tr>' +
          '<tr><td>Tujuan Donasi</td><td>' + esc(trx.tujuan_donasi) + '</td></tr>' +
          '<tr><td>Metode Pembayaran</td><td>' + esc(trx.metode_pembayaran) + '</td></tr>' +
          '<tr><td>Nominal Diterima</td><td><strong style="font-size:15px;">' + TPQUi.formatRupiah(trx.nominal) + '</strong></td></tr>' +
          '<tr><td>Keterangan</td><td>' + esc(trx.keterangan || '-') + '</td></tr>' +
          '</tbody></table>' +
          '<div class="report-signature"><div class="report-sign-box"><div>Penerima / Petugas</div><div class="report-sign-line">' + esc(trx.petugas_nama || 'Petugas TPQ') + '</div></div></div>';
        TPQExport.printProfessionalReport(html, 'Bukti_Donasi_' + trx.id_transaksi);
      }
    });
  }

  function openInsidentalModal(editTrx, periodes, container) {
    var esc = TPQUi.escapeHtml;
    var today = new Date().toISOString().slice(0, 10);
    var rtOpts = '<option value="">Umum / Luar Wilayah</option>' + state.rtList.map(function (r) {
      var sel = editTrx && editTrx.id_rt === r.id_rt ? ' selected' : '';
      return '<option value="' + esc(r.id_rt) + '"' + sel + '>' + esc(r.nomor_rt) + '</option>';
    }).join('');
    var perOpts = '<option value="">-- Otomatis / Opsional --</option>' + (periodes || []).map(function (p) {
      var sel = editTrx && editTrx.id_periode === p.id_periode ? ' selected' : '';
      return '<option value="' + esc(p.id_periode) + '"' + sel + '>' + esc(p.nama_periode + ' ' + p.tahun) + '</option>';
    }).join('');

    var body =
      '<div class="form-grid">' +
      '  <div class="form-group"><label for="ins-donatur">Nama Donatur (Opsional / Anonim)</label><input type="text" id="ins-donatur" value="' + esc(editTrx ? editTrx.nama_donatur : '') + '" placeholder="Kosongkan untuk Hamba Allah"></div>' +
      '  <div class="form-group"><label for="ins-tanggal">Tanggal</label><input type="date" id="ins-tanggal" value="' + esc(editTrx ? editTrx.tanggal : today) + '" required></div>' +
      '  <div class="form-group"><label for="ins-nominal">Nominal (Rp)</label><input type="number" id="ins-nominal" min="1000" step="500" value="' + esc(editTrx ? editTrx.nominal : '') + '" required></div>' +
      '  <div class="form-group"><label for="ins-tujuan">Tujuan Donasi</label><input type="text" id="ins-tujuan" value="' + esc(editTrx ? editTrx.tujuan_donasi : 'Operasional TPQ') + '" placeholder="Operasional / Pembangunan / Kegiatan"></div>' +
      '  <div class="form-group"><label for="ins-rt">Wilayah RT (Opsional)</label><select id="ins-rt">' + rtOpts + '</select></div>' +
      '  <div class="form-group"><label for="ins-periode">Periode Bulan (Opsional)</label><select id="ins-periode">' + perOpts + '</select></div>' +
      '  <div class="form-group"><label for="ins-metode">Metode Pembayaran</label><select id="ins-metode"><option value="Tunai">Tunai</option><option value="Transfer Bank">Transfer Bank</option><option value="QRIS">QRIS</option></select></div>' +
      '  <div class="form-group"><label for="ins-ket">Keterangan</label><input type="text" id="ins-ket" value="' + esc(editTrx ? editTrx.keterangan : '') + '"></div>' +
      '</div>';

    var footer = '<button class="btn btn-outline" onclick="TPQUi.closeModal()">Batal</button><button class="btn btn-primary" id="btn-save-ins">Simpan Donasi Insidental</button>';
    TPQUi.openModal(editTrx ? 'Edit Donasi Insidental' : 'Tambah Donasi Insidental', body, footer);
    if (editTrx && editTrx.metode_pembayaran) document.getElementById('ins-metode').value = editTrx.metode_pembayaran;

    document.getElementById('btn-save-ins').addEventListener('click', function () {
      var btn = this;
      btn.disabled = true;
      TPQApi.request('admin_donasi_trx_save', {
        id_transaksi: editTrx ? editTrx.id_transaksi : '',
        kategori: 'INSIDENTAL',
        nama_donatur: document.getElementById('ins-donatur').value,
        tanggal: document.getElementById('ins-tanggal').value,
        nominal: document.getElementById('ins-nominal').value,
        tujuan_donasi: document.getElementById('ins-tujuan').value,
        id_rt: document.getElementById('ins-rt').value,
        id_periode: document.getElementById('ins-periode').value,
        metode_pembayaran: document.getElementById('ins-metode').value,
        keterangan: document.getElementById('ins-ket').value
      }, { requireAuth: true })
        .then(function () {
          TPQUi.closeModal();
          TPQUi.showToast('Donasi insidental berhasil disimpan.');
          renderDonasiInsidental(container);
        })
        .catch(function (err) {
          btn.disabled = false;
          TPQUi.showToast(err.message, 'error');
        });
    });
  }

  /* ==================== 3. PENGATURAN PERIODE DINAMIS (SUPERADMIN) ==================== */

  function renderPeriodeManager(container) {
    container.innerHTML = TPQUi.renderLoading('Memuat daftar periode donasi...');
    TPQApi.request('admin_periode_list', {}, { requireAuth: true })
      .then(function (list) {
        var esc = TPQUi.escapeHtml;
        var rowsHtml = (list || []).map(function (p) {
          return (
            '<tr>' +
            '  <td><strong>' + esc(p.tahun) + '</strong></td>' +
            '  <td>' + esc(p.nama_periode) + (p.is_khusus ? ' <span class="badge badge-gold">Khusus</span>' : '') + '</td>' +
            '  <td class="text-center">' + esc(p.urutan) + '</td>' +
            '  <td>' + TPQUi.statusBadge(p.status) + '</td>' +
            '  <td><button class="btn btn-outline btn-sm" data-pedit="' + esc(p.id_periode) + '">Edit</button></td>' +
            '</tr>'
          );
        }).join('');

        container.innerHTML =
          '<div class="card" style="margin-bottom:18px;border-left:4px solid var(--gold);">' +
          '  <strong>Sistem Periode Dinamis:</strong> Superadmin dapat menambahkan tahun baru (12 bulan otomatis) maupun bulan/periode khusus tanpa mengubah source code dan tanpa menambah kolom Spreadsheet. Data transaksi lama tetap aman.' +
          '</div>' +
          '<div class="card" style="margin-bottom:18px;background:var(--gold-soft);border-color:var(--gold);">' +
          '  <div class="toolbar" style="margin-bottom:0;">' +
          '    <div><strong>Migrasi Aman dari Sheet Lama "Donatur":</strong><br><span style="font-size:0.82rem;color:var(--text-muted);">Jika Spreadsheet Anda masih memiliki sheet lama bernama <code>Donatur</code>, jalankan migrasi idempotent ini untuk menyalin warga, target, dan angsuran lama ke model donasi baru tanpa menghapus sheet lama.</span></div>' +
          '    <div class="toolbar-group">' +
          '      <input type="number" id="mig-old-year" value="' + new Date().getFullYear() + '" min="2020" max="2100" style="width:100px;">' +
          '      <button class="btn btn-gold btn-sm" id="btn-run-migrasi-lama">Jalankan Migrasi Donatur Lama</button>' +
          '    </div>' +
          '  </div>' +
          '</div>' +
          '<div class="card">' +
          '  <div class="toolbar">' +
          '    <div class="toolbar-group">' +
          '      <input type="number" id="per-new-year" value="' + (new Date().getFullYear() + 1) + '" min="2020" max="2100" style="width:120px;">' +
          '      <button class="btn btn-gold btn-sm" id="btn-add-full-year">+ Generate 12 Bulan Tahun Baru</button>' +
          '    </div>' +
          '    <button class="btn btn-primary btn-sm" id="btn-add-single-periode">+ Tambah Periode / Bulan Khusus</button>' +
          '  </div>' +
          '  <div class="table-responsive"><table><thead><tr><th>Tahun</th><th>Nama Periode</th><th class="text-center">Urutan</th><th>Status</th><th>Aksi</th></tr></thead><tbody id="per-tbody">' + rowsHtml + '</tbody></table></div>' +
          '</div>';

        document.getElementById('btn-run-migrasi-lama').addEventListener('click', function () {
          var yr = document.getElementById('mig-old-year').value;
          if (!confirm('Salin data dari sheet lama "Donatur" ke tahun anggaran ' + yr + '? Sheet "Donatur" lama tidak akan dihapus.')) return;
          TPQApi.request('admin_donasi_migrasi_lama', { tahun: yr }, { requireAuth: true })
            .then(function (r) {
              TPQUi.showToast('Migrasi selesai: ' + r.inserted_warga + ' warga, ' + r.inserted_transaksi + ' transaksi, ' + r.inserted_periode + ' periode.');
              renderPeriodeManager(container);
            })
            .catch(function (err) { TPQUi.showToast(err.message, 'error'); });
        });

        document.getElementById('btn-add-full-year').addEventListener('click', function () {
          var yr = document.getElementById('per-new-year').value;
          if (!confirm('Buat otomatis 12 periode bulan (Januari - Desember) untuk tahun ' + yr + '?')) return;
          TPQApi.request('admin_periode_add_year', { tahun: yr }, { requireAuth: true })
            .then(function (r) {
              TPQUi.showToast('Berhasil menambahkan ' + r.inserted + ' periode untuk tahun ' + r.tahun + '.');
              renderPeriodeManager(container);
            })
            .catch(function (err) { TPQUi.showToast(err.message, 'error'); });
        });

        document.getElementById('btn-add-single-periode').addEventListener('click', function () {
          openPeriodeModal(null, container);
        });

        document.getElementById('per-tbody').addEventListener('click', function (e) {
          var btn = e.target.closest('button[data-pedit]');
          if (!btn) return;
          var pid = btn.getAttribute('data-pedit');
          var item = list.find(function (x) { return x.id_periode === pid; });
          if (item) openPeriodeModal(item, container);
        });
      })
      .catch(function (err) {
        container.innerHTML = TPQUi.renderError(err.message);
      });
  }

  function openPeriodeModal(editPer, container) {
    var esc = TPQUi.escapeHtml;
    var body =
      '<div class="form-grid">' +
      '  <div class="form-group"><label for="pm-tahun">Tahun</label><input type="number" id="pm-tahun" value="' + esc(editPer ? editPer.tahun : new Date().getFullYear()) + '" required></div>' +
      '  <div class="form-group"><label for="pm-nama">Nama Periode</label><input type="text" id="pm-nama" value="' + esc(editPer ? editPer.nama_periode : '') + '" placeholder="Contoh: Ramadhan / Januari" required></div>' +
      '  <div class="form-group"><label for="pm-urutan">Urutan Tampilan</label><input type="number" id="pm-urutan" value="' + esc(editPer ? editPer.urutan : 13) + '" min="1"></div>' +
      '  <div class="form-group"><label for="pm-status">Status</label><select id="pm-status"><option value="AKTIF">AKTIF</option><option value="NONAKTIF">NONAKTIF</option></select></div>' +
      '  <div class="form-group full"><label><input type="checkbox" id="pm-khusus"' + (editPer && editPer.is_khusus ? ' checked' : '') + '> Tandai sebagai Periode Khusus</label></div>' +
      '</div>';

    var footer = '<button class="btn btn-outline" onclick="TPQUi.closeModal()">Batal</button><button class="btn btn-primary" id="btn-save-per">Simpan Periode</button>';
    TPQUi.openModal(editPer ? 'Edit Periode Donasi' : 'Tambah Periode Donasi', body, footer);
    if (editPer) document.getElementById('pm-status').value = editPer.status;

    document.getElementById('btn-save-per').addEventListener('click', function () {
      var btn = this;
      btn.disabled = true;
      TPQApi.request('admin_periode_save', {
        id_periode: editPer ? editPer.id_periode : '',
        tahun: document.getElementById('pm-tahun').value,
        nama_periode: document.getElementById('pm-nama').value,
        urutan: document.getElementById('pm-urutan').value,
        status: document.getElementById('pm-status').value,
        is_khusus: document.getElementById('pm-khusus').checked
      }, { requireAuth: true })
        .then(function () {
          TPQUi.closeModal();
          TPQUi.showToast('Periode donasi berhasil disimpan.');
          renderPeriodeManager(container);
        })
        .catch(function (err) {
          btn.disabled = false;
          TPQUi.showToast(err.message, 'error');
        });
    });
  }

  global.TPQAdminDonasi = {
    renderSukarela: renderDonasiSukarela,
    renderInsidental: renderDonasiInsidental,
    renderPeriode: renderPeriodeManager
  };
})(window);
