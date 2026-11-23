/**
 * admin-donasi.js - Modul Admin Sistem Keuangan Donasi Terintegrasi
 * Mencakup: Pengaturan Iuran Target, Data Warga, Penerimaan Iuran Target (klik nama warga -> multi-bulan),
 * Sumbangan Insidental, Riwayat Transaksi, Pengeluaran, dan Saldo Keuangan Tunggal.
 * Portal Digital TPQ Nurul Huda
 */
(function (global) {
  'use strict';

  var BULAN_LIST = [
    { val: 1, name: 'Januari' }, { val: 2, name: 'Februari' }, { val: 3, name: 'Maret' },
    { val: 4, name: 'April' }, { val: 5, name: 'Mei' }, { val: 6, name: 'Juni' },
    { val: 7, name: 'Juli' }, { val: 8, name: 'Agustus' }, { val: 9, name: 'September' },
    { val: 10, name: 'Oktober' }, { val: 11, name: 'November' }, { val: 12, name: 'Desember' }
  ];

  var state = {
    tahun: new Date().getFullYear(),
    filterRt: '',
    search: '',
    matrixData: null
  };

  function statusIuranBadge(st) {
    var s = String(st || '').toUpperCase();
    if (s === 'LUNAS') return '<span class="badge badge-success">LUNAS</span>';
    if (s === 'CICILAN') return '<span class="badge badge-warning">CICILAN</span>';
    return '<span class="badge badge-danger">BELUM BAYAR</span>';
  }

  function bulanOptionsHtml(selectedVal) {
    return BULAN_LIST.map(function (b) {
      return '<option value="' + b.val + '"' + (Number(selectedVal) === b.val ? ' selected' : '') + '>' + b.name + '</option>';
    }).join('');
  }

  /* ==================== 1. PENGATURAN IURAN TARGET ==================== */

  function renderPengaturanIuran(container) {
    container.innerHTML = TPQUi.renderLoading('Memuat pengaturan program iuran target...');
    TPQApi.request('admin_iuran_config_list', {}, { requireAuth: true })
      .then(function (list) {
        var esc = TPQUi.escapeHtml;
        var rows = (list || []).map(function (p) {
          var bMulai = (BULAN_LIST[Number(p.bulan_mulai) - 1] || {}).name || p.bulan_mulai;
          var bAkhir = (BULAN_LIST[Number(p.bulan_akhir) - 1] || {}).name || p.bulan_akhir;
          return (
            '<tr>' +
            '  <td><strong>' + esc(p.nama_program) + '</strong><br><small style="color:var(--text-muted);">' + esc(p.id_program) + '</small></td>' +
            '  <td class="text-right"><strong>' + TPQUi.formatRupiah(p.nominal_target) + '</strong> / bln</td>' +
            '  <td>' + esc(bMulai + ' - ' + bAkhir) + '</td>' +
            '  <td class="text-center"><strong>' + esc(p.tahun) + '</strong></td>' +
            '  <td>' + TPQUi.statusBadge(p.status) + '</td>' +
            '  <td><button class="btn btn-outline btn-sm" data-pedit="' + esc(p.id_program) + '">Edit</button></td>' +
            '</tr>'
          );
        }).join('');

        container.innerHTML =
          '<div class="card" style="margin-bottom:16px;border-left:4px solid var(--gold);">' +
          '  <strong>Catatan Integritas:</strong> Nominal iuran target dan periode bulan dapat diubah sewaktu-waktu oleh Admin <strong>tanpa mengubah transaksi historis</strong> yang sudah tercatat sebelumnya.' +
          '</div>' +
          '<div class="card">' +
          '  <div class="toolbar">' +
          '    <h2 class="card-title" style="margin:0;">Daftar Program Iuran Target</h2>' +
          '    <button class="btn btn-primary btn-sm" id="btn-add-prg">+ Tambah Program Iuran</button>' +
          '  </div>' +
          '  <div class="table-responsive"><table><thead><tr><th>Nama Program</th><th class="text-right">Nominal Target</th><th>Periode Bulan</th><th class="text-center">Tahun</th><th>Status</th><th>Aksi</th></tr></thead><tbody id="prg-tbody">' + (rows || '<tr><td colspan="6" class="text-center">Belum ada program iuran target.</td></tr>') + '</tbody></table></div>' +
          '</div>';

        document.getElementById('btn-add-prg').addEventListener('click', function () { openProgramModal(null, container); });
        document.getElementById('prg-tbody').addEventListener('click', function (e) {
          var btn = e.target.closest('button[data-pedit]');
          if (!btn) return;
          var item = list.find(function (x) { return x.id_program === btn.getAttribute('data-pedit'); });
          if (item) openProgramModal(item, container);
        });
      })
      .catch(function (err) { container.innerHTML = TPQUi.renderError(err.message); });
  }

  function openProgramModal(editP, container) {
    var esc = TPQUi.escapeHtml;
    var body =
      '<div class="form-grid">' +
      '  <div class="form-group full"><label>Nama Program Iuran</label><input type="text" id="pi-nama" value="' + esc(editP ? editP.nama_program : 'Iuran Operasional TPQ Nurul Huda') + '" required></div>' +
      '  <div class="form-group"><label>Nominal Target per Bulan (Rp)</label><input type="number" id="pi-nom" min="1000" step="1000" value="' + esc(editP ? editP.nominal_target : 25000) + '" required></div>' +
      '  <div class="form-group"><label>Tahun Pembayaran</label><input type="number" id="pi-thn" min="2020" max="2100" value="' + esc(editP ? editP.tahun : new Date().getFullYear()) + '" required></div>' +
      '  <div class="form-group"><label>Bulan Mulai</label><select id="pi-bm">' + bulanOptionsHtml(editP ? editP.bulan_mulai : 1) + '</select></div>' +
      '  <div class="form-group"><label>Bulan Berakhir</label><select id="pi-ba">' + bulanOptionsHtml(editP ? editP.bulan_akhir : 12) + '</select></div>' +
      '  <div class="form-group full"><label>Status Program</label><select id="pi-st"><option value="AKTIF">AKTIF</option><option value="NONAKTIF">NONAKTIF</option></select></div>' +
      '</div>';
    var footer = '<button class="btn btn-outline" onclick="TPQUi.closeModal()">Batal</button><button class="btn btn-primary" id="btn-save-prg">Simpan Pengaturan</button>';
    TPQUi.openModal(editP ? 'Edit Pengaturan Iuran Target' : 'Tambah Program Iuran Target', body, footer);
    if (editP) document.getElementById('pi-st').value = editP.status;

    document.getElementById('btn-save-prg').addEventListener('click', function () {
      var btn = this; btn.disabled = true;
      TPQApi.request('admin_iuran_config_save', {
        id_program: editP ? editP.id_program : '',
        nama_program: document.getElementById('pi-nama').value,
        nominal_target: document.getElementById('pi-nom').value,
        tahun: document.getElementById('pi-thn').value,
        bulan_mulai: document.getElementById('pi-bm').value,
        bulan_akhir: document.getElementById('pi-ba').value,
        status: document.getElementById('pi-st').value
      }, { requireAuth: true })
        .then(function () {
          TPQUi.closeModal();
          TPQUi.showToast('Pengaturan iuran target berhasil disimpan.');
          renderPengaturanIuran(container);
        })
        .catch(function (err) { btn.disabled = false; TPQUi.showToast(err.message, 'error'); });
    });
  }

  /* ==================== 2. DATA WARGA (DATA_WARGA) ==================== */

  function renderDataWargaV2(container) {
    container.innerHTML = TPQUi.renderLoading('Memuat database warga...');
    Promise.all([
      TPQApi.request('admin_data_warga_list', {}, { requireAuth: true }),
      TPQApi.request('admin_rt_list', {}, { requireAuth: true })
    ])
      .then(function (res) {
        var list = res[0] || [];
        var rtList = res[1] || [];
        var esc = TPQUi.escapeHtml;

        function paint(filtered) {
          var tbody = document.getElementById('dw-tbody');
          tbody.innerHTML = filtered.length > 0
            ? filtered.map(function (w) {
                return (
                  '<tr>' +
                  '  <td class="text-center"><strong>' + esc(w.nomor) + '</strong></td>' +
                  '  <td><strong>' + esc(w.nama_warga) + '</strong></td>' +
                  '  <td>' + esc(w.nomor_rt) + '</td>' +
                  '  <td>' + esc(w.alamat || '-') + '</td>' +
                  '  <td>' + esc(w.nomor_hp || '-') + '</td>' +
                  '  <td>' + TPQUi.statusBadge(w.status) + '</td>' +
                  '  <td style="white-space:nowrap;">' +
                  '    <button class="btn btn-outline btn-sm" data-dwact="edit" data-id="' + esc(w.id_warga) + '">Edit</button> ' +
                  '    <button class="btn btn-danger btn-sm" data-dwact="del" data-id="' + esc(w.id_warga) + '">Hapus/Nonaktif</button>' +
                  '  </td>' +
                  '</tr>'
                );
              }).join('')
            : '<tr><td colspan="7" class="text-center" style="padding:20px;color:var(--text-muted);">Belum ada data warga. Klik "+ Tambah Warga" untuk memulai.</td></tr>';
        }

        container.innerHTML =
          '<div class="card">' +
          '  <div class="toolbar">' +
          '    <div class="toolbar-group">' +
          '      <input type="search" id="dw-search" placeholder="Cari nama warga..."> ' +
          '      <select id="dw-rt"><option value="">Semua RT</option>' + rtList.map(function (r) { return '<option value="' + esc(r.nomor_rt) + '">' + esc(r.nomor_rt) + '</option>'; }).join('') + '</select>' +
          '    </div>' +
          '    <div class="toolbar-group">' +
          '      <button class="btn btn-outline btn-sm" id="dw-import">Import Excel (CSV)</button>' +
          '      <button class="btn btn-outline btn-sm" id="dw-export">Export Excel</button>' +
          '      <button class="btn btn-primary btn-sm" id="dw-add">+ Tambah Warga</button>' +
          '    </div>' +
          '  </div>' +
          '  <div class="table-responsive"><table><thead><tr><th class="text-center">No</th><th>Nama Warga</th><th>RT</th><th>Alamat</th><th>Nomor HP</th><th>Status</th><th>Aksi</th></tr></thead><tbody id="dw-tbody"></tbody></table></div>' +
          '</div>';

        function applyFilter() {
          var q = document.getElementById('dw-search').value.toLowerCase().trim();
          var rt = document.getElementById('dw-rt').value;
          var f = list.filter(function (w) {
            if (rt && w.nomor_rt !== rt) return false;
            if (q && (w.nama_warga + ' ' + w.nomor_rt + ' ' + w.alamat).toLowerCase().indexOf(q) === -1) return false;
            return true;
          });
          paint(f);
          return f;
        }

        paint(list);
        document.getElementById('dw-search').addEventListener('input', applyFilter);
        document.getElementById('dw-rt').addEventListener('change', applyFilter);
        document.getElementById('dw-add').addEventListener('click', function () { openDataWargaModal(null, rtList, container); });
        document.getElementById('dw-export').addEventListener('click', function () {
          TPQExport.exportToExcel('Data_Warga_TPQ_Nurul_Huda', 'Database Warga TPQ Nurul Huda', [
            { label: 'Nomor', key: 'nomor' },
            { label: 'Nama Warga', key: 'nama_warga' },
            { label: 'RT', key: 'nomor_rt' },
            { label: 'Alamat', key: 'alamat' },
            { label: 'Nomor HP', key: 'nomor_hp' },
            { label: 'Status', key: 'status' }
          ], applyFilter());
        });
        document.getElementById('dw-import').addEventListener('click', function () {
          var body = '<p style="font-size:0.86rem;">Upload file CSV (hasil Save As dari Excel) dengan header: <code>nama_warga,rt,alamat,nomor_hp,status</code></p><input type="file" id="dw-csv-file" accept=".csv,text/csv">';
          var footer = '<button class="btn btn-outline" onclick="TPQUi.closeModal()">Batal</button><button class="btn btn-primary" id="btn-dw-imp-go">Proses Import</button>';
          TPQUi.openModal('Import Data Warga (Excel CSV)', body, footer);
          document.getElementById('btn-dw-imp-go').addEventListener('click', function () {
            var fIn = document.getElementById('dw-csv-file');
            if (!fIn.files || !fIn.files[0]) { TPQUi.showToast('Pilih file CSV terlebih dahulu.', 'warning'); return; }
            var btn = this; btn.disabled = true;
            var rd = new FileReader();
            rd.onload = function () {
              var items = TPQExport.parseCsvText(rd.result);
              TPQApi.request('admin_data_warga_import', { items: items }, { requireAuth: true })
                .then(function (r) { TPQUi.closeModal(); TPQUi.showToast('Import selesai: ' + r.inserted + ' masuk, ' + r.skipped + ' dilewati.'); renderDataWargaV2(container); })
                .catch(function (err) { btn.disabled = false; TPQUi.showToast(err.message, 'error'); });
            };
            rd.readAsText(fIn.files[0]);
          });
        });

        document.getElementById('dw-tbody').addEventListener('click', function (e) {
          var btn = e.target.closest('button[data-dwact]');
          if (!btn) return;
          var item = list.find(function (x) { return x.id_warga === btn.getAttribute('data-id'); });
          if (!item) return;
          if (btn.getAttribute('data-dwact') === 'edit') openDataWargaModal(item, rtList, container);
          else if (confirm('Hapus/nonaktifkan warga "' + item.nama_warga + '"? (Jika sudah memiliki transaksi, warga akan dinonaktifkan agar riwayat tetap aman)')) {
            TPQApi.request('admin_data_warga_delete', { id_warga: item.id_warga }, { requireAuth: true })
              .then(function (r) { TPQUi.showToast(r.message); renderDataWargaV2(container); })
              .catch(function (err) { TPQUi.showToast(err.message, 'error'); });
          }
        });
      })
      .catch(function (err) { container.innerHTML = TPQUi.renderError(err.message); });
  }

  function openDataWargaModal(editW, rtList, container) {
    var esc = TPQUi.escapeHtml;
    var rtOpts = '<option value="">-- Pilih RT --</option>' + rtList.map(function (r) {
      var sel = editW && (editW.id_rt === r.id_rt || editW.nomor_rt === r.nomor_rt) ? ' selected' : '';
      return '<option value="' + esc(r.nomor_rt) + '"' + sel + '>' + esc(r.nomor_rt) + '</option>';
    }).join('');
    var body =
      '<div class="form-grid">' +
      '  <div class="form-group"><label>Nama Warga</label><input type="text" id="dwm-nama" value="' + esc(editW ? editW.nama_warga : '') + '" required></div>' +
      '  <div class="form-group"><label>RT</label><select id="dwm-rt" required>' + rtOpts + '</select></div>' +
      '  <div class="form-group full"><label>Alamat (Opsional)</label><input type="text" id="dwm-al" value="' + esc(editW ? editW.alamat : '') + '"></div>' +
      '  <div class="form-group"><label>Nomor HP (Opsional)</label><input type="text" id="dwm-hp" value="' + esc(editW ? editW.nomor_hp : '') + '"></div>' +
      '  <div class="form-group"><label>Status</label><select id="dwm-st"><option value="AKTIF">AKTIF</option><option value="NONAKTIF">NONAKTIF</option></select></div>' +
      '</div>';
    var footer = '<button class="btn btn-outline" onclick="TPQUi.closeModal()">Batal</button><button class="btn btn-primary" id="btn-dwm-save">Simpan Warga</button>';
    TPQUi.openModal(editW ? 'Edit Data Warga' : 'Tambah Data Warga', body, footer);
    if (editW) document.getElementById('dwm-st').value = editW.status;

    document.getElementById('btn-dwm-save').addEventListener('click', function () {
      var btn = this; btn.disabled = true;
      TPQApi.request('admin_data_warga_save', {
        id_warga: editW ? editW.id_warga : '',
        nama_warga: document.getElementById('dwm-nama').value,
        nomor_rt: document.getElementById('dwm-rt').value,
        alamat: document.getElementById('dwm-al').value,
        nomor_hp: document.getElementById('dwm-hp').value,
        status: document.getElementById('dwm-st').value
      }, { requireAuth: true })
        .then(function () { TPQUi.closeModal(); TPQUi.showToast('Data warga tersimpan.'); renderDataWargaV2(container); })
        .catch(function (err) { btn.disabled = false; TPQUi.showToast(err.message, 'error'); });
    });
  }

  /* ==================== 3. PENERIMAAN IURAN TARGET (KLIK NAMA WARGA -> MULTI-BULAN) ==================== */

  function renderPenerimaanIuran(container) {
    container.innerHTML = TPQUi.renderLoading('Memuat daftar warga & status Iuran Target...');
    Promise.all([
      TPQApi.request('admin_iuran_matrix', { tahun: state.tahun }, { requireAuth: true }),
      TPQApi.request('admin_saldo_get', { tahun: state.tahun }, { requireAuth: true }),
      TPQApi.request('admin_rt_list', {}, { requireAuth: true })
    ])
      .then(function (res) {
        state.matrixData = res[0];
        var saldo = res[1] || {};
        var rtList = res[2] || [];
        paintPenerimaanIuran(container, saldo, rtList);
      })
      .catch(function (err) { container.innerHTML = TPQUi.renderError(err.message); });
  }

  function paintPenerimaanIuran(container, saldo, rtList) {
    var mData = state.matrixData;
    var prog = mData.program_aktif || {};
    var months = mData.months || [];
    var rows = mData.rows || [];
    var rw = mData.ringkasan_warga || {};
    var esc = TPQUi.escapeHtml;

    var monthHeaders = months.map(function (m) {
      return '<th class="text-center">' + esc(m.nama_bulan.slice(0, 3)) + '</th>';
    }).join('');

    container.innerHTML =
      '<div class="stats-grid" style="margin-bottom:16px;">' +
      '  <div class="stat-card"><div class="stat-label">Program Aktif (' + esc(mData.tahun) + ')</div><div class="stat-value" style="font-size:1.1rem;">' + esc(prog.nama_program || '-') + '</div><div class="stat-sub">Target: ' + TPQUi.formatRupiah(prog.nominal_target || 0) + ' / bulan</div></div>' +
      '  <div class="stat-card gold"><div class="stat-label">Total Iuran Target Masuk</div><div class="stat-value" style="font-size:1.3rem;">' + TPQUi.formatRupiah(saldo.periode_iuran_target) + '</div><div class="stat-sub">Otomatis terhubung ke Saldo Utama</div></div>' +
      '  <div class="stat-card info"><div class="stat-label">Warga Sudah Membayar</div><div class="stat-value">' + TPQUi.formatNumber(rw.warga_sudah_membayar) + ' / ' + TPQUi.formatNumber(rw.jumlah_warga) + '</div><div class="stat-sub">Belum bayar: ' + TPQUi.formatNumber(rw.warga_belum_membayar) + ' warga</div></div>' +
      '  <div class="stat-card dark"><div class="stat-label">Saldo Akhir Kas Donasi</div><div class="stat-value" style="font-size:1.3rem;">' + TPQUi.formatRupiah(saldo.saldo_akhir) + '</div><div class="stat-sub">Konsisten Admin &amp; Publik</div></div>' +
      '</div>' +

      '<div class="card">' +
      '  <div style="margin-bottom:12px;padding:10px 14px;background:var(--primary-soft);border-radius:8px;font-size:0.86rem;color:var(--primary-dark);">' +
      '    <strong>Cara Cepat Mencatat Pembayaran:</strong> Klik langsung <strong>Nama Warga</strong> pada tabel di bawah untuk memilih 1 atau beberapa bulan pembayaran sekaligus, menyesuaikan nominal aktual, dan menyimpan ke Saldo Utama.' +
      '  </div>' +
      '  <div class="toolbar">' +
      '    <div class="toolbar-group">' +
      '      <input type="number" id="iur-year" value="' + state.tahun + '" min="2020" max="2100" style="width:100px;">' +
      '      <button class="btn btn-outline btn-sm" id="iur-load-year">Muat Tahun</button>' +
      '      <select id="iur-rt"><option value="">Semua RT</option>' + rtList.map(function (r) { return '<option value="' + esc(r.nomor_rt) + '"' + (state.filterRt === r.nomor_rt ? ' selected' : '') + '>' + esc(r.nomor_rt) + '</option>'; }).join('') + '</select>' +
      '      <input type="search" id="iur-search" value="' + esc(state.search) + '" placeholder="Cari nama warga..." style="min-width:190px;">' +
      '    </div>' +
      '    <button class="btn btn-outline btn-sm" id="iur-export">Export Excel</button>' +
      '  </div>' +
      '  <div class="table-responsive">' +
      '    <table>' +
      '      <thead><tr><th class="text-center">No</th><th>Nama Warga (Klik untuk Bayar)</th><th>RT</th>' + monthHeaders + '<th class="text-right">Total Bayar</th><th>Aksi</th></tr></thead>' +
      '      <tbody id="iur-tbody"></tbody>' +
      '    </table>' +
      '  </div>' +
      '</div>';

    function paintRows() {
      var q = document.getElementById('iur-search').value.toLowerCase().trim();
      var rt = document.getElementById('iur-rt').value;
      state.search = q; state.filterRt = rt;

      var filtered = rows.filter(function (w) {
        if (rt && w.nomor_rt !== rt) return false;
        if (q && (w.nama_warga + ' ' + w.nomor_rt).toLowerCase().indexOf(q) === -1) return false;
        return true;
      });

      var tbody = document.getElementById('iur-tbody');
      tbody.innerHTML = filtered.length > 0
        ? filtered.map(function (w) {
            var mCells = (w.detail_bulan || []).map(function (db) {
              return '<td class="text-center">' + statusIuranBadge(db.status) + '</td>';
            }).join('');
            return (
              '<tr>' +
              '  <td class="text-center">' + esc(w.nomor) + '</td>' +
              '  <td><a href="javascript:void(0)" data-pay-warga="' + esc(w.id_warga) + '" style="font-weight:800;color:var(--primary-dark);text-decoration:underline;">' + esc(w.nama_warga) + '</a></td>' +
              '  <td>' + esc(w.nomor_rt) + '</td>' +
              mCells +
              '  <td class="text-right"><strong>' + TPQUi.formatRupiah(w.total_dibayar) + '</strong></td>' +
              '  <td style="white-space:nowrap;"><button class="btn btn-primary btn-sm" data-pay-warga="' + esc(w.id_warga) + '">+ Bayar</button> <button class="btn btn-outline btn-sm" data-hist-warga="' + esc(w.id_warga) + '">Riwayat</button></td>' +
              '</tr>'
            );
          }).join('')
        : '<tr><td colspan="' + (5 + months.length) + '" class="text-center" style="padding:24px;color:var(--text-muted);">Belum ada warga terdaftar. Tambahkan warga di menu <strong>Data Warga</strong> terlebih dahulu.</td></tr>';
      return filtered;
    }

    paintRows();
    document.getElementById('iur-search').addEventListener('input', paintRows);
    document.getElementById('iur-rt').addEventListener('change', paintRows);
    document.getElementById('iur-load-year').addEventListener('click', function () {
      state.tahun = Number(document.getElementById('iur-year').value) || new Date().getFullYear();
      renderPenerimaanIuran(container);
    });
    document.getElementById('iur-export').addEventListener('click', function () {
      var f = paintRows();
      var cols = [{ label: 'No', key: 'nomor' }, { label: 'Nama Warga', key: 'nama_warga' }, { label: 'RT', key: 'nomor_rt' }]
        .concat(months.map(function (m) {
          return { label: m.nama_bulan, value: function (w) { return (w.status_per_bulan && w.status_per_bulan[m.bulan]) || 'BELUM BAYAR'; } };
        }))
        .concat([{ label: 'Total Pembayaran', key: 'total_dibayar' }]);
      TPQExport.exportToExcel('Iuran_Target_' + state.tahun, 'Rekap Iuran Target ' + state.tahun, cols, f);
    });

    document.getElementById('iur-tbody').addEventListener('click', function (e) {
      var payEl = e.target.closest('[data-pay-warga]');
      if (payEl) {
        var wObj = rows.find(function (x) { return x.id_warga === payEl.getAttribute('data-pay-warga'); });
        if (wObj) openBayarIuranModal(wObj, container);
        return;
      }
      var histEl = e.target.closest('[data-hist-warga]');
      if (histEl) {
        var wObj2 = rows.find(function (x) { return x.id_warga === histEl.getAttribute('data-hist-warga'); });
        if (wObj2) openRiwayatIuranWargaModal(wObj2, container);
      }
    });
  }

  /**
   * Modal Transaksi Penerimaan Iuran Target (Multi-bulan + Cicilan + Nominal Aktual Fleksibel)
   */
  function openBayarIuranModal(warga, container) {
    var esc = TPQUi.escapeHtml;
    var today = new Date().toISOString().slice(0, 10);
    var detailBulan = warga.detail_bulan || [];

    var monthChecklist = detailBulan.map(function (db) {
      var isLunas = db.status === 'LUNAS';
      var defaultPay = db.sisa > 0 ? db.sisa : db.nominal_target;
      return (
        '<tr>' +
        '  <td class="text-center"><input type="checkbox" class="iur-m-cb" data-bulan="' + db.bulan + '"' + (isLunas ? ' disabled' : '') + '></td>' +
        '  <td><strong>' + esc(db.nama_bulan) + ' ' + state.tahun + '</strong></td>' +
        '  <td>' + statusIuranBadge(db.status) + '</td>' +
        '  <td class="text-right">' + TPQUi.formatRupiah(db.nominal_target) + '</td>' +
        '  <td class="text-right">' + TPQUi.formatRupiah(db.nominal_dibayar) + '</td>' +
        '  <td><input type="number" class="iur-m-nom" data-bulan="' + db.bulan + '" min="500" step="500" value="' + defaultPay + '"' + (isLunas ? ' disabled' : '') + ' style="padding:6px 8px;width:130px;"></td>' +
        '</tr>'
      );
    }).join('');

    var body =
      '<div style="padding:12px;background:var(--primary-soft);border-radius:8px;margin-bottom:14px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;">' +
      '  <div><strong>' + esc(warga.nama_warga) + '</strong> (' + esc(warga.nomor_rt) + ')</div>' +
      '  <div>Target Berlaku: <strong>' + TPQUi.formatRupiah(warga.nominal_target) + ' / bulan</strong></div>' +
      '</div>' +
      '<p style="font-size:0.82rem;color:var(--text-muted);margin:0 0 10px;">Centang satu atau beberapa bulan yang dibayarkan. Anda dapat menyesuaikan nominal aktual (untuk cicilan atau pembayaran lebih).</p>' +
      '<div class="table-responsive" style="margin-bottom:14px;"><table><thead><tr><th class="text-center">Pilih</th><th>Bulan</th><th>Status</th><th class="text-right">Target</th><th class="text-right">Sudah Bayar</th><th>Nominal Aktual (Rp)</th></tr></thead><tbody>' + monthChecklist + '</tbody></table></div>' +
      '<div class="form-grid">' +
      '  <div class="form-group"><label>Tanggal Penerimaan</label><input type="date" id="pay-tgl" value="' + today + '" required></div>' +
      '  <div class="form-group"><label>Keterangan (Opsional)</label><input type="text" id="pay-ket" placeholder="Contoh: Bayar tunai / transfer"></div>' +
      '</div>' +
      '<div style="padding:10px 14px;background:var(--gold-soft);border-radius:8px;font-weight:700;display:flex;justify-content:space-between;"><span>Total Pembayaran Dipilih:</span><span id="pay-grand-total">Rp0</span></div>';

    var footer = '<button class="btn btn-outline" onclick="TPQUi.closeModal()">Batal</button><button class="btn btn-primary" id="btn-submit-iuran">SIMPAN PEMBAYARAN</button>';
    TPQUi.openModal('Penerimaan Iuran Target — ' + warga.nama_warga, body, footer, true);

    function recalcTotal() {
      var tot = 0;
      document.querySelectorAll('.iur-m-cb:checked').forEach(function (cb) {
        var b = cb.getAttribute('data-bulan');
        var inp = document.querySelector('.iur-m-nom[data-bulan="' + b + '"]');
        tot += Number(inp ? inp.value : 0) || 0;
      });
      document.getElementById('pay-grand-total').textContent = TPQUi.formatRupiah(tot);
    }

    document.querySelectorAll('.iur-m-cb, .iur-m-nom').forEach(function (el) {
      el.addEventListener('change', recalcTotal);
      el.addEventListener('input', recalcTotal);
    });

    document.getElementById('btn-submit-iuran').addEventListener('click', function () {
      var items = [];
      document.querySelectorAll('.iur-m-cb:checked').forEach(function (cb) {
        var b = Number(cb.getAttribute('data-bulan'));
        var inp = document.querySelector('.iur-m-nom[data-bulan="' + b + '"]');
        items.push({ bulan: b, nominal_aktual: Number(inp ? inp.value : 0) });
      });
      if (items.length === 0) {
        TPQUi.showToast('Pilih minimal satu bulan pembayaran.', 'warning');
        return;
      }
      var btn = this; btn.disabled = true; btn.textContent = 'Menyimpan...';
      TPQApi.request('admin_iuran_pay', {
        id_warga: warga.id_warga,
        tahun: state.tahun,
        tanggal_bayar: document.getElementById('pay-tgl').value,
        keterangan: document.getElementById('pay-ket').value,
        items: items
      }, { requireAuth: true })
        .then(function (r) {
          TPQUi.closeModal();
          TPQUi.showToast('Berhasil menyimpan ' + r.saved_count + ' bulan pembayaran & memperbarui Saldo Utama.');
          renderPenerimaanIuran(container);
        })
        .catch(function (err) {
          btn.disabled = false; btn.textContent = 'SIMPAN PEMBAYARAN';
          TPQUi.showToast(err.message, 'error');
        });
    });
  }

  function openRiwayatIuranWargaModal(warga, container) {
    var esc = TPQUi.escapeHtml;
    var trx = warga.transaksi || [];
    var rows = trx.map(function (t) {
      return (
        '<tr>' +
        '  <td>' + esc(t.tanggal_bayar) + '</td>' +
        '  <td><strong>' + esc(t.nama_bulan + ' ' + t.tahun) + '</strong></td>' +
        '  <td class="text-right">' + TPQUi.formatRupiah(t.nominal_target) + '</td>' +
        '  <td class="text-right"><strong>' + TPQUi.formatRupiah(t.nominal_aktual) + '</strong></td>' +
        '  <td>' + esc(t.admin_nama || '-') + '</td>' +
        '  <td style="white-space:nowrap;">' +
        '    <button class="btn btn-outline btn-sm" data-iract="edit" data-id="' + esc(t.id_transaksi) + '">Edit</button> ' +
        '    <button class="btn btn-danger btn-sm" data-iract="cancel" data-id="' + esc(t.id_transaksi) + '">Batalkan</button>' +
        '  </td>' +
        '</tr>'
      );
    }).join('');

    var body = '<div class="table-responsive"><table><thead><tr><th>Tgl Bayar</th><th>Bulan</th><th class="text-right">Target</th><th class="text-right">Aktual</th><th>Admin</th><th>Aksi</th></tr></thead><tbody id="ir-hist-tbody">' + (rows || '<tr><td colspan="6" class="text-center">Belum ada pembayaran pada tahun ' + state.tahun + '.</td></tr>') + '</tbody></table></div>';
    TPQUi.openModal('Riwayat Pembayaran Iuran — ' + warga.nama_warga, body, '<button class="btn btn-outline" onclick="TPQUi.closeModal()">Tutup</button>', true);

    document.getElementById('ir-hist-tbody').addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-iract]');
      if (!btn) return;
      var id = btn.getAttribute('data-id');
      var item = trx.find(function (x) { return x.id_transaksi === id; });
      if (!item) return;

      if (btn.getAttribute('data-iract') === 'cancel') {
        if (!confirm('Batalkan pembayaran ' + item.nama_bulan + ' sebesar ' + TPQUi.formatRupiah(item.nominal_aktual) + '? Saldo utama akan otomatis dikoreksi.')) return;
        TPQApi.request('admin_iuran_cancel', { id_transaksi: id }, { requireAuth: true })
          .then(function () { TPQUi.closeModal(); TPQUi.showToast('Transaksi dibatalkan & saldo dikoreksi.'); renderPenerimaanIuran(container); })
          .catch(function (err) { TPQUi.showToast(err.message, 'error'); });
      } else {
        var newNom = prompt('Masukkan nominal aktual baru (Rp) untuk ' + item.nama_bulan + ':', item.nominal_aktual);
        if (!newNom || Number(newNom) <= 0) return;
        TPQApi.request('admin_iuran_update', { id_transaksi: id, nominal_aktual: Number(newNom) }, { requireAuth: true })
          .then(function () { TPQUi.closeModal(); TPQUi.showToast('Nominal diperbarui & saldo otomatis disinkronkan.'); renderPenerimaanIuran(container); })
          .catch(function (err) { TPQUi.showToast(err.message, 'error'); });
      }
    });
  }

  /* ==================== 4. SUMBANGAN INSIDENTAL ==================== */

  function renderSumbanganInsidental(container) {
    container.innerHTML = TPQUi.renderLoading('Memuat data Sumbangan Insidental...');
    Promise.all([
      TPQApi.request('admin_insidental_v2_list', { tahun: state.tahun }, { requireAuth: true }),
      TPQApi.request('admin_rt_list', {}, { requireAuth: true })
    ])
      .then(function (res) {
        var list = res[0] || [];
        var rtList = res[1] || [];
        var esc = TPQUi.escapeHtml;
        var total = list.reduce(function (a, b) { return a + (Number(b.nominal) || 0); }, 0);

        var rows = list.map(function (t) {
          return (
            '<tr>' +
            '  <td>' + esc(t.tanggal_penerimaan) + '<br><small style="color:var(--text-muted);">' + esc(t.nama_bulan + ' ' + t.tahun) + '</small></td>' +
            '  <td><strong>' + esc(t.nama_penyumbang) + '</strong></td>' +
            '  <td>' + esc(t.nomor_rt || 'Umum') + '</td>' +
            '  <td class="text-right"><strong>' + TPQUi.formatRupiah(t.nominal) + '</strong></td>' +
            '  <td>' + esc(t.keterangan || '-') + '</td>' +
            '  <td>' + esc(t.admin_nama || '-') + '</td>' +
            '  <td style="white-space:nowrap;">' +
            '    <button class="btn btn-outline btn-sm" data-inact="edit" data-id="' + esc(t.id_transaksi) + '">Edit</button> ' +
            '    <button class="btn btn-danger btn-sm" data-inact="cancel" data-id="' + esc(t.id_transaksi) + '">Hapus</button>' +
            '  </td>' +
            '</tr>'
          );
        }).join('');

        container.innerHTML =
          '<div class="stats-grid-3" style="margin-bottom:16px;">' +
          '  <div class="stat-card gold"><div class="stat-label">Total Sumbangan Insidental (' + state.tahun + ')</div><div class="stat-value">' + TPQUi.formatRupiah(total) + '</div></div>' +
          '  <div class="stat-card"><div class="stat-label">Jumlah Transaksi</div><div class="stat-value">' + list.length + '</div></div>' +
          '  <div class="stat-card dark"><div class="stat-label">Integrasi Kas</div><div class="stat-sub" style="margin-top:0;">Otomatis masuk ke Saldo Keuangan Utama.</div></div>' +
          '</div>' +
          '<div class="card">' +
          '  <div class="toolbar">' +
          '    <div class="toolbar-group"><input type="number" id="in2-year" value="' + state.tahun + '" style="width:100px;"><button class="btn btn-outline btn-sm" id="in2-reload">Muat Tahun</button></div>' +
          '    <div class="toolbar-group"><button class="btn btn-outline btn-sm" id="in2-export">Export Excel</button><button class="btn btn-primary btn-sm" id="in2-add">+ TAMBAH SUMBANGAN</button></div>' +
          '  </div>' +
          '  <div class="table-responsive"><table><thead><tr><th>Tgl / Bulan</th><th>Nama Penyumbang</th><th>RT</th><th class="text-right">Nominal</th><th>Keterangan / Peruntukan</th><th>Admin</th><th>Aksi</th></tr></thead><tbody id="in2-tbody">' + (rows || '<tr><td colspan="7" class="text-center" style="padding:20px;color:var(--text-muted);">Belum ada sumbangan insidental pada tahun ' + state.tahun + '.</td></tr>') + '</tbody></table></div>' +
          '</div>';

        document.getElementById('in2-reload').addEventListener('click', function () {
          state.tahun = Number(document.getElementById('in2-year').value) || new Date().getFullYear();
          renderSumbanganInsidental(container);
        });
        document.getElementById('in2-add').addEventListener('click', function () { openInsidentalV2Modal(null, rtList, container); });
        document.getElementById('in2-export').addEventListener('click', function () {
          TPQExport.exportToExcel('Sumbangan_Insidental_' + state.tahun, 'Sumbangan Insidental ' + state.tahun, [
            { label: 'ID', key: 'id_transaksi' }, { label: 'Tanggal', key: 'tanggal_penerimaan' },
            { label: 'Bulan', key: 'nama_bulan' }, { label: 'Nama Penyumbang', key: 'nama_penyumbang' },
            { label: 'RT', key: 'nomor_rt' }, { label: 'Nominal', key: 'nominal' },
            { label: 'Keterangan', key: 'keterangan' }, { label: 'Admin', key: 'admin_nama' }
          ], list);
        });
        document.getElementById('in2-tbody').addEventListener('click', function (e) {
          var btn = e.target.closest('button[data-inact]');
          if (!btn) return;
          var item = list.find(function (x) { return x.id_transaksi === btn.getAttribute('data-id'); });
          if (!item) return;
          if (btn.getAttribute('data-inact') === 'edit') openInsidentalV2Modal(item, rtList, container);
          else if (confirm('Batalkan/hapus sumbangan dari "' + item.nama_penyumbang + '" sebesar ' + TPQUi.formatRupiah(item.nominal) + '? Saldo utama akan otomatis dikoreksi.')) {
            TPQApi.request('admin_insidental_v2_cancel', { id_transaksi: item.id_transaksi }, { requireAuth: true })
              .then(function () { TPQUi.showToast('Sumbangan dibatalkan & saldo dikoreksi.'); renderSumbanganInsidental(container); })
              .catch(function (err) { TPQUi.showToast(err.message, 'error'); });
          }
        });
      })
      .catch(function (err) { container.innerHTML = TPQUi.renderError(err.message); });
  }

  function openInsidentalV2Modal(editT, rtList, container) {
    var esc = TPQUi.escapeHtml;
    var today = new Date().toISOString().slice(0, 10);
    var rtOpts = '<option value="Umum">Umum / Non-Warga</option>' + rtList.map(function (r) {
      var sel = editT && editT.nomor_rt === r.nomor_rt ? ' selected' : '';
      return '<option value="' + esc(r.nomor_rt) + '"' + sel + '>' + esc(r.nomor_rt) + '</option>';
    }).join('');
    var body =
      '<div class="form-grid">' +
      '  <div class="form-group full"><label>Nama Penyumbang (Warga atau Umum)</label><input type="text" id="inm-nama" value="' + esc(editT ? editT.nama_penyumbang : '') + '" placeholder="Contoh: Bapak Ahmad / Hamba Allah" required></div>' +
      '  <div class="form-group"><label>Tanggal Penerimaan</label><input type="date" id="inm-tgl" value="' + esc(editT ? editT.tanggal_penerimaan : today) + '" required></div>' +
      '  <div class="form-group"><label>Bulan Penerimaan</label><select id="inm-bln">' + bulanOptionsHtml(editT ? editT.bulan : (new Date().getMonth() + 1)) + '</select></div>' +
      '  <div class="form-group"><label>Nominal Sumbangan (Rp)</label><input type="number" id="inm-nom" min="1000" step="1000" value="' + esc(editT ? editT.nominal : '') + '" required></div>' +
      '  <div class="form-group"><label>Wilayah RT (Opsional)</label><select id="inm-rt">' + rtOpts + '</select></div>' +
      '  <div class="form-group full"><label>Keterangan / Peruntukan</label><input type="text" id="inm-ket" value="' + esc(editT ? editT.keterangan : '') + '" placeholder="Contoh: Bantuan operasional / pembangunan"></div>' +
      '</div>';
    var footer = '<button class="btn btn-outline" onclick="TPQUi.closeModal()">Batal</button><button class="btn btn-primary" id="btn-inm-save">SIMPAN</button>';
    TPQUi.openModal(editT ? 'Edit Sumbangan Insidental' : 'Tambah Sumbangan Insidental', body, footer);

    document.getElementById('btn-inm-save').addEventListener('click', function () {
      var btn = this; btn.disabled = true;
      TPQApi.request('admin_insidental_v2_save', {
        id_transaksi: editT ? editT.id_transaksi : '',
        nama_penyumbang: document.getElementById('inm-nama').value,
        tanggal_penerimaan: document.getElementById('inm-tgl').value,
        bulan: document.getElementById('inm-bln').value,
        nominal: document.getElementById('inm-nom').value,
        nomor_rt: document.getElementById('inm-rt').value,
        keterangan: document.getElementById('inm-ket').value
      }, { requireAuth: true })
        .then(function () { TPQUi.closeModal(); TPQUi.showToast('Sumbangan insidental disimpan & Saldo Utama diperbarui.'); renderSumbanganInsidental(container); })
        .catch(function (err) { btn.disabled = false; TPQUi.showToast(err.message, 'error'); });
    });
  }

  /* ==================== 5. RIWAYAT TRANSAKSI KEUANGAN ==================== */

  function renderRiwayatTransaksi(container) {
    container.innerHTML = TPQUi.renderLoading('Memuat riwayat transaksi keuangan...');
    TPQApi.request('admin_riwayat_keuangan', { tahun: state.tahun, include_cancelled: true }, { requireAuth: true })
      .then(function (list) {
        var esc = TPQUi.escapeHtml;
        function paint(filtered) {
          document.getElementById('rw-tbody').innerHTML = filtered.length > 0
            ? filtered.map(function (k) {
                var isMasuk = k.jenis === 'MASUK';
                return (
                  '<tr>' +
                  '  <td>' + esc(k.tanggal) + '<br><small style="color:var(--text-muted);">' + esc(k.id_keuangan) + '</small></td>' +
                  '  <td><span class="badge ' + (isMasuk ? 'badge-success' : 'badge-danger') + '">' + esc(k.sumber_dana) + '</span></td>' +
                  '  <td>' + esc(k.deskripsi) + '</td>' +
                  '  <td class="text-right" style="font-weight:700;color:' + (isMasuk ? 'var(--primary-dark)' : 'var(--danger)') + ';">' + (isMasuk ? '+' : '-') + ' ' + TPQUi.formatRupiah(k.nominal) + '</td>' +
                  '  <td>' + esc(k.admin_nama || '-') + '</td>' +
                  '  <td>' + TPQUi.statusBadge(k.status) + '</td>' +
                  '</tr>'
                );
              }).join('')
            : '<tr><td colspan="6" class="text-center">Belum ada riwayat transaksi.</td></tr>';
        }
        container.innerHTML =
          '<div class="card">' +
          '  <div class="toolbar">' +
          '    <div class="toolbar-group">' +
          '      <select id="rw-sumber"><option value="">Semua Kategori</option><option value="IURAN_TARGET">Iuran Target</option><option value="SUMBANGAN_INSIDENTAL">Sumbangan Insidental</option><option value="PENGELUARAN">Pengeluaran</option></select>' +
          '      <select id="rw-bulan"><option value="">Semua Bulan</option>' + bulanOptionsHtml(0) + '</select>' +
          '    </div>' +
          '    <button class="btn btn-outline btn-sm" id="rw-export">Export Excel</button>' +
          '  </div>' +
          '  <div class="table-responsive"><table><thead><tr><th>Tanggal &amp; ID</th><th>Sumber Dana</th><th>Deskripsi</th><th class="text-right">Nominal</th><th>Admin</th><th>Status</th></tr></thead><tbody id="rw-tbody"></tbody></table></div>' +
          '</div>';

        function applyF() {
          var s = document.getElementById('rw-sumber').value;
          var b = document.getElementById('rw-bulan').value;
          var f = (list || []).filter(function (k) {
            if (s && k.sumber_dana !== s) return false;
            if (b && String(k.bulan) !== b) return false;
            return true;
          });
          paint(f); return f;
        }
        paint(list || []);
        document.getElementById('rw-sumber').addEventListener('change', applyF);
        document.getElementById('rw-bulan').addEventListener('change', applyF);
        document.getElementById('rw-export').addEventListener('click', function () {
          TPQExport.exportToExcel('Riwayat_Keuangan_' + state.tahun, 'Riwayat Transaksi Keuangan ' + state.tahun, [
            { label: 'ID Keuangan', key: 'id_keuangan' }, { label: 'Tanggal', key: 'tanggal' },
            { label: 'Sumber Dana', key: 'sumber_dana' }, { label: 'Jenis', key: 'jenis' },
            { label: 'Deskripsi', key: 'deskripsi' }, { label: 'Nominal', key: 'nominal' },
            { label: 'Admin', key: 'admin_nama' }, { label: 'Status', key: 'status' }
          ], applyF());
        });
      })
      .catch(function (err) { container.innerHTML = TPQUi.renderError(err.message); });
  }

  /* ==================== 6. PENGELUARAN ==================== */

  function renderPengeluaran(container) {
    container.innerHTML = TPQUi.renderLoading('Memuat data pengeluaran...');
    TPQApi.request('admin_pengeluaran_list', { tahun: state.tahun }, { requireAuth: true })
      .then(function (list) {
        var esc = TPQUi.escapeHtml;
        var total = (list || []).reduce(function (a, b) { return a + (Number(b.nominal) || 0); }, 0);
        var rows = (list || []).map(function (p) {
          return (
            '<tr>' +
            '  <td>' + esc(p.tanggal) + '</td>' +
            '  <td><strong>' + esc(p.kategori) + '</strong></td>' +
            '  <td>' + esc(p.keterangan || '-') + '</td>' +
            '  <td class="text-right" style="color:var(--danger);font-weight:700;">- ' + TPQUi.formatRupiah(p.nominal) + '</td>' +
            '  <td>' + esc(p.admin_nama || '-') + '</td>' +
            '  <td style="white-space:nowrap;"><button class="btn btn-outline btn-sm" data-oact="edit" data-id="' + esc(p.id_pengeluaran) + '">Edit</button> <button class="btn btn-danger btn-sm" data-oact="del" data-id="' + esc(p.id_pengeluaran) + '">Hapus</button></td>' +
            '</tr>'
          );
        }).join('');

        container.innerHTML =
          '<div class="stats-grid-3" style="margin-bottom:16px;">' +
          '  <div class="stat-card" style="border-top-color:var(--danger);"><div class="stat-label">Total Pengeluaran (' + state.tahun + ')</div><div class="stat-value" style="color:var(--danger);">' + TPQUi.formatRupiah(total) + '</div></div>' +
          '  <div class="stat-card"><div class="stat-label">Jumlah Transaksi</div><div class="stat-value">' + (list || []).length + '</div></div>' +
          '  <div class="stat-card dark"><div class="stat-label">Integrasi Saldo</div><div class="stat-sub" style="margin-top:0;">Otomatis mengurangi Saldo Keuangan Utama.</div></div>' +
          '</div>' +
          '<div class="card">' +
          '  <div class="toolbar"><h2 class="card-title" style="margin:0;">Daftar Pengeluaran TPQ</h2><button class="btn btn-primary btn-sm" id="btn-add-out">+ Catat Pengeluaran</button></div>' +
          '  <div class="table-responsive"><table><thead><tr><th>Tanggal</th><th>Kategori</th><th>Keterangan</th><th class="text-right">Nominal</th><th>Admin</th><th>Aksi</th></tr></thead><tbody id="out-tbody">' + (rows || '<tr><td colspan="6" class="text-center">Belum ada pengeluaran tercatat.</td></tr>') + '</tbody></table></div>' +
          '</div>';

        document.getElementById('btn-add-out').addEventListener('click', function () { openPengeluaranModal(null, container); });
        document.getElementById('out-tbody').addEventListener('click', function (e) {
          var btn = e.target.closest('button[data-oact]');
          if (!btn) return;
          var item = list.find(function (x) { return x.id_pengeluaran === btn.getAttribute('data-id'); });
          if (!item) return;
          if (btn.getAttribute('data-oact') === 'edit') openPengeluaranModal(item, container);
          else if (confirm('Batalkan pengeluaran "' + item.kategori + '" sebesar ' + TPQUi.formatRupiah(item.nominal) + '? Saldo akan dikembalikan otomatis.')) {
            TPQApi.request('admin_pengeluaran_cancel', { id_pengeluaran: item.id_pengeluaran }, { requireAuth: true })
              .then(function () { TPQUi.showToast('Pengeluaran dibatalkan & saldo dikoreksi.'); renderPengeluaran(container); })
              .catch(function (err) { TPQUi.showToast(err.message, 'error'); });
          }
        });
      })
      .catch(function (err) { container.innerHTML = TPQUi.renderError(err.message); });
  }

  function openPengeluaranModal(editO, container) {
    var esc = TPQUi.escapeHtml;
    var today = new Date().toISOString().slice(0, 10);
    var body =
      '<div class="form-grid">' +
      '  <div class="form-group"><label>Tanggal</label><input type="date" id="om-tgl" value="' + esc(editO ? editO.tanggal : today) + '" required></div>' +
      '  <div class="form-group"><label>Kategori</label><input type="text" id="om-kat" value="' + esc(editO ? editO.kategori : 'Operasional TPQ') + '" required></div>' +
      '  <div class="form-group full"><label>Nominal Pengeluaran (Rp)</label><input type="number" id="om-nom" min="1000" step="1000" value="' + esc(editO ? editO.nominal : '') + '" required></div>' +
      '  <div class="form-group full"><label>Keterangan</label><input type="text" id="om-ket" value="' + esc(editO ? editO.keterangan : '') + '" placeholder="Contoh: Pembelian kitab Iqra / listrik / honor guru"></div>' +
      '</div>';
    var footer = '<button class="btn btn-outline" onclick="TPQUi.closeModal()">Batal</button><button class="btn btn-primary" id="btn-om-save">Simpan Pengeluaran</button>';
    TPQUi.openModal(editO ? 'Edit Pengeluaran' : 'Catat Pengeluaran Baru', body, footer);

    document.getElementById('btn-om-save').addEventListener('click', function () {
      var btn = this; btn.disabled = true;
      TPQApi.request('admin_pengeluaran_save', {
        id_pengeluaran: editO ? editO.id_pengeluaran : '',
        tanggal: document.getElementById('om-tgl').value,
        kategori: document.getElementById('om-kat').value,
        nominal: document.getElementById('om-nom').value,
        keterangan: document.getElementById('om-ket').value
      }, { requireAuth: true })
        .then(function () { TPQUi.closeModal(); TPQUi.showToast('Pengeluaran disimpan & Saldo Utama diperbarui.'); renderPengeluaran(container); })
        .catch(function (err) { btn.disabled = false; TPQUi.showToast(err.message, 'error'); });
    });
  }

  /* ==================== 7. SALDO KEUANGAN & PRIVASI PUBLIK ==================== */

  function renderSaldoKeuangan(container) {
    container.innerHTML = TPQUi.renderLoading('Menghitung saldo keuangan utama...');
    TPQApi.request('admin_saldo_get', { tahun: state.tahun }, { requireAuth: true })
      .then(function (s) {
        var esc = TPQUi.escapeHtml;
        container.innerHTML =
          '<div class="stats-grid" style="margin-bottom:20px;">' +
          '  <div class="stat-card"><div class="stat-label">Saldo Awal</div><div class="stat-value" style="font-size:1.3rem;">' + TPQUi.formatRupiah(s.saldo_awal) + '</div></div>' +
          '  <div class="stat-card info"><div class="stat-label">Total Penerimaan (Iuran + Insidental)</div><div class="stat-value" style="font-size:1.3rem;">' + TPQUi.formatRupiah(s.total_penerimaan) + '</div><div class="stat-sub">Iuran: ' + TPQUi.formatRupiah(s.total_iuran_target) + ' | Insidental: ' + TPQUi.formatRupiah(s.total_sumbangan_insidental) + '</div></div>' +
          '  <div class="stat-card" style="border-top-color:var(--danger);"><div class="stat-label">Total Pengeluaran</div><div class="stat-value" style="font-size:1.3rem;color:var(--danger);">' + TPQUi.formatRupiah(s.total_pengeluaran) + '</div></div>' +
          '  <div class="stat-card gold"><div class="stat-label">SALDO AKHIR KAS DONASI</div><div class="stat-value" style="font-size:1.4rem;">' + TPQUi.formatRupiah(s.saldo_akhir) + '</div><div class="stat-sub">Saldo Awal + Penerimaan - Pengeluaran</div></div>' +
          '</div>' +

          '<div class="grid-2">' +
          '  <div class="card">' +
          '    <div class="card-header"><h2 class="card-title">Pengaturan Saldo Awal &amp; Privasi Nama Publik</h2></div>' +
          '    <div class="form-group"><label>Saldo Awal Kas Donasi (Rp)</label><input type="number" id="sal-awal" min="0" step="1000" value="' + esc(s.saldo_awal) + '"></div>' +
          '    <div class="form-group"><label>Tampilan Nama Warga di Halaman Publik</label><select id="sal-priv"><option value="TERBUKA"' + (s.tampilkan_nama_publik === 'TERBUKA' ? ' selected' : '') + '>Terbuka (Tampilkan Nama Warga)</option><option value="DISAMARKAN"' + (s.tampilkan_nama_publik === 'DISAMARKAN' ? ' selected' : '') + '>Disamarkan (Contoh: A*** B***)</option></select><div class="form-hint">Nomor HP dan alamat lengkap tidak pernah ditampilkan di halaman publik.</div></div>' +
          '    <div class="form-group"><label>Keterangan</label><input type="text" id="sal-ket" value="' + esc(s.keterangan_saldo || '') + '"></div>' +
          '    <button class="btn btn-primary" id="btn-save-saldo">Simpan Pengaturan Saldo</button>' +
          '  </div>' +
          '  <div class="card">' +
          '    <div class="card-header"><h2 class="card-title">Grafik Arus Kas Bulanan (' + state.tahun + ')</h2></div>' +
          '    <div id="saldo-chart-host"></div>' +
          '  </div>' +
          '</div>';

        TPQUi.renderLightweightBarChart(document.getElementById('saldo-chart-host'), s.chart_bulanan || []);

        document.getElementById('btn-save-saldo').addEventListener('click', function () {
          var btn = this; btn.disabled = true;
          TPQApi.request('admin_saldo_save', {
            saldo_awal: document.getElementById('sal-awal').value,
            tampilkan_nama_publik: document.getElementById('sal-priv').value,
            keterangan: document.getElementById('sal-ket').value
          }, { requireAuth: true })
            .then(function () { TPQUi.showToast('Pengaturan saldo & privasi berhasil disimpan.'); renderSaldoKeuangan(container); })
            .catch(function (err) { btn.disabled = false; TPQUi.showToast(err.message, 'error'); });
        });
      })
      .catch(function (err) { container.innerHTML = TPQUi.renderError(err.message); });
  }

  global.TPQAdminDonasi = {
    renderPengaturanIuran: renderPengaturanIuran,
    renderDataWarga: renderDataWargaV2,
    renderPenerimaanIuran: renderPenerimaanIuran,
    renderSumbanganInsidental: renderSumbanganInsidental,
    renderRiwayatTransaksi: renderRiwayatTransaksi,
    renderPengeluaran: renderPengeluaran,
    renderSaldoKeuangan: renderSaldoKeuangan
  };
})(window);
