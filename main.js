/* SI-BARISAN - logika aplikasi: tema, slider, penilaian mandiri, bukti dukung, daftar penilaian, login.
   Membutuhkan wilayah.js (JALUR dan WILAYAH) yang dimuat sebelum berkas ini. */
(function () {
  /*=============== GOOGLE DRIVE CONFIG ===============*/
  // DRIVE_URL: URL Web App Apps Script (berakhiran /exec).
  // DRIVE_TOKEN: kosong di sini, diisi otomatis setelah login (tiket dari server).
  var DRIVE_URL =
    "https://script.google.com/macros/s/AKfycbxP0CheqIQOqnbJU6OOPz_nZocCW9emcSLMm5ngl2fSpF1lv3f3jZ9U9QzyTJPeJzEs/exec";
  var DRIVE_TOKEN = "";
  window.SIB = { url: DRIVE_URL, token: DRIVE_TOKEN, user: null };

  /*=============== HELPERS ===============*/
  var $ = function (s, r) {
      return (r || document).querySelector(s);
    },
    $$ = function (s, r) {
      return [].slice.call((r || document).querySelectorAll(s));
    };

  document.documentElement.classList.add("js");

  /*=============== SHOW MENU ===============*/
  var menu = $("#nav-menu");

  $("#nav-toggle").onclick = function () {
    menu.classList.add("show");
  };

  $("#nav-close").onclick = function () {
    menu.classList.remove("show");
  };

  $$(".nav__link").forEach(function (a) {
    a.onclick = function () {
      menu.classList.remove("show");
    };
  });

  /*=============== DARK LIGHT THEME ===============*/
  var root = document.documentElement,
    tb = $("#theme-button");

  function setTheme(t) {
    root.dataset.theme = t;
    tb.innerHTML =
      '<svg class="i"><use href="#' +
      (t === "dark" ? "sun" : "moon") +
      '"/></svg>';
  }

  var saved = null;

  try {
    saved = localStorage.getItem("theme");
  } catch (e) {}

  setTheme(saved || "light");

  tb.onclick = function () {
    var t = root.dataset.theme === "dark" ? "light" : "dark";
    setTheme(t);

    try {
      localStorage.setItem("theme", t);
    } catch (e) {}
  };

  /*=============== SLIDERS ===============*/
  $$(".slider").forEach(function (s) {
    var tr = $(".slider__track", s),
      n = $$(".slide", s).length,
      i = 0,
      tm,
      x0 = null;

    function go(k) {
      i = (k + n) % n;
      tr.style.transform = "translateX(-" + i * 100 + "%)";
    }

    function play() {
      var d = +s.dataset.auto;

      if (d && !matchMedia("(prefers-reduced-motion:reduce)").matches) {
        clearInterval(tm);

        tm = setInterval(function () {
          go(i + 1);
        }, d);
      }
    }

    $(".prev", s).onclick = function () {
      go(i - 1);
      play();
    };

    $(".next", s).onclick = function () {
      go(i + 1);
      play();
    };

    s.onmouseenter = function () {
      clearInterval(tm);
    };

    s.onmouseleave = play;

    s.addEventListener(
      "touchstart",
      function (e) {
        x0 = e.touches[0].clientX;
      },
      { passive: true },
    );

    s.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var d = e.changedTouches[0].clientX - x0;

      if (Math.abs(d) > 40) {
        go(i + (d < 0 ? 1 : -1));
        play();
      }

      x0 = null;
    });

    play();
  });

  /*=============== SCROLL: HEADER, SCROLL UP, ACTIVE LINK ===============*/
  var hd = $("#header"),
    up = $("#scroll-up"),
    secs = $$("#app section[id]"),
    links = $$(".nav__link");

  function onScroll() {
    var y = window.scrollY;
    hd.classList.toggle("scrolled", y > 40);
    up.classList.toggle("show", y > 350);
    var cur = secs[0].id;

    if (halamanAktif) cur = halamanAktif;
    else
      secs.forEach(function (s) {
        if (!s.hidden && s.offsetParent !== null && y + 120 >= s.offsetTop)
          cur = s.id;
      });

    var adaMenu = links.some(function (a) {
      return a.getAttribute("href") === "#" + cur;
    });
    if (!adaMenu) cur = secs[0].id; // bagian tanpa menu: sorot Beranda
    links.forEach(function (a) {
      a.classList.toggle("active-link", a.getAttribute("href") === "#" + cur);
    });
  }

  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /*=============== SCROLL REVEAL ANIMATION ===============*/
  var rv = $$(".rv");

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0, rootMargin: "0px 0px -8% 0px" },
    );

    rv.forEach(function (e) {
      io.observe(e);
    });
  } else
    rv.forEach(function (e) {
      e.classList.add("in");
    });

  // Saat menu diklik, tampilkan langsung bagian tujuan tanpa menunggu observer
  $$(".nav__link").forEach(function (a) {
    a.addEventListener("click", function () {
      var t = document.querySelector(a.getAttribute("href"));
      if (!t) return;
      if (t.classList.contains("rv")) t.classList.add("in");
      $$(".rv", t).forEach(function (e) {
        e.classList.add("in");
      });
    });
  });

  /*=============== HALAMAN TERPISAH: dibuka lewat menu ===============*/
  // Penilaian Mandiri (memuat #forms) dan Monitoring Penilaian (memuat #tb)
  // Mencari bagian yang dituju sebuah menu, berdasarkan tulisan menunya
  function seksiMenu(kata) {
    var a = $$(".nav__link").filter(function (l) {
      var t = l.textContent.toLowerCase();

      return (
        t.indexOf(kata) > -1 &&
        t.indexOf("monitoring") < 0 &&
        /^#[\w-]+$/.test(l.getAttribute("href") || "")
      );
    })[0];

    return a ? document.querySelector(a.getAttribute("href")) : null;
  }

  var TERPISAH = [
    $("#forms") ? $("#forms").closest("section") : null, // Penilaian Mandiri
    $("#tb") ? $("#tb").closest("section") : null, // Monitoring Penilaian
    seksiMenu("capaian"), // Capaian
    seksiMenu("unduh"), // Unduhan
  ].filter(function (s, i, arr) {
    return s && s !== secs[0] && arr.indexOf(s) === i;
  });

  var halamanAktif = "";

  TERPISAH.forEach(function (s) {
    s.classList.add("halaman-terpisah");
  });

  function tampilHalaman() {
    var id = location.hash.slice(1),
      sebelum = halamanAktif,
      tujuan =
        TERPISAH.filter(function (s) {
          return s.id === id && !s.hidden;
        })[0] || null;

    halamanAktif = tujuan ? tujuan.id : "";

    TERPISAH.forEach(function (s) {
      s.classList.toggle("aktif", s === tujuan);
    });

    $$("#app section[id]").forEach(function (s) {
      if (TERPISAH.indexOf(s) < 0) s.classList.toggle("tersembunyi", !!tujuan);
    });

    if (tujuan) {
      $$(".rv", tujuan)
        .concat([tujuan])
        .forEach(function (e) {
          e.classList.add("in");
        });
      window.scrollTo(0, 0);
    } else if (sebelum) {
      var t = id && document.getElementById(id);
      if (t) t.scrollIntoView();
      else window.scrollTo(0, 0);
    }

    onScroll();
  }

  addEventListener("hashchange", tampilHalaman);

  document.addEventListener("sib:masuk", function () {
    setTimeout(tampilHalaman, 0);
  });

  tampilHalaman();

  /*=============== ASSESSMENT DATA (MINIMUM STANDARDS) ===============*/
  var G = [
    [
      "BARISAN",
      [
        [
          "Bersih",
          "assets/img/BERSIH1.jpeg",
          [
            "Tersedia tempat sampah terpilah untuk sampah organik, anorganik, dan residu di lokasi yang strategis.",
            "Tersedia jadwal kegiatan kebersihan dan petugas yang bertanggung jawab melaksanakannya.",
            "Tidak terdapat sampah berserakan di dalam maupun di luar gedung.",
            "Toilet dan tempat wudu bersih serta berfungsi dengan baik.",
            "Saluran air atau drainase bersih dan tidak tersumbat.",
            "Terdapat upaya mengurangi penggunaan plastik sekali pakai dalam kegiatan perkantoran, pembelajaran, dan keagamaan.",
          ],
        ],
        [
          "Asri",
          "assets/img/ASRI.jpeg",
          [
            "Halaman dan area terbuka tertata dengan baik.",
            "Terdapat taman atau tanaman hias yang ditanam langsung di lahan maupun dalam pot atau wadah lainnya.",
            "Barang, arsip, dan perlengkapan tersimpan dengan rapi serta tidak menumpuk di area terbuka.",
            "Tidak terdapat area yang kumuh, tidak terawat, atau terbengkalai.",
          ],
        ],
        [
          "Rindang",
          "assets/img/RINDANG.jpeg",
          [
            "Terdapat pohon peneduh sesuai dengan ketersediaan lahan atau tanaman dalam pot bagi satuan kerja yang memiliki lahan terbatas.",
            "Tersedia lubang resapan biopori atau sumur resapan sesuai dengan kondisi dan ketersediaan lahan.",
            "Tanaman dan pohon dipelihara secara berkala.",
            "Terdapat program penanaman pohon yang dilaksanakan paling sedikit satu kali dalam setahun.",
          ],
        ],
        [
          "Indah",
          "assets/img/INDAH.jpeg",
          [
            "Bangunan, pagar, dan fasilitas dalam kondisi baik dan terawat.",
            "Papan nama dan penunjuk arah terpasang dengan jelas serta tertata rapi.",
            "Tersedia media informasi yang memuat pesan pelestarian lingkungan, ekoteologi, atau nilai kearifan lokal.",
            "Ruang dan lingkungan ditata dengan memperhatikan keindahan, keserasian, dan kerapian.",
          ],
        ],
        [
          "Sehat",
          "assets/img/SEHAT.jpeg",
          [
            "Tersedia air bersih yang layak digunakan untuk kebutuhan sehari-hari.",
            "Ruangan memiliki sirkulasi udara dan pencahayaan yang memadai.",
            "Kawasan tanpa rokok diterapkan sesuai dengan ketentuan yang berlaku.",
            "Lingkungan bebas dari genangan air dan jentik nyamuk.",
            "Asrama, dapur, dan kantin, bagi satuan pendidikan yang memilikinya, dijaga agar tetap bersih dan memenuhi standar kesehatan. (bila ada)",
          ],
        ],
        [
          "Aman",
          "assets/img/AMAN1.jpeg",
          [
            "Tersedia alat pemadam api ringan (APAR) yang masih berlaku masa pemeriksaan atau masa kelayakannya.",
            "Jalur evakuasi dan titik kumpul tersedia, ditandai dengan jelas, dan mudah diakses.",
            "Tersedia prosedur kesiapsiagaan bencana yang disosialisasikan kepada pegawai, pendidik, tenaga kependidikan, peserta didik, dan santri.",
            "Pohon, bangunan, dan instalasi listrik yang berpotensi membahayakan diperiksa secara berkala.",
            "Drainase berfungsi dengan baik untuk mengurangi risiko banjir dan genangan air.",
          ],
        ],
        [
          "Nyaman",
          "assets/img/NYAMAN.jpeg",
          [
            "Ruang pelayanan, ruang kerja, dan ruang belajar ditata agar bersih, rapi, dan nyaman digunakan.",
            "Tersedia akses yang ramah bagi penyandang disabilitas dan lanjut usia sesuai dengan kondisi serta kemampuan satuan kerja.",
          ],
        ],
      ],
    ],
    [
      "SIPAKAINGE",
      [
        [
          "Sipakatau",
          "",
          [
            "Seluruh pegawai dan warga satuan pendidikan berpartisipasi dalam aksi BARISAN paling sedikit satu kali setiap bulan.",
            "Pelaksanaan aksi BARISAN memperhatikan kebutuhan dan mendorong keterlibatan perempuan, lanjut usia, penyandang disabilitas, dan murid sesuai dengan kemampuan, kondisi, dan kebutuhan masing-masing.",
            "Fasilitas satuan kerja, termasuk halaman, toilet, dan sarana air bersih, dapat dimanfaatkan oleh masyarakat sekitar dalam keadaan darurat atau untuk mendukung kegiatan sosial keagamaan, sesuai dengan ketentuan yang berlaku serta dengan tetap menjaga keamanan, kebersihan, dan keberlangsungan fungsi utama fasilitas.",
          ],
        ],
        [
          "Sipakalebbi",
          "",
          [
            "Satuan kerja memberikan apresiasi kepada pegawai atau murid yang menunjukkan kepedulian terhadap lingkungan.",
            "Paling sedikit 80% dari jumlah pohon yang ditanam dalam satu tahun terakhir tetap hidup dan terpelihara dengan baik.",
          ],
        ],
        [
          "Sipakainge",
          "",
          [
            "Satuan kerja menyampaikan pesan dan ajakan SIPAKAINGE melalui apel, rapat, pembinaan tatap muka, atau kanal komunikasi internal.",
            "Satuan kerja mengintegrasikan nilai ekoteologi dan kearifan lokal ke dalam pelaksanaan layanan utama, seperti pembelajaran, bimbingan perkawinan, penyuluhan, atau khotbah, sesuai dengan tugas dan fungsi masing-masing.",
            "Satuan kerja membagikan praktik baik pelaksanaan BARISAN-SIPAKAINGE kepada satuan kerja atau lembaga lain, terutama lembaga yang melibatkan partisipasi masyarakat.",
          ],
        ],
        [
          "Siri' na Pacce",
          "",
          [
            "Pimpinan dan seluruh pegawai menandatangani ikrar BARISAN-SIPAKAINGE yang dipasang di tempat terbuka dan mudah dilihat.",
            "Satuan kerja melaksanakan simulasi kesiapsiagaan bencana dengan melibatkan seluruh pegawai atau warga satuan pendidikan.",
            "Satuan kerja berpartisipasi dalam aksi solidaritas bagi masyarakat yang terdampak bencana atau kerusakan lingkungan.",
          ],
        ],
      ],
    ],
    [
      "Kolaborasi",
      [
        [
          "Kolaborasi",
          "",
          [
            "Satuan kerja memiliki dokumen kerja sama tertulis dengan pihak di luar Kementerian Agama.",
            "Satuan kerja melaksanakan kegiatan kolaboratif bersama mitra di luar Kementerian Agama paling sedikit satu kali setiap semester. Mitra dapat berasal dari unsur pemerintah, perguruan tinggi, organisasi kemasyarakatan dan keagamaan, tokoh masyarakat, dunia usaha, atau media.",
            "Kerja sama menghasilkan dukungan nyata, seperti bibit tanaman, sarana dan prasarana, tenaga ahli, atau pendanaan yang sah dan tidak mengikat. Setiap dukungan dibuktikan dengan dokumen yang dapat diverifikasi, seperti berita acara serah terima, daftar penerimaan, laporan kegiatan, atau dokumen administrasi lainnya.",
          ],
        ],
      ],
    ],
    [
      "Tata Kelola dan Pelaporan",
      [
        [
          "Tata Kelola",
          "",
          [
            "Tim pelaksana Gerakan BARISAN-SIPAKAINGE ditetapkan melalui surat keputusan pimpinan satuan kerja.",
            "Rencana kegiatan Gerakan BARISAN-SIPAKAINGE disusun dan diintegrasikan ke dalam program kerja dan/atau anggaran satuan kerja.",
            "Penilaian mandiri disampaikan sebelum batas waktu yang telah ditetapkan.",
            "Rencana perbaikan disusun paling lambat satu bulan setelah penilaian mandiri dilakukan.",
            "Laporan kegiatan setiap semester disampaikan sesuai dengan batas waktu yang telah ditetapkan.",
            "Bukti dukung dan dokumentasi kegiatan tersedia secara lengkap, tersusun rapi, dan dapat diakses untuk keperluan verifikasi.",
          ],
        ],
      ],
    ],
  ];

  /*=============== STATE & SCORING ===============*/
  var st = {},
    KEY = "si-barisan",
    mem = [],
    U = null;

  function na(g, u, i) {
    return g == 0 && u == 4 && i == 5 && !$("#as").checked;
  }

  /*=============== EVIDENCE RULES ===============*/
  var OK = /\.(jpe?g|png|webp|gif|pdf|docx?|xlsx?)$/i,
    MAXB = 2 * 1024 * 1024,
    MINF = 1,
    MAXF = 2;

  function isImg(f) {
    return /^image\//.test(f.type) || /\.(jpe?g|png|webp|gif)$/i.test(f.name);
  }

  function fok(f) {
    return !isImg(f) || (!!f.tgl && f.lok.trim().length > 1);
  }

  function evOK(x) {
    return x.f.filter(fok).length >= MINF;
  }

  function eff(g, u, i) {
    var x = st[g + "." + u + "." + i];
    return x.s > 0 && !evOK(x) ? 0 : x.s;
  }

  function sz(n) {
    return n < 1048576
      ? Math.max(1, Math.round(n / 1024)) + " KB"
      : (n / 1048576).toFixed(1) + " MB";
  }

  function flist(k) {
    var x = st[k],
      el = document.getElementById("f" + k);
    if (!el) return;

    el.innerHTML = x.f
      .map(function (f, j) {
        var im = isImg(f);

        return (
          "<li>" +
          (im && f.url
            ? '<img src="' + f.url + '" alt="Pratinjau ' + esc(f.name) + '">'
            : '<span class="dc">' +
              (im
                ? "FOTO"
                : f.name.split(".").pop().slice(0, 4).toUpperCase()) +
              "</span>") +
          '<span class="nm">' +
          esc(f.name) +
          "<br><small>" +
          sz(f.size) +
          "</small></span>" +
          (im
            ? '<input type="date" data-k="' +
              k +
              '" data-i="' +
              j +
              '" data-d="1" value="' +
              esc(f.tgl) +
              '" aria-label="Tanggal foto"><input type="text" data-k="' +
              k +
              '" data-i="' +
              j +
              '" data-l="1" value="' +
              esc(f.lok) +
              '" placeholder="Lokasi foto" maxlength="80" aria-label="Lokasi foto">'
            : "") +
          '<button type="button" class="rm" data-k="' +
          k +
          '" data-i="' +
          j +
          '" aria-label="Hapus berkas">&times;</button></li>'
        );
      })
      .join("");
  }

  // Mengecilkan foto (maks. 1600 px, JPEG) agar unggahan jauh lebih cepat
  function kecilkan(file) {
    return new Promise(function (ok) {
      if (
        !/^image\/(jpeg|png|webp)$/.test(file.type) ||
        file.size < 300 * 1024
      ) {
        return ok(file);
      }
      var img = new Image(),
        u = URL.createObjectURL(file);

      img.onload = function () {
        var w = img.naturalWidth,
          h = img.naturalHeight,
          r = Math.min(1, 1600 / Math.max(w, h)),
          cv = document.createElement("canvas"),
          cx;

        cv.width = Math.round(w * r);
        cv.height = Math.round(h * r);
        cx = cv.getContext("2d");
        cx.fillStyle = "#fff";
        cx.fillRect(0, 0, cv.width, cv.height);
        cx.drawImage(img, 0, 0, cv.width, cv.height);
        URL.revokeObjectURL(u);

        cv.toBlob(
          function (b) {
            if (!b || b.size >= file.size) return ok(file);
            ok(
              new File([b], file.name.replace(/\.\w+$/, "") + ".jpg", {
                type: "image/jpeg",
              }),
            );
          },
          "image/jpeg",
          0.75,
        );
      };

      img.onerror = function () {
        URL.revokeObjectURL(u);
        ok(file);
      };
      img.src = u;
    });
  }

  // Daftar proses kompres foto yang belum selesai
  function tungguKompres() {
    var p = [];
    Object.keys(st).forEach(function (k) {
      st[k].f.forEach(function (o) {
        if (o.kompres) p.push(o.kompres);
      });
    });
    return p;
  }

  function addF(k, files) {
    var x = st[k],
      er = [];

    [].forEach.call(files, function (f) {
      if (!OK.test(f.name)) {
        er.push(f.name + ": jenis berkas tidak didukung.");
        return;
      }

      if (f.size > MAXB) {
        er.push(f.name + ": lebih dari 2 MB.");
        return;
      }

      if (x.f.length >= MAXF) {
        er.push(
          "Maksimal " +
            MAXF +
            " berkas per butir. Hapus salah satu berkas dulu untuk menggantinya.",
        );
        return;
      }

      var o = {
        name: f.name,
        type: f.type,
        size: f.size,
        tgl: "",
        lok: "",
        url: "",
        file: f,
      };
      x.f.push(o);

      if (isImg(f)) {
        o.kompres = kecilkan(f).then(function (g) {
          if (g !== f) {
            o.file = g;
            o.name = g.name;
            o.type = g.type;
            o.size = g.size;
          }
          if (x.f.indexOf(o) > -1) flist(k);
        });

        var r = new FileReader();

        r.onload = function () {
          o.url = r.result;
          if (x.f.indexOf(o) > -1) flist(k);
        };

        r.readAsDataURL(f);
      }
    });

    st[k].er = er.length ? er.join(" ") : "";
    flist(k);
    upd();
  }

  function val(g, u) {
    var n = 0,
      s = 0,
      ok = 0;

    G[g][1][u][2].forEach(function (_, i) {
      if (na(g, u, i)) return;
      n++;
      var v = eff(g, u, i);
      s += v;
      if (v == 2) ok++;
    });

    return { v: n ? (s / (n * 2)) * 100 : 0, n: n, ok: ok };
  }

  function avg(g) {
    var a = G[g][1].map(function (_, u) {
      return val(g, u).v;
    });

    return {
      m:
        a.reduce(function (x, y) {
          return x + y;
        }, 0) / a.length,
      mn: Math.min.apply(0, a),
    };
  }

  function kat(x) {
    return x >= 80
      ? "Sangat Baik"
      : x >= 71
        ? "Baik"
        : x >= 60
          ? "Cukup"
          : "Kurang";
  }

  function kc(k) {
    return k == "Cukup" ? " m" : k == "Kurang" ? " l" : "";
  }

  function ig(b, s, k, t) {
    return 0.5 * b + 0.25 * s + 0.15 * k + 0.1 * t;
  }

  function calc() {
    var b = avg(0),
      s = avg(1),
      k = val(2, 0).v,
      t = val(3, 0).v,
      y = $("#y1").checked,
      kz = [0, 1, 2].some(function (i) {
        return eff(2, 0, i) == 0;
      });

    return {
      nb: b.m,
      ns: s.m,
      nk: k,
      nt: t,
      ig: ig(b.m, s.m, k, t),
      B: b.m >= 80 && b.mn >= 60,
      S: s.m >= (y ? 70 : 80) && s.mn >= (y ? 50 : 60),
      K: (y || k >= 80) && !kz,
    };
  }

  function f(x) {
    return x.toFixed(1);
  }

  /*=============== ASSESSMENT FORM & EVIDENCE UPLOAD ===============*/
  function build() {
    retryId = null;

    if ($("#dv")) {
      $("#dv").textContent = DRIVE_URL
        ? "Periksa kembali data dan dokumen yang Anda masukkan sebelum disimpan. Setelah Anda menekan Simpan, data masuk ke Google Sheets dan bukti dukung ke folder Google Drive, dan tidak dapat dihapus kembali."
        : "Mode lokal: data hanya tersimpan di browser ini. Isi DRIVE_URL di main.js untuk mengirim ke Google Drive.";
    }

    var h = "";
    st = {};

    G.forEach(function (g, gi) {
      h +=
        '<details class="grp"' +
        (gi ? "" : " open") +
        "><summary>" +
        g[0] +
        "</summary>";

      g[1].forEach(function (u, ui) {
        if (g[1].length > 1) h += "<h4>" + u[0] + "</h4>";

        u[2].forEach(function (t, i) {
          var k = gi + "." + ui + "." + i;
          st[k] = { s: 0, f: [], o: "", er: "" };

          h +=
            '<div class="it" id="r' +
            k +
            '"><span>' +
            t +
            '</span><div class="seg" data-k="' +
            k +
            '">' +
            [0, 1, 2]
              .map(function (v) {
                return (
                  '<button type="button" aria-pressed="' +
                  (v == 0) +
                  '" data-v="' +
                  v +
                  '">' +
                  v +
                  "</button>"
                );
              })
              .join("") +
            '</div><div class="ub"><label class="up"><input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" data-f="' +
            k +
            '" aria-label="Unggah bukti dukung"> + Unggah bukti</label><input class="join__input obs" data-o="' +
            k +
            '" placeholder="Atau tulis hasil pengamatan (min. 10 karakter)" maxlength="300" aria-label="Hasil pengamatan"><ul class="fl" id="f' +
            k +
            '"></ul></div><div class="wn" id="w' +
            k +
            '"></div></div>';
        });
      });

      h += "</details>";
    });

    $("#forms").innerHTML = h;
    upd();
  }

  function upd() {
    // Skor kembali ke 0 jika buktinya hilang (berkas dihapus atau isian dikosongkan)
    Object.keys(st).forEach(function (k) {
      var x = st[k],
        seg = document.querySelector('.seg[data-k="' + k + '"]');

      if (x.s > 0 && !evOK(x)) {
        x.s = 0;
        [].forEach.call(seg.children, function (b) {
          b.setAttribute("aria-pressed", b.dataset.v == 0);
        });
      }
    });

    var c = calc(),
      ev0 = 0,
      sc0 = 0;

    Object.keys(st).forEach(function (k) {
      if (st[k].s > 0) {
        sc0++;
        if (evOK(st[k])) ev0++;
      }
    });

    Object.keys(st).forEach(function (k) {
      var p = k.split("."),
        t = na(+p[0], +p[1], +p[2]);
      document.getElementById("r" + k).style.opacity = t ? 0.45 : 1;

      var kunci = t || !evOK(st[k]);

      [].forEach.call(
        document.querySelectorAll('.seg[data-k="' + k + '"] button'),
        function (b) {
          b.disabled = kunci;
          b.title = kunci && !t ? "Unggah bukti dulu untuk memilih skor" : "";
        },
      );

      document.getElementById("w" + k).textContent = t
        ? "Tidak berlaku: tanpa asrama, dapur, atau kantin."
        : st[k].er
          ? st[k].er
          : !evOK(st[k])
            ? st[k].f.length
              ? "Foto wajib memuat tanggal dan lokasi agar dihitung sebagai bukti."
              : "Unggah minimal " +
                MINF +
                " berkas bukti (maks. " +
                MAXF +
                ") agar skor bisa dipilih."
            : "";
    });

    $("#res").innerHTML =
      [
        ["NB", c.nb],
        ["NS", c.ns],
        ["NK", c.nk],
        ["NT", c.nt],
        ["IGBS", c.ig],
      ]
        .map(function (x) {
          return "<div><b>" + f(x[1]) + "</b><span>" + x[0] + "</span></div>";
        })
        .join("") +
      "<div><b>" +
      kat(c.ig) +
      "</b><span>Kategori</span></div><div><b>" +
      ev0 +
      " / " +
      sc0 +
      "</b><span>Butir berbukti</span></div>";

    $("#stsForm").innerHTML = [
      ["BARISAN", c.B],
      ["SIPAKAINGE", c.S],
      ["Kolaborasi", c.K],
    ]
      .map(function (x) {
        return (
          '<span class="pill' +
          (x[1] ? "" : " l") +
          '">' +
          x[0] +
          ": " +
          (x[1] ? "memenuhi" : "belum memenuhi") +
          "</span>"
        );
      })
      .join("");

    $("#unsurForm").innerHTML =
      '<span class="field-hint" style="flex-basis: 100%">Nilai unsur BARISAN pada formulir ini</span>' +
      G[0][1]
        .map(function (u, ui) {
          var r = val(0, ui),
            p = Math.round(r.v);

          return (
            '<span class="pill' +
            (p < 60 ? " l" : p < 80 ? " m" : "") +
            '">' +
            esc(u[0]) +
            " " +
            p +
            " (" +
            r.ok +
            "/" +
            r.n +
            " butir)</span>"
          );
        })
        .join("");
  }

  $("#forms").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-v]");
    if (!b) return;
    var s = b.parentNode;
    st[s.dataset.k].s = +b.dataset.v;

    [].forEach.call(s.children, function (x) {
      x.setAttribute("aria-pressed", x == b);
    });

    upd();
  });

  $("#forms").addEventListener("change", function (e) {
    var t = e.target;

    if (t.dataset.f) {
      addF(t.dataset.f, t.files);
      t.value = "";
    }
  });

  $("#forms").addEventListener("input", function (e) {
    var t = e.target,
      d = t.dataset;

    if (d.o !== undefined) {
      st[d.o].o = t.value;
      upd();
    } else if (d.d) {
      st[d.k].f[+d.i].tgl = t.value;
      upd();
    } else if (d.l) {
      st[d.k].f[+d.i].lok = t.value;
      upd();
    }
  });

  $("#forms").addEventListener("click", function (e) {
    var b = e.target.closest(".rm");
    if (!b) return;
    st[b.dataset.k].f.splice(+b.dataset.i, 1);
    st[b.dataset.k].er = "";
    flist(b.dataset.k);
    upd();
  });

  $("#as").onchange = $("#y1").onchange = upd;

  /*=============== JALUR DAN WILAYAH SATKER ===============*/
  // Jalur A: KUA, MIN, Kankemenag (lingkup Kankemenag Kab/Kota).
  // Jalur B: MTsN dan MAN (penilaian mandiri tersendiri).
  var otoNama = false;

  // Daftar lembaga Partisipatif: 6 rumah ibadah dan 1 pondok pesantren
  var LEMBAGA_PART = [
    {
      nama: "Pura Giri Natha",
      kab: "Makassar",
      ket: "Rumah ibadah",
      kat: "Rumah ibadah",
      jenis: "",
    },
    {
      nama: "Vihara Balla Samadhi Mawang",
      kab: "Gowa",
      ket: "Rumah ibadah",
      kat: "Rumah ibadah",
      jenis: "",
    },
    {
      nama: "Masjid Al Ukhwah",
      kab: "Luwu Timur",
      ket: "Rumah ibadah",
      kat: "Rumah ibadah",
      jenis: "",
    },
    {
      nama: "Gereja Toraja Jamaat Rama",
      kab: "Makassar",
      ket: "Rumah ibadah",
      kat: "Rumah ibadah",
      jenis: "",
    },
    {
      nama: "Gereja Pusat Ziarah Katolik",
      kab: "Tana Toraja",
      ket: "Rumah ibadah",
      kat: "Rumah ibadah",
      jenis: "",
    },
    {
      nama: "Klenteng Kwan Kong",
      kab: "Parepare",
      ket: "Rumah ibadah",
      kat: "Rumah ibadah",
      jenis: "",
    },
    {
      nama: "Ponpes Ilmu Yaqin Tompobulu",
      kab: "Maros",
      ket: "Pondok pesantren",
      kat: "Pendidikan keagamaan",
      jenis: "Pondok pesantren",
    },
  ];
  window.SIB.lembaga = LEMBAGA_PART;

  // Mencocokkan nama singkat (mis. "Gowa") dengan nama resmi di WILAYAH (mis. "Kabupaten Gowa")
  function cariKab(k) {
    var kunci = k.toLowerCase().replace(/[^a-z]/g, "");
    var w = WILAYAH.filter(function (x) {
      return (
        x.kab
          .toLowerCase()
          .replace(/[^a-z]/g, "")
          .indexOf(kunci) > -1
      );
    })[0];
    return w ? w.kab : k;
  }

  function aturWilayah() {
    var j = $("#jn").value,
      kw = j === "Kanwil",
      kua = j === "KUA",
      part = j === "Partisipatif",
      lembaga = null,
      info = "",
      nama;

    // Partisipatif: isi pilihan lembaga, kab/kota mengikuti lembaga yang dipilih
    $("#lpw").hidden = !part;

    // Partisipatif memakai daftar kegiatan sendiri, bukan butir BARISAN/SIPAKAINGE
    [
      "#forms",
      "#res",
      "#stsForm",
      "#unsurForm",
      "#ketNilai",
      "#optNilai",
    ].forEach(function (s) {
      $(s).hidden = part;
    });
    $("#partbox").hidden = !part;

    if (part) {
      var lamaL = $("#lpt").value;

      $("#lpt").innerHTML =
        '<option value="">Pilih lembaga</option>' +
        LEMBAGA_PART.map(function (x) {
          return "<option>" + esc(x.nama) + "</option>";
        }).join("");

      lembaga =
        LEMBAGA_PART.filter(function (x) {
          return x.nama === lamaL;
        })[0] || null;
      $("#lpt").value = lembaga ? lembaga.nama : "";

      if (lembaga) $("#kb").value = cariKab(lembaga.kab);
    }

    var kab = $("#kb").value,
      w = WILAYAH.filter(function (x) {
        return x.kab === kab;
      })[0],
      prev = $("#kc").value || (U && U.kec) || "",
      daftar = w ? w.kua : [];

    $("#kbw").hidden = kw || part;
    $("#kcw").hidden = !kua;

    $("#kc").innerHTML = daftar
      .map(function (x) {
        return "<option>" + esc(x) + "</option>";
      })
      .join("");
    if (daftar.indexOf(prev) > -1) $("#kc").value = prev;
    $("#kc").disabled = false;

    // Nama satuan kerja selalu terisi otomatis dan terkunci.
    // Madrasah negeri: nama diambil dari pilihan "Nama madrasah".
    var pil = MADRASAH.filter(function (m) {
        return m[2] === j && m[1] === kab;
      }),
      lama = $("#nms").value;

    $("#mdw").hidden = !pil.length;

    if (pil.length) {
      $("#nms").innerHTML =
        '<option value="">Pilih madrasah</option>' +
        pil
          .map(function (m) {
            return "<option>" + esc(m[0]) + "</option>";
          })
          .join("");

      $("#nms").value = pil.some(function (m) {
        return m[0] === lama;
      })
        ? lama
        : "";
      nama = $("#nms").value;
    } else if (part) nama = lembaga ? lembaga.nama : "";
    else if (kw) nama = "Kanwil Sulawesi Selatan";
    else if (kua)
      nama = $("#kc").value ? "KUA " + $("#kc").value + ", " + kab : "";
    else nama = j + " " + kab;

    $("#nm").value = nama;
    $("#nm").readOnly = true;
    otoNama = true;

    if (part) {
      info = lembaga
        ? "Partisipatif: " + lembaga.ket + " di " + kab + "."
        : "Partisipatif: pilih lembaga terlebih dahulu.";
    } else if (!kw) {
      info =
        JALUR[j] === "A"
          ? "Jalur A: dilaporkan melalui Kankemenag " + kab + "."
          : "Jalur B: penilaian mandiri tersendiri, langsung ke Kanwil.";
    }
    $("#jl").textContent = info;
    $("#jl").hidden = !info;
  }

  // Akun madrasah: jika nama sudah diawali MIN/MTsN/MAN, awalan ikut diganti saat jenis diubah.
  // Nama yang masih kosong atau tidak berawalan jenis dibiarkan apa adanya (diisi manual).
  $("#jn").onchange = function () {
    var n = $("#nm").value.trim(),
      re = /^(MIN|MTsN|MAN)\b/i;

    if (U && U.role == "madrasah" && re.test(n)) {
      $("#nm").value = n.replace(re, this.value);
    }

    aturWilayah();
  };

  $("#kb").onchange = function () {
    $("#kc").value = "";
    aturWilayah();
  };

  $("#kc").onchange = aturWilayah;
  $("#lpt").onchange = aturWilayah;

  $("#nms").onchange = function () {
    $("#nm").value = this.value;
  };

  $("#rs").onclick = function () {
    build();
    msg("Penilaian diatur ulang.", 1);
  };

  /*=============== SAVED ASSESSMENTS (STORAGE & TABLE) ===============*/
  function load() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || [];
    } catch (e) {
      return mem;
    }
  }

  function save(d) {
    mem = d;

    try {
      localStorage.setItem(KEY, JSON.stringify(d));
    } catch (e) {}
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[c];
    });
  }

  function msg(t, ok) {
    var m = $("#msg");
    m.textContent = t;
    m.style.color = ok ? "#1f8a5b" : "#d64545";
  }

  function vis(x) {
    if (!U) return false;
    if (U.role == "kanwil") return true; // kanwil melihat semua

    var by = x.by || x.pengguna || ""; // pemilik input
    var pr = x.byRole || ""; // peran pemilik input (dikirim server)

    if (by && by === U.u) return true; // input sendiri
    if (!pr) return x.nm === U.sk; // data lama tanpa pemilik

    // input kanwil: semua akun, kecuali jenis Kanwil
    if (pr == "kanwil") return x.jn != "Kanwil" && x.jn != "Partisipatif";

    // input kankemenag dibagikan ke KUA dan MIN
    if (pr == "kab" && x.jn == "KUA" && U.role == "unit") return true;
    if (pr == "kab" && x.jn == "MIN" && U.role == "madrasah") return true;

    // kankemenag melihat semua KUA dan MIN
    if (U.role == "kab" && (x.jn == "KUA" || x.jn == "MIN")) return true;

    return false;
  }

  // Urutan tampilan tetap: Kanwil, Kankemenag, KUA, madrasah, Partisipatif
  var URUT_JENIS = [
    "Kanwil",
    "Kankemenag",
    "KUA",
    "MIN",
    "MTsN",
    "MAN",
    "Partisipatif",
  ];

  function urutJenis(j) {
    var i = URUT_JENIS.indexOf(j);
    return i < 0 ? 99 : i;
  }

  function urutKab(k) {
    for (var i = 0; i < WILAYAH.length; i++) {
      if (WILAYAH[i].kab === k) return i;
    }
    return -1;
  }

  function rows() {
    return load()
      .filter(vis)
      .map(function (x) {
        var g = ig(x.nb, x.ns, x.nk, x.nt);

        return Object.assign(
          {
            ig: g,
            kt: kat(g),
          },
          x,
        );
      })
      .sort(function (a, b) {
        return (
          urutJenis(a.jn) - urutJenis(b.jn) ||
          urutKab(a.kb) - urutKab(b.kb) ||
          String(a.nm).localeCompare(String(b.nm), "id")
        );
      });
  }

  // Siapa yang boleh memverifikasi baris ini (aturannya sama dengan Code.gs)
  function bolehVer(x) {
    if (!U || x.drv != "Terkirim") return false;
    if (U.role == "kanwil") return true;
    if (U.role != "kab") return false;
    if (x.part) return true;

    return x.jn == "KUA" || x.jn == "MIN";
  }

  /*=============== MONITORING BERTAHAP (Kanwil dan Kankemenag) ===============*/
  var navMon = { level: 0, kab: "" },
    partData = [],
    secMon = $("#tb") ? $("#tb").closest("section") : null;

  function adaNav() {
    return !!U && (U.role == "kanwil" || U.role == "kab");
  }

  // Semua penilaian (tanpa saringan akun) ditambah data Lembaga Partisipatif
  function semuaMon() {
    return load()
      .filter(function (x) {
        return x.drv == "Terkirim" || x.by === U.u;
      })
      .map(function (x) {
        var g = ig(x.nb, x.ns, x.nk, x.nt);
        return Object.assign({ ig: g, kt: kat(g) }, x);
      })
      .concat(partData);
  }

  function urutMon(l) {
    return l.sort(function (p, q) {
      return (
        urutJenis(p.jn) - urutJenis(q.jn) ||
        String(p.nm).localeCompare(String(q.nm), "id")
      );
    });
  }

  // Menentukan baris apa yang tampil pada tahap yang sedang dibuka
  function tampilMon() {
    var a = semuaMon(),
      out = [];

    if (navMon.level == 0) {
      var kw = urutMon(
          a.filter(function (x) {
            return x.jn == "Kanwil";
          }),
        ),
        masuk = {};

      a.forEach(function (x) {
        if (x.jn == "Kankemenag") masuk[x.kb] = 1;
      });

      if (!kw.length) {
        kw = [
          { kosong: true, nm: "Kanwil Sulawesi Selatan", jn: "Kanwil", kb: "" },
        ];
      }

      return kw.concat([
        { grup: true, total: WILAYAH.length, masuk: Object.keys(masuk).length },
      ]);
    }

    // Tahap 3: baris Kanwil dan semua Lembaga Partisipatif
    if (navMon.level == 3) {
      var kw3 = a.filter(function (x) {
        return x.jn == "Kanwil";
      });

      if (!kw3.length) {
        kw3 = [
          { kosong: true, nm: "Kanwil Sulawesi Selatan", jn: "Kanwil", kb: "" },
        ];
      }

      return urutMon(kw3).concat(
        urutMon(
          a.filter(function (x) {
            return x.jn == "Partisipatif";
          }),
        ),
      );
    }

    if (navMon.level == 1) {
      WILAYAH.forEach(function (w) {
        var r = a
          .filter(function (x) {
            return x.jn == "Kankemenag" && x.kb == w.kab;
          })
          .sort(function (p, q) {
            return (
              String(q.tgl).localeCompare(String(p.tgl)) ||
              (Number(q.id) || 0) - (Number(p.id) || 0)
            );
          })[0];

        out.push(
          r || {
            kosong: true,
            nm: "Kankemenag " + w.kab,
            jn: "Kankemenag",
            kb: w.kab,
          },
        );
      });
      return out;
    }

    return urutMon(
      a.filter(function (x) {
        return x.kb == navMon.kab && x.jn != "Kanwil" && x.jn != "Kankemenag";
      }),
    );
  }

  // Satu baris tabel
  function barisMon(x, ver) {
    var td = "<td>-</td>",
      enam = td + td + td + td + td + td;

    if (x.grup) {
      return (
        "<tr>" +
        td +
        "<td>" +
        '<button type="button" class="button line nav-mon" data-nav="kab">Kankemenag &rsaquo;</button>' +
        "<br><small>" +
        x.masuk +
        " dari " +
        x.total +
        " Kankemenag sudah masuk</small></td>" +
        td +
        td +
        enam +
        td +
        td +
        td +
        "</tr>"
      );
    }

    var bisaBuka = navMon.level == 1 && x.jn == "Kankemenag",
      bukaKw = navMon.level == 0 && x.jn == "Kanwil",
      nama = bisaBuka
        ? '<button type="button" class="button line nav-mon" data-nav="turun" data-kb="' +
          esc(x.kb) +
          '">' +
          esc(x.nm) +
          " &rsaquo;</button>"
        : bukaKw
          ? '<button type="button" class="button line nav-mon" data-nav="kanwil">' +
            esc(x.nm) +
            " &rsaquo;</button>"
          : "<b>" + esc(x.nm) + "</b>";

    if (x.kosong) {
      return (
        "<tr>" +
        td +
        "<td>" +
        nama +
        "<br><small>Belum ada penilaian</small></td><td>" +
        esc(JALUR[x.jn] || "-") +
        "</td><td>" +
        esc(x.kb || "-") +
        "</td>" +
        enam +
        td +
        td +
        td +
        "</tr>"
      );
    }

    var part = !!x.part,
      nilai = part
        ? enam
        : "<td>" +
          f(x.nb) +
          "</td><td>" +
          f(x.ns) +
          "</td><td>" +
          f(x.nk) +
          "</td><td>" +
          f(x.nt) +
          "</td><td><b>" +
          f(x.ig) +
          '</b></td><td><span class="pill' +
          kc(x.kt) +
          '">' +
          x.kt +
          "</span></td>",
      aksi = "";

    if (ver) {
      aksi = "<td>-</td>";

      if (bolehVer(x)) {
        var dp = part ? ' data-p="1"' : "",
          dt = ' data-id="' + esc(x.id) + '"' + dp;

        aksi =
          "<td>" +
          (x.status == "Terverifikasi"
            ? '<button type="button" class="button line ver"' +
              dt +
              ' data-s="Menunggu">Batalkan</button>'
            : '<button type="button" class="button gold ver"' +
              dt +
              ' data-s="Terverifikasi">Verifikasi</button>' +
              (x.status == "Ditolak"
                ? ""
                : ' <button type="button" class="button line ver"' +
                  dt +
                  ' data-s="Ditolak">Tolak</button>')) +
          "</td>";
      }
    }

    return (
      "<tr><td>" +
      esc(x.tgl) +
      "</td><td>" +
      nama +
      "<br><small>" +
      esc(x.jn) +
      (part && x.ket ? " &middot; " + esc(x.ket) : "") +
      "</small></td><td>" +
      esc(x.jl || JALUR[x.jn] || "-") +
      "</td><td>" +
      esc(x.kb || "-") +
      (x.kc ? "<br><small>" + esc(x.kc) + "</small>" : "") +
      "</td>" +
      nilai +
      '<td><span class="pill' +
      (x.drv == "Gagal" ? " l" : x.drv == "Terkirim" ? "" : " m") +
      '">' +
      (x.drv || "-") +
      '</span></td><td><span class="pill' +
      (x.status == "Terverifikasi" ? "" : x.status == "Ditolak" ? " l" : " m") +
      '">' +
      esc(x.status || "Menunggu") +
      "</span>" +
      (x.status == "Ditolak" && x.alasan
        ? "<br><small>Alasan: " + esc(x.alasan) + "</small>"
        : "") +
      (x.oleh ? "<br><small>oleh " + esc(x.oleh) + "</small>" : "") +
      (x.status == "Ditolak" && !part && U && x.by === U.u
        ? '<br><button type="button" class="button gold fix" data-id="' +
          esc(x.id) +
          '">Perbaiki</button>'
        : "") +
      "</td>" +
      aksi +
      "</tr>"
    );
  }

  // Tombol Kembali dan jejak tahap, dibuat otomatis di atas tabel
  function jejakMon() {
    var el = document.getElementById("jejakmon");

    if (!el) {
      el = document.createElement("div");
      el.id = "jejakmon";
      el.style.cssText =
        "display:none;align-items:center;gap:0.8rem;margin:0.6rem 0;font-weight:600;";

      var w = $("#tb").closest(".tw") || $("#tb").closest("table");
      w.parentNode.insertBefore(el, w);

      el.addEventListener("click", function (e) {
        if (!e.target.closest(".mon-kembali")) return;
        navMon =
          navMon.level == 2 ? { level: 1, kab: "" } : { level: 0, kab: "" };
        render();
      });
    }

    el.style.display = navMon.level ? "flex" : "none";
    el.innerHTML =
      '<button type="button" class="button line mon-kembali">&larr; Kembali</button>' +
      "<span>" +
      (navMon.level == 3
        ? "Kanwil &rsaquo; Partisipatif"
        : "Kanwil &rsaquo; Kankemenag" +
          (navMon.level == 2
            ? " &rsaquo; Kankemenag " + esc(navMon.kab)
            : "")) +
      "</span>";
  }

  function render() {
    var nav = adaNav(),
      d = nav ? tampilMon() : rows();

    $("#tb").innerHTML = d
      .map(function (x) {
        return barisMon(x, nav);
      })
      .join("");

    $("#em").textContent =
      navMon.level == 2
        ? "Belum ada penilaian dari satuan kerja di wilayah ini."
        : "Belum ada penilaian.";
    $("#em").style.display = d.length ? "none" : "block";
    jejakMon();
  }

  /*=============== CAPAIAN: RATA-RATA IGBS GABUNGAN (dari server) ===============*/
  var memuatCap = false;

  // Jumlah satuan kerja yang seharusnya menilai: Kanwil, Kankemenag, KUA, dan madrasah negeri
  function totalSatker() {
    var n = 1 + WILAYAH.length;

    WILAYAH.forEach(function (w) {
      n += w.kua.length;
    });
    MADRASAH.forEach(function (m) {
      if (["MIN", "MTsN", "MAN"].indexOf(m[2]) > -1) n++;
    });

    return n;
  }

  function isiCapaian(j) {
    var s = j.semua,
      v = j.ver,
      ada = s.n > 0;

    $("#s1").textContent = ada ? f(s.ig) : "-";
    $("#s2").textContent = ada ? s.kt : "-";
    $("#s3").textContent = ada ? f(s.nb) : "-";
    $("#s4").textContent = ada ? f(s.ns) : "-";
    $("#s5").textContent = ada ? f(s.nk) : "-";
    $("#s6").textContent = ada ? f(s.nt) : "-";
    $("#sb").style.width = (ada ? s.ig : 0) + "%";

    $("#capKet").textContent = ada
      ? "Rata-rata dari " +
        s.n +
        " satuan kerja yang sudah menilai (dari total " +
        totalSatker() +
        " satuan kerja). Penilaian yang ditolak tidak dihitung, dan satu satuan kerja dihitung sekali dengan penilaian terbarunya."
      : "Belum ada penilaian yang masuk.";

    $("#sts").innerHTML =
      '<span class="pill' +
      (v.n ? "" : " m") +
      '">Terverifikasi: ' +
      (v.n
        ? v.n +
          " satuan kerja, rata-rata IGBS " +
          f(v.ig) +
          " (" +
          esc(v.kt) +
          ")"
        : "belum ada") +
      '</span><span class="pill">Partisipatif: ' +
      j.part.total +
      " terdaftar, " +
      j.part.ver +
      " terverifikasi</span>";
  }

  // Jumlah satuan kerja yang seharusnya menilai untuk satu jenis
  function totalJenis(j) {
    if (j === "Kanwil") return 1;
    if (j === "Kankemenag") return WILAYAH.length;

    if (j === "KUA") {
      var n = 0;
      WILAYAH.forEach(function (w) {
        n += w.kua.length;
      });
      return n;
    }

    return MADRASAH.filter(function (m) {
      return m[2] === j;
    }).length;
  }

  /*=============== GRAFIK CAKUPAN PENILAIAN (bawah gambar Capaian) ===============*/
  var capData = null,
    capUser = "";

  // Pilihan wilayah, diisi saat berkas dimuat
  $("#capWil").innerHTML =
    '<option value="">Seluruh Sulawesi Selatan</option>' +
    WILAYAH.map(function (w) {
      return "<option>" + esc(w.kab) + "</option>";
    }).join("");

  $("#capWil").addEventListener("change", function () {
    gambarGrafik();
  });

  // Jumlah satuan kerja yang seharusnya menilai di satu kabupaten/kota
  function totalJenisKab(jn, kab) {
    if (jn === "Kanwil") return 0;
    if (jn === "Kankemenag") return 1;

    if (jn === "KUA") {
      var w = WILAYAH.filter(function (x) {
        return x.kab === kab;
      })[0];
      return w ? w.kua.length : 0;
    }

    return MADRASAH.filter(function (m) {
      return m[2] === jn && m[1] === kab;
    }).length;
  }

  function gambarGrafik() {
    var j = capData,
      kab = $("#capWil").value,
      jenis = kab
        ? ["Kankemenag", "KUA", "MIN", "MTsN", "MAN"]
        : ["Kanwil", "Kankemenag", "KUA", "MIN", "MTsN", "MAN"];

    if (!j) return;

    var grup = jenis.map(function (jn) {
      var d;

      if (kab) {
        var e = (j.kab && j.kab[kab] && j.kab[kab][jn]) || {
          n: 0,
          ver: 0,
          ig: 0,
        };
        d = { total: totalJenisKab(jn, kab), n: e.n, ver: e.ver, ig: e.ig };
      } else {
        var r = j.jenis.filter(function (x) {
          return x.jn === jn;
        })[0];
        d = {
          total: totalJenis(jn),
          n: r.semua.n,
          ver: r.ver.n,
          ig: r.semua.ig,
        };
      }

      d.jn = jn;
      return d;
    });

    var maks = 0,
      sT = 0,
      sN = 0,
      sV = 0;

    grup.forEach(function (g) {
      maks = Math.max(maks, g.total, g.n, g.ver);
      sT += g.total;
      sN += g.n;
      sV += g.ver;
    });

    var skala = Math.max(4, Math.ceil(maks / 4) * 4),
      h = "";

    function tinggi(v) {
      return (
        "calc((100% - 1.2rem) * " + Math.round((v / skala) * 1000) / 1000 + ")"
      );
    }

    function bar(v, kls, ket) {
      return (
        '<div class="gk-b" title="' +
        esc(ket) +
        '"><span class="gk-v">' +
        v +
        '</span><i class="gk-f ' +
        kls +
        '" style="height:' +
        tinggi(v) +
        '"></i></div>'
      );
    }

    h += '<div class="gk"><div class="gk-garis">';
    for (var i = 0; i <= 4; i++) {
      h +=
        '<i style="bottom:calc((100% - 1.2rem) * ' +
        i / 4 +
        ')"><b>' +
        (skala / 4) * i +
        "</b></i>";
    }
    h += '</div><div class="gk-kol">';

    grup.forEach(function (g) {
      h +=
        '<div class="gk-grup"><div class="gk-bars">' +
        bar(g.total, "gk-t", g.jn + ": total " + g.total + " satuan kerja") +
        bar(g.n, "gk-n", g.jn + ": " + g.n + " sudah menilai") +
        bar(g.ver, "gk-vf", g.jn + ": " + g.ver + " terverifikasi") +
        '</div><div class="gk-lab">' +
        esc(g.jn) +
        "<small>" +
        (g.n ? "IGBS " + f(g.ig) : "belum ada") +
        "</small></div></div>";
    });

    h += "</div></div>";
    h +=
      '<div class="gk-legend"><span class="t">Total satuan kerja</span><span class="n">Sudah menilai</span><span class="v">Terverifikasi</span></div>';

    var persen = sT ? Math.round((sN / sT) * 100) : 0;

    h +=
      '<p class="gk-ringkas"><b>' +
      esc(kab || "Sulawesi Selatan") +
      "</b>: " +
      sN +
      " dari " +
      sT +
      " satuan kerja sudah menilai (" +
      persen +
      "%), " +
      sV +
      " terverifikasi.</p>" +
      '<span class="gk-cat">Penilaian yang ditolak tidak dihitung, dan satu satuan kerja dihitung sekali dengan penilaian terbarunya.</span>';

    $("#capGrafik").innerHTML = h;
  }

  function isiGrafik(j) {
    capData = j;
    $("#capGrafikBox").style.display = "";

    // Pertama kali (atau saat ganti akun): buka di wilayah akun itu sendiri
    if (capUser !== U.u) {
      capUser = U.u;
      $("#capWil").value = U.kab || "";
      if ($("#capWil").value !== (U.kab || "")) $("#capWil").value = "";
    }

    gambarGrafik();
  }

  // Tabel rincian per jenis
  function isiJenis(j) {
    $("#capJenis").innerHTML = j.jenis
      .map(function (x) {
        var s = x.semua,
          v = x.ver;

        return (
          "<tr><td><b>" +
          esc(x.jn) +
          "</b></td><td>" +
          s.n +
          " dari " +
          totalJenis(x.jn) +
          "</td><td>" +
          (s.n ? "<b>" + f(s.ig) + "</b>" : "-") +
          "</td><td>" +
          (s.n
            ? '<span class="pill' + kc(s.kt) + '">' + esc(s.kt) + "</span>"
            : "-") +
          "</td><td>" +
          (v.n ? v.n + " (rata-rata " + f(v.ig) + ")" : "-") +
          "</td></tr>"
        );
      })
      .join("");
  }

  // Kotak "Capaian Anda"
  function isiSaya(j) {
    var y = j.saya,
      el = $("#capSaya");

    if (!y) {
      el.innerHTML =
        '<b>Capaian Anda</b><div class="baris"><span>Akun ini belum menyimpan penilaian.</span></div>';
      return;
    }

    var banding = "";

    if (y.status === "Ditolak") {
      banding =
        "Penilaian ini ditolak, jadi belum dihitung dalam rata-rata. Perbaiki lewat Monitoring Penilaian.";
    } else if (j.semua.n) {
      var d = Math.round((y.ig - j.semua.ig) * 10) / 10;

      banding =
        d === 0
          ? "Sama dengan rata-rata gabungan (" + f(j.semua.ig) + ")."
          : f(Math.abs(d)) +
            " poin " +
            (d > 0 ? "di atas" : "di bawah") +
            " rata-rata gabungan (" +
            f(j.semua.ig) +
            ").";
    }

    el.innerHTML =
      "<b>Capaian Anda</b> &middot; " +
      esc(y.nm) +
      ' <span class="pill' +
      (y.status == "Terverifikasi" ? "" : y.status == "Ditolak" ? " l" : " m") +
      '">' +
      esc(y.status) +
      '</span><div class="baris"><span>IGBS <b>' +
      f(y.ig) +
      "</b> (" +
      esc(y.kt) +
      ")</span><span>NB " +
      f(y.nb) +
      "</span><span>NS " +
      f(y.ns) +
      "</span><span>NK " +
      f(y.nk) +
      "</span><span>NT " +
      f(y.nt) +
      "</span><span>" +
      esc(y.tgl) +
      "</span></div>" +
      (banding ? '<div class="baris"><span>' + banding + "</span></div>" : "");
  }

  // Nama fungsi dipertahankan agar pemanggilnya tidak perlu diubah
  function capaianTerakhir() {
    if (!DRIVE_URL || !U || memuatCap) return;
    memuatCap = true;
    $("#capKet").textContent = "Memuat rata-rata dari server...";

    drivePost({ action: "ringkas" })
      .then(function (j) {
        isiCapaian(j);
        isiJenis(j);
        isiSaya(j);
        isiGrafik(j);
      })
      .catch(function (e) {
        $("#capKet").textContent =
          "Rata-rata belum dapat dimuat (" + e.message + ").";
      })
      .then(function () {
        memuatCap = false;
      });
  }

  // Setiap kali halaman Capaian dibuka, angkanya diperbarui
  addEventListener("hashchange", function () {
    if (location.hash === "#capaian") capaianTerakhir();
  });

  /*=============== KARTU UNSUR BARISAN: RATA-RATA GABUNGAN (dari server) ===============*/
  var memuatUnsur = false;

  function isiUnsur(j) {
    var peta = {};

    j.unsur.forEach(function (x) {
      peta[x.unsur] = x;
    });

    $("#cards").innerHTML = G[0][1]
      .map(function (u) {
        var x = peta[u[0]],
          ada = !!x && x.n > 0,
          p = ada ? Math.round(x.rata) : 0;

        return (
          '<article class="destination__card"><img src="' +
          u[1] +
          '" alt="" class="destination__img"><div class="destination__data"><h3 class="destination__subtitle">' +
          (ada ? x.n + " satuan kerja" : "belum ada data") +
          '</h3><h2 class="destination__title">' +
          u[0] +
          '</h2><p class="destination__country"><b>' +
          (ada ? p : "-") +
          "</b>&nbsp;rata-rata nilai unsur" +
          (ada && p < 60 ? " &middot; di bawah ambang 60" : "") +
          '</p><div class="trk"><i style="width:' +
          p +
          '%"></i></div></div></article>'
        );
      })
      .join("");
  }

  function unsurRata() {
    if (!DRIVE_URL || !U || memuatUnsur) return;
    memuatUnsur = true;
    $("#cards").innerHTML =
      '<p style="grid-column: 1 / -1; text-align: center; color: var(--t2)">Memuat rata-rata unsur...</p>';

    drivePost({ action: "unsur" })
      .then(isiUnsur)
      .catch(function () {
        $("#cards").innerHTML =
          '<p style="grid-column: 1 / -1; text-align: center; color: var(--t2)">Rata-rata unsur belum dapat dimuat.</p>';
      })
      .then(function () {
        memuatUnsur = false;
      });
  }

  /*=============== GOOGLE DRIVE (SHEETS & EVIDENCE) ===============*/
  var retryId = null;

  function drivePost(payload) {
    if (!DRIVE_URL) {
      return Promise.reject(new Error("DRIVE_URL belum diisi."));
    }

    if (payload.action !== "login" && !DRIVE_TOKEN) {
      return Promise.reject(new Error("Anda belum masuk."));
    }

    var dataKirim = Object.assign({}, payload, {
      token: DRIVE_TOKEN,
    });

    return fetch(DRIVE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(dataKirim),
      redirect: "follow",
    })
      .then(function (response) {
        return response.text().then(function (text) {
          if (!response.ok) {
            throw new Error(
              "HTTP " + response.status + ": " + text.slice(0, 500),
            );
          }

          var json;

          try {
            json = JSON.parse(text);
          } catch (e) {
            throw new Error(
              "Google Apps Script tidak mengembalikan JSON. " +
                "Respons server: " +
                text.slice(0, 500),
            );
          }

          if (json && json.sesi === false) {
            leave();
            $("#lerr").textContent = "Sesi berakhir. Silakan masuk lagi.";
          }
          if (!json || json.ok !== true) {
            throw new Error(
              json && json.error
                ? json.error
                : "Google Apps Script menolak permintaan.",
            );
          }

          return json;
        });
      })
      .catch(function (error) {
        console.error("SI-BARISAN Google Apps Script error:", error);

        throw error;
      });
  }

  // Memuat ulang data dari Google Sheets saat login (butuh aksi "list" di Code.gs)
  function sync() {
    if (!DRIVE_URL || !U) return;

    drivePost({ action: "list", pengguna: U.u, role: U.role, kab: U.kab || "" })
      .then(function (r) {
        var ids = {};

        r.data.forEach(function (x) {
          x.drv = "Terkirim";
          if (!x.by && x.pengguna) x.by = x.pengguna;
          ids[String(x.id)] = 1;
        });

        var sisa = load().filter(function (x) {
          return !ids[String(x.id)] && x.drv != "Terkirim";
        });

        save(r.data.concat(sisa));
        render();
        capaianTerakhir();
      })
      .catch(function (e) {
        console.warn("SI-BARISAN: data dari Drive belum dapat dimuat.", e);
      });
  }

  // Memuat data Lembaga Partisipatif untuk akun Kanwil dan Kankemenag
  function syncPart() {
    if (!DRIVE_URL || !adaNav()) return;

    drivePost({ action: "part_list", pengguna: U.u, role: U.role })
      .then(function (r) {
        partData = r.data.map(function (p) {
          return {
            id: "p" + p.id,
            rid: p.id,
            part: true,
            tgl: p.tgl,
            nm: p.nama,
            jn: "Partisipatif",
            kb: p.kab,
            kc: "",
            jl: "-",
            ket:
              p.kategori +
              (p.jenis ? ", " + p.jenis : "") +
              ", " +
              (p.kegiatan || []).length +
              " kegiatan",
            drv: "Terkirim",
            status: p.status,
            oleh: p.oleh,
            alasan: p.alasan || "",
            by: p.by,
          };
        });
        render();
      })
      .catch(function (e) {
        console.warn("SI-BARISAN: data Partisipatif belum dapat dimuat.", e);
      });
  }

  function fileToBase64(file) {
    return new Promise(function (done, fail) {
      var r = new FileReader();
      r.onload = function () {
        done(String(r.result).split(",")[1] || "");
      };
      r.onerror = function () {
        fail(new Error("berkas tidak dapat dibaca: " + file.name));
      };
      r.readAsDataURL(file);
    });
  }

  // Mengumpulkan seluruh isian formulir menjadi satu paket yang rapi untuk Google Sheets
  function collect(c, id, row) {
    var butir = [],
      files = [],
      sah = 0,
      nilai = 0,
      kode = ["BARISAN", "SIPAKAINGE", "KOLABORASI", "TATA"];

    G.forEach(function (g, gi) {
      g[1].forEach(function (u, ui) {
        u[2].forEach(function (t, i) {
          var x = st[gi + "." + ui + "." + i],
            tb = na(gi, ui, i),
            ok = evOK(x),
            valid = x.f.filter(fok);

          if (!tb && x.s > 0) {
            nilai++;
            if (ok) sah++;
          }

          butir.push({
            standar: g[0],
            unsur: u[0],
            no: i + 1,
            butir: t,
            skorInput: tb ? "TB" : x.s,
            skorHitung: tb ? "TB" : eff(gi, ui, i),
            buktiSah: tb ? "-" : ok ? "Ya" : "Tidak",
            catatan: x.o.trim(),
            berkas: valid.length,
          });

          valid.forEach(function (f) {
            files.push({
              kode: kode[gi] + "-" + u[0].replace(/\W/g, "") + "-" + (i + 1),
              standar: g[0],
              unsur: u[0],
              butir: t,
              nama: f.name,
              mime: f.type,
              tgl: f.tgl,
              lok: f.lok.trim(),
              ukuran: Math.round(f.size / 1024),
              file: f.file,
            });
          });
        });
      });
    });

    return {
      butir: butir,
      files: files,
      penilaian: {
        tanggal: row.tgl,
        satuan: row.nm,
        jenis: row.jn,
        pengguna: U ? U.u : "",
        tahunPertama: $("#y1").checked,
        asrama: $("#as").checked,
        nb: c.nb,
        ns: c.ns,
        nk: c.nk,
        nt: c.nt,
        igbs: c.ig,
        kategori: kat(c.ig),
        okB: c.B,
        okS: c.S,
        okK: c.K,
        butirBerbukti: sah,
        jumlahBerkas: files.length,
        jalur: row.jl,
        kab: row.kb,
        kec: row.kc,
      },
    };
  }

  function setDrive(id, s) {
    var d = load();
    d.forEach(function (x) {
      if (x.id === id) x.drv = s;
    });
    save(d);
    render();
  }

  // Mengulang permintaan yang gagal sementara (sinyal lemah atau server sibuk)
  function coba(fn, sisa) {
    return fn().catch(function (e) {
      if (sisa <= 0) throw e;
      return new Promise(function (ok) {
        setTimeout(ok, 2500);
      }).then(function () {
        return coba(fn, sisa - 1);
      });
    });
  }

  // Menjalankan kerja(item, nomor) paling banyak 'lebar' sekaligus; berhenti bila ada yang gagal
  function antriParalel(daftar, kerja, lebar) {
    return new Promise(function (selesai, gagal) {
      var i = 0,
        aktif = 0,
        sisa = daftar.length,
        mati = false;

      if (!sisa) return selesai();

      function jalan() {
        while (!mati && aktif < lebar && i < daftar.length) {
          (function (k) {
            aktif++;
            kerja(daftar[k], k).then(
              function () {
                aktif--;
                sisa--;
                if (!sisa) selesai();
                else jalan();
              },
              function (e) {
                mati = true;
                gagal(e);
              },
            );
          })(i++);
        }
      }

      jalan();
    });
  }

  function toDrive(row, c, id) {
    var btn = $("#sv"),
      pack = null,
      total = 1,
      jalan = 0,
      lewat = 0;

    btn.disabled = true;
    SimpanUI.mulai("Menyimpan penilaian…", "Menyiapkan data");

    // tunggu semua foto selesai dikecilkan, baru data dikumpulkan
    Promise.all(tungguKompres())
      .then(function () {
        pack = collect(c, id, row);
        total = pack.files.length + 1; // semua berkas + 1 untuk data

        return drivePost({
          action: "save",
          id: id,
          penilaian: pack.penilaian,
          butir: pack.butir,
          // Daftar berkas: server membalas nomor berkas yang sudah terunggah sebelumnya
          berkas: pack.files.map(function (f) {
            return { butir: f.butir, nama: f.nama, ukuran: f.ukuran };
          }),
        });
      })
      .then(function (r) {
        var sudah = {};

        (r.ada || []).forEach(function (i) {
          sudah[i] = 1;
        });

        jalan = 1; // data sudah tersimpan
        SimpanUI.maju(
          jalan / total,
          pack.files.length ? "Mengunggah bukti dukung" : "",
        );

        // bukti dukung diunggah 3 sekaligus
        return antriParalel(
          pack.files,
          function (f, i) {
            if (sudah[i]) {
              lewat++;
              jalan++;
              SimpanUI.maju(jalan / total);
              return Promise.resolve();
            }

            return fileToBase64(f.file)
              .then(function (b64) {
                return coba(function () {
                  return drivePost({
                    action: "upload",
                    id: id,
                    tanggal: row.tgl,
                    satuan: row.nm,
                    kode: f.kode,
                    standar: f.standar,
                    unsur: f.unsur,
                    butir: f.butir,
                    nama: f.nama,
                    mime: f.mime,
                    tgl: f.tgl,
                    lok: f.lok,
                    ukuran: f.ukuran,
                    data: b64,
                  });
                }, 2);
              })
              .then(function () {
                jalan++;
                SimpanUI.maju(
                  jalan / total,
                  "Bukti " + (jalan - 1) + " dari " + pack.files.length,
                );
              });
          },
          3,
        );
      })
      .then(function () {
        retryId = null;
        setDrive(id, "Terkirim");
        SimpanUI.selesai(
          "Penilaian tersimpan",
          pack.butir.length + " butir, " + pack.files.length + " berkas bukti",
        );
        msg(
          "Tersimpan di Google Drive: 1 penilaian, " +
            pack.butir.length +
            " butir, " +
            pack.files.length +
            " berkas bukti." +
            (lewat
              ? " " + lewat + " berkas dilewati karena sudah terunggah."
              : ""),
          1,
        );
      })
      .catch(function (e) {
        retryId = id;
        setDrive(id, "Gagal");
        SimpanUI.gagal(
          "Gagal mengirim",
          "Tersimpan di perangkat. Tekan Simpan lagi untuk mengirim ulang.",
        );
        msg(
          "Tersimpan di perangkat, tetapi gagal dikirim ke Google Drive (" +
            e.message +
            "). Tekan Simpan lagi untuk mengirim ulang.",
          0,
        );
      })
      .then(function () {
        btn.disabled = false;
      });
  }

  $("#sv").onclick = function () {
    if ($("#jn").value === "Partisipatif") {
      document.dispatchEvent(new Event("sib:simpan-part"));
      return;
    }

    var n = $("#nm").value.trim();

    if (!n) {
      msg(
        $("#mdw").hidden
          ? "Isi nama satuan kerja terlebih dahulu."
          : "Pilih nama madrasah terlebih dahulu.",
        0,
      );
      ($("#mdw").hidden ? $("#jn") : $("#nms")).focus();
      return;
    }

    if (
      U &&
      U.role == "madrasah" &&
      n.toUpperCase().indexOf($("#jn").value.toUpperCase()) !== 0
    ) {
      msg(
        'Nama satuan kerja harus diawali jenisnya, misalnya "' +
          $("#jn").value +
          ' 1 Makassar".',
        0,
      );
      $("#nm").focus();
      return;
    }

    // Peringatan: butir berskor 1 atau 2 yang buktinya belum sah akan dihitung 0
    var tanpa = [];

    G.forEach(function (g, gi) {
      g[1].forEach(function (u, ui) {
        u[2].forEach(function (t, i) {
          var x = st[gi + "." + ui + "." + i];

          if (!na(gi, ui, i) && x.s > 0 && !evOK(x)) {
            tanpa.push("- " + u[0] + ": " + t);
          }
        });
      });
    });

    if (tanpa.length) {
      var daftar = tanpa.slice(0, 8).join("\n");

      if (tanpa.length > 8) {
        daftar += "\n... dan " + (tanpa.length - 8) + " butir lainnya";
      }

      if (
        !confirm(
          tanpa.length +
            " butir sudah diberi skor tetapi bukti dukungnya belum sah, sehingga dihitung 0:\n\n" +
            daftar +
            "\n\nBukti sah: 1 sampai 2 berkas (foto wajib memuat tanggal dan lokasi)." +
            "\n\nTekan OK untuk tetap mengirim, atau Batal untuk melengkapi bukti dulu.",
        )
      ) {
        return;
      }
    }

    var c = calc(),
      id = retryId || Date.now(),
      d = load().filter(function (x) {
        return x.id !== id;
      }),
      row = {
        nm: n,
        jn: $("#jn").value,
        jl: JALUR[$("#jn").value] || "-",
        kb: $("#jn").value === "Kanwil" ? "" : $("#kb").value,
        kc: $("#jn").value === "KUA" ? $("#kc").value : "",
        nb: c.nb,
        ns: c.ns,
        nk: c.nk,
        nt: c.nt,
        tgl: new Date().toISOString().slice(0, 10),
        id: id,
        by: U ? U.u : "",
        byRole: U ? U.role : "",
        drv: DRIVE_URL ? "Mengirim" : "Lokal",
      };

    d.push(row);
    save(d);
    render();

    if (!DRIVE_URL) {
      msg(
        "Tersimpan di perangkat ini. Google Drive belum dikonfigurasi (isi DRIVE_URL di main.js).",
        1,
      );
      return;
    }

    toDrive(row, c, id);
  };

  // Verifikasi atau penolakan: baris penilaian biasa dan baris Lembaga Partisipatif
  $("#tb").addEventListener("click", function (e) {
    var b = e.target.closest(".ver");
    if (!b || !U || b.disabled) return;

    var part = !!b.dataset.p,
      id = b.dataset.id,
      status = b.dataset.s,
      x = (part ? partData : load()).filter(function (r) {
        return String(r.id) === id;
      })[0];

    if (!x || !bolehVer(x)) return;

    var alasan = "",
      anim = status !== "Menunggu"; // "Batalkan" berjalan tanpa animasi

    if (status === "Ditolak") {
      alasan = (
        prompt("Alasan penolakan untuk " + x.nm + " (minimal 5 karakter):") ||
        ""
      ).trim();
      if (!alasan) return; // dibatalkan
      if (alasan.length < 5) {
        alert("Alasan penolakan minimal 5 karakter.");
        return;
      }
    } else if (
      !confirm(
        (status === "Terverifikasi" ? "Verifikasi " : "Batalkan verifikasi ") +
          x.nm +
          "?",
      )
    ) {
      return;
    }

    b.disabled = true;
    if (anim) {
      SimpanUI.mulai(
        status === "Ditolak" ? "Memproses penolakan…" : "Memverifikasi…",
        x.nm,
        true,
      );
    }

    drivePost({
      action: part ? "part_verify" : "verify",
      id: part ? x.rid : id,
      status: status,
      alasan: alasan,
      pengguna: U.u,
      role: U.role,
    })
      .then(function () {
        var oleh = status === "Menunggu" ? "" : U.u,
          alasanSimpan = status === "Ditolak" ? alasan : "";

        if (part) {
          x.status = status;
          x.oleh = oleh;
          x.alasan = alasanSimpan;
        } else {
          var d = load();
          d.forEach(function (r) {
            if (String(r.id) === id) {
              r.status = status;
              r.oleh = oleh;
              r.alasan = alasanSimpan;
            }
          });
          save(d);
        }

        render();

        if (status === "Terverifikasi") SimpanUI.selesai("Terverifikasi", x.nm);
        else if (status === "Ditolak")
          SimpanUI.ditolak("Penilaian ditolak", x.nm);
      })
      .catch(function (err) {
        b.disabled = false;
        if (anim) SimpanUI.gagal("Gagal memperbarui status", err.message);
        else alert("Gagal memperbarui status (" + err.message + ").");
      });
  });

  /*=============== PERBAIKI PENILAIAN YANG DITOLAK ===============*/
  function perbaiki(x) {
    build(); // formulir dikosongkan; build() juga mengosongkan retryId
    retryId = x.id; // Simpan berikutnya memakai ID ini, jadi menimpa baris lama

    $("#jn").value = x.jn;
    if (x.kb) $("#kb").value = x.kb;
    aturWilayah(); // isi pilihan kecamatan atau madrasah sesuai jenis dan kab/kota

    if (x.kc) $("#kc").value = x.kc;
    if (!$("#mdw").hidden) $("#nms").value = x.nm;
    aturWilayah(); // nama satuan kerja ikut terisi

    msg(
      "Memperbaiki penilaian " +
        x.nm +
        ". Isi ulang formulir, lalu tekan Simpan untuk menimpa penilaian yang ditolak.",
      1,
    );
    location.hash = "#" + $("#forms").closest("section").id;
  }

  $("#tb").addEventListener("click", function (e) {
    var b = e.target.closest(".fix");
    if (!b) return;

    var x = load().filter(function (r) {
      return String(r.id) === b.dataset.id;
    })[0];

    if (!x || x.status !== "Ditolak") return;

    if (
      !confirm(
        "Perbaiki penilaian " +
          x.nm +
          "?\n\nFormulir akan dikosongkan dan perlu diisi ulang. " +
          "Saat Anda menekan Simpan, penilaian ini ditimpa dan kembali berstatus Menunggu.",
      )
    ) {
      return;
    }

    perbaiki(x);
  });

  /*=============== MONITORING BERTAHAP: KLIK TABEL DAN MENU ===============*/
  // Klik tombol Kankemenag (tahap 1) atau nama Kankemenag (tahap 2)
  $("#tb").addEventListener("click", function (e) {
    var b = e.target.closest(".nav-mon");
    if (!b) return;

    navMon =
      b.dataset.nav == "kab"
        ? { level: 1, kab: "" }
        : b.dataset.nav == "kanwil"
          ? { level: 3, kab: "" }
          : { level: 2, kab: b.dataset.kb };
    render();
  });

  // Setiap kali menu Monitoring Penilaian dibuka, kembali ke tahap 1
  function resetMon() {
    navMon = { level: 0, kab: "" };
    if (U) render();
  }

  $$(".nav__link").forEach(function (a) {
    if (secMon && a.getAttribute("href") === "#" + secMon.id) {
      a.addEventListener("click", resetMon);
    }
  });

  addEventListener("hashchange", function () {
    if (secMon && location.hash.slice(1) === secMon.id) resetMon();
  });

  /*=============== UNDUH EXCEL ===============*/
  var GARIS = { style: "thin", color: { argb: "FFBFBFBF" } },
    BATAS = { top: GARIS, left: GARIS, bottom: GARIS, right: GARIS };

  function gayaHeader(row) {
    row.height = 22;
    row.eachCell(function (c) {
      c.font = { bold: true, color: { argb: "FFFFFFFF" } };
      c.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0E4F55" },
      };
      c.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true,
      };
      c.border = BATAS;
    });
  }

  function warnaPil(c, bg, fg) {
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
    c.font = { bold: true, color: { argb: fg } };
  }

  function warnaStatus(c, s) {
    if (s == "Terverifikasi") warnaPil(c, "FFD9F2E4", "FF17704A");
    else if (s == "Ditolak") warnaPil(c, "FFFBE0DC", "FFB03A2E");
    else warnaPil(c, "FFFBF0CC", "FF7A5700");
  }

  function urutExcel(l) {
    return l.sort(function (a, b) {
      return (
        urutJenis(a.jn) - urutJenis(b.jn) ||
        urutKab(a.kb) - urutKab(b.kb) ||
        String(a.nm).localeCompare(String(b.nm), "id")
      );
    });
  }

  // Lembar "Ringkasan": angka sama dengan halaman Capaian
  function lembarRingkasan(wb, j) {
    var ws = wb.addWorksheet("Ringkasan");

    ws.columns = [
      { width: 38 },
      { width: 16 },
      { width: 16 },
      { width: 16 },
      { width: 14 },
      { width: 14 },
      { width: 16 },
      { width: 10 },
    ];

    function judul(teks) {
      ws.addRow([teks]).getCell(1).font = { bold: true, size: 13 };
    }

    function catatan(teks) {
      ws.addRow([teks]).getCell(1).font = {
        italic: true,
        color: { argb: "FF555555" },
      };
    }

    function kepala(arr) {
      gayaHeader(ws.addRow(arr));
    }

    function baris(arr, desimal) {
      var r = ws.addRow(arr);

      r.eachCell(function (c, n) {
        c.border = BATAS;
        c.alignment = {
          vertical: "middle",
          horizontal: n === 1 ? "left" : "center",
        };
        if (desimal.indexOf(n) > -1 && typeof c.value === "number") {
          c.numFmt = "0.0";
        }
      });
    }

    judul("Ringkasan Capaian IGBS Gerakan BARISAN-SIPAKAINGE");
    catatan(
      "Diunduh " +
        new Date().toLocaleDateString("id-ID") +
        ". Satu satuan kerja dihitung sekali dengan penilaian terbarunya; penilaian yang ditolak tidak dihitung.",
    );
    ws.addRow([]);

    kepala([
      "Ukuran",
      "Satuan kerja",
      "IGBS",
      "Kategori",
      "NB",
      "NS",
      "NK",
      "NT",
    ]);
    [
      ["Semua penilaian (selain ditolak)", j.semua],
      ["Terverifikasi saja", j.ver],
    ].forEach(function (p) {
      var s = p[1],
        a = s.n > 0;

      baris(
        [
          p[0],
          s.n,
          a ? s.ig : "-",
          a ? s.kt : "-",
          a ? s.nb : "-",
          a ? s.ns : "-",
          a ? s.nk : "-",
          a ? s.nt : "-",
        ],
        [3, 5, 6, 7, 8],
      );
    });

    ws.addRow([]);
    kepala([
      "Jenis satuan kerja",
      "Sudah menilai",
      "Total seharusnya",
      "Rata-rata IGBS",
      "Kategori",
      "Terverifikasi",
      "Rata-rata terverifikasi",
    ]);
    j.jenis.forEach(function (x) {
      var s = x.semua,
        v = x.ver;

      baris(
        [
          x.jn,
          s.n,
          totalJenis(x.jn),
          s.n ? s.ig : "-",
          s.n ? s.kt : "-",
          v.n,
          v.n ? v.ig : "-",
        ],
        [4, 7],
      );
    });

    ws.addRow([]);
    kepala([
      "Lembaga Partisipatif (tanpa nilai IGBS)",
      "Terdaftar",
      "Terverifikasi",
    ]);
    baris(["Partisipatif", j.part.total, j.part.ver], []);
  }

  function buatExcel(d, rk, nav) {
    var wb = new ExcelJS.Workbook();
    var ws = wb.addWorksheet("Penilaian", {
      views: [{ state: "frozen", ySplit: 1 }],
    });

    ws.columns = [
      { header: "Tanggal", key: "tgl", width: 13 },
      { header: "Satuan Kerja", key: "nm", width: 34 },
      { header: "Jenis", key: "jn", width: 13 },
      { header: "NB", key: "nb", width: 9 },
      { header: "NS", key: "ns", width: 9 },
      { header: "NK", key: "nk", width: 9 },
      { header: "NT", key: "nt", width: 9 },
      { header: "IGBS", key: "ig", width: 10 },
      { header: "Kategori", key: "kt", width: 15 },
      { header: "Drive", key: "drv", width: 12 },
      { header: "Jalur", key: "jl", width: 8 },
      { header: "Kab/Kota", key: "kb", width: 30 },
      { header: "Kecamatan", key: "kc", width: 22 },
      { header: "Status", key: "status", width: 15 },
      { header: "Diverifikasi Oleh", key: "oleh", width: 18 },
      { header: "Alasan Penolakan", key: "alasan", width: 36 },
    ];
    gayaHeader(ws.getRow(1));

    d.forEach(function (x) {
      var r = ws.addRow({
        tgl: x.tgl,
        nm: x.nm,
        jn: x.jn,
        nb: Math.round(x.nb * 10) / 10,
        ns: Math.round(x.ns * 10) / 10,
        nk: Math.round(x.nk * 10) / 10,
        nt: Math.round(x.nt * 10) / 10,
        ig: Math.round(x.ig * 10) / 10,
        kt: x.kt,
        drv: x.drv || "-",
        jl: x.jl || JALUR[x.jn] || "-",
        kb: x.kb || "",
        kc: x.kc || "",
        status: x.status || "Menunggu",
        oleh: x.oleh || "",
        alasan: x.alasan || "",
      });

      r.eachCell(function (c, n) {
        c.border = BATAS;
        c.alignment = {
          vertical: "middle",
          horizontal: n >= 4 && n <= 11 ? "center" : "left",
        };
        if (n >= 4 && n <= 8) c.numFmt = "0.0";
      });

      r.getCell("ig").font = { bold: true };

      var kt = r.getCell("kt");
      if (x.kt == "Cukup") warnaPil(kt, "FFFBF0CC", "FF7A5700");
      else if (x.kt == "Kurang") warnaPil(kt, "FFFBE0DC", "FFB03A2E");
      else warnaPil(kt, "FFD9F2E4", "FF17704A");

      var dv = r.getCell("drv");
      if (x.drv == "Gagal") warnaPil(dv, "FFFBE0DC", "FFB03A2E");
      else if (x.drv == "Terkirim") warnaPil(dv, "FFD9F2E4", "FF17704A");
      else warnaPil(dv, "FFFBF0CC", "FF7A5700");

      warnaStatus(r.getCell("status"), x.status);
    });

    if (rk) lembarRingkasan(wb, rk);

    if (nav && partData.length) {
      var wp = wb.addWorksheet("Partisipatif", {
        views: [{ state: "frozen", ySplit: 1 }],
      });

      wp.columns = [
        { header: "Tanggal", key: "tgl", width: 13 },
        { header: "Nama Lembaga", key: "nm", width: 34 },
        { header: "Kab/Kota", key: "kb", width: 26 },
        { header: "Keterangan", key: "ket", width: 40 },
        { header: "Status", key: "status", width: 15 },
        { header: "Diverifikasi Oleh", key: "oleh", width: 18 },
        { header: "Alasan Penolakan", key: "alasan", width: 36 },
      ];
      gayaHeader(wp.getRow(1));

      partData
        .slice()
        .sort(function (a, b) {
          return (
            urutKab(a.kb) - urutKab(b.kb) ||
            String(a.nm).localeCompare(String(b.nm), "id")
          );
        })
        .forEach(function (x) {
          var r = wp.addRow({
            tgl: x.tgl,
            nm: x.nm,
            kb: x.kb || "",
            ket: x.ket || "",
            status: x.status || "Menunggu",
            oleh: x.oleh || "",
            alasan: x.alasan || "",
          });

          r.eachCell(function (c) {
            c.border = BATAS;
            c.alignment = { vertical: "middle", horizontal: "left" };
          });
          warnaStatus(r.getCell("status"), x.status);
        });
    }

    return wb.xlsx.writeBuffer().then(function (buf) {
      var a = document.createElement("a");

      a.href = URL.createObjectURL(
        new Blob([buf], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
      );
      a.download = "monitoring-penilaian-si-barisan.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
    });
  }

  $("#csv").onclick = function () {
    var tombol = this,
      nav = adaNav(),
      d = nav
        ? urutExcel(
            semuaMon().filter(function (x) {
              return !x.part;
            }),
          )
        : rows();

    if (!d.length) {
      alert("Belum ada data untuk diunduh.");
      return;
    }

    if (typeof ExcelJS === "undefined") {
      alert(
        "Pustaka Excel belum termuat. Periksa koneksi internet, lalu muat ulang halaman.",
      );
      return;
    }

    tombol.disabled = true;

    // Ringkasan diambil segar dari server; kalau gagal, lembar Ringkasan dilewati
    (DRIVE_URL ? drivePost({ action: "ringkas" }) : Promise.reject())
      .catch(function () {
        return null;
      })
      .then(function (rk) {
        return buatExcel(d, rk, nav);
      })
      .then(
        function () {
          tombol.disabled = false;
        },
        function (e) {
          tombol.disabled = false;
          alert("Gagal membuat Excel (" + e.message + ").");
        },
      );
  };

  /*=============== AUTHENTICATION (DEMO ACCOUNTS) ===============*/
  var JENIS_ALL = [
    "KUA",
    "MIN",
    "MTsN",
    "MAN",
    "Kankemenag",
    "Kanwil",
    "Partisipatif",
  ];

  var SK = "si-barisan-sesi",
    msess = null;

  function getS() {
    try {
      return localStorage.getItem(SK) || msess;
    } catch (e) {
      return msess;
    }
  }

  function setS(v) {
    msess = v;

    try {
      v ? localStorage.setItem(SK, v) : localStorage.removeItem(SK);
    } catch (e) {}
  }

  function enter(a) {
    U = a;
    window.SIB.user = a;
    document.dispatchEvent(new Event("sib:masuk"));
    $("#login").hidden = true;
    $("#app").hidden = false;
    $("#who").textContent = a.n;
    var k = a.role == "kanwil",
      m = a.role == "madrasah",
      b = a.role == "kab" || a.role == "unit",
      opsi = k ? JENIS_ALL : a.jenis || [a.jn];

    $("#jn").innerHTML = opsi
      .map(function (x) {
        return "<option>" + x + "</option>";
      })
      .join("");

    otoNama = false;
    $("#nm").value = "";
    $("#nm").readOnly = false;
    $("#jn").value = a.jn;
    $("#jn").disabled = opsi.length < 2;

    // Pilihan wilayah: akun Kankemenag dan KUA terkunci pada wilayahnya
    $("#kb").innerHTML = WILAYAH.map(function (w) {
      return "<option>" + esc(w.kab) + "</option>";
    }).join("");
    $("#kb").value = a.kab || WILAYAH[0].kab;
    $("#kb").disabled = !(k || m || b);
    $("#kc").innerHTML = "";
    aturWilayah();

    $("#aksi").style.display = k || a.role == "kab" ? "" : "none";
    $("#mon").hidden = !(a.role == "kanwil" || a.role == "kab");

    build();
    render();
    capaianTerakhir();
    sync();
    syncPart();
    unsurRata();
    msg("", 1);
    window.scrollTo(0, 0);
  }

  function leave() {
    if (DRIVE_URL && DRIVE_TOKEN) {
      drivePost({ action: "keluar" }).catch(function () {});
    }
    DRIVE_TOKEN = "";
    window.SIB.token = "";
    U = null;
    window.SIB.user = null;
    setS(null);
    $("#app").hidden = true;
    $("#login").hidden = false;
    $("#lf").reset();
    $("#lp").type = "password";
    if (window.LoginUI) LoginUI.reset();
    $("#lerr").textContent = "";
    window.scrollTo(0, 0);
  }

  window.SIB.habis = function () {
    leave();
    $("#lerr").textContent = "Sesi berakhir. Silakan masuk lagi.";
  };

  /*=============== LAYAR SAMBUTAN DI DALAM KARTU LOGIN ===============*/
  function sambutan(user, lanjut) {
    var kartu = $(".lcard"),
      lama = $(".sambut", kartu),
      kurang = matchMedia("(prefers-reduced-motion:reduce)").matches;

    if (lama) lama.remove();

    var el = document.createElement("div");

    el.className = "sambut";
    el.setAttribute("role", "status");
    el.innerHTML =
      '<div class="sambut__isi">' +
      '<div class="sambut__ikon"><svg viewBox="0 0 64 64" aria-hidden="true">' +
      '<path class="sambut__centang" d="M18 33l9 9 19-21"/></svg></div>' +
      '<h2 class="sambut__judul">Berhasil masuk</h2>' +
      '<p class="sambut__sub"></p></div>';

    el.querySelector(".sambut__sub").textContent = user.n || "";
    kartu.appendChild(el);

    // Tampil sebentar sampai animasi selesai, lalu langsung masuk
    setTimeout(
      function () {
        try {
          if (lanjut) lanjut(); // halaman utama dibuka lebih dulu
        } finally {
          el.remove();
        }
      },
      kurang ? 600 : 2000,
    );
  }

  $("#lf").addEventListener("submit", function (e) {
    e.preventDefault();
    var btn = $("#lbtn");
    if (btn.classList.contains("load") || btn.classList.contains("ok")) return;
    var er = $("#lerr");

    var u = $("#lu").value.trim().toLowerCase(),
      p = $("#lp").value;

    LoginUI.bersih();
    er.textContent = "";

    if (!u || !p) {
      if (!u) LoginUI.galat("#fu");
      if (!p) LoginUI.galat("#fp");
      er.textContent = "Isi nama pengguna dan kata sandi.";
      return;
    }

    LoginUI.muat("Memeriksa…");

    drivePost({ action: "login", username: u, sandi: p })
      .then(function (r) {
        DRIVE_TOKEN = r.token;
        window.SIB.token = r.token;
        setS(r.token);

        var reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;

        LoginUI.berhasil(
          function () {
            $("#lp").value = "";
            LoginUI.reset();
            sambutan(r.user, function () {
              enter(r.user);
            });
          },
          reduce ? 300 : 1200,
        );
      })
      .catch(function (err) {
        LoginUI.berhenti();
        er.textContent = err.message;
        if (/salah|sandi|pengguna/i.test(err.message)) {
          LoginUI.galat("#fu", "#fp");
        }
      });
  });

  $("#lshow").onchange = function () {
    $("#lp").type = this.checked ? "text" : "password";
  };

  $("#lo").onclick = leave;
  var s0 = getS();

  if (s0 && DRIVE_URL) {
    DRIVE_TOKEN = s0;
    window.SIB.token = s0;
    drivePost({ action: "sesi" })
      .then(function (r) {
        enter(r.user);
      })
      .catch(function () {
        leave();
      });
  } else leave();
})();
