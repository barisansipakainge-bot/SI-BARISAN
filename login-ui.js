/* SI-BARISAN - efek login: kekuatan sandi, garis zigzag galat, dan tombol */
const LoginUI = (() => {
  const $ = (s) => document.querySelector(s);
  const btn = () => $("#lbtn");
  const tx = () => $("#lbtn .lg-tx");

  function nilai(p) {
    let s = 0;
    if (p.length >= 6) s++;
    if (p.length >= 10) s++;
    if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
    if (/\d/.test(p)) s++;
    if (/[^\w\s]/.test(p)) s++;
    return s;
  }

  function kuat(p) {
    const k = $("#lkuat");
    if (!p) {
      k.classList.remove("on");
      return;
    }
    const s = nilai(p),
      n = s <= 1 ? 1 : s === 2 ? 2 : s <= 4 ? 3 : 4;
    k.dataset.n = n;
    $("#lisi").style.width = n * 25 + "%";
    $("#lkt").textContent = ["", "Lemah", "Sedang", "Kuat", "Sangat kuat"][n];
    k.classList.add("on");
  }

  function bersih() {
    ["#fu", "#fp"].forEach((id) => $(id).classList.remove("err"));
  }

  $("#lp").addEventListener("input", (e) => {
    $("#fp").classList.remove("err");
    kuat(e.target.value);
  });
  $("#lu").addEventListener("input", () => $("#fu").classList.remove("err"));

  return {
    bersih,
    galat(...ids) {
      ids.forEach((id) => {
        const el = $(id);
        el.classList.remove("err");
        void el.offsetWidth; // memulai ulang animasi
        el.classList.add("err");
      });
    },
    muat(t) {
      btn().classList.add("load");
      tx().textContent = t || "Memeriksa…";
    },
    berhenti() {
      btn().classList.remove("load");
      tx().textContent = "Masuk";
    },
    berhasil(selesai, ms) {
      btn().classList.remove("load");
      btn().classList.add("ok");
      setTimeout(selesai, ms);
    },
    reset() {
      btn().classList.remove("load", "ok");
      tx().textContent = "Masuk";
      bersih();
      kuat("");
    },
  };
})();
window.LoginUI = LoginUI;
