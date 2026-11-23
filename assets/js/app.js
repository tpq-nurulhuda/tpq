/**
 * app.js - Shared UI Components, Formatters, Navbar, Footer, Modal & Toast
 * Portal Digital TPQ Nurul Huda
 */
(function (global) {
  'use strict';

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatRupiah(amount) {
    var n = Number(amount) || 0;
    return 'Rp' + Math.round(n).toLocaleString('id-ID');
  }

  function formatNumber(val) {
    return (Number(val) || 0).toLocaleString('id-ID');
  }

  function formatDateID(isoOrYmd) {
    if (!isoOrYmd) return '-';
    var d = new Date(isoOrYmd);
    if (isNaN(d.getTime())) return String(isoOrYmd);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function showToast(message, type) {
    var container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    var el = document.createElement('div');
    el.className = 'toast' + (type ? ' ' + type : '');
    el.textContent = message;
    container.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 3600);
  }

  function renderLoading(message) {
    return (
      '<div class="loading-box">' +
      '<div class="spinner"></div>' +
      '<div>' + escapeHtml(message || 'Memuat data...') + '</div>' +
      '</div>'
    );
  }

  function renderEmpty(title, subtitle) {
    return (
      '<div class="empty-box">' +
      '<div style="font-size:1.8rem;margin-bottom:8px;">&#128214;</div>' +
      '<strong style="color:var(--primary-dark);display:block;margin-bottom:4px;">' + escapeHtml(title || 'Belum ada data') + '</strong>' +
      '<span>' + escapeHtml(subtitle || 'Data akan tampil di sini setelah ditambahkan oleh administrator.') + '</span>' +
      '</div>'
    );
  }

  function renderError(message, retryFnName) {
    var btn = retryFnName
      ? '<div style="margin-top:12px;"><button class="btn btn-outline btn-sm" onclick="' + retryFnName + '()">Coba Lagi</button></div>'
      : '';
    return (
      '<div class="error-box">' +
      '<strong>Gagal memuat data</strong>' +
      '<div style="margin-top:4px;font-size:0.88rem;">' + escapeHtml(message || 'Terjadi gangguan koneksi.') + '</div>' +
      btn +
      '</div>'
    );
  }

  function initPublicNavbar(activePage) {
    var host = document.getElementById('public-navbar');
    if (!host) return;
    var logo = (global.TPQ_CONFIG && global.TPQ_CONFIG.DEFAULT_LOGO) || 'assets/images/logo.svg';
    var items = [
      { id: 'beranda', label: 'Beranda', href: 'index.html' },
      { id: 'profil', label: 'Profil Lembaga', href: 'profil.html' },
      { id: 'guru', label: 'Profil Guru', href: 'guru.html' },
      { id: 'murid', label: 'Data Murid', href: 'murid.html' },
      { id: 'donasi', label: 'Donasi', href: 'donasi.html' }
    ];

    var linksHtml = items.map(function (it) {
      var cls = it.id === activePage ? ' class="active"' : '';
      return '<li><a href="' + it.href + '"' + cls + '>' + it.label + '</a></li>';
    }).join('');
    linksHtml += '<li><a href="admin.html" class="btn-login-nav">Login Admin</a></li>';

    host.innerHTML =
      '<nav class="navbar">' +
      '  <div class="container navbar-inner">' +
      '    <a href="index.html" class="brand">' +
      '      <img id="nav-logo-img" src="' + logo + '" alt="Logo TPQ Nurul Huda" loading="eager">' +
      '      <div class="brand-text">' +
      '        <span class="brand-title" id="nav-brand-name">TPQ NURUL HUDA</span>' +
      '        <span class="brand-sub">Portal Digital Lembaga</span>' +
      '      </div>' +
      '    </a>' +
      '    <button class="nav-toggle" id="nav-toggle-btn" aria-label="Buka Menu">&#9776;</button>' +
      '    <ul class="nav-links" id="nav-links-list">' + linksHtml + '</ul>' +
      '  </div>' +
      '</nav>';

    var toggle = document.getElementById('nav-toggle-btn');
    var list = document.getElementById('nav-links-list');
    if (toggle && list) {
      toggle.addEventListener('click', function () {
        list.classList.toggle('open');
      });
    }
  }

  function initPublicFooter(profil) {
    var host = document.getElementById('public-footer');
    if (!host) return;
    var p = profil || {};
    var year = new Date().getFullYear();
    host.innerHTML =
      '<footer class="footer">' +
      '  <div class="container">' +
      '    <div class="footer-grid">' +
      '      <div>' +
      '        <h4>' + escapeHtml(p.nama_lembaga || 'TPQ Nurul Huda') + '</h4>' +
      '        <p style="margin:0 0 10px;font-size:0.9rem;">' + escapeHtml(p.alamat || 'Lembaga Pendidikan Al-Qur\'an untuk generasi Qur\'ani berakhlak mulia.') + '</p>' +
      '        <div style="font-size:0.84rem;color:rgba(255,255,255,0.72);">Izin Operasional: ' + escapeHtml(p.nomor_izin || '-') + '</div>' +
      '      </div>' +
      '      <div>' +
      '        <h4>Navigasi</h4>' +
      '        <ul>' +
      '          <li><a href="index.html">Beranda</a></li>' +
      '          <li><a href="profil.html">Profil Lembaga</a></li>' +
      '          <li><a href="guru.html">Profil Guru</a></li>' +
      '          <li><a href="murid.html">Statistik Murid</a></li>' +
      '          <li><a href="donasi.html">Transparansi Donasi</a></li>' +
      '        </ul>' +
      '      </div>' +
      '      <div>' +
      '        <h4>Kontak Lembaga</h4>' +
      '        <ul>' +
      '          <li>Telepon: ' + escapeHtml(p.kontak_telp || '-') + '</li>' +
      '          <li>Email: ' + escapeHtml(p.kontak_email || '-') + '</li>' +
      '          <li>WhatsApp: ' + escapeHtml(p.kontak_wa || '-') + '</li>' +
      '        </ul>' +
      '      </div>' +
      '    </div>' +
      '    <div class="footer-bottom">' +
      '      <span>&copy; ' + year + ' ' + escapeHtml(p.nama_lembaga || 'TPQ Nurul Huda') + '. Seluruh hak cipta dilindungi.</span>' +
      '      <span>Portal Digital Resmi • Transparan &amp; Amanah</span>' +
      '    </div>' +
      '  </div>' +
      '</footer>';
  }

  function applyBrandIdentity(profil) {
    if (!profil) return;
    var logoImg = document.getElementById('nav-logo-img');
    var brandName = document.getElementById('nav-brand-name');
    if (logoImg && profil.logo_url) logoImg.src = profil.logo_url;
    if (brandName && profil.nama_lembaga) brandName.textContent = profil.nama_lembaga.toUpperCase();
  }

  function renderLightweightBarChart(containerEl, chartData) {
    if (!containerEl) return;
    if (!chartData || chartData.length === 0) {
      containerEl.innerHTML = renderEmpty('Belum ada data grafik', 'Data grafik per periode akan tampil otomatis saat transaksi tercatat.');
      return;
    }
    var maxVal = 0;
    chartData.forEach(function (c) {
      var tot = (Number(c.sukarela) || 0) + (Number(c.insidental) || 0);
      if (tot > maxVal) maxVal = tot;
    });
    if (maxVal === 0) maxVal = 1;

    var colsHtml = chartData.map(function (c) {
      var s = Number(c.sukarela) || 0;
      var ins = Number(c.insidental) || 0;
      var tot = s + ins;
      var sPct = Math.round((s / maxVal) * 145);
      var iPct = Math.round((ins / maxVal) * 145);
      var shortVal = tot >= 1000000 ? (tot / 1000000).toFixed(1) + 'jt' : (tot >= 1000 ? Math.round(tot / 1000) + 'rb' : String(tot));

      return (
        '<div class="chart-col" title="' + escapeHtml(c.nama_periode) + ': Sukarela ' + formatRupiah(s) + ' | Insidental ' + formatRupiah(ins) + '">' +
        '  <div class="chart-val">' + (tot > 0 ? shortVal : '') + '</div>' +
        '  <div class="chart-stack">' +
        '    <div class="chart-seg-sukarela" style="height:' + sPct + 'px"></div>' +
        '    <div class="chart-seg-insidental" style="height:' + iPct + 'px"></div>' +
        '  </div>' +
        '  <div class="chart-label">' + escapeHtml(String(c.nama_periode).slice(0, 6)) + '</div>' +
        '</div>'
      );
    }).join('');

    containerEl.innerHTML =
      '<div class="chart-bars">' + colsHtml + '</div>' +
      '<div style="display:flex;gap:16px;justify-content:center;margin-top:12px;font-size:0.8rem;color:var(--text-muted);">' +
      '  <span><span style="display:inline-block;width:10px;height:10px;background:var(--primary);border-radius:2px;margin-right:6px;"></span>Donasi Sukarela</span>' +
      '  <span><span style="display:inline-block;width:10px;height:10px;background:var(--gold);border-radius:2px;margin-right:6px;"></span>Donasi Insidental</span>' +
      '</div>';
  }

  function openModal(title, bodyHtml, footerHtml, isLarge) {
    var backdrop = document.getElementById('global-modal-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'global-modal-backdrop';
      backdrop.className = 'modal-backdrop';
      backdrop.innerHTML =
        '<div class="modal" id="global-modal-box">' +
        '  <div class="modal-header">' +
        '    <h3 id="global-modal-title"></h3>' +
        '    <button class="modal-close" id="global-modal-close" aria-label="Tutup">&times;</button>' +
        '  </div>' +
        '  <div class="modal-body" id="global-modal-body"></div>' +
        '  <div class="modal-footer" id="global-modal-footer"></div>' +
        '</div>';
      document.body.appendChild(backdrop);
      document.getElementById('global-modal-close').addEventListener('click', closeModal);
      backdrop.addEventListener('click', function (e) {
        if (e.target === backdrop) closeModal();
      });
    }
    var box = document.getElementById('global-modal-box');
    box.className = isLarge ? 'modal modal-lg' : 'modal';
    document.getElementById('global-modal-title').textContent = title;
    document.getElementById('global-modal-body').innerHTML = bodyHtml;
    var footer = document.getElementById('global-modal-footer');
    footer.innerHTML = footerHtml || '';
    footer.style.display = footerHtml ? 'flex' : 'none';
    backdrop.classList.add('open');
  }

  function closeModal() {
    var backdrop = document.getElementById('global-modal-backdrop');
    if (backdrop) backdrop.classList.remove('open');
  }

  function readFileAsBase64(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = function () { reject(new Error('Gagal membaca file.')); };
      reader.readAsDataURL(file);
    });
  }

  function polaBadge(jenisPola) {
    if (jenisPola === 'TARGET_TAHUNAN') return '<span class="badge badge-info">Target Tahunan</span>';
    if (jenisPola === 'KESANGGUPAN_BULANAN') return '<span class="badge badge-gold">Kesanggupan Bulanan</span>';
    return '<span class="badge badge-neutral">Donasi Bebas</span>';
  }

  function statusBadge(status) {
    var s = String(status || '').toUpperCase();
    if (s === 'AKTIF' || s === 'TARGET TERCAPAI' || s === 'SUDAH BERPARTISIPASI' || s === 'BERPARTISIPASI') {
      return '<span class="badge badge-success">' + escapeHtml(s) + '</span>';
    }
    if (s === 'DALAM PROSES' || s === 'PARTISIPASI SEBAGIAN') {
      return '<span class="badge badge-warning">' + escapeHtml(s) + '</span>';
    }
    if (s === 'NONAKTIF' || s === 'DENIED') {
      return '<span class="badge badge-danger">' + escapeHtml(s) + '</span>';
    }
    return '<span class="badge badge-neutral">' + escapeHtml(s || '-') + '</span>';
  }

  global.TPQUi = {
    escapeHtml: escapeHtml,
    formatRupiah: formatRupiah,
    formatNumber: formatNumber,
    formatDateID: formatDateID,
    showToast: showToast,
    renderLoading: renderLoading,
    renderEmpty: renderEmpty,
    renderError: renderError,
    initPublicNavbar: initPublicNavbar,
    initPublicFooter: initPublicFooter,
    applyBrandIdentity: applyBrandIdentity,
    renderLightweightBarChart: renderLightweightBarChart,
    openModal: openModal,
    closeModal: closeModal,
    readFileAsBase64: readFileAsBase64,
    polaBadge: polaBadge,
    statusBadge: statusBadge
  };
})(window);
