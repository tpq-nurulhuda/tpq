/**
 * export.js - Export Excel (.xls / .csv), Import CSV/Excel, dan Cetak PDF Profesional
 * Tanpa dependensi library berat - Vanilla JS murni
 * Portal Digital TPQ Nurul Huda
 */
(function (global) {
  'use strict';

  /**
   * Export array of objects ke file Excel (.xls HTML workbook yang langsung dibuka Microsoft Excel & LibreOffice)
   */
  function exportToExcel(filename, sheetTitle, columns, rows) {
    if (!rows || rows.length === 0) {
      global.TPQUi.showToast('Tidak ada data untuk diexport.', 'warning');
      return;
    }

    var esc = global.TPQUi.escapeHtml;
    var thead = '<tr>' + columns.map(function (c) {
      return '<th style="background:#0B3D2E;color:#FFFFFF;font-weight:bold;border:1px solid #CCCCCC;padding:6px;">' + esc(c.label) + '</th>';
    }).join('') + '</tr>';

    var tbody = rows.map(function (row) {
      return '<tr>' + columns.map(function (c) {
        var val = typeof c.value === 'function' ? c.value(row) : row[c.key];
        var str = val === undefined || val === null ? '' : String(val);
        return '<td style="border:1px solid #DDDDDD;padding:5px;">' + esc(str) + '</td>';
      }).join('') + '</tr>';
    }).join('');

    var html =
      '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">' +
      '<head><meta charset="UTF-8"><style>table{border-collapse:collapse;font-family:Calibri,Arial,sans-serif;font-size:11pt;}</style></head>' +
      '<body>' +
      '<h3>' + esc(sheetTitle || filename) + '</h3>' +
      '<table><thead>' + thead + '</thead><tbody>' + tbody + '</tbody></table>' +
      '</body></html>';

    var blob = new Blob(['\ufeff' + html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename.replace(/\.xls$/i, '') + '.xls';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    global.TPQUi.showToast('File Excel berhasil diunduh.');
  }

  /**
   * Parse file CSV (dari Export Excel Save As CSV) menjadi array of objects.
   * Mendukung delimiter koma (,) maupun titik koma (;) yang umum di Excel Indonesia.
   */
  function parseCsvText(text) {
    var clean = String(text || '').replace(/^\uFEFF/, '').trim();
    if (!clean) return [];
    var lines = clean.split(/\r?\n/).filter(function (l) { return l.trim() !== ''; });
    if (lines.length < 2) return [];

    // Deteksi delimiter otomatis (; vs ,)
    var firstLine = lines[0];
    var delimiter = (firstLine.split(';').length > firstLine.split(',').length) ? ';' : ',';

    var headers = splitCsvLine_(firstLine, delimiter).map(function (h) {
      return h.trim().toLowerCase().replace(/\s+/g, '_');
    });

    var result = [];
    for (var i = 1; i < lines.length; i++) {
      var cols = splitCsvLine_(lines[i], delimiter);
      var obj = {};
      for (var j = 0; j < headers.length; j++) {
        obj[headers[j]] = cols[j] !== undefined ? cols[j].trim() : '';
      }
      result.push(obj);
    }
    return result;
  }

  function splitCsvLine_(line, delimiter) {
    var out = [];
    var cur = '';
    var inQuotes = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === delimiter && !inQuotes) {
        out.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out;
  }

  /**
   * Cetak dokumen/laporan profesional ke PDF melalui Print Dialog browser (format kop surat TPQ).
   */
  function printProfessionalReport(htmlContent, title) {
    var win = window.open('', '_blank', 'width=960,height=720');
    if (!win) {
      global.TPQUi.showToast('Izinkan pop-up browser untuk mencetak PDF.', 'warning');
      return;
    }
    var esc = global.TPQUi.escapeHtml;
    win.document.write(
      '<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8">' +
      '<title>' + esc(title || 'Laporan TPQ Nurul Huda') + '</title>' +
      '<style>' +
      'body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:24px;font-size:12px;line-height:1.45;}' +
      '.report-kop{display:flex;align-items:center;gap:16px;border-bottom:3px double #0B3D2E;padding-bottom:12px;margin-bottom:18px;}' +
      '.report-kop img{width:60px;height:60px;object-fit:contain;}' +
      '.report-kop h2{margin:0 0 4px;color:#0B3D2E;font-size:18px;}' +
      '.report-kop p{margin:0;color:#444;font-size:11px;}' +
      'h3{margin:0 0 6px;color:#0B3D2E;font-size:15px;}' +
      'table{width:100%;border-collapse:collapse;margin-top:12px;}' +
      'th{background:#0B3D2E;color:#FFF;text-align:left;padding:7px 8px;border:1px solid #0B3D2E;font-size:11px;}' +
      'td{padding:6px 8px;border:1px solid #CCC;font-size:11px;}' +
      '.text-right{text-align:right;}.text-center{text-align:center;}' +
      '.summary-box{background:#F4F8F6;border:1px solid #C8DDD2;padding:10px 14px;border-radius:6px;margin:12px 0;}' +
      '.report-signature{margin-top:32px;display:flex;justify-content:flex-end;}' +
      '.report-sign-box{text-align:center;min-width:200px;}' +
      '.report-sign-line{margin-top:58px;border-top:1px solid #222;padding-top:4px;font-weight:bold;}' +
      '@media print{body{margin:10mm;} th{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}' +
      '</style></head><body>' + htmlContent + '</body></html>'
    );
    win.document.close();
    win.focus();
    setTimeout(function () { win.print(); }, 350);
  }

  global.TPQExport = {
    exportToExcel: exportToExcel,
    parseCsvText: parseCsvText,
    printProfessionalReport: printProfessionalReport
  };
})(window);
