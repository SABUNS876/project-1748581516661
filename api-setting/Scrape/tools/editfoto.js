const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

module.exports = async (req) => {
    // Validasi input
    if (!req.files || !req.files.image) {
        throw new Error('File gambar tidak ditemukan');
    }

    if (!req.body.prompt) {
        throw new Error('Prompt custom diperlukan. Contoh: buatkan foto itu lebih estetik');
    }

    const image = req.files.image;
    const mime = image.mimetype;
    const prompt = req.body.prompt;

    if (!/image\/(jpe?g|png)/.test(mime)) {
        throw new Error(`Format ${mime} tidak didukung! Hanya jpeg/jpg/png.`);
    }

    try {
        // Proses dengan Gemini AI
        const genAI = new GoogleGenerativeAI("AIzaSyCfPx5_aLgfwiaNglp1V6iRZhBeYRghINo");
        const base64Image = (await fs.promises.readFile(image.tempFilePath)).toString("base64");

        const contents = [
            { text: prompt },
            {
                inlineData: {
                    mimeType: mime,
                    data: base64Image
                }
            }
        ];

        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-exp-image-generation",
            generationConfig: {
                responseModalities: ["Text", "Image"]
            },
        });

        const response = await model.generateContent(contents);
        let resultImage;
        let resultText = "";

        for (const part of response.response.candidates[0].content.parts) {
            if (part.text) {
                resultText += part.text;
            } else if (part.inlineData) {
                const imageData = part.inlineData.data;
                resultImage = Buffer.from(imageData, "base64");
            }
        }

        if (resultImage) {
            return {
                status: true,
                result: {
                    image: resultImage.toString('base64'),
                    text: resultText,
                    message: "Edit selesai sesuai permintaan"
                }
            };
        } else {
            throw new Error("Gagal memproses gambar");
        }
    } catch (error) {
        console.error(error);
        throw new Error(`Error: ${error.message}`);
    } finally {
        // Bersihkan file temp
        if (image.tempFilePath) {
            fs.unlinkSync(image.tempFilePath).catch(console.error);
        }
    }
};
