
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { letterboxImage, resizeImage } from '../lib/utils';

const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

const dataUrlToParts = (dataUrl: string) => {
    const arr = dataUrl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");
    return { mimeType: mimeMatch[1], data: arr[1] };
}

const dataUrlToPart = (dataUrl: string) => {
    const { mimeType, data } = dataUrlToParts(dataUrl);
    return { inlineData: { mimeType, data } };
}

const handleApiResponse = (response: GenerateContentResponse): string => {
    for (const candidate of response.candidates ?? []) {
        const imagePart = candidate.content?.parts?.find(part => part.inlineData);
        if (imagePart?.inlineData) {
            const { mimeType, data } = imagePart.inlineData;
            return `data:${mimeType};base64,${data}`;
        }
    }
    throw new Error("The AI model did not return an image. Check safety filters or prompt complexity.");
};

const model = 'gemini-3-pro-image-preview';

const parseAspectRatio = (ratio: string): number => {
  const [w, h] = ratio.split(':').map(Number);
  return w / h;
};

export const generateRoomBase = async (
  roomImage: File, 
  ratio: string = "16:9"
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
  const dataUrl = await fileToDataUrl(roomImage);
  
  // Just resize to a reasonable max dimension, preserving original aspect ratio
  const resized = await resizeImage(dataUrl, 1600, 1600);
  const part = dataUrlToPart(resized);

  const prompt = `
    You are an expert AI interior design visualizer. 
    Your task is to generate an empty "Architectural Shell" based on the uploaded reference image.

    Directives:
    1. ANALYZE the reference image's architectural style, lighting direction, and material textures (flooring, wall paint, window treatments).
    2. REMOVE all distinct furniture (sofas, tables, chairs, beds) and freestanding decor (rugs, lamps, plants).
    3. PRESERVE the structural integrity: keep walls, windows, ceilings, and built-in fixtures (like fireplaces or recessed shelves) exactly as they are.
    4. RECONSTRUCT the empty space: seamlessy extend the flooring and wall textures into the areas where furniture was removed.
    5. LIGHTING: Strictly maintain the original lighting mood, shadows, and color temperature of the reference image.
    
    Output the final image in ${ratio} aspect ratio, cropping or extending as needed.
    Return ONLY the final image.`;

  const response = await ai.models.generateContent({
    model,
    contents: { parts: [part, { text: prompt }] },
    config: {
        imageConfig: { aspectRatio: ratio as any }
    },
  });

  return handleApiResponse(response);
};

export const placeFurniture = async (
    roomImageUrl: string, 
    assetImage: File, 
    coord: { x: number; y: number },
    ratio: string = "16:9"
): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const roomPart = dataUrlToPart(roomImageUrl);
    const assetDataUrl = await fileToDataUrl(assetImage);
    const assetPart = dataUrlToPart(assetDataUrl);

    const prompt = `You are a world-class interior designer and spatial artist. 
    Task: Place the furniture piece from the 'asset image' into the 'room image'.
    
    Location: Place the object centered at these normalized coordinates: X=${coord.x.toFixed(1)}%, Y=${coord.y.toFixed(1)}%.
    Note: These percentages are relative to the top-left corner of the image. 
    Interpret the Y coordinate as the ground-contact point for the furniture base.
    
    Rules for Visual Fidelity:
    1. STRICTURE POSE PRESERVATION: Do NOT change the angle or rotation of the furniture. It must be placed in the room exactly as it appears in the 'asset image' thumbnail. If it is side-on, place it side-on. If it is front-facing, place it front-facing.
    2. Orientation: Match the perspective of the asset to the room's floor plane.
    3. Realistic Scale: Ensure the object is sized correctly according to the room's architecture.
    4. Environment Mapping: Apply realistic shadows, reflections, and ambient occlusion that match the room's lighting source.
    5. Integrity: Do not alter any other part of the room background.
    
    Maintain aspect ratio: ${ratio}.
    Return ONLY the final composited image.`;

    const response = await ai.models.generateContent({
        model,
        contents: { parts: [roomPart, assetPart, { text: prompt }] },
        config: {
            imageConfig: { aspectRatio: ratio as any }
        },
    });
    return handleApiResponse(response);
};

export const removeObject = async (
    roomImageUrl: string,
    box: { x: number; y: number; width: number; height: number },
    ratio: string = "16:9"
): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const roomPart = dataUrlToPart(roomImageUrl);

    const x2 = box.x + box.width;
    const y2 = box.y + box.height;

    const prompt = `You are an AI image editor specializing in interior photography.
    Your task is to REMOVE the object within the specified region and seamlessly inpaint the background.
    
    Region (Normalized 0-100%): Top: ${box.y.toFixed(1)}%, Left: ${box.x.toFixed(1)}%, Bottom: ${y2.toFixed(1)}%, Right: ${x2.toFixed(1)}%.
    
    Rules:
    1. Inpainting: Fill the removal area with textures that perfectly match the surrounding environment (walls, floor, shadows).
    2. Seamlessness: The result must be completely invisible.
    3. Integrity: Do not change anything else in the image.
    4. Maintain the aspect ratio of ${ratio}.
    Return ONLY the final edited image.`;

    const response = await ai.models.generateContent({
        model,
        contents: { parts: [roomPart, { text: prompt }] },
        config: {
            imageConfig: { aspectRatio: ratio as any }
        },
    });
    return handleApiResponse(response);
};

export const modifyRoomWithPrompt = async (
    roomImageUrl: string, 
    userPrompt: string,
    ratio: string = "16:9"
): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const roomPart = dataUrlToPart(roomImageUrl);

    const prompt = `You are an AI interior renderer. Modify the provided room image based on this request: "${userPrompt}". 
    Maintain the overall perspective and structure of the room. 
    Keep the aspect ratio as ${ratio}.
    Return ONLY the updated image.`;

    const response = await ai.models.generateContent({
        model,
        contents: { parts: [roomPart, { text: prompt }] },
        config: {
            imageConfig: { aspectRatio: ratio as any }
        },
    });
    return handleApiResponse(response);
};
