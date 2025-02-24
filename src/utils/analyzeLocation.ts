import { HfInference } from "@huggingface/inference";

const hf = new HfInference("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");

interface LocationAnalysis {
  mealWeight: string; // heavy/light
  setting: string; // outdoors/indoors
  mealTiming: string[]; // [breakfast, lunch, dinner]
  socialEnergy: string; // high/medium/low
  noiseLevel: string; // high/medium/low
  mainOfferings: string[]; // main types of food/drinks
}

const analyzeLocation = async (
  locationName: string,
  foodItems: string[]
): Promise<LocationAnalysis> => {
  // Adjusted prompt for GPT-2's style
  const prompt = `Analyze restaurant "${locationName}" serving ${foodItems.join(
    ", "
  )}.
Please provide only:
MW:light
SE:indoor
MT:breakfast/lunch/dinner
SO:medium
NL:medium
MO:${foodItems.join(",")}`;
  console.log(prompt);

  try {
    const response = await hf.textGeneration({
      model: "gpt2-medium",
      inputs: prompt,
      parameters: {
        max_new_tokens: 250,
        temperature: 0.5, // Balanced temperature for GPT-2
        do_sample: true,
        top_k: 30, // Lower for more focused responses
        top_p: 0.85, // Slightly lower for better coherence
        repetition_penalty: 1.2, // Helps prevent repetition
        no_repeat_ngram_size: 2, // Prevents repeating phrases
      },
    });

    console.log("Response from HF:", response);

    const text = response.generated_text;
    const lines = text.split("\n").filter((line) => line.trim().length > 0);

    // Adjust the parsing to match the shorter format
    const analysis: LocationAnalysis = {
      mealWeight:
        lines
          .find((l) => l.startsWith("MW:"))
          ?.split(":")[1]
          ?.trim() || "unknown",
      setting:
        lines
          .find((l) => l.startsWith("SE:"))
          ?.split(":")[1]
          ?.trim() || "unknown",
      mealTiming:
        lines
          .find((l) => l.startsWith("MT:"))
          ?.split(":")[1]
          ?.trim()
          .split("/") || [],
      socialEnergy:
        lines
          .find((l) => l.startsWith("SO:"))
          ?.split(":")[1]
          ?.trim() || "unknown",
      noiseLevel:
        lines
          .find((l) => l.startsWith("NL:"))
          ?.split(":")[1]
          ?.trim() || "unknown",
      mainOfferings:
        lines
          .find((l) => l.startsWith("MO:"))
          ?.split(":")[1]
          ?.trim()
          .split(",")
          .map((item) => item.trim()) || foodItems,
    };

    return analysis;
  } catch (error) {
    console.error("Error analyzing location:", error);
    return {
      mealWeight: "unknown",
      setting: "unknown",
      mealTiming: [],
      socialEnergy: "unknown",
      noiseLevel: "unknown",
      mainOfferings: foodItems,
    };
  }
};

export default analyzeLocation;
