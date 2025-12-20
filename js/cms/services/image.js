/**
 * Image Service
 * Handles image compression and processing
 */

export class ImageService {
    /**
     * Compress an image file
     * @param {File} file - The image file to compress
     * @param {number} maxWidth - Maximum width of the output image
     * @param {number} maxHeight - Maximum height of the output image (defaults to maxWidth)
     * @param {Object} options - Additional options
     * @param {boolean} options.preserveTransparency - If true, converts to WebP to preserve transparency. Default: false (strips transparency, outputs JPEG)
     * @returns {Promise<File>} The compressed image file
     */
    async compressImage(file, maxWidth, maxHeight = maxWidth, options = {}) {
        const { preserveTransparency = false } = options;
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const img = document.createElement('img');

                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Calculate new dimensions
                    if (width > maxWidth || height > maxHeight) {
                        if (width > height) {
                            if (width > maxWidth) {
                                height = height * (maxWidth / width);
                                width = maxWidth;
                            }
                        } else {
                            if (height > maxHeight) {
                                width = width * (maxHeight / height);
                                height = maxHeight;
                            }
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    
                    // If not preserving transparency, fill with white background first
                    if (!preserveTransparency) {
                        ctx.fillStyle = '#FFFFFF';
                        ctx.fillRect(0, 0, width, height);
                    }
                    
                    ctx.drawImage(img, 0, 0, width, height);

                    // Choose output format based on transparency option
                    const outputFormat = preserveTransparency ? 'image/webp' : 'image/jpeg';
                    const outputExtension = preserveTransparency ? '.webp' : '.jpg';
                    const quality = preserveTransparency ? 0.90 : 0.85;
                    
                    // Update filename extension
                    const baseName = file.name.replace(/\.[^/.]+$/, '');
                    const newFileName = baseName + outputExtension;

                    canvas.toBlob((blob) => {
                        if (blob) {
                            const compressedFile = new File([blob], newFileName, {
                                type: outputFormat,
                                lastModified: Date.now(),
                            });
                            resolve(compressedFile);
                        } else {
                            reject(new Error('Compression failed - blob is null'));
                        }
                    }, outputFormat, quality);
                };

                img.onerror = () => {
                    reject(new Error('Failed to load image'));
                };

                img.src = e.target.result;
            };

            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };

            reader.readAsDataURL(file);
        });
    }
}

export default new ImageService();

