const axios = require('axios');
const fetch = require('node-fetch')
const fs = require('fs')

const formatAudio = ['mp3', 'm4a', 'webm', 'acc', 'flac', 'opus', 'ogg', 'wav']
const formatVideo = ['360', '480', '720', '1080', '1440', '4k']

async function cekProgress(id) {
    const configProgress = {
        method: 'GET',
        url: `https://p.oceansaver.in/ajax/progress.php?id=${id}`,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Connection': 'keep-alive',
            'X-Requested-With': 'XMLHttpRequest'
        }
    }

    while (true) {
        const response = await axios.request(configProgress)
        if (response.data && response.data.success && response.data.progress === 1000) {
            return response.data.download_url
        }
        await new Promise(resolve => setTimeout(resolve, 5000))
    }
}

async function ytdlv2(url, format) {
    if (!formatAudio.includes(format) && !formatVideo.includes(format)) {
        throw new Error('Format nya gak valid bro.')
    }

    const configDownload = {
        method: 'GET',
        url: `https://p.oceansaver.in/ajax/download.php?format=${format}&url=${encodeURIComponent(url)}&api=dfcb6d76f2f6a9894gjkege8a4ab232222`,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Connection': 'keep-alive',
            'X-Requested-With': 'XMLHttpRequest'
        }
    }

    const response = await axios.request(configDownload)

    if (response.data && response.data.success) {
        const { id, title, info } = response.data
        const { image } = info

        const downloadUrl = await cekProgress(id)

        return {
            id: id,
            image: image,
            title: title,
            downloadUrl: downloadUrl
        }
    }

    throw new Error('Failed to fetch video details.')
}

async function Ytdl(link) {
    try {
        const result = await axios.get(`https://ytdl.vreden.web.id/metadata?url=${link}`)
        return {
            status: true,
            data: result.data
        }
    } catch (error) {
        return {
            status: false,
            message: error.message
        }
    }
}


module.exports = ytdlv2;
