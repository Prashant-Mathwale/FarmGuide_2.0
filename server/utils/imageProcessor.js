const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const crypto = require('crypto');
const config = require('../config/community');

// Ensure local upload directory exists
const localDir = path.resolve(__dirname, '..', config.storage.localUploadDir);
if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir, { recursive: true });
}

/**
 * Process image with sharp and store via selected STORAGE_DRIVER
 * @param {Buffer} buffer
 * @returns {Promise<{ url: string, width: number, height: number }>}
 */
async function processAndSaveImage(buffer) {
    const { imageMaxWidthPx, imageQualityJpeg } = config.limits;

    // Process with sharp: strip EXIF/GPS, resize to max width, re-encode to JPEG
    const pipeline = sharp(buffer)
        .rotate() // auto-orient based on EXIF before stripping
        .resize({ width: imageMaxWidthPx, withoutEnlargement: true })
        .jpeg({ quality: imageQualityJpeg, mozjpeg: true });

    const processedBuffer = await pipeline.toBuffer();
    const metadata = await sharp(processedBuffer).metadata();

    const width = metadata.width || imageMaxWidthPx;
    const height = metadata.height || 0;

    const driver = process.env.STORAGE_DRIVER || config.storage.driver;

    if (driver === 'cloudinary' && process.env.CLOUDINARY_CLOUD_NAME) {
        const cloudinary = require('cloudinary').v2;
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        });

        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { folder: 'farmguide/community', format: 'jpg' },
                (err, result) => {
                    if (err) return reject(err);
                    resolve({
                        url: result.secure_url,
                        width: result.width || width,
                        height: result.height || height
                    });
                }
            );
            uploadStream.end(processedBuffer);
        });
    }

    // Default: Local disk storage
    const filename = `${crypto.randomUUID()}.jpg`;
    const destPath = path.join(localDir, filename);
    await fs.promises.writeFile(destPath, processedBuffer);

    const relativeUrl = `${config.storage.staticUrlPrefix}/${filename}`;
    return {
        url: relativeUrl,
        width,
        height
    };
}

module.exports = { processAndSaveImage };
