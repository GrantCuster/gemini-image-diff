import { createUserContent, Modality } from "@google/genai";
import { ai } from "./App";

export async function generateImage({
  prompt,
  dataUrl,
}: {
  prompt: string;
  dataUrl: string;
}) {
  const response = await ai!.models.generateContent({
    model: "gemini-2.5-flash-image-preview",
    contents: createUserContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/png",
          data: dataUrl.split(",")[1], // Extract base64 part
        },
      },
    ]),
    config: { responseModalities: [Modality.TEXT, Modality.IMAGE] },
  });

  const firstCandidateContent = response.candidates?.[0].content;
  const inlineData = firstCandidateContent?.parts?.filter(
    (part) => part.inlineData,
  )[0];
  if (inlineData && inlineData.inlineData) {
    const { mimeType, data } = inlineData.inlineData;
    const imageSrc = `data:${mimeType};base64,${data}`;
    return imageSrc;
  } else {
    console.error("No image data found in the response.");
  }
}
