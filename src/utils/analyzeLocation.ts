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

// List of models to try
const MODELS = [
  "gpt2-medium",
  "distilgpt2",
  "EleutherAI/gpt-neo-125M",
  "bigscience/bloom-560m",
];

const analyzeLocation = async (
  locationName: string,
  foodItems: string[]
): Promise<LocationAnalysis> => {
  const prompt = `Restaurant Name: ${locationName}
  Food Offerings: ${foodItems.join(", ")}
  
  Please analyze this restaurant and provide a concise description with the following details:
  - Meal Weight (MW): How substantial are the meals? (light/medium/heavy)
  - Setting (SE): What is the restaurant's atmosphere? (indoor/outdoor/casual/formal)
  - Meal Timing (MT): What meals are served? (breakfast/lunch/dinner/late-night)
  - Social Energy (SO): What's the social vibe? (low/medium/high)
  - Noise Level (NL): How loud is the environment? (quiet/moderate/loud)
  - Main Offerings (MO): Key food items
  
  Use this format strictly:
  MW:[light/medium/heavy]
  SE:[atmosphere type]
  MT:[meal types]
  SO:[social energy level]
  NL:[noise level]
  MO:[main food items]
  
  Example:
  MW:medium
  SE:casual indoor
  MT:lunch/dinner
  SO:high
  NL:moderate
  MO:tacos, burritos, quesadillas`;

  try {
    // Function to try different models
    const tryModels = async (modelIndex = 0): Promise<LocationAnalysis> => {
      if (modelIndex >= MODELS.length) {
        throw new Error("No suitable model found");
      }

      const currentModel = MODELS[modelIndex];

      try {
        const response = await hf.textGeneration({
          model: currentModel,
          inputs: prompt,
          parameters: {
            max_new_tokens: 250,
            temperature: 0.5,
            do_sample: true,
            top_k: 30,
            top_p: 0.85,
            repetition_penalty: 1.2,
            no_repeat_ngram_size: 2,
          },
        });

        console.log(`Model ${currentModel} succeeded`, response);
        console.log(response.generated_text);

        const text = response.generated_text;
        const lines = text.split("\n").filter((line) => line.trim().length > 0);

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
        console.warn(`Model ${currentModel} failed. Trying next model...`);
        return tryModels(modelIndex + 1);
      }
    };

    return await tryModels();
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
