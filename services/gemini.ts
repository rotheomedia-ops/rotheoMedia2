
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AspectRatio } from "../types";

export class GeminiService {
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

  // Refined getClient to use process.env.API_KEY directly as per guidelines
  private getClient() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async generateAdImage(
    productFiles: File[],
    prompt: string,
    ratio: AspectRatio,
    variationIndex: number = 0
  ): Promise<string> {
    const ai = this.getClient();
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

    const fullPrompt = `
      Fotografia comercial de alto padrão.
      Crie um anúncio luxuoso para o produto nas imagens.
      CONTEXTO: ${prompt || "Ambiente moderno e profissional."}
      ESTILO: Foco nítido, iluminação de estúdio, HDR, 8k.
      Variação #${variationIndex + 1}.
      Proporção: ${ratio}.
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
    throw new Error('Nenhuma imagem gerada');
  }

  async integrateProduct(ambientFile: File, productFiles: File[]): Promise<string> {
    const ai = this.getClient();
    const parts = [];
    const ambientBase64 = await this.fileToBase64(ambientFile);
    parts.push({ inlineData: { data: ambientBase64, mimeType: ambientFile.type } });

    for (const file of productFiles) {
      const base64 = await this.fileToBase64(file);
      parts.push({ inlineData: { data: base64, mimeType: file.type } });
    }

    parts.push({ text: "Integre o produto no ambiente real de forma perfeita, mantendo luz e sombras." });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error('Falha na integração');
  }

  async editImage(sourceImage: File | string, editPrompt: string): Promise<string> {
    const ai = this.getClient();
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
          { inlineData: { data: base64Data, mimeType } },
          { text: `Edite a imagem: ${editPrompt}` },
        ],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error('Falha na edição');
  }

  async generateAdCopy(prompt: string, platform: string): Promise<{ caption: string, voiceover: string }> {
    const ai = this.getClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Crie kit marketing para ${platform}: "${prompt || "produto técnico"}".
        OBRIGATÓRIO: PT-BR, incluir site www.rotheo.com.br e WhatsApp +55 11 91301-9900.
        Retorne JSON: { "caption": "texto post", "voiceover": "texto locutor" }
      `,
      config: {
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
      // Accessing response.text directly as it is a property
      return JSON.parse(response.text || '{}');
    } catch {
      return { caption: response.text || '', voiceover: 'Erro ao gerar script.' };
    }
  }

  async generateAudio(text: string, voiceName: string): Promise<string> {
    const ai = this.getClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName } },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("Falha no áudio");

    const pcmData = this.decodeBase64(base64Audio);
    const wavData = this.createWavHeader(pcmData, 24000);
    const blob = new Blob([wavData], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  }
}
