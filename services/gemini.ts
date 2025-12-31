
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AspectRatio } from "../types";

export class GeminiService {
  // Removida a propriedade privada 'ai' para instanciar por chamada conforme diretrizes

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private decodeBase64(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  private createWavHeader(pcmData: Uint8Array, sampleRate: number): Uint8Array {
    const header = new ArrayBuffer(44);
    const view = new DataView(header);
    const byteLength = pcmData.length;

    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, 36 + byteLength, true); 
    view.setUint32(8, 0x57415645, false); // "WAVE"

    view.setUint32(12, 0x666d7420, false); // "fmt "
    view.setUint32(16, 16, true); 
    view.setUint16(20, 1, true); 
    view.setUint16(22, 1, true); 
    view.setUint32(24, sampleRate, true); 
    view.setUint32(28, sampleRate * 2, true); 
    view.setUint16(32, 2, true); 
    view.setUint16(34, 16, true); 

    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, byteLength, true); 

    const combined = new Uint8Array(44 + byteLength);
    combined.set(new Uint8Array(header), 0);
    combined.set(pcmData, 44);
    return combined;
  }

  async generateAdImage(
    productFiles: File[],
    prompt: string,
    ratio: AspectRatio,
    variationIndex: number = 0
  ): Promise<string> {
    // Instanciar por chamada para garantir chave atualizada conforme diretrizes
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const parts = [];
    for (const file of productFiles) {
      const base64 = await this.fileToBase64(file);
      parts.push({
        inlineData: {
          data: base64,
          mimeType: file.type || 'image/png'
        }
      });
    }

    const sceneDescription = prompt.trim() || "AUTOMATIC_DETECTION";
    
    const fullPrompt = `
      Professional agency-level commercial photography. 
      Create a high-end marketing visual for the product shown in the images.
      
      SCENE CONTEXT:
      ${sceneDescription === "AUTOMATIC_DETECTION" 
        ? "Identify the product provided. If it's a lamp (luminária), place it in a cozy, high-end living room or bedroom with warm lighting. If it's a solar panel (painel solar), place it on a modern sunny rooftop. For any other product, create a luxurious and fitting environment optimized for sales." 
        : `Description: ${sceneDescription}`}
      
      CRITICAL INSTRUCTIONS FOR TEXT OVERLAYS:
      If the user specifies any text in their description (e.g., in quotes like 'OFERTA'), include that EXACT text with professional typography.
      
      VARIATION REQUIREMENT:
      Variation #${variationIndex + 1}. Unique composition.
      
      Style: Sharp focus, professional studio lighting, realistic textures, high dynamic range.
      Aspect Ratio required: ${ratio}.
    `;

    parts.push({ text: fullPrompt });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: ratio as any
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error('No image was generated');
  }

  async integrateProduct(
    ambientFile: File,
    productFiles: File[]
  ): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const parts = [];
    const ambientBase64 = await this.fileToBase64(ambientFile);
    parts.push({
      inlineData: {
        data: ambientBase64,
        mimeType: ambientFile.type
      }
    });

    for (const file of productFiles) {
      const base64 = await this.fileToBase64(file);
      parts.push({
        inlineData: {
          data: base64,
          mimeType: file.type
        }
      });
    }

    const fullPrompt = `
      You are a professional product visualizer. 
      I have provided an environment image (the first one) and a product image.
      Your task is to SEAMLESSLY INTEGRATE the product into that environment.
      
      REQUIREMENTS:
      1. Scale the product realistically for the room/scene.
      match lighting, reflections and shadows.
    `;

    parts.push({ text: fullPrompt });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error('Integration failed');
  }

  async editImage(
    sourceImage: File | string,
    editPrompt: string
  ): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let base64Data = '';
    let mimeType = 'image/png';

    if (sourceImage instanceof File) {
      base64Data = await this.fileToBase64(sourceImage);
      mimeType = sourceImage.type;
    } else {
      base64Data = sourceImage.split(',')[1];
      mimeType = sourceImage.split(',')[0].split(':')[1].split(';')[0];
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: `Edit instruction: ${editPrompt}. Maintain realism.`,
          },
        ],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error('Editing failed');
  }

  async generateAdCopy(prompt: string, platform: string): Promise<{ caption: string, voiceover: string }> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Atue como redator sênior. Crie kit marketing para ${platform}: "${prompt || "o produto"}".
        OBRIGATÓRIO: PT-BR, Site www.rotheo.com.br, WhatsApp +55 11 91301-9900.
        Retorne JSON: { "caption": "...", "voiceover": "..." }
      `,
      config: {
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            caption: { type: Type.STRING },
            voiceover: { type: Type.STRING }
          },
          required: ["caption", "voiceover"]
        }
      }
    });

    try {
      // Corrected usage of .text property (not a method)
      const content = response.text || '{}';
      return JSON.parse(content);
    } catch {
      return { caption: response.text || '', voiceover: 'Script não gerado.' };
    }
  }

  async generateAudio(text: string, voiceName: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("Audio generation failed");

    const pcmData = this.decodeBase64(base64Audio);
    const wavData = this.createWavHeader(pcmData, 24000);
    const blob = new Blob([wavData], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  }
}
