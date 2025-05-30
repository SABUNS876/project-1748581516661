const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

module.exports = async (req) => {
    try {
        // Validasi input lebih ketat
        if (!req.files || !req.files.image) {
            throw new Error('Harap unggah file gambar');
        }

        const image = req.files.image;
        const prompt = req.body.prompt || 'Perbaiki foto ini';

        // Validasi tipe file
        const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedMimes.includes(image.mimetype)) {
            throw new Error('Format file tidak didukung. Gunakan JPG/PNG');
        }

        // Validasi ukuran file (max 4MB)
        if (image.size > 4 * 1024 * 1024) {
            throw new Error('Ukuran file maksimal 4MB');
        }

        // Inisialisasi Gemini AI
        const genAI = new GoogleGenerativeAI("AIzaSyCfPx5_aLgfwiaNglp1V6iRZhBeYRghINo");
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash-latest",
            generationConfig: {
                maxOutputTokens: 2048,
                temperature: 0.5
            }
        });

        // Baca file sebagai buffer
        const imageBuffer = fs.readFileSync(image.tempFilePath);
        const base64Image = imageBuffer.toString('base64');

        // Siapkan input untuk Gemini
        const parts = [
            { text: prompt },
            {
                inlineData: {
                    mimeType: image.mimetype,
                    data: base64Image
                }
            }
        ];

        // Kirim request ke Gemini
        const result = await model.generateContent({
            contents: [{ role: "user", parts }]
        });

        // Proses response
        const response = result.response;
        if (!response.candidates || !response.candidates[0]) {
            throw new Error('Tidak mendapatkan response dari AI');
        }

        let generatedImage = null;
        let generatedText = '';

        for (const part of response.candidates[0].content.parts) {
            if (part.text) {
                generatedText += part.text;
            } else if (part.inlineData) {
                generatedImage = Buffer.from(part.inlineData.data, 'base64');
            }
        }

        if (!generatedImage) {
            throw new Error('Gagal menghasilkan gambar');
        }

        return {
            status: true,
            image: generatedImage.toString('base64'),
            text: generatedText,
            mimeType: 'image/png' // Gemini selalu return PNG
        };

    } catch (error) {
        console.error('Error in editfoto:', error);
        throw new Error(`Gagal memproses gambar: ${error.message}`);
    } finally {
        // Bersihkan file temporary
        if (req.files?.image?.tempFilePath) {
            fs.unlink(req.files.image.tempFilePath, () => {});
        }
    }
};
