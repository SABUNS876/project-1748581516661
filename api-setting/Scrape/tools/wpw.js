const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const crypto = require('crypto');

async function hitamkanWaifu(imagePath) {
    const userId = `user-${crypto.randomBytes(4).toString('hex')}`;
    const sessionId = crypto.randomBytes(8).toString('hex');

    const url = 'https://wpw.my.id/api/upload'; // Ganti dengan endpoint yang benar
    const headers = {
        'Accept': '*/*',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cookie': `userId=${userId}; sessionId=${sessionId}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
        'Origin': 'https://wpw.my.id',
        'Referer': 'https://wpw.my.id/'
    };

    // Membuat form data
    const formData = new FormData();
    formData.append('image', fs.createReadStream(imagePath));
    formData.append('user', userId);
    formData.append('action', 'darken'); // Parameter untuk proses hitamkan

    // Gabungkan headers FormData dengan headers lainnya
    const finalHeaders = {
        ...headers,
        ...formData.getHeaders()
    };

    try {
        const response = await axios.post(url, formData, {
            headers: finalHeaders,
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });
        return response.data;
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        throw error;
    }
}

// Contoh penggunaan
// hitamkanWaifu('./waifu.jpg')
//   .then(result => console.log(result))
//   .catch(err => console.error(err));

module.exports = hitamkanWaifu;
