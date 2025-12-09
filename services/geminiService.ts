
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { StoryParams, GeneratedStory, Character } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

/**
 * Generates the text story using Gemini 2.5 Flash
 */
export const generateStoryText = async (params: StoryParams): Promise<GeneratedStory> => {
  const languagePrompt = params.language === 'id' ? 'Bahasa Indonesia' : 'English';
  
  // Construct a richer prompt with the new fields
  let contextPrompt = "";
  if (params.mainTitle) contextPrompt += `Main Story Title: "${params.mainTitle}".\n`;
  if (params.chapterNumber) contextPrompt += `Chapter Number: ${params.chapterNumber}.\n`;
  if (params.chapterTitle) contextPrompt += `Chapter Title: "${params.chapterTitle}".\n`;

  // Format characters list with their specific locations
  const charactersDescription = params.characters.length > 0 
    ? params.characters.map(c => 
        `- Name: ${c.name} (${c.gender}, ${c.age} y.o)
           Role: ${c.role}
           Traits: ${c.description}
           
           LOCATION DETAILS for ${c.name}:
           - Environment: ${c.settingEnvironment || 'Unknown'}
           - Env. Description: ${c.settingAtmosphere || 'N/A'}
           - Specific Location: ${c.settingLocation || 'Default/Anywhere'}
           - Loc. Description: ${c.settingVisuals || 'N/A'}`
      ).join('\n\n')
    : "No specific characters provided.";

  // Join genres if multiple are selected
  const genreString = params.genre.join(', ');

  // Add Parallel Scene Context if available
  let parallelScenePrompt = "";
  if (params.parallelScene && params.parallelScene.trim() !== "") {
    parallelScenePrompt = `
    MEANWHILE / PARALLEL EVENTS:
    While the main character's story is unfolding, the following is happening elsewhere:
    "${params.parallelScene}"
    INSTRUCTION: You MUST weave this parallel event into the story. You can use a scene break (e.g., "Sementara itu di tempat lain..."), a flashback, or a shifting perspective to show this.
    `;
  }

  const prompt = `
    Create a short story chapter (approx 300-500 words).
    Language: ${languagePrompt}.
    
    Context:
    ${contextPrompt}
    
    Characters & Their Settings:
    ${charactersDescription}
    
    ${parallelScenePrompt}
    
    Story Details:
    Genre: ${genreString}.
    Theme/Topic: ${params.theme}.
    
    Instructions:
    1. STRICTLY use the provided "Environment" and "Specific Location" for each character to set the scene. 
    2. Incorporate the "Env. Description" and "Loc. Description" to make the setting vivid.
    3. If characters are in different locations, you can cut between scenes or have them meet.
    4. Ensure the tone matches the Genre.
    5. The story must flow naturally between the main characters and the parallel events (if any).
    
    Return the result strictly as JSON.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "The creative title of this specific chapter/story" },
          content: { type: Type.STRING, description: "The full body of the story" },
          moral: { type: Type.STRING, description: "A short moral lesson from the story" }
        },
        required: ["title", "content", "moral"]
      }
    }
  });

  if (!response.text) {
    throw new Error("No text generated");
  }

  return JSON.parse(response.text) as GeneratedStory;
};

/**
 * Generates an illustration using Gemini 2.5 Flash Image
 */
export const generateStoryImage = async (story: GeneratedStory, params: StoryParams): Promise<string | null> => {
  const genreString = params.genre.join(', ');
  
  // Use the first character's setting as the primary visual context
  const primaryChar = params.characters[0];
  let settingVisuals = 'Fantasy world';
  
  if (primaryChar) {
    settingVisuals = `
      Environment: ${primaryChar.settingEnvironment}. 
      Atmosphere: ${primaryChar.settingAtmosphere}. 
      Location: ${primaryChar.settingLocation}. 
      Visual Details: ${primaryChar.settingVisuals}
    `;
  }

  const prompt = `
    A colorful, digital art style illustration.
    Scene: ${story.title}. 
    Setting/Background: ${settingVisuals}.
    Genre vibe: ${genreString}.
    High quality, vibrant colors, artistic, cinematic lighting.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
    });

    // Iterate through parts to find the inline image data
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
        for (const part of parts) {
            if (part.inlineData && part.inlineData.data) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
    }
    return null;
  } catch (error) {
    console.error("Image generation failed:", error);
    return null; // Return null gracefully if image generation fails (it's optional)
  }
};

/**
 * Generates speech (TTS) using Gemini 2.5 Flash Preview TTS
 * Returns the base64 encoded string of raw PCM data
 */
export const generateStorySpeech = async (text: string, language: 'id' | 'en'): Promise<string | null> => {
  const ttsPrompt = `Read this story with a warm, engaging, storytelling voice: "${text}"`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: ttsPrompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return audioData || null;
  } catch (error) {
    console.error("Speech generation failed:", error);
    return null;
  }
};
