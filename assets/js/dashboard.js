/**
 * dashboard.js - Logika Halaman Beranda Publik (index.html)
 * Menggunakan 1 bundle request (public_home) dengan cache publik untuk performa maksimal.
 */
(function () {
  'use strict';

  function loadHome() {
    var contentEl = document.getElementById('home-dynamic-content');
    if (contentEl) contentEl.innerHTML = TPQUi.renderLoading('Memuat informasi Portal Digital TPQ Nurul Huda...');

    TPQApi.request('public_home', {}, { useCache: true })
      .then(function (data) {
        var p = data.profil || {};
        var s = data.stats || {};
        var dp = data.donasi_preview || {};
        var sk = dp.ringkasan_sukarela || {};
        var ins = dp.ringkasan_insidental || {};
        var esc = TPQUi.escapeHtml;

        TPQUi.applyBrandIdentity(p);
        TPQUi.initPublicFooter(p);

        // Update Hero
        var heroTitle = document.getElementById('hero-title');
        var heroSub = document.getElementById('hero-subtitle');
        var heroMedia = document.getElementById('hero-media-box');
        if (heroTitle) heroTitle.textContent = p.nama_lembaga || 'TPQ Nurul Huda';
        if (heroSub) heroSub.textContent = (data.settings && data.settings.site_tagline) || 'Membina Generasi Qur\'ani yang Berakhlak Mulia, Cerdas, dan Mencintai Al-Qur\'an.';
        if (heroMedia && p.hero_image_url) {
          heroMedia.innerHTML = '<img src="' + esc(p.hero_image_url) + '" alt="Kegiatan TPQ Nurul Huda" loading="lazy">';
        }

        // Statistik Utama
        var kegiatanHtml = '';
        var kegList = Array.isArray(p.kegiatan_terbaru) ? p.kegiatan_terbaru : [];
        if (kegList.length > 0) {
          kegiatanHtml = '<div class="grid-3">' + kegList.slice(0, 3).map(function (k) {
            return (
              '<div class="card">' +
              '  <span class="badge badge-gold" style="margin-bottom:8px;">' + esc(k.tanggal || 'Kegiatan') + '</span>' +
              '  <h3 style="margin:0 0 8px;font-size:1.02rem;color:var(--primary-dark);">' + esc(k.judul || '-') + '</h3>' +
              '  <p style="margin:0;font-size:0.88rem;color:var(--text-muted);">' + esc(k.deskripsi || '') + '</p>' +
              '</div>'
            );
          }).join('') + '</div>';
        } else {
          kegiatanHtml = TPQUi.renderEmpty('Belum ada pengumuman kegiatan terbaru', 'Informasi kegiatan TPQ akan ditampilkan di sini.');
        }

        var dokHtml = '';
        var dokList = Array.isArray(p.dokumentasi) ? p.dokumentasi : [];
        if (dokList.length > 0) {
          dokHtml = '<div class="grid-4">' + dokList.slice(0, 4).map(function (d) {
            return (
              '<div class="card" style="padding:10px;">' +
              '  <img src="' + esc(d.url || '') + '" alt="' + esc(d.caption || 'Dokumentasi TPQ') + '" loading="lazy" style="width:100%;height:160px;object-fit:cover;border-radius:8px;">' +
              '  <div style="font-size:0.82rem;color:var(--text-muted);margin-top:8px;">' + esc(d.caption || 'Kegiatan TPQ') + '</div>' +
              '</div>'
            );
          }).join('') + '</div>';
        } else {
          dokHtml = TPQUi.renderEmpty('Belum ada dokumentasi foto', 'Foto kegiatan TPQ dapat diunggah melalui Dashboard Administrator.');
        }

        var pct = Math.min(100, Number(s.persentase_target_tahunan) || 0);
        var misiItems = String(p.misi || '').split(/\n+/).filter(Boolean).map(function (m) {
          return '<li style="margin-bottom:6px;">' + esc(m.replace(/^\d+\.\s*/, '')) + '</li>';
        }).join('');

        contentEl.innerHTML =
          // Statistik 4 Kartu
          '<section class="section" style="padding-bottom:24px;">' +
          '  <div class="container">' +
          '    <div class="stats-grid">' +
          '      <div class="stat-card">' +
          '        <div class="stat-label">Tenaga Pendidik (Guru)</div>' +
          '        <div class="stat-value">' + TPQUi.formatNumber(s.jumlah_guru) + '</div>' +
          '        <div class="stat-sub">Ustadz &amp; Ustadzah Aktif</div>' +
          '      </div>' +
          '      <div class="stat-card gold">' +
          '        <div class="stat-label">Total Santri / Murid</div>' +
          '        <div class="stat-value">' + TPQUi.formatNumber(s.jumlah_murid) + '</div>' +
          '        <div class="stat-sub">Santri Aktif Belajar</div>' +
          '      </div>' +
          '      <div class="stat-card dark">' +
          '        <div class="stat-label">Cakupan Wilayah</div>' +
          '        <div class="stat-value">' + TPQUi.formatNumber(s.jumlah_rt) + ' RT</div>' +
          '        <div class="stat-sub">Wilayah Partisipasi Warga</div>' +
          '      </div>' +
          '      <div class="stat-card info">' +
          '        <div class="stat-label">Total Donasi (' + esc(dp.tahun || new Date().getFullYear()) + ')</div>' +
          '        <div class="stat-value" style="font-size:1.3rem;">' + TPQUi.formatRupiah(s.total_donasi_gabungan) + '</div>' +
          '        <div class="stat-sub">Sukarela &amp; Insidental</div>' +
          '      </div>' +
          '    </div>' +
          '  </div>' +
          '</section>' +

          // Sambutan Kepala TPQ & Profil Singkat
          '<section class="section section-alt">' +
          '  <div class="container">' +
          '    <div class="grid-2">' +
          '      <div class="card" style="border-left:4px solid var(--gold);">' +
          '        <div class="section-kicker">Sambutan Kepala TPQ</div>' +
          '        <h2 class="section-title" style="margin-bottom:12px;">' + esc(p.nama_kepala || 'Kepala TPQ Nurul Huda') + '</h2>' +
          '        <p style="color:var(--text-muted);white-space:pre-line;margin:0;">' + esc(p.sambutan_kepala || 'Selamat datang di Portal Digital TPQ Nurul Huda.') + '</p>' +
          '      </div>' +
          '      <div class="card">' +
          '        <div class="section-kicker">Visi &amp; Misi Lembaga</div>' +
          '        <h3 style="margin:0 0 8px;color:var(--primary-dark);">Visi</h3>' +
          '        <p style="margin:0 0 14px;color:var(--text);font-weight:600;">' + esc(p.visi || '-') + '</p>' +
          '        <h3 style="margin:0 0 8px;color:var(--primary-dark);">Misi</h3>' +
          '        <ul style="margin:0;padding-left:18px;color:var(--text-muted);font-size:0.92rem;">' + (misiItems || '<li>-</li>') + '</ul>' +
          '        <div style="margin-top:16px;"><a href="profil.html" class="btn btn-outline btn-sm">Lihat Profil Lengkap &rarr;</a></div>' +
          '      </div>' +
          '    </div>' +
          '  </div>' +
          '</section>' +

          // Ringkasan Transparansi Donasi
          '<section class="section">' +
          '  <div class="container">' +
          '    <div class="section-header">' +
          '      <div>' +
          '        <div class="section-kicker">Transparansi Keuangan</div>' +
          '        <h2 class="section-title">Ringkasan Donasi Tahun ' + esc(dp.tahun || new Date().getFullYear()) + '</h2>' +
          '      </div>' +
          '      <a href="donasi.html" class="btn btn-primary btn-sm">Buka Dashboard Donasi &rarr;</a>' +
          '    </div>' +
          '    <div class="stats-grid-3" style="margin-bottom:18px;">' +
          '      <div class="stat-card">' +
          '        <div class="stat-label">Total Donasi Sukarela</div>' +
          '        <div class="stat-value">' + TPQUi.formatRupiah(sk.total_keseluruhan_sukarela) + '</div>' +
          '        <div class="stat-sub">Target Tahunan, Bulanan &amp; Bebas</div>' +
          '      </div>' +
          '      <div class="stat-card gold">' +
          '        <div class="stat-label">Total Donasi Insidental</div>' +
          '        <div class="stat-value">' + TPQUi.formatRupiah(ins.total_donasi_insidental) + '</div>' +
          '        <div class="stat-sub">' + TPQUi.formatNumber(ins.jumlah_transaksi) + ' transaksi spontan</div>' +
          '      </div>' +
          '      <div class="stat-card dark">' +
          '        <div class="stat-label">Pencapaian Target Tahunan</div>' +
          '        <div class="stat-value">' + pct + '%</div>' +
          '        <div class="progress-wrap" style="margin-top:8px;"><div class="progress-bar" style="width:' + pct + '%"></div></div>' +
          '      </div>' +
          '    </div>' +
          '  </div>' +
          '</section>' +

          // Kegiatan Terbaru
          '<section class="section section-alt">' +
          '  <div class="container">' +
          '    <div class="section-header">' +
          '      <div><div class="section-kicker">Agenda &amp; Berita</div><h2 class="section-title">Kegiatan Terbaru</h2></div>' +
          '    </div>' +
          kegiatanHtml +
          '  </div>' +
          '</section>' +

          // Dokumentasi
          '<section class="section">' +
          '  <div class="container">' +
          '    <div class="section-header">' +
          '      <div><div class="section-kicker">Galeri</div><h2 class="section-title">Dokumentasi Kegiatan</h2></div>' +
          '    </div>' +
          dokHtml +
          '  </div>' +
          '</section>';
      })
      .catch(function (err) {
        TPQUi.initPublicFooter({});
        if (contentEl) {
          contentEl.innerHTML = '<div class="container" style="padding:36px 20px;">' + TPQUi.renderError(err.message, 'window.reloadHomePage') + '</div>';
        }
      });
  }

  window.reloadHomePage = loadHome;

  document.addEventListener('DOMContentLoaded', function () {
    TPQUi.initPublicNavbar('beranda');
    loadHome();
  });
})();
