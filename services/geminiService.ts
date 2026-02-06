
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { resizeImage } from '../lib/utils';

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
    You are an industrial data augmentation specialist. 
    Your task is to prepare the uploaded factory/workshop image for object detection data generation.

    Directives:
    1. ANALYZE the reference image's lighting, metallic surfaces, and depth.
    2. CLEAN UP: Remove any blurred foreground obstructions if they interfere with the main assembly line view.
    3. PRESERVE: Keep the machinery, conveyor belts, and existing background equipment exactly as is.
    4. QUALITY: Ensure the output is high-fidelity photorealistic.
    
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

export const placeObjectInBox = async (
    roomImageUrl: string, 
    assetImage: File, 
    box: { x: number; y: number; width: number; height: number },
    ratio: string = "16:9"
): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const roomPart = dataUrlToPart(roomImageUrl);
    const assetDataUrl = await fileToDataUrl(assetImage);
    const assetPart = dataUrlToPart(assetDataUrl);

    // Calculate coordinates for prompt
    const y2 = box.y + box.height;
    const x2 = box.x + box.width;

    const prompt = `You are a synthetic data generator for computer vision training.
    
    Task: Insert the industrial hardware object (from the asset image) into the factory scene (the background image).
    
    Bounding Box Location (Normalized 0-100%):
    Top: ${box.y.toFixed(1)}%, Left: ${box.x.toFixed(1)}%
    Bottom: ${y2.toFixed(1)}%, Right: ${x2.toFixed(1)}%
    
    Directives:
    1. INTEGRATION: The object must physically sit within the defined bounding box.
    2. PERSPECTIVE MATCHING: Align the object's perspective with the factory floor or machinery surface it is placed on.
    3. MATERIALITY: Apply realistic metallic reflections, rust, or grease marks to match the surrounding industrial environment.
    4. LIGHTING: Cast accurate shadows based on the factory's overhead lighting.
    5. OCCLUSION: If the bounding box implies the object is behind a pipe or wire, handle the occlusion naturally.
    
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

    const prompt = `You are an AI image editor.
    Your task is to REMOVE the object within the specified region and seamlessly inpaint the factory background.
    
    Region: Top: ${box.y.toFixed(1)}%, Left: ${box.x.toFixed(1)}%, Bottom: ${y2.toFixed(1)}%, Right: ${x2.toFixed(1)}%.
    
    Rules:
    1. Inpainting: Fill with machinery, floor, or walls that match the factory pattern.
    2. Seamlessness: The result must be invisible.
    
    Maintain the aspect ratio of ${ratio}.
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

    const prompt = `You are an AI industrial environment editor. Modify the provided image: "${userPrompt}". 
    Focus on realistic factory conditions (safety markings, lighting, wear and tear).
    Maintain the aspect ratio as ${ratio}.
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
