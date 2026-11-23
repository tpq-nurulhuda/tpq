/**
 * admin.js - Core Administrator Dashboard, Auth, Master Data, Users, Settings & Audit Log
 * Portal Digital TPQ Nurul Huda
 */
(function () {
  'use strict';

  var currentUser = null;
  var currentMenu = 'dashboard';

  var MENU_TITLES = {
    dashboard: 'Dashboard Ikhtisar',
    profil: 'Profil Lembaga',
    guru: 'Data Master: Profil Guru',
    murid: 'Data Master: Data Murid',
    rt: 'Data Master: Wilayah RT',
    warga: 'Data Master: Data Warga',
    pengaturan_iuran: 'Pengaturan Iuran Target',
    iuran_target: 'Penerimaan Iuran Target',
    sumbangan_insidental: 'Sumbangan Insidental',
    riwayat_transaksi: 'Riwayat Transaksi Keuangan',
    pengeluaran: 'Pengeluaran Kas TPQ',
    saldo_keuangan: 'Saldo Keuangan & Privasi Publik',
    laporan: 'Laporan Donasi & Keuangan',
    settings: 'Pengaturan Website & Backup',
    users: 'Manajemen Pengguna',
    audit_log: 'Audit Log Aktivitas'
  };

  /* ==================== BOOTSTRAP & AUTH ==================== */

  function initAdminApp() {
    var session = TPQApi.getSession();
    if (!session || !session.token) {
      showLoginView();
      return;
    }

    // Validasi session di backend
    TPQApi.request('me', {}, { requireAuth: true })
      .then(function (user) {
        currentUser = user;
        showDashboardShell();
      })
      .catch(function () {
        TPQApi.setSession(null);
        showLoginView();
      });
  }

  function showLoginView() {
    document.getElementById('admin-app-view').style.display = 'none';
    document.getElementById('admin-login-view').style.display = 'flex';
  }

  function showDashboardShell() {
    document.getElementById('admin-login-view').style.display = 'none';
    document.getElementById('admin-app-view').style.display = 'flex';

    document.getElementById('admin-user-pill').textContent =
      (currentUser.nama_lengkap || currentUser.username) + ' (' + currentUser.role + ')';

    // Terapkan visibilitas menu berdasarkan permission (enforcement tetap di backend!)
    var perms = currentUser.permissions || [];
    var buttons = document.querySelectorAll('#admin-sidebar-nav .sidebar-item');
    buttons.forEach(function (btn) {
      var reqPerm = btn.getAttribute('data-perm');
      var allowed = currentUser.role === 'SUPERADMIN' || perms.indexOf(reqPerm) !== -1;
      btn.style.display = allowed ? 'flex' : 'none';
    });

    navigateMenu('dashboard');
  }

  function navigateMenu(menuId) {
    currentMenu = menuId;
    document.getElementById('admin-page-title').textContent = MENU_TITLES[menuId] || 'Dashboard';

    var buttons = document.querySelectorAll('#admin-sidebar-nav .sidebar-item');
    buttons.forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-menu') === menuId);
    });

    // Tutup drawer mobile jika terbuka
    document.getElementById('admin-sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('open');

    var container = document.getElementById('admin-content-area');
    switch (menuId) {
      case 'dashboard': renderDashboardHome(container); break;
      case 'profil': renderProfilEditor(container); break;
      case 'guru': renderGuruAdmin(container); break;
      case 'murid': renderMuridAdmin(container); break;
      case 'rt': renderRTAdmin(container); break;
      case 'warga': TPQAdminDonasi.renderDataWarga(container); break;
      case 'pengaturan_iuran': TPQAdminDonasi.renderPengaturanIuran(container); break;
      case 'iuran_target': TPQAdminDonasi.renderPenerimaanIuran(container); break;
      case 'sumbangan_insidental': TPQAdminDonasi.renderSumbanganInsidental(container); break;
      case 'riwayat_transaksi': TPQAdminDonasi.renderRiwayatTransaksi(container); break;
      case 'pengeluaran': TPQAdminDonasi.renderPengeluaran(container); break;
      case 'saldo_keuangan': TPQAdminDonasi.renderSaldoKeuangan(container); break;
      case 'laporan': TPQAdminLaporan.render(container); break;
      case 'settings': renderSettingsAdmin(container); break;
      case 'users': renderUsersAdmin(container); break;
      case 'audit_log': renderAuditLogAdmin(container); break;
    }
  }

  /* ==================== 1. DASHBOARD OVERVIEW ==================== */

  function renderDashboardHome(container) {
    container.innerHTML = TPQUi.renderLoading('Memuat ringkasan dashboard...');
    TPQApi.request('admin_dashboard', {}, { requireAuth: true })
      .then(function (data) {
        var s = data.stats || {};
        var saldo = data.saldo || {};
        var rw = data.ringkasan_warga || {};
        var esc = TPQUi.escapeHtml;

        container.innerHTML =
          '<div class="stats-grid" style="margin-bottom:20px;">' +
          '  <div class="stat-card"><div class="stat-label">Guru &amp; Murid Aktif</div><div class="stat-value">' + TPQUi.formatNumber(s.jumlah_guru) + ' / ' + TPQUi.formatNumber(s.jumlah_murid) + '</div><div class="stat-sub">Guru / Santri Aktif</div></div>' +
          '  <div class="stat-card info"><div class="stat-label">Total Iuran Target</div><div class="stat-value" style="font-size:1.3rem;">' + TPQUi.formatRupiah(saldo.total_iuran_target) + '</div><div class="stat-sub">Sudah bayar: ' + TPQUi.formatNumber(rw.warga_sudah_membayar) + ' dari ' + TPQUi.formatNumber(rw.jumlah_warga) + ' warga</div></div>' +
          '  <div class="stat-card gold"><div class="stat-label">Total Sumbangan Insidental</div><div class="stat-value" style="font-size:1.3rem;">' + TPQUi.formatRupiah(saldo.total_sumbangan_insidental) + '</div><div class="stat-sub">Total Penerimaan: ' + TPQUi.formatRupiah(saldo.total_penerimaan) + '</div></div>' +
          '  <div class="stat-card dark"><div class="stat-label">SALDO AKHIR KAS DONASI</div><div class="stat-value" style="font-size:1.35rem;">' + TPQUi.formatRupiah(saldo.saldo_akhir) + '</div><div class="stat-sub">Pengeluaran: ' + TPQUi.formatRupiah(saldo.total_pengeluaran) + '</div></div>' +
          '</div>' +
          '<div class="card">' +
          '  <div class="card-header"><h2 class="card-title">Grafik Arus Penerimaan Bulanan (' + esc(data.tahun || new Date().getFullYear()) + ')</h2></div>' +
          '  <div id="admin-dash-chart"></div>' +
          '</div>';

        TPQUi.renderLightweightBarChart(document.getElementById('admin-dash-chart'), saldo.chart_bulanan || []);
      })
      .catch(function (err) {
        container.innerHTML = TPQUi.renderError(err.message);
      });
  }

  /* ==================== 2. PROFIL LEMBAGA ==================== */

  function renderProfilEditor(container) {
    container.innerHTML = TPQUi.renderLoading('Memuat profil lembaga...');
    TPQApi.request('public_profil', {}, { requireAuth: true })
      .then(function (p) {
        p = p || {};
        var esc = TPQUi.escapeHtml;
        container.innerHTML =
          '<div class="card">' +
          '  <form id="form-profil-lembaga">' +
          '    <div class="form-grid">' +
          '      <div class="form-group"><label>Nama Lembaga</label><input type="text" id="pr-nama" value="' + esc(p.nama_lembaga || '') + '" required></div>' +
          '      <div class="form-group"><label>Kepala TPQ</label><input type="text" id="pr-kepala" value="' + esc(p.nama_kepala || '') + '"></div>' +
          '      <div class="form-group"><label>Tahun Berdiri</label><input type="text" id="pr-tahun" value="' + esc(p.tahun_berdiri || '') + '"></div>' +
          '      <div class="form-group"><label>Nomor Izin Operasional</label><input type="text" id="pr-izin" value="' + esc(p.nomor_izin || '') + '"></div>' +
          '      <div class="form-group full"><label>Alamat Lengkap</label><input type="text" id="pr-alamat" value="' + esc(p.alamat || '') + '"></div>' +
          '      <div class="form-group"><label>Telepon</label><input type="text" id="pr-telp" value="' + esc(p.kontak_telp || '') + '"></div>' +
          '      <div class="form-group"><label>Email</label><input type="email" id="pr-email" value="' + esc(p.kontak_email || '') + '"></div>' +
          '      <div class="form-group"><label>WhatsApp</label><input type="text" id="pr-wa" value="' + esc(p.kontak_wa || '') + '"></div>' +
          '      <div class="form-group"><label>Upload Logo Baru (ke Drive LOGO/)</label><input type="file" id="pr-logo-file" accept="image/*"><input type="hidden" id="pr-logo-url" value="' + esc(p.logo_url || '') + '"><input type="hidden" id="pr-logo-fid" value="' + esc(p.logo_file_id || '') + '"></div>' +
          '      <div class="form-group full"><label>URL Foto Hero Beranda</label><input type="url" id="pr-hero" value="' + esc(p.hero_image_url || '') + '" placeholder="https://..."></div>' +
          '      <div class="form-group full"><label>Sambutan Kepala TPQ</label><textarea id="pr-sambutan" rows="3">' + esc(p.sambutan_kepala || '') + '</textarea></div>' +
          '      <div class="form-group full"><label>Sejarah Lembaga</label><textarea id="pr-sejarah" rows="3">' + esc(p.sejarah || '') + '</textarea></div>' +
          '      <div class="form-group full"><label>Visi</label><textarea id="pr-visi" rows="2">' + esc(p.visi || '') + '</textarea></div>' +
          '      <div class="form-group full"><label>Misi (pisahkan tiap poin dengan baris baru)</label><textarea id="pr-misi" rows="4">' + esc(p.misi || '') + '</textarea></div>' +
          '      <div class="form-group full"><label>Program Pendidikan (pisahkan tiap program dengan baris baru)</label><textarea id="pr-program" rows="4">' + esc(p.program_pendidikan || '') + '</textarea></div>' +
          '    </div>' +
          '    <button type="submit" class="btn btn-primary" id="btn-save-profil">Simpan Perubahan Profil</button>' +
          '  </form>' +
          '</div>';

        document.getElementById('form-profil-lembaga').addEventListener('submit', function (e) {
          e.preventDefault();
          var btn = document.getElementById('btn-save-profil');
          btn.disabled = true;
          var fileInput = document.getElementById('pr-logo-file');
          var uploadPromise = Promise.resolve(null);

          if (fileInput.files && fileInput.files[0]) {
            var file = fileInput.files[0];
            uploadPromise = TPQUi.readFileAsBase64(file).then(function (b64) {
              return TPQApi.request('admin_upload', {
                folder: 'LOGO',
                file_name: file.name,
                mime_type: file.type,
                base64_data: b64
              }, { requireAuth: true });
            });
          }

          uploadPromise
            .then(function (up) {
              var logoUrl = up ? up.file_url : document.getElementById('pr-logo-url').value;
              var logoFid = up ? up.file_id : document.getElementById('pr-logo-fid').value;
              return TPQApi.request('admin_profil_update', {
                nama_lembaga: document.getElementById('pr-nama').value,
                nama_kepala: document.getElementById('pr-kepala').value,
                tahun_berdiri: document.getElementById('pr-tahun').value,
                nomor_izin: document.getElementById('pr-izin').value,
                alamat: document.getElementById('pr-alamat').value,
                kontak_telp: document.getElementById('pr-telp').value,
                kontak_email: document.getElementById('pr-email').value,
                kontak_wa: document.getElementById('pr-wa').value,
                logo_url: logoUrl,
                logo_file_id: logoFid,
                hero_image_url: document.getElementById('pr-hero').value,
                sambutan_kepala: document.getElementById('pr-sambutan').value,
                sejarah: document.getElementById('pr-sejarah').value,
                visi: document.getElementById('pr-visi').value,
                misi: document.getElementById('pr-misi').value,
                program_pendidikan: document.getElementById('pr-program').value,
                kegiatan_terbaru: p.kegiatan_terbaru || [],
                dokumentasi: p.dokumentasi || []
              }, { requireAuth: true });
            })
            .then(function () {
              TPQUi.showToast('Profil lembaga berhasil diperbarui.');
              btn.disabled = false;
            })
            .catch(function (err) {
              TPQUi.showToast(err.message, 'error');
              btn.disabled = false;
            });
        });
      })
      .catch(function (err) { container.innerHTML = TPQUi.renderError(err.message); });
  }

  /* ==================== 3. PROFIL GURU ==================== */

  function renderGuruAdmin(container) {
    container.innerHTML = TPQUi.renderLoading('Memuat data guru...');
    TPQApi.request('admin_guru_list', {}, { requireAuth: true })
      .then(function (list) {
        var esc = TPQUi.escapeHtml;
        var rows = (list || []).map(function (g) {
          return (
            '<tr>' +
            '  <td class="text-center">' + esc(g.urutan) + '</td>' +
            '  <td><strong>' + esc(g.nama_lengkap) + '</strong><br><small style="color:var(--text-muted);">' + esc(g.id_guru) + '</small></td>' +
            '  <td>' + esc(g.jabatan) + '</td>' +
            '  <td>' + esc(g.pendidikan_terakhir || '-') + '</td>' +
            '  <td>' + esc(g.nomor_kontak || '-') + '</td>' +
            '  <td>' + TPQUi.statusBadge(g.status) + '</td>' +
            '  <td style="white-space:nowrap;">' +
            '    <button class="btn btn-outline btn-sm" data-gact="edit" data-id="' + esc(g.id_guru) + '">Edit</button> ' +
            '    <button class="btn btn-danger btn-sm" data-gact="del" data-id="' + esc(g.id_guru) + '">Hapus</button>' +
            '  </td>' +
            '</tr>'
          );
        }).join('');

        container.innerHTML =
          '<div class="card">' +
          '  <div class="toolbar">' +
          '    <span style="font-size:0.86rem;color:var(--text-muted);">Nomor kontak guru hanya tampil di dashboard admin ini (disembunyikan di halaman publik).</span>' +
          '    <button class="btn btn-primary btn-sm" id="btn-add-guru">+ Tambah Guru</button>' +
          '  </div>' +
          '  <div class="table-responsive"><table><thead><tr><th class="text-center">Urutan</th><th>Nama Guru</th><th>Jabatan</th><th>Pendidikan</th><th>Kontak (Privat)</th><th>Status</th><th>Aksi</th></tr></thead><tbody id="guru-admin-tbody">' + (rows || '<tr><td colspan="7" class="text-center">Belum ada data guru.</td></tr>') + '</tbody></table></div>' +
          '</div>';

        document.getElementById('btn-add-guru').addEventListener('click', function () { openGuruModal(null, container); });
        document.getElementById('guru-admin-tbody').addEventListener('click', function (e) {
          var btn = e.target.closest('button[data-gact]');
          if (!btn) return;
          var id = btn.getAttribute('data-id');
          var item = list.find(function (x) { return x.id_guru === id; });
          if (btn.getAttribute('data-gact') === 'edit') openGuruModal(item, container);
          else if (confirm('Hapus data guru "' + item.nama_lengkap + '"?')) {
            TPQApi.request('admin_guru_delete', { id_guru: id }, { requireAuth: true })
              .then(function () { TPQUi.showToast('Data guru dihapus.'); renderGuruAdmin(container); })
              .catch(function (err) { TPQUi.showToast(err.message, 'error'); });
          }
        });
      })
      .catch(function (err) { container.innerHTML = TPQUi.renderError(err.message); });
  }

  function openGuruModal(editGuru, container) {
    var esc = TPQUi.escapeHtml;
    var body =
      '<div class="form-grid">' +
      '  <div class="form-group"><label>Nama Lengkap</label><input type="text" id="gm-nama" value="' + esc(editGuru ? editGuru.nama_lengkap : '') + '" required></div>' +
      '  <div class="form-group"><label>Jabatan</label><input type="text" id="gm-jabatan" value="' + esc(editGuru ? editGuru.jabatan : 'Guru TPQ') + '" required></div>' +
      '  <div class="form-group"><label>Pendidikan Terakhir</label><input type="text" id="gm-pend" value="' + esc(editGuru ? editGuru.pendidikan_terakhir : '') + '"></div>' +
      '  <div class="form-group"><label>Nomor Kontak (Privat Admin)</label><input type="text" id="gm-kontak" value="' + esc(editGuru ? editGuru.nomor_kontak : '') + '"></div>' +
      '  <div class="form-group"><label>Urutan Tampilan</label><input type="number" id="gm-urutan" value="' + esc(editGuru ? editGuru.urutan : 1) + '" min="1"></div>' +
      '  <div class="form-group"><label>Status</label><select id="gm-status"><option value="AKTIF">AKTIF</option><option value="NONAKTIF">NONAKTIF</option></select></div>' +
      '  <div class="form-group full"><label>Upload Foto Guru (ke Drive FOTO_GURU/)</label><input type="file" id="gm-foto-file" accept="image/*"></div>' +
      '</div>';

    var footer = '<button class="btn btn-outline" onclick="TPQUi.closeModal()">Batal</button><button class="btn btn-primary" id="btn-save-guru">Simpan Guru</button>';
    TPQUi.openModal(editGuru ? 'Edit Data Guru' : 'Tambah Data Guru', body, footer);
    if (editGuru) document.getElementById('gm-status').value = editGuru.status;

    document.getElementById('btn-save-guru').addEventListener('click', function () {
      var btn = this;
      btn.disabled = true;
      var fIn = document.getElementById('gm-foto-file');
      var upProm = Promise.resolve(null);
      if (fIn.files && fIn.files[0]) {
        var f = fIn.files[0];
        upProm = TPQUi.readFileAsBase64(f).then(function (b64) {
          return TPQApi.request('admin_upload', { folder: 'FOTO_GURU', file_name: f.name, mime_type: f.type, base64_data: b64 }, { requireAuth: true });
        });
      }
      upProm
        .then(function (up) {
          var payload = {
            id_guru: editGuru ? editGuru.id_guru : '',
            nama_lengkap: document.getElementById('gm-nama').value,
            jabatan: document.getElementById('gm-jabatan').value,
            pendidikan_terakhir: document.getElementById('gm-pend').value,
            nomor_kontak: document.getElementById('gm-kontak').value,
            urutan: document.getElementById('gm-urutan').value,
            status: document.getElementById('gm-status').value
          };
          if (up) { payload.foto_file_id = up.file_id; payload.foto_url = up.file_url; }
          return TPQApi.request('admin_guru_save', payload, { requireAuth: true });
        })
        .then(function () {
          TPQUi.closeModal();
          TPQUi.showToast('Data guru berhasil disimpan.');
          renderGuruAdmin(container);
        })
        .catch(function (err) { btn.disabled = false; TPQUi.showToast(err.message, 'error'); });
    });
  }

  /* ==================== 4. DATA MURID ==================== */

  function renderMuridAdmin(container) {
    container.innerHTML = TPQUi.renderLoading('Memuat data murid...');
    Promise.all([
      TPQApi.request('admin_murid_list', {}, { requireAuth: true }),
      TPQApi.request('admin_rt_list', {}, { requireAuth: true })
    ])
      .then(function (res) {
        var list = (res[0] && res[0].items) || [];
        var rtList = res[1] || [];
        var esc = TPQUi.escapeHtml;

        function paintTable(filtered) {
          var tbody = document.getElementById('murid-admin-tbody');
          if (!tbody) return;
          tbody.innerHTML = filtered.length > 0
            ? filtered.map(function (m) {
                return (
                  '<tr>' +
                  '  <td><strong>' + esc(m.nomor_induk) + '</strong></td>' +
                  '  <td><strong>' + esc(m.nama_lengkap) + '</strong><br><small style="color:var(--text-muted);">Wali: ' + esc(m.nama_wali || '-') + '</small></td>' +
                  '  <td class="text-center">' + esc(m.jenis_kelamin) + '</td>' +
                  '  <td>' + esc(m.kelas || '-') + '</td>' +
                  '  <td>' + esc(m.nomor_rt) + '</td>' +
                  '  <td>' + esc(m.tahun_masuk) + '</td>' +
                  '  <td>' + TPQUi.statusBadge(m.status) + '</td>' +
                  '  <td style="white-space:nowrap;">' +
                  '    <button class="btn btn-outline btn-sm" data-mact="edit" data-id="' + esc(m.nomor_induk) + '">Edit</button> ' +
                  '    <button class="btn btn-danger btn-sm" data-mact="del" data-id="' + esc(m.nomor_induk) + '">Hapus</button>' +
                  '  </td>' +
                  '</tr>'
                );
              }).join('')
            : '<tr><td colspan="8" class="text-center">Belum ada data murid.</td></tr>';
        }

        container.innerHTML =
          '<div class="card">' +
          '  <div class="toolbar">' +
          '    <div class="toolbar-group">' +
          '      <input type="search" id="mr-search" placeholder="Cari nama / NIS / wali..."> ' +
          '      <select id="mr-filter-rt"><option value="">Semua RT</option>' + rtList.map(function (r) { return '<option value="' + esc(r.id_rt) + '">' + esc(r.nomor_rt) + '</option>'; }).join('') + '</select>' +
          '      <select id="mr-filter-status"><option value="">Semua Status</option><option value="AKTIF">AKTIF</option><option value="NONAKTIF">NONAKTIF</option></select>' +
          '    </div>' +
          '    <div class="toolbar-group">' +
          '      <button class="btn btn-outline btn-sm" id="btn-import-murid">Import CSV/Excel</button>' +
          '      <button class="btn btn-outline btn-sm" id="btn-export-murid">Export Excel</button>' +
          '      <button class="btn btn-outline btn-sm" id="btn-print-murid">Cetak</button>' +
          '      <button class="btn btn-primary btn-sm" id="btn-add-murid">+ Tambah Murid</button>' +
          '    </div>' +
          '  </div>' +
          '  <div class="table-responsive"><table><thead><tr><th>No. Induk</th><th>Nama Murid</th><th class="text-center">L/P</th><th>Kelas</th><th>RT</th><th>Thn Masuk</th><th>Status</th><th>Aksi</th></tr></thead><tbody id="murid-admin-tbody"></tbody></table></div>' +
          '</div>';

        function applyFilters() {
          var q = document.getElementById('mr-search').value.toLowerCase().trim();
          var rt = document.getElementById('mr-filter-rt').value;
          var st = document.getElementById('mr-filter-status').value;
          var filtered = list.filter(function (m) {
            if (rt && m.id_rt !== rt) return false;
            if (st && m.status !== st) return false;
            if (q && (m.nomor_induk + ' ' + m.nama_lengkap + ' ' + m.nama_wali + ' ' + m.kelas).toLowerCase().indexOf(q) === -1) return false;
            return true;
          });
          paintTable(filtered);
          return filtered;
        }

        paintTable(list);
        document.getElementById('mr-search').addEventListener('input', applyFilters);
        document.getElementById('mr-filter-rt').addEventListener('change', applyFilters);
        document.getElementById('mr-filter-status').addEventListener('change', applyFilters);

        document.getElementById('btn-add-murid').addEventListener('click', function () { openMuridModal(null, rtList, container); });
        document.getElementById('btn-export-murid').addEventListener('click', function () {
          TPQExport.exportToExcel('Data_Murid_TPQ_Nurul_Huda', 'Data Murid TPQ Nurul Huda', [
            { label: 'Nomor Induk', key: 'nomor_induk' },
            { label: 'Nama Lengkap', key: 'nama_lengkap' },
            { label: 'L/P', key: 'jenis_kelamin' },
            { label: 'Tempat Lahir', key: 'tempat_lahir' },
            { label: 'Tanggal Lahir', key: 'tanggal_lahir' },
            { label: 'Nama Wali', key: 'nama_wali' },
            { label: 'Alamat', key: 'alamat' },
            { label: 'RT', key: 'nomor_rt' },
            { label: 'Tahun Masuk', key: 'tahun_masuk' },
            { label: 'Kelas', key: 'kelas' },
            { label: 'Status', key: 'status' }
          ], applyFilters());
        });
        document.getElementById('btn-print-murid').addEventListener('click', function () {
          var filtered = applyFilters();
          var html = '<div class="report-kop"><div><h2>TPQ NURUL HUDA</h2><p>Daftar Data Murid (' + filtered.length + ' santri)</p></div></div>' +
            '<table><thead><tr><th>No. Induk</th><th>Nama</th><th>L/P</th><th>Wali</th><th>RT</th><th>Kelas</th><th>Status</th></tr></thead><tbody>' +
            filtered.map(function (m) {
              return '<tr><td>' + esc(m.nomor_induk) + '</td><td>' + esc(m.nama_lengkap) + '</td><td>' + esc(m.jenis_kelamin) + '</td><td>' + esc(m.nama_wali) + '</td><td>' + esc(m.nomor_rt) + '</td><td>' + esc(m.kelas) + '</td><td>' + esc(m.status) + '</td></tr>';
            }).join('') + '</tbody></table>';
          TPQExport.printProfessionalReport(html, 'Data_Murid_TPQ_Nurul_Huda');
        });
        document.getElementById('btn-import-murid').addEventListener('click', function () {
          openCsvImportModal('Import Data Murid (CSV dari Excel)', 'Header kolom: nama_lengkap,jenis_kelamin,tempat_lahir,tanggal_lahir,nama_wali,alamat,rt,tahun_masuk,kelas', 'admin_murid_import', function () { renderMuridAdmin(container); });
        });

        document.getElementById('murid-admin-tbody').addEventListener('click', function (e) {
          var btn = e.target.closest('button[data-mact]');
          if (!btn) return;
          var id = btn.getAttribute('data-id');
          var item = list.find(function (x) { return x.nomor_induk === id; });
          if (btn.getAttribute('data-mact') === 'edit') openMuridModal(item, rtList, container);
          else if (confirm('Hapus data murid "' + item.nama_lengkap + '"?')) {
            TPQApi.request('admin_murid_delete', { nomor_induk: id }, { requireAuth: true })
              .then(function () { TPQUi.showToast('Data murid dihapus.'); renderMuridAdmin(container); })
              .catch(function (err) { TPQUi.showToast(err.message, 'error'); });
          }
        });
      })
      .catch(function (err) { container.innerHTML = TPQUi.renderError(err.message); });
  }

  function openMuridModal(editM, rtList, container) {
    var esc = TPQUi.escapeHtml;
    var rtOpts = '<option value="">-- Pilih RT --</option>' + rtList.map(function (r) {
      var sel = editM && editM.id_rt === r.id_rt ? ' selected' : '';
      return '<option value="' + esc(r.id_rt) + '"' + sel + '>' + esc(r.nomor_rt) + '</option>';
    }).join('');

    var body =
      '<div class="form-grid">' +
      '  <div class="form-group"><label>Nama Lengkap</label><input type="text" id="mm-nama" value="' + esc(editM ? editM.nama_lengkap : '') + '" required></div>' +
      '  <div class="form-group"><label>Jenis Kelamin</label><select id="mm-jk"><option value="L">Laki-laki (L)</option><option value="P">Perempuan (P)</option></select></div>' +
      '  <div class="form-group"><label>Tempat Lahir</label><input type="text" id="mm-tmp" value="' + esc(editM ? editM.tempat_lahir : '') + '"></div>' +
      '  <div class="form-group"><label>Tanggal Lahir</label><input type="date" id="mm-tgl" value="' + esc(editM ? editM.tanggal_lahir : '') + '"></div>' +
      '  <div class="form-group"><label>Nama Orang Tua / Wali</label><input type="text" id="mm-wali" value="' + esc(editM ? editM.nama_wali : '') + '"></div>' +
      '  <div class="form-group"><label>Wilayah RT</label><select id="mm-rt">' + rtOpts + '</select></div>' +
      '  <div class="form-group full"><label>Alamat</label><input type="text" id="mm-alamat" value="' + esc(editM ? editM.alamat : '') + '"></div>' +
      '  <div class="form-group"><label>Tahun Masuk</label><input type="number" id="mm-thn" value="' + esc(editM ? editM.tahun_masuk : new Date().getFullYear()) + '"></div>' +
      '  <div class="form-group"><label>Kelas / Kelompok Belajar</label><input type="text" id="mm-kelas" value="' + esc(editM ? editM.kelas : 'Iqra 1') + '"></div>' +
      '  <div class="form-group"><label>Status</label><select id="mm-status"><option value="AKTIF">AKTIF</option><option value="NONAKTIF">NONAKTIF</option></select></div>' +
      '</div>';

    var footer = '<button class="btn btn-outline" onclick="TPQUi.closeModal()">Batal</button><button class="btn btn-primary" id="btn-save-murid">Simpan Murid</button>';
    TPQUi.openModal(editM ? 'Edit Murid (' + editM.nomor_induk + ')' : 'Tambah Murid Baru (Nomor Induk Otomatis)', body, footer);
    if (editM) {
      document.getElementById('mm-jk').value = editM.jenis_kelamin;
      document.getElementById('mm-status').value = editM.status;
    }

    document.getElementById('btn-save-murid').addEventListener('click', function () {
      var btn = this;
      btn.disabled = true;
      TPQApi.request('admin_murid_save', {
        is_edit: Boolean(editM),
        nomor_induk: editM ? editM.nomor_induk : '',
        nama_lengkap: document.getElementById('mm-nama').value,
        jenis_kelamin: document.getElementById('mm-jk').value,
        tempat_lahir: document.getElementById('mm-tmp').value,
        tanggal_lahir: document.getElementById('mm-tgl').value,
        nama_wali: document.getElementById('mm-wali').value,
        id_rt: document.getElementById('mm-rt').value,
        alamat: document.getElementById('mm-alamat').value,
        tahun_masuk: document.getElementById('mm-thn').value,
        kelas: document.getElementById('mm-kelas').value,
        status: document.getElementById('mm-status').value
      }, { requireAuth: true })
        .then(function () {
          TPQUi.closeModal();
          TPQUi.showToast('Data murid berhasil disimpan.');
          renderMuridAdmin(container);
        })
        .catch(function (err) { btn.disabled = false; TPQUi.showToast(err.message, 'error'); });
    });
  }

  /* ==================== 5. WILAYAH RT ==================== */

  function renderRTAdmin(container) {
    container.innerHTML = TPQUi.renderLoading('Memuat data wilayah RT...');
    TPQApi.request('admin_rt_list', {}, { requireAuth: true })
      .then(function (list) {
        var esc = TPQUi.escapeHtml;
        var isSA = currentUser.role === 'SUPERADMIN';
        var rows = (list || []).map(function (r) {
          return (
            '<tr>' +
            '  <td><strong>' + esc(r.nomor_rt) + '</strong></td>' +
            '  <td>' + esc(r.nama_wilayah || '-') + '</td>' +
            '  <td>' + TPQUi.statusBadge(r.status) + '</td>' +
            '  <td>' + (isSA ? '<button class="btn btn-outline btn-sm" data-ract="edit" data-id="' + esc(r.id_rt) + '">Edit</button> <button class="btn btn-danger btn-sm" data-ract="del" data-id="' + esc(r.id_rt) + '">Hapus</button>' : '-') + '</td>' +
            '</tr>'
          );
        }).join('');

        container.innerHTML =
          '<div class="card">' +
          '  <div class="toolbar">' +
          '    <span style="font-size:0.86rem;color:var(--text-muted);">Hanya Superadmin yang dapat menambah, mengubah, atau menghapus Wilayah RT.</span>' +
          (isSA ? '<button class="btn btn-primary btn-sm" id="btn-add-rt">+ Tambah Wilayah RT</button>' : '') +
          '  </div>' +
          '  <div class="table-responsive"><table><thead><tr><th>Nomor RT</th><th>Nama Wilayah</th><th>Status</th><th>Aksi</th></tr></thead><tbody id="rt-admin-tbody">' + (rows || '<tr><td colspan="4" class="text-center">Belum ada wilayah RT.</td></tr>') + '</tbody></table></div>' +
          '</div>';

        if (isSA) {
          document.getElementById('btn-add-rt').addEventListener('click', function () { openRTModal(null, container); });
          document.getElementById('rt-admin-tbody').addEventListener('click', function (e) {
            var btn = e.target.closest('button[data-ract]');
            if (!btn) return;
            var id = btn.getAttribute('data-id');
            var item = list.find(function (x) { return x.id_rt === id; });
            if (btn.getAttribute('data-ract') === 'edit') openRTModal(item, container);
            else if (confirm('Hapus wilayah ' + item.nomor_rt + '?')) {
              TPQApi.request('admin_rt_delete', { id_rt: id }, { requireAuth: true })
                .then(function () { TPQUi.showToast('Wilayah RT dihapus.'); renderRTAdmin(container); })
                .catch(function (err) { TPQUi.showToast(err.message, 'error'); });
            }
          });
        }
      })
      .catch(function (err) { container.innerHTML = TPQUi.renderError(err.message); });
  }

  function openRTModal(editRT, container) {
    var esc = TPQUi.escapeHtml;
    var body =
      '<div class="form-group"><label>Nomor RT</label><input type="text" id="rtm-nomor" value="' + esc(editRT ? editRT.nomor_rt : '') + '" placeholder="Contoh: RT 01" required></div>' +
      '<div class="form-group"><label>Nama Wilayah / Keterangan</label><input type="text" id="rtm-nama" value="' + esc(editRT ? editRT.nama_wilayah : '') + '" placeholder="Contoh: Dusun Krajan Timur"></div>' +
      '<div class="form-group"><label>Status</label><select id="rtm-status"><option value="AKTIF">AKTIF</option><option value="NONAKTIF">NONAKTIF</option></select></div>';
    var footer = '<button class="btn btn-outline" onclick="TPQUi.closeModal()">Batal</button><button class="btn btn-primary" id="btn-save-rt">Simpan</button>';
    TPQUi.openModal(editRT ? 'Edit Wilayah RT' : 'Tambah Wilayah RT', body, footer);
    if (editRT) document.getElementById('rtm-status').value = editRT.status;

    document.getElementById('btn-save-rt').addEventListener('click', function () {
      var btn = this;
      btn.disabled = true;
      TPQApi.request('admin_rt_save', {
        id_rt: editRT ? editRT.id_rt : '',
        nomor_rt: document.getElementById('rtm-nomor').value,
        nama_wilayah: document.getElementById('rtm-nama').value,
        status: document.getElementById('rtm-status').value
      }, { requireAuth: true })
        .then(function () { TPQUi.closeModal(); TPQUi.showToast('Wilayah RT disimpan.'); renderRTAdmin(container); })
        .catch(function (err) { btn.disabled = false; TPQUi.showToast(err.message, 'error'); });
    });
  }

  /* ==================== 6. DATA WARGA ==================== */

  function renderWargaAdmin(container) {
    container.innerHTML = TPQUi.renderLoading('Memuat data warga...');
    Promise.all([
      TPQApi.request('admin_warga_list', {}, { requireAuth: true }),
      TPQApi.request('admin_rt_list', {}, { requireAuth: true })
    ])
      .then(function (res) {
        var list = res[0] || [];
        var rtList = res[1] || [];
        var esc = TPQUi.escapeHtml;

        function paintTable(filtered) {
          var tbody = document.getElementById('warga-admin-tbody');
          tbody.innerHTML = filtered.length > 0
            ? filtered.map(function (w) {
                return (
                  '<tr>' +
                  '  <td><strong>' + esc(w.nama_lengkap) + '</strong><br><small style="color:var(--text-muted);">' + esc(w.id_warga) + '</small></td>' +
                  '  <td>' + esc(w.nomor_rt) + '</td>' +
                  '  <td>' + esc(w.alamat || '-') + '</td>' +
                  '  <td>' + esc(w.nomor_kontak || '-') + '</td>' +
                  '  <td>' + esc(w.keterangan || '-') + '</td>' +
                  '  <td><button class="btn btn-outline btn-sm" data-wedit="' + esc(w.id_warga) + '">Edit</button></td>' +
                  '</tr>'
                );
              }).join('')
            : '<tr><td colspan="6" class="text-center">Belum ada data warga.</td></tr>';
        }

        container.innerHTML =
          '<div class="card">' +
          '  <div class="toolbar">' +
          '    <div class="toolbar-group">' +
          '      <input type="search" id="wg-search" placeholder="Cari nama warga..."> ' +
          '      <select id="wg-rt"><option value="">Semua RT</option>' + rtList.map(function (r) { return '<option value="' + esc(r.id_rt) + '">' + esc(r.nomor_rt) + '</option>'; }).join('') + '</select>' +
          '    </div>' +
          '    <div class="toolbar-group">' +
          '      <button class="btn btn-outline btn-sm" id="btn-import-warga">Import CSV/Excel</button>' +
          '      <button class="btn btn-outline btn-sm" id="btn-export-warga">Export Excel</button>' +
          '      <button class="btn btn-primary btn-sm" id="btn-add-warga">+ Tambah Warga</button>' +
          '    </div>' +
          '  </div>' +
          '  <div class="table-responsive"><table><thead><tr><th>Nama Warga</th><th>RT</th><th>Alamat</th><th>Kontak</th><th>Keterangan</th><th>Aksi</th></tr></thead><tbody id="warga-admin-tbody"></tbody></table></div>' +
          '</div>';

        function applyFilters() {
          var q = document.getElementById('wg-search').value.toLowerCase().trim();
          var rt = document.getElementById('wg-rt').value;
          var filtered = list.filter(function (w) {
            if (rt && w.id_rt !== rt) return false;
            if (q && (w.nama_lengkap + ' ' + w.alamat + ' ' + w.id_warga).toLowerCase().indexOf(q) === -1) return false;
            return true;
          });
          paintTable(filtered);
          return filtered;
        }

        paintTable(list);
        document.getElementById('wg-search').addEventListener('input', applyFilters);
        document.getElementById('wg-rt').addEventListener('change', applyFilters);
        document.getElementById('btn-add-warga').addEventListener('click', function () { openWargaModal(null, rtList, container); });
        document.getElementById('btn-export-warga').addEventListener('click', function () {
          TPQExport.exportToExcel('Data_Warga_TPQ_Nurul_Huda', 'Master Data Warga', [
            { label: 'ID Warga', key: 'id_warga' },
            { label: 'Nama Lengkap', key: 'nama_lengkap' },
            { label: 'RT', key: 'nomor_rt' },
            { label: 'Alamat', key: 'alamat' },
            { label: 'Kontak', key: 'nomor_kontak' },
            { label: 'Keterangan', key: 'keterangan' }
          ], applyFilters());
        });
        document.getElementById('btn-import-warga').addEventListener('click', function () {
          openCsvImportModal('Import Data Warga (CSV dari Excel)', 'Header kolom: nama_lengkap,rt,alamat,nomor_kontak,keterangan', 'admin_warga_import', function () { renderWargaAdmin(container); });
        });
        document.getElementById('warga-admin-tbody').addEventListener('click', function (e) {
          var btn = e.target.closest('button[data-wedit]');
          if (!btn) return;
          var item = list.find(function (x) { return x.id_warga === btn.getAttribute('data-wedit'); });
          if (item) openWargaModal(item, rtList, container);
        });
      })
      .catch(function (err) { container.innerHTML = TPQUi.renderError(err.message); });
  }

  function openWargaModal(editW, rtList, container) {
    var esc = TPQUi.escapeHtml;
    var rtOpts = '<option value="">-- Pilih Wilayah RT --</option>' + rtList.map(function (r) {
      var sel = editW && editW.id_rt === r.id_rt ? ' selected' : '';
      return '<option value="' + esc(r.id_rt) + '"' + sel + '>' + esc(r.nomor_rt) + '</option>';
    }).join('');
    var body =
      '<div class="form-grid">' +
      '  <div class="form-group"><label>Nama Lengkap</label><input type="text" id="wgm-nama" value="' + esc(editW ? editW.nama_lengkap : '') + '" required></div>' +
      '  <div class="form-group"><label>Wilayah RT</label><select id="wgm-rt" required>' + rtOpts + '</select></div>' +
      '  <div class="form-group full"><label>Alamat</label><input type="text" id="wgm-alamat" value="' + esc(editW ? editW.alamat : '') + '"></div>' +
      '  <div class="form-group"><label>Nomor Kontak (Opsional)</label><input type="text" id="wgm-kontak" value="' + esc(editW ? editW.nomor_kontak : '') + '"></div>' +
      '  <div class="form-group"><label>Keterangan</label><input type="text" id="wgm-ket" value="' + esc(editW ? editW.keterangan : '') + '"></div>' +
      '</div>';
    var footer = '<button class="btn btn-outline" onclick="TPQUi.closeModal()">Batal</button><button class="btn btn-primary" id="btn-save-warga">Simpan Warga</button>';
    TPQUi.openModal(editW ? 'Edit Data Warga' : 'Tambah Data Warga', body, footer);

    document.getElementById('btn-save-warga').addEventListener('click', function () {
      var btn = this;
      btn.disabled = true;
      TPQApi.request('admin_warga_save', {
        id_warga: editW ? editW.id_warga : '',
        nama_lengkap: document.getElementById('wgm-nama').value,
        id_rt: document.getElementById('wgm-rt').value,
        alamat: document.getElementById('wgm-alamat').value,
        nomor_kontak: document.getElementById('wgm-kontak').value,
        keterangan: document.getElementById('wgm-ket').value
      }, { requireAuth: true })
        .then(function () { TPQUi.closeModal(); TPQUi.showToast('Data warga disimpan.'); renderWargaAdmin(container); })
        .catch(function (err) { btn.disabled = false; TPQUi.showToast(err.message, 'error'); });
    });
  }

  /* ==================== 7. SETTINGS, USERS, AUDIT LOG ==================== */

  function renderSettingsAdmin(container) {
    container.innerHTML = TPQUi.renderLoading('Memuat pengaturan website...');
    TPQApi.request('admin_settings_get', {}, { requireAuth: true })
      .then(function (s) {
        s = s || {};
        var esc = TPQUi.escapeHtml;
        container.innerHTML =
          '<div class="grid-2">' +
          '  <div class="card">' +
          '    <div class="card-header"><h2 class="card-title">Pengaturan Umum Website</h2></div>' +
          '    <div class="form-group"><label>Tahun Anggaran Donasi Aktif</label><input type="number" id="set-tahun" value="' + esc(s.tahun_aktif || new Date().getFullYear()) + '"></div>' +
          '    <div class="form-group"><label>Tagline Hero Beranda</label><input type="text" id="set-tagline" value="' + esc(s.site_tagline || '') + '"></div>' +
          '    <div class="form-group"><label>Nama Bendahara Default</label><input type="text" id="set-bendahara" value="' + esc(s.nama_bendahara || '') + '"></div>' +
          '    <button class="btn btn-primary" id="btn-save-settings">Simpan Pengaturan</button>' +
          '  </div>' +
          '  <div class="card">' +
          '    <div class="card-header"><h2 class="card-title">Pemeliharaan &amp; Backup Database</h2></div>' +
          '    <p style="font-size:0.88rem;color:var(--text-muted);margin-top:0;">Buat salinan cadangan Google Spreadsheet secara otomatis ke folder privat <code>TPQ_NURUL_HUDA/BACKUP/</code> di Google Drive.</p>' +
          '    <div style="display:flex;gap:10px;flex-wrap:wrap;">' +
          '      <button class="btn btn-gold" id="btn-backup-now">Backup Database ke Drive Sekarang</button>' +
          '      <button class="btn btn-outline" id="btn-init-check">Verifikasi 13 Sheet &amp; Folder Drive</button>' +
          '    </div>' +
          '  </div>' +
          '</div>';

        document.getElementById('btn-save-settings').addEventListener('click', function () {
          TPQApi.request('admin_settings_save', {
            tahun_aktif: document.getElementById('set-tahun').value,
            site_tagline: document.getElementById('set-tagline').value,
            nama_bendahara: document.getElementById('set-bendahara').value
          }, { requireAuth: true })
            .then(function () { TPQUi.showToast('Pengaturan berhasil disimpan.'); })
            .catch(function (err) { TPQUi.showToast(err.message, 'error'); });
        });

        document.getElementById('btn-backup-now').addEventListener('click', function () {
          var btn = this;
          btn.disabled = true;
          TPQApi.request('admin_backup_db', {}, { requireAuth: true })
            .then(function (r) { TPQUi.showToast('Backup berhasil: ' + r.backup_name); btn.disabled = false; })
            .catch(function (err) { TPQUi.showToast(err.message, 'error'); btn.disabled = false; });
        });

        document.getElementById('btn-init-check').addEventListener('click', function () {
          TPQApi.request('admin_init_system', {}, { requireAuth: true })
            .then(function () { TPQUi.showToast('Seluruh 13 sheet database dan 7 folder Drive terverifikasi.'); })
            .catch(function (err) { TPQUi.showToast(err.message, 'error'); });
        });
      })
      .catch(function (err) { container.innerHTML = TPQUi.renderError(err.message); });
  }

  function renderUsersAdmin(container) {
    container.innerHTML = TPQUi.renderLoading('Memuat daftar pengguna...');
    TPQApi.request('admin_users_list', {}, { requireAuth: true })
      .then(function (list) {
        var esc = TPQUi.escapeHtml;
        var rows = (list || []).map(function (u) {
          return (
            '<tr>' +
            '  <td><strong>' + esc(u.username) + '</strong></td>' +
            '  <td>' + esc(u.nama_lengkap) + '</td>' +
            '  <td><span class="badge ' + (u.role === 'SUPERADMIN' ? 'badge-gold' : 'badge-info') + '">' + esc(u.role) + '</span></td>' +
            '  <td>' + TPQUi.statusBadge(u.status) + '</td>' +
            '  <td>' + (u.last_login ? TPQUi.formatDateID(u.last_login) : '-') + '</td>' +
            '  <td><button class="btn btn-outline btn-sm" data-uedit="' + esc(u.id_user) + '">Edit</button></td>' +
            '</tr>'
          );
        }).join('');

        container.innerHTML =
          '<div class="card">' +
          '  <div class="toolbar">' +
          '    <span style="font-size:0.86rem;color:var(--text-muted);">Kelola akun Superadmin &amp; Admin serta hak akses modul masing-masing.</span>' +
          '    <button class="btn btn-primary btn-sm" id="btn-add-user">+ Tambah Pengguna</button>' +
          '  </div>' +
          '  <div class="table-responsive"><table><thead><tr><th>Username</th><th>Nama Lengkap</th><th>Role</th><th>Status</th><th>Login Terakhir</th><th>Aksi</th></tr></thead><tbody id="users-tbody">' + rows + '</tbody></table></div>' +
          '</div>';

        document.getElementById('btn-add-user').addEventListener('click', function () { openUserModal(null, container); });
        document.getElementById('users-tbody').addEventListener('click', function (e) {
          var btn = e.target.closest('button[data-uedit]');
          if (!btn) return;
          var item = list.find(function (x) { return x.id_user === btn.getAttribute('data-uedit'); });
          if (item) openUserModal(item, container);
        });
      })
      .catch(function (err) { container.innerHTML = TPQUi.renderError(err.message); });
  }

  function openUserModal(editU, container) {
    var esc = TPQUi.escapeHtml;
    var permOptions = ['dashboard', 'profil', 'guru', 'murid', 'rt', 'warga', 'pengaturan_iuran', 'iuran_target', 'sumbangan_insidental', 'riwayat_transaksi', 'pengeluaran', 'saldo_keuangan', 'laporan'];
    var curPerms = (editU && editU.permissions) || permOptions;

    var body =
      '<div class="form-grid">' +
      '  <div class="form-group"><label>Username</label><input type="text" id="um-user" value="' + esc(editU ? editU.username : '') + '"' + (editU ? ' disabled' : '') + ' required></div>' +
      '  <div class="form-group"><label>Nama Lengkap</label><input type="text" id="um-nama" value="' + esc(editU ? editU.nama_lengkap : '') + '" required></div>' +
      '  <div class="form-group"><label>Role</label><select id="um-role"><option value="ADMIN">ADMIN</option><option value="SUPERADMIN">SUPERADMIN</option></select></div>' +
      '  <div class="form-group"><label>Status</label><select id="um-status"><option value="AKTIF">AKTIF</option><option value="NONAKTIF">NONAKTIF</option></select></div>' +
      '  <div class="form-group full"><label>Password ' + (editU ? '(Kosongkan jika tidak diubah)' : '(Minimal 8 karakter)') + '</label><input type="password" id="um-pass" placeholder="Minimal 8 karakter"></div>' +
      '  <div class="form-group full"><label>Hak Akses Modul (Khusus Role ADMIN)</label><div style="display:flex;flex-wrap:wrap;gap:10px;">' +
         permOptions.map(function (p) {
           return '<label style="font-weight:400;"><input type="checkbox" class="um-perm" value="' + p + '"' + (curPerms.indexOf(p) !== -1 ? ' checked' : '') + '> ' + p + '</label>';
         }).join('') +
      '  </div></div>' +
      '</div>';

    var footer = '<button class="btn btn-outline" onclick="TPQUi.closeModal()">Batal</button><button class="btn btn-primary" id="btn-save-user">Simpan Pengguna</button>';
    TPQUi.openModal(editU ? 'Edit Pengguna' : 'Tambah Pengguna Baru', body, footer);
    if (editU) {
      document.getElementById('um-role').value = editU.role;
      document.getElementById('um-status').value = editU.status;
    }

    document.getElementById('btn-save-user').addEventListener('click', function () {
      var btn = this;
      btn.disabled = true;
      var perms = Array.prototype.slice.call(document.querySelectorAll('.um-perm:checked')).map(function (cb) { return cb.value; });
      TPQApi.request('admin_users_save', {
        id_user: editU ? editU.id_user : '',
        username: document.getElementById('um-user').value,
        nama_lengkap: document.getElementById('um-nama').value,
        role: document.getElementById('um-role').value,
        status: document.getElementById('um-status').value,
        password: document.getElementById('um-pass').value,
        permissions: perms
      }, { requireAuth: true })
        .then(function () { TPQUi.closeModal(); TPQUi.showToast('Pengguna berhasil disimpan.'); renderUsersAdmin(container); })
        .catch(function (err) { btn.disabled = false; TPQUi.showToast(err.message, 'error'); });
    });
  }

  function renderAuditLogAdmin(container) {
    container.innerHTML = TPQUi.renderLoading('Memuat audit log...');
    TPQApi.request('admin_audit_list', { limit: 150 }, { requireAuth: true })
      .then(function (list) {
        var esc = TPQUi.escapeHtml;
        var rows = (list || []).map(function (l) {
          return '<tr><td style="white-space:nowrap;">' + esc(String(l.timestamp).replace('T', ' ').slice(0, 19)) + '</td><td><strong>' + esc(l.username) + '</strong> (' + esc(l.role) + ')</td><td>' + esc(l.aksi) + '</td><td>' + esc(l.modul) + '</td><td>' + esc(l.detail) + '</td><td>' + TPQUi.statusBadge(l.status) + '</td></tr>';
        }).join('');
        container.innerHTML =
          '<div class="card">' +
          '  <div class="card-header"><h2 class="card-title">Riwayat Audit Log Sistem (150 Aktivitas Terakhir)</h2></div>' +
          '  <div class="table-responsive"><table><thead><tr><th>Waktu</th><th>Pengguna</th><th>Aksi</th><th>Modul</th><th>Detail</th><th>Status</th></tr></thead><tbody>' + (rows || '<tr><td colspan="6" class="text-center">Belum ada catatan log.</td></tr>') + '</tbody></table></div>' +
          '</div>';
      })
      .catch(function (err) { container.innerHTML = TPQUi.renderError(err.message); });
  }

  /* ==================== HELPER: MODAL IMPORT CSV/EXCEL ==================== */

  function openCsvImportModal(title, hint, actionName, onDone) {
    var body =
      '<p style="font-size:0.86rem;color:var(--text-muted);margin-top:0;">Simpan file Excel Anda sebagai <strong>CSV (Comma atau Semicolon delimited)</strong>, lalu pilih file di bawah ini.</p>' +
      '<div style="background:var(--bg);padding:10px;border-radius:6px;font-size:0.78rem;margin-bottom:12px;"><code>' + TPQUi.escapeHtml(hint) + '</code></div>' +
      '<input type="file" id="csv-import-file" accept=".csv,text/csv">';
    var footer = '<button class="btn btn-outline" onclick="TPQUi.closeModal()">Batal</button><button class="btn btn-primary" id="btn-run-csv-import">Proses Import</button>';
    TPQUi.openModal(title, body, footer);

    document.getElementById('btn-run-csv-import').addEventListener('click', function () {
      var fileIn = document.getElementById('csv-import-file');
      if (!fileIn.files || !fileIn.files[0]) {
        TPQUi.showToast('Pilih file CSV terlebih dahulu.', 'warning');
        return;
      }
      var btn = this;
      btn.disabled = true;
      var reader = new FileReader();
      reader.onload = function () {
        var items = TPQExport.parseCsvText(reader.result);
        if (items.length === 0) {
          TPQUi.showToast('File CSV kosong atau format tidak valid.', 'error');
          btn.disabled = false;
          return;
        }
        TPQApi.request(actionName, { items: items }, { requireAuth: true })
          .then(function (res) {
            TPQUi.closeModal();
            TPQUi.showToast('Import selesai: ' + res.inserted + ' data ditambahkan, ' + res.skipped + ' dilewati.');
            if (onDone) onDone();
          })
          .catch(function (err) { btn.disabled = false; TPQUi.showToast(err.message, 'error'); });
      };
      reader.readAsText(fileIn.files[0]);
    });
  }

  /* ==================== EVENT BINDINGS ==================== */

  document.addEventListener('DOMContentLoaded', function () {
    // Login form
    var loginForm = document.getElementById('admin-login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var errBox = document.getElementById('login-error-msg');
        var btn = document.getElementById('login-submit-btn');
        errBox.style.display = 'none';
        btn.disabled = true;
        btn.textContent = 'Memverifikasi...';

        TPQApi.request('login', {
          username: document.getElementById('login-username').value,
          password: document.getElementById('login-password').value
        })
          .then(function (res) {
            TPQApi.setSession(res);
            currentUser = res.user;
            showDashboardShell();
          })
          .catch(function (err) {
            errBox.textContent = err.message || 'Login gagal.';
            errBox.style.display = 'block';
          })
          .finally(function () {
            btn.disabled = false;
            btn.textContent = 'Masuk ke Dashboard';
          });
      });
    }

    // Sidebar navigation
    var nav = document.getElementById('admin-sidebar-nav');
    if (nav) {
      nav.addEventListener('click', function (e) {
        var btn = e.target.closest('.sidebar-item[data-menu]');
        if (btn) navigateMenu(btn.getAttribute('data-menu'));
      });
    }

    // Mobile sidebar toggle
    var mobToggle = document.getElementById('sidebar-mobile-toggle');
    var overlay = document.getElementById('sidebar-overlay');
    var sidebar = document.getElementById('admin-sidebar');
    if (mobToggle && overlay && sidebar) {
      mobToggle.addEventListener('click', function () {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('open');
      });
      overlay.addEventListener('click', function () {
        sidebar.classList.remove('open');
        overlay.classList.remove('open');
      });
    }

    // Logout
    var btnLogout = document.getElementById('btn-logout-sidebar');
    if (btnLogout) {
      btnLogout.addEventListener('click', function () {
        TPQApi.request('logout', {}, { requireAuth: true }).catch(function () {});
        TPQApi.setSession(null);
        currentUser = null;
        showLoginView();
      });
    }

    initAdminApp();
  });
})();
