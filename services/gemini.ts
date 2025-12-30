
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AspectRatio } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

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

    const response = await this.ai.models.generateContent({
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
    const parts = [];
    
    // Add ambient image
    const ambientBase64 = await this.fileToBase64(ambientFile);
    parts.push({
      inlineData: {
        data: ambientBase64,
        mimeType: ambientFile.type
      }
    });

    // Add product images
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
      2. Match the lighting, reflections, and shadows of the environment onto the product.
      3. Place it in a logical position (e.g., if it's a lamp, place it on a table or hanging).
      4. DO NOT change the environment significantly, just add the product as if it were really there.
      5. Final result must look like a real, professional photograph.
    `;

    parts.push({ text: fullPrompt });

    const response = await this.ai.models.generateContent({
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
    let base64Data = '';
    let mimeType = 'image/png';

    if (sourceImage instanceof File) {
      base64Data = await this.fileToBase64(sourceImage);
      mimeType = sourceImage.type;
    } else {
      base64Data = sourceImage.split(',')[1];
      mimeType = sourceImage.split(',')[0].split(':')[1].split(';')[0];
    }

    const response = await this.ai.models.generateContent({
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
            text: `
              Edit this image based on the following instruction: ${editPrompt}. 
              
              CRITICAL INSTRUCTIONS FOR TEXT:
              If the instruction asks to add or change text, use the EXACT words provided in the prompt. Do not translate or modify them.
              
              Maintain agency-level realism, sharpness, and professional lighting integration.
            `,
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
    const textModel = this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Atue como um redator sênior e especialista em SEO de alta performance.
        Crie um kit de marketing para um anúncio no ${platform} baseado nesta descrição ou produto: "${prompt || "o produto enviado"}".
        
        REGRAS OBRIGATÓRIAS:
        - Use EXCLUSIVAMENTE Português do Brasil (PT-BR).
        - No texto do anúncio, inclua OBRIGATORIAMENTE o site: www.rotheo.com.br
        - No texto do anúncio, inclua OBRIGATORIAMENTE o WhatsApp: +55 11 91301-9900
        
        ESTRUTURA DO CONTEÚDO (JSON esperado):
        Retorne um JSON com os seguintes campos:
        "caption": Texto persuasivo para redes sociais.
        "voiceover": Script formatado para locução no Eleven Labs.
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

    const res = await textModel;
    try {
      return JSON.parse(res.text || '{}');
    } catch {
      return { caption: res.text || '', voiceover: 'Script não gerado corretamente.' };
    }
  }

  async generateAudio(text: string, voiceName: string): Promise<string> {
    const response = await this.ai.models.generateContent({
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
