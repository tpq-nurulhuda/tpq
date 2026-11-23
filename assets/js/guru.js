/**
 * guru.js - Direktori Profil Guru Publik (guru.html)
 * Catatan Privasi: Nomor kontak pribadi guru TIDAK pernah dikirim/ditampilkan di halaman publik.
 */
(function () {
  'use strict';

  var allGuru = [];

  function renderGuruList(list) {
    var host = document.getElementById('guru-grid-host');
    if (!host) return;
    if (!list || list.length === 0) {
      host.innerHTML = TPQUi.renderEmpty('Belum ada data guru yang sesuai', 'Data guru aktif akan tampil di sini.');
      return;
    }

    var esc = TPQUi.escapeHtml;
    host.innerHTML = '<div class="grid-4">' + list.map(function (g) {
      var initials = String(g.nama_lengkap || 'G').split(' ').slice(0, 2).map(function (s) { return s.charAt(0).toUpperCase(); }).join('');
      var photoHtml = g.foto_url
        ? '<img src="' + esc(g.foto_url) + '" alt="' + esc(g.nama_lengkap) + '" loading="lazy">'
        : '<div class="guru-avatar-fallback">' + esc(initials) + '</div>';

      return (
        '<article class="guru-card">' +
        '  <div class="guru-photo">' + photoHtml + '</div>' +
        '  <div class="guru-body">' +
        '    <h3 class="guru-name">' + esc(g.nama_lengkap) + '</h3>' +
        '    <div class="guru-role">' + esc(g.jabatan || 'Pengajar TPQ') + '</div>' +
        '    <div class="guru-meta">Pendidikan: ' + esc(g.pendidikan_terakhir || '-') + '</div>' +
        '  </div>' +
        '</article>'
      );
    }).join('') + '</div>';
  }

  function loadGuru() {
    var host = document.getElementById('guru-grid-host');
    if (host) host.innerHTML = TPQUi.renderLoading('Memuat direktori guru...');

    Promise.all([
      TPQApi.request('public_guru', {}, { useCache: true }),
      TPQApi.request('public_profil', {}, { useCache: true }).catch(function () { return {}; })
    ])
      .then(function (results) {
        allGuru = results[0] || [];
        TPQUi.applyBrandIdentity(results[1]);
        TPQUi.initPublicFooter(results[1]);
        renderGuruList(allGuru);
      })
      .catch(function (err) {
        TPQUi.initPublicFooter({});
        if (host) host.innerHTML = TPQUi.renderError(err.message, 'window.reloadGuruPage');
      });
  }

  window.reloadGuruPage = loadGuru;

  document.addEventListener('DOMContentLoaded', function () {
    TPQUi.initPublicNavbar('guru');
    loadGuru();

    var searchInput = document.getElementById('guru-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        var q = searchInput.value.toLowerCase().trim();
        var filtered = allGuru.filter(function (g) {
          return (String(g.nama_lengkap) + ' ' + String(g.jabatan) + ' ' + String(g.pendidikan_terakhir)).toLowerCase().indexOf(q) !== -1;
        });
        renderGuruList(filtered);
      });
    }
  });
})();
