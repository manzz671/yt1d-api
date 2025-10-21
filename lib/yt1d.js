const axios = require('axios');
const qs = require('qs');
const cheerio = require('cheerio');
const { manzz: cf } = require('./bycf');

const USER_AGENT =
  'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36';

// NOTE: Param endpoint, referer, dan mhash bisa berubah dari sisi server.
// Simpan di satu tempat agar mudah di-update.
const YT1D = {
  analyzeEndpoint:
    'https://yt1d.com/mates/en/analyze/ajax?retry=undefined&platform=youtube&mhash=2eb5f4c999fea86c',
  convertEndpoint: (id) => `https://yt1d.com/mates/en/convert?id=${id}`,
  origin: 'https://yt1d.com',
  referer: 'https://yt1d.com/en307/'
};

const yt1d = {
  // Ambil token Turnstile untuk melewati proteksi Cloudflare/Turnstile.
  bypass: async () => {
    const token = await cf.turnstileMin(
      'https://yt1d.com/mates/en/analyze/ajax',
      '0x4AAAAAAAzuNQE5IJEnuaAp',
      null
    );
    if (!token) throw new Error('Failed to obtain Turnstile token');
    return token;
  },

  // Kirim URL YouTube ke endpoint analyze, parse HTML, dan ambil daftar opsi unduhan/konversi.
  analyze: async (youtubeUrl) => {
    if (!youtubeUrl) throw new Error('youtubeUrl is required');

    const token = await yt1d.bypass();
    const data = qs.stringify({
      url: youtubeUrl,
      ajax: '1',
      lang: 'en',
      cftoken: token
    });

    const config = {
      method: 'POST',
      url: YT1D.analyzeEndpoint,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json, text/javascript, */*; q=0.01',
        'Content-Type': 'application/x-www-form-urlencoded',
        origin: YT1D.origin,
        referer: YT1D.referer
      },
      data,
      timeout: 15000
    };

    const api = await axios.request(config);
    const html = api?.data?.result;
    const status = api?.data?.status;
    if (status !== 'success' || !html) {
      throw new Error('Analyze failed or empty HTML result');
    }

    const $ = cheerio.load(html);

    // Validasi minimal struktur
    const titleEl = $('#video_title');
    if (!titleEl.length) throw new Error('Unexpected HTML structure (missing #video_title)');

    const videoTitle = titleEl.text().trim();
    const thumbnail = $('.img-thumbnail').attr('src') || null;

    const result = {
      video_title: videoTitle,
      thumbnail,
      downloads: []
    };

    $('table.table tr').each((_, el) => {
      const tds = $(el).find('td');
      if (tds.length !== 3) return;

      const quality = $(tds[0]).text().trim().replace(/\s+/g, ' ');
      const size = $(tds[1]).text().trim();
      const link = $(tds[2]).find('a, button');
      const href = link.attr('href') || '';
      const onclick = link.attr('onclick') || '';
      const noaudio = $(el).hasClass('noaudio');

      // Direct link (googlevideo)
      if (href.includes('googlevideo.com')) {
        result.downloads.push({
          type: 'direct',
          quality,
          size,
          has_audio: !noaudio,
          url: href
        });
        return;
      }

      // Konversi via onclick "download(...)"
      if (onclick.startsWith('download')) {
        const match = onclick.match(
          /download\('([^']*)','([^']*)','([^']*)','([^']*)',([^,]*),'([^']*)','([^']*)'\)/
        );
        if (match) {
          result.downloads.push({
            type: 'conversion',
            quality,
            size,
            has_audio: !noaudio,
            conversion_params: {
              youtubeUrl: match[1],
              title: videoTitle,
              id: match[3],
              ext: match[4],
              note: match[6],
              format: match[7]
            }
          });
        }
      }
    });

    return result;
  },

  // Kirim ke endpoint convert untuk opsi yang membutuhkan proses konversi (non direct).
  convert: async ({ youtubeUrl, title, id, ext, note, format }) => {
    if (!id) throw new Error('Missing id for conversion');

    const data = qs.stringify({
      platform: 'youtube',
      url: youtubeUrl,
      title,
      id,
      ext,
      note,
      format
    });

    const config = {
      method: 'POST',
      url: YT1D.convertEndpoint(id),
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json, text/javascript, */*; q=0.01',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'x-note': note,
        platform: 'youtube',
        origin: YT1D.origin,
        referer: YT1D.referer
      },
      data,
      timeout: 15000
    };

    const response = await axios.request(config);
    return response.data;
  }
};

module.exports = { yt1d };
