/**
 * Stub bycf: menyediakan interface { shannz: { turnstileMin(url, sitekey, cookie) } }
 * Agar proyek ini lengkap, kita sediakan implementasi minimal yang mengembalikan null.
 *
 * Catatan:
 * - Penerapan nyata bypass Turnstile bergantung pada metode khusus (mis. headless browser,
 *   worker, atau API pihak ketiga). Karena itu bervariasi, kamu bisa mengganti isi fungsi
 *   di bawah dengan implementasi milikmu sendiri tanpa mengubah interface.
 */

const manzz = {
  /**
   * @param {string} url - Endpoint target yang dilindungi Turnstile (contoh: analyze/ajax)
   * @param {string} sitekey - Sitekey Turnstile dari target situs
   * @param {string|null} cookie - Cookie sesi jika diperlukan (opsional)
   * @returns {Promise<string|null>} token - Token valid jika sukses, atau null jika gagal
   */
  turnstileMin: async (url, sitekey, cookie) => {
    // TODO: Replace dengan implementasi kamu.
    // Untuk saat ini, return null agar flow gagal secara jelas dan aman.
    // Kamu bisa melempar error juga jika ingin:
    // throw new Error('bycf.turnstileMin not implemented');
    return null;
  }
};

module.exports = { manzz };
