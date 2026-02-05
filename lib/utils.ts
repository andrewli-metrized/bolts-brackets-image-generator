
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getFriendlyErrorMessage(error: any, context: string): string {
    let rawMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
        rawMessage = error.message;
    } else if (typeof error === 'string') {
        rawMessage = error;
    } else if (error) {
        rawMessage = String(error);
    }

    if (rawMessage.includes("Unsupported MIME type")) {
        try {
            const errorJson = JSON.parse(rawMessage);
            const nestedMessage = errorJson?.error?.message;
            if (nestedMessage && nestedMessage.includes("Unsupported MIME type")) {
                const mimeType = nestedMessage.split(': ')[1] || 'unsupported';
                return `File type '${mimeType}' is not supported. Please use a format like PNG, JPEG, or WEBP.`;
            }
        } catch (e) {}
        return `Unsupported file format. Please upload an image format like PNG, JPEG, or WEBP.`;
    }
    
    return `${context}. ${rawMessage}`;
}

export const urlToFile = (url: string, filename: string): Promise<File> => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.setAttribute('crossOrigin', 'anonymous');

        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context.'));
            }
            ctx.drawImage(image, 0, 0);

            canvas.toBlob((blob) => {
                if (!blob) {
                    return reject(new Error('Canvas toBlob failed.'));
                }
                const mimeType = blob.type || 'image/png';
                const file = new File([blob], filename, { type: mimeType });
                resolve(file);
            }, 'image/png');
        };

        image.onerror = (error) => {
            reject(new Error(`Could not load image from URL for canvas conversion. Error: ${error}`));
        };

        image.src = url;
    });
};

export const letterboxImage = (imageSrc: string, targetAspectRatio: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Could not get canvas context.'));

            const currentAspectRatio = img.width / img.height;

            let canvasWidth, canvasHeight;
            let drawX, drawY, drawWidth, drawHeight;

            if (currentAspectRatio > targetAspectRatio) {
                canvasWidth = img.width;
                canvasHeight = img.width / targetAspectRatio;
                drawX = 0;
                drawY = (canvasHeight - img.height) / 2;
                drawWidth = img.width;
                drawHeight = img.height;
            } else {
                canvasWidth = img.height * targetAspectRatio;
                canvasHeight = img.height;
                drawX = (canvasWidth - img.width) / 2;
                drawY = 0;
                drawWidth = img.width;
                drawHeight = img.height;
            }

            canvas.width = canvasWidth;
            canvas.height = canvasHeight;

            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = (err) => reject(err);
        img.src = imageSrc;
    });
};

export const resizeImage = (imageSrc: string, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Could not get canvas context.'));

            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width *= maxHeight / height;
                    height = maxHeight;
                }
            }

            canvas.width = width;
            canvas.height = height;

            ctx.drawImage(img, 0, 0, width, height);

            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = (err) => reject(err);
        img.src = imageSrc;
    });
};

export const getCroppedImg = (image: HTMLImageElement, pixelCrop: any): Promise<string> => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2d context");

  // Use natural dimensions to ensure we map back to the high-res original source
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  // The canvas should be the size of the selection in original pixels
  canvas.width = Math.floor(pixelCrop.width * scaleX);
  canvas.height = Math.floor(pixelCrop.height * scaleY);

  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(
    image,
    pixelCrop.x * scaleX,
    pixelCrop.y * scaleY,
    pixelCrop.width * scaleX,
    pixelCrop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return Promise.resolve(canvas.toDataURL("image/png"));
};
