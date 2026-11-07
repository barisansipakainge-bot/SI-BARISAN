const SimpanUI = (() => {
  const C = 326.73; // keliling cincin
  let p = 0,
    rayap = null,
    tutup = null;

  const ov = () => document.getElementById("simpanOverlay");
  const kartu = () => ov().querySelector(".simpan-kartu");
  const isi = () => ov().querySelector(".sc-isi");
  const teks = (j, s) => {
    document.getElementById("simpanJudul").textContent = j;
    document.getElementById("simpanSub").textContent = s || "";
  };
  const set = (v) => {
    p = Math.max(0, Math.min(1, v));
    isi().style.strokeDashoffset = C * (1 - p);
  };
  const reset = () => {
    clearInterval(rayap);
    clearTimeout(tutup);
    rayap = tutup = null;
  };
  const tutupNanti = (ms) => {
    tutup = setTimeout(() => ov().classList.remove("tampil"), ms);
  };

  return {
    // merayap = true: cincin terisi pelan-pelan selama menunggu server
    mulai(judul = "Menyimpan penilaian…", sub = "", merayap = false) {
      reset();
      kartu().classList.remove("selesai", "gagal", "ditolak");
      set(0);
      teks(judul, sub);
      ov().classList.add("tampil");
      if (merayap) {
        rayap = setInterval(() => set(p + (0.9 - p) * 0.12), 400);
      }
    },
    maju(v, sub) {
      set(v);
      if (sub !== undefined) {
        document.getElementById("simpanSub").textContent = sub;
      }
    },
    selesai(judul = "Penilaian tersimpan", sub = "", tutupMs = 1600) {
      reset();
      set(1);
      teks(judul, sub);
      kartu().classList.add("selesai");
      tutupNanti(tutupMs);
    },
    ditolak(judul = "Penilaian ditolak", sub = "", tutupMs = 2800) {
      reset();
      set(1);
      teks(judul, sub);
      kartu().classList.add("ditolak");
      tutupNanti(tutupMs);
    },
    gagal(
      judul = "Gagal menyimpan",
      sub = "Silakan coba lagi",
      tutupMs = 2600,
    ) {
      reset();
      kartu().classList.add("gagal");
      teks(judul, sub);
      tutupNanti(tutupMs);
    },
  };
})();
window.SimpanUI = SimpanUI;
