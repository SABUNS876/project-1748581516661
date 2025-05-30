const axios = require('axios');
const { parse } = require('url');

async function scrapeTikTok(url) {
  // Validate URL first
  if (!url || !url.includes('tiktok.com')) {
    return { error: 'Invalid TikTok URL' };
  }

  // Try multiple approaches
  try {
    // First try the SnapAny API
    const snapAnyResult = await trySnapAnyApi(url);
    if (snapAnyResult && !snapAnyResult.error) {
      return snapAnyResult;
    }

    // If that fails, try direct TikTok API
    const directApiResult = await tryDirectTikTokApi(url);
    if (directApiResult && !directApiResult.error) {
      return directApiResult;
    }

    // If both fail, return the best error message
    return {
      error: 'All scraping methods failed',
      details: {
        snapAnyError: snapAnyResult?.error,
        directApiError: directApiResult?.error
      }
    };
  } catch (error) {
    console.error('Scraping error:', error);
    return { error: 'Unexpected scraping error', details: error.message };
  }
}

async function trySnapAnyApi(url) {
  const headers = {
    'accept': '*/*',
    'accept-language': 'en-US,en;q=0.9',
    'content-type': 'application/json',
    'origin': 'https://snapany.com',
    'referer': 'https://snapany.com/',
    'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-site',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  };

  try {
    const response = await axios.post('https://api.snapany.com/v1/extract', { link: url }, {
      headers,
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    console.error('SnapAny API error:', error.message);
    return { error: 'SnapAny API request failed', details: error.message };
  }
}

async function tryDirectTikTokApi(url) {
  // Extract video ID from URL
  const parsedUrl = parse(url, true);
  const videoId = parsedUrl.pathname?.split('/').pop();
  if (!videoId) {
    return { error: 'Could not extract video ID from URL' };
  }

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0'
  };

  try {
    // Try the TikTok oEmbed API
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
    const oembedResponse = await axios.get(oembedUrl, { headers, timeout: 8000 });
    
    // Try to get the direct video URL
    const htmlResponse = await axios.get(url, { headers, timeout: 8000 });
    const videoUrlMatch = htmlResponse.data.match(/"playAddr":"(https:\\\/\\\/[^"]+)"/);
    const videoUrl = videoUrlMatch ? videoUrlMatch[1].replace(/\\\//g, '/') : null;

    return {
      ...oembedResponse.data,
      video_url: videoUrl,
      video_id: videoId
    };
  } catch (error) {
    console.error('Direct TikTok API error:', error.message);
    return { error: 'Direct TikTok API request failed', details: error.message };
  }
}

module.exports = scrapeTikTok;