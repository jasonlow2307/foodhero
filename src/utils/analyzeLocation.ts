interface LocationAnalysis {
  mealWeight: string; // heavy/light/medium
  setting: string; // outdoors/indoors/casual/formal
  mealTiming: string[]; // [breakfast, lunch, dinner, supper]
  socialEnergy: string; // high/medium/low
  noiseLevel: string; // high/medium/low
  mainOfferings: string[]; // main types of food/drinks
  priceRange: string; // budget/moderate/expensive
  cuisineType: string; // Malaysian, Chinese, Indian, Western, etc.
}

// Malaysian restaurant name keywords
const restaurantTypeKeywords = {
  mamak: ["mamak", "bistro", "maju", "pelita", "kayu", "nasi kandar"],
  kopitiam: [
    "kopitiam",
    "kopi",
    "coffee shop",
    "café",
    "kedai kopi",
    "old town",
    "toast",
  ],
  hawker: [
    "hawker",
    "food court",
    "medan selera",
    "kompleks",
    "pusat makanan",
    "pasar malam",
    "night market",
    "food street",
  ],
  restaurant: [
    "restaurant",
    "restoran",
    "bistro",
    "café",
    "warung",
    "kedai makan",
  ],
  fastFood: [
    "mcd",
    "mcdonalds",
    "kfc",
    "pizza hut",
    "subway",
    "burger king",
    "a&w",
    "wendy",
    "domino",
    "jollibee",
    "texas chicken",
  ],
  bakery: [
    "bakery",
    "bakeri",
    "roti",
    "bread",
    "cake",
    "pastry",
    "kek",
    "donut",
  ],
  catering: ["catering", "katering", "hidang", "kenduri"],
  buffet: ["buffet", "hidangan", "prasmanan", "self-service"],
  streetFood: [
    "stall",
    "gerai",
    "warung",
    "food truck",
    "van",
    "street food",
    "roadside",
    "tepi jalan",
  ],
  fancyDining: [
    "fine dining",
    "lounge",
    "high-end",
    "exclusive",
    "premium",
    "luxury",
    "5-star",
    "hotel",
  ],
};

// Malaysian cuisine types
const cuisineKeywords = {
  malaysian: ["malaysian", "local", "tempatan", "fusion"],
  malay: [
    "malay",
    "melayu",
    "nasi lemak",
    "rendang",
    "satay",
    "mee rebus",
    "nasi campur",
    "ayam percik",
    "masak lemak",
    "gulai",
    "kerabu",
  ],
  chinese: [
    "chinese",
    "cina",
    "dim sum",
    "char kuey teow",
    "hokkien mee",
    "wantan mee",
    "bak kut teh",
    "yong tau foo",
    "chicken rice",
    "pau",
    "tim sum",
  ],
  indian: [
    "indian",
    "india",
    "mamak",
    "banana leaf",
    "roti canai",
    "chapati",
    "thosai",
    "naan",
    "tandoori",
    "bryani",
    "dosai",
  ],
  peranakan: [
    "nyonya",
    "baba",
    "peranakan",
    "nonya",
    "laksa",
    "asam",
    "belacan",
    "cincalok",
  ],
  western: [
    "western",
    "barat",
    "steak",
    "burger",
    "pizza",
    "pasta",
    "grill",
    "chop",
    "sizzling",
    "lamb",
  ],
  japanese: [
    "japanese",
    "jepun",
    "sushi",
    "sashimi",
    "ramen",
    "udon",
    "don",
    "bento",
    "teppanyaki",
  ],
  korean: [
    "korean",
    "korea",
    "kimchi",
    "bibimbap",
    "bulgogi",
    "gochujang",
    "samgyupsal",
    "tteokbokki",
  ],
  thai: [
    "thai",
    "siam",
    "tomyam",
    "pad thai",
    "green curry",
    "basil",
    "mango sticky rice",
  ],
  vietnamese: ["vietnam", "vietnamese", "pho", "banh mi", "spring roll"],
  middleEastern: [
    "arab",
    "middle eastern",
    "kebab",
    "hummus",
    "shawarma",
    "falafel",
    "mandi",
    "arab",
  ],
  indonesian: [
    "indonesian",
    "indonesia",
    "nasi padang",
    "sate",
    "gado-gado",
    "bakso",
    "mie goreng",
    "rendang",
  ],
};

// Food items for meal weight classification
const mealWeightKeywords = {
  heavy: [
    // Rice-based heavy meals
    "nasi lemak",
    "nasi goreng",
    "nasi kandar",
    "nasi padang",
    "nasi campur",
    "nasi ayam",
    "nasi biryani",
    "nasi mandi",
    // Noodle heavy dishes
    "mee goreng",
    "char kuey teow",
    "hokkien mee",
    "curry mee",
    "wantan mee",
    "pan mee",
    "laksa",
    "mee rebus",
    "loh mee",
    // Meat-heavy dishes
    "rendang",
    "ayam goreng",
    "ayam percik",
    "mutton",
    "lamb",
    "steak",
    "burger",
    "ribs",
    "kambing",
    // Rich and filling dishes
    "curry",
    "masak lemak",
    "gulai",
    "sambal",
    "murtabak",
    "bryani",
    "claypot",
    "hotpot",
    // Western heavy
    "pizza",
    "pasta",
    "burger",
    "steak",
    "chop",
    "fried chicken",
    "bbq",
    "barbeque",
  ],
  medium: [
    // Medium protein dishes
    "satay",
    "tandoori",
    "grilled",
    "panggang",
    "bakar",
    "soup",
    "chicken rice",
    "asam pedas",
    // Balanced meals
    "mixed rice",
    "economy rice",
    "chap fan",
    "nasi campur",
    "thali",
    "set meal",
    "combo meal",
    // Medium noodles
    "mee soup",
    "kuey teow soup",
    "yee mee",
    "bihun soup",
    "maggi",
    "mee hoon",
    // Sandwiches
    "sandwich",
    "roti john",
    "toast",
    "subway",
    "wrap",
  ],
  light: [
    // Breakfast/light items
    "roti canai",
    "roti",
    "thosai",
    "chapati",
    "naan",
    "dim sum",
    "pau",
    "bao",
    "congee",
    "porridge",
    "bubur",
    // Snacks
    "kuih",
    "apam",
    "cucur",
    "rojak",
    "popiah",
    "keropok",
    "fritter",
    "vadai",
    "pisang goreng",
    "cekodok",
    // Salads/light dishes
    "salad",
    "kerabu",
    "ulam",
    "gado-gado",
    "yong tau foo",
    "sushi",
    // Desserts/drinks when primary
    "cendol",
    "ice kacang",
    "ais kacang",
    "dessert",
    "kek",
    "cake",
    "pastry",
    "tea",
    "coffee",
    "boba",
    "teh tarik",
  ],
};

// Dining settings
const settingKeywords = {
  formal: [
    "fine dining",
    "luxury",
    "high-end",
    "elegant",
    "exclusive",
    "premium",
    "5-star",
    "hotel restaurant",
    "resort",
  ],
  casual: [
    "casual",
    "restoran",
    "restaurant",
    "bistro",
    "café",
    "cafeteria",
    "coffeeshop",
    "family",
    "franchise",
    "chain",
    "kedai makan",
    "warung",
    "shop",
  ],
  indoor: [
    "indoor",
    "air-cond",
    "air-conditioned",
    "shopping mall",
    "plaza",
    "centre",
    "center",
    "kompleks",
    "restaurant",
    "restoran",
    "café",
    "cafeteria",
    "hotel",
    "indoors",
  ],
  outdoor: [
    "outdoor",
    "alfresco",
    "garden",
    "street",
    "roadside",
    "tepi jalan",
    "tent",
    "open-air",
    "food court",
    "hawker",
    "pasar malam",
    "night market",
    "stall",
    "gerai",
    "food truck",
    "van",
    "garden",
    "park",
  ],
};

// Meal timing
const mealTimingKeywords = {
  breakfast: [
    // Common breakfast places
    "breakfast",
    "morning",
    "pagi",
    "sarapan",
    "brunch",
    // Breakfast foods
    "roti canai",
    "nasi lemak",
    "dim sum",
    "kopitiam",
    "kopi",
    "toast",
    "half-boiled egg",
    "telur separuh masak",
    "coffee shop",
    "kedai kopi",
    "teh tarik",
    "mee soup",
    "porridge",
    "congee",
    "bubur",
    "pau",
    "bao",
    "thosai",
    "chapati",
    "tea",
    "bakery",
    "bakeri",
    "muffin",
    "donut",
    "sandwich",
    "nasi dagang",
  ],
  lunch: [
    "lunch",
    "tengahari",
    "makan tengahari",
    "afternoon",
    // Common lunch options
    "set lunch",
    "business lunch",
    "express lunch",
    "economy rice",
    "chap fan",
    "nasi campur",
    "mixed rice",
    "nasi kandar",
    "chicken rice",
    "thali",
    "combo meal",
    "value meal",
  ],
  dinner: [
    "dinner",
    "evening",
    "petang",
    "malam",
    "supper",
    "makan malam",
    // Common dinner options
    "bbq",
    "steamboat",
    "hotpot",
    "grill",
    "seafood",
    "premium",
    "steak",
    "fine dining",
    "buffet",
    "package",
    "set dinner",
    "special",
    "family",
    "feast",
  ],
  supper: [
    "supper",
    "late night",
    "24 hour",
    "24-hour",
    "24/7",
    "mamak",
    "midnight",
    "lepak",
    "maggi goreng",
    "roti",
    "mee goreng",
    "teh tarik",
  ],
};

// Social energy
const socialEnergyKeywords = {
  high: [
    "bar",
    "pub",
    "club",
    "bistro",
    "karaoke",
    "ktv",
    "live music",
    "entertainment",
    "family restaurant",
    "buffet",
    "gathering",
    "celebration",
    "party",
    "festive",
    "popular",
    "trendy",
    "hotspot",
    "hangout",
    "mamak",
    "lepak",
    "crowd",
    "busy",
    "hawker center",
    "food court",
    "night market",
    "pasar malam",
  ],
  medium: [
    "restaurant",
    "café",
    "coffee shop",
    "kopitiam",
    "casual dining",
    "chain restaurant",
    "family friendly",
    "dine-in",
    "kedai makan",
    "restoran",
    "warung",
    "bistro",
    "booth",
    "cozy",
    "meetup",
  ],
  low: [
    "quiet",
    "intimate",
    "private",
    "exclusive",
    "peace",
    "calm",
    "relaxing",
    "study",
    "work",
    "tea house",
    "bakery",
    "drive-thru",
    "take-away",
    "delivery",
    "grab",
    "foodpanda",
    "self-service",
  ],
};

// Noise level
const noiseLevelKeywords = {
  high: [
    "bar",
    "pub",
    "club",
    "live music",
    "karaoke",
    "ktv",
    "entertainment",
    "hawker",
    "food court",
    "night market",
    "pasar malam",
    "crowded",
    "busy",
    "popular",
    "bustling",
    "loud",
    "night life",
    "family restaurant",
    "mamak",
    "open kitchen",
  ],
  medium: [
    "restaurant",
    "café",
    "coffee shop",
    "kopitiam",
    "casual dining",
    "chain restaurant",
    "shopping mall",
    "plaza",
    "food hall",
    "cafeteria",
    "bistro",
    "moderately busy",
  ],
  low: [
    "quiet",
    "intimate",
    "private",
    "exclusive",
    "peace",
    "calm",
    "relaxing",
    "study",
    "work",
    "tea house",
    "fine dining",
    "high-end",
    "library",
    "book café",
    "boutique",
  ],
};

// Price ranges
const priceRangeKeywords = {
  budget: [
    "economy",
    "cheap",
    "affordable",
    "value",
    "budget",
    "student",
    "kedai",
    "warung",
    "stall",
    "gerai",
    "hawker",
    "food court",
    "pasar malam",
    "night market",
    "roadside",
    "street food",
    "mamak",
    "express",
    "kopitiam",
    "coffee shop",
    "canteen",
    "cafeteria",
    "fast food",
    "value meal",
  ],
  moderate: [
    "restaurant",
    "restoran",
    "bistro",
    "café",
    "casual dining",
    "chain restaurant",
    "family restaurant",
    "shopping mall",
    "franchise",
    "standard",
    "regular",
    "average",
    "moderate",
    "mid-range",
  ],
  expensive: [
    "fine dining",
    "luxury",
    "premium",
    "exclusive",
    "high-end",
    "5-star",
    "hotel",
    "resort",
    "signature",
    "speciality",
    "award-winning",
    "michelin",
    "gourmet",
    "upscale",
    "fancy",
    "executive",
    "lounge",
    "fusion",
    "international",
    "imported",
  ],
};

const foodCategoryKeywords = {
  rice: [
    "nasi",
    "rice",
    "beras",
    "biryani",
    "bryani",
    "pulao",
    "paella",
    "porridge",
    "congee",
    "bubur",
  ],
  noodles: [
    "mee",
    "noodle",
    "kuey teow",
    "koay teow",
    "bihun",
    "mihun",
    "udon",
    "ramen",
    "laksa",
    "spaghetti",
    "pasta",
    "maggi",
    "mee hun",
    "vermicelli",
    "wantan mee",
    "pan mee",
    "mee goreng",
  ],
  bread: [
    "roti",
    "bread",
    "toast",
    "sandwich",
    "burger",
    "bun",
    "pau",
    "bao",
    "chapati",
    "naan",
    "pizza",
  ],
  seafood: [
    "fish",
    "ikan",
    "seafood",
    "prawn",
    "udang",
    "crab",
    "ketam",
    "squid",
    "sotong",
    "shellfish",
    "oyster",
    "mussel",
    "clam",
  ],
  meat: [
    "chicken",
    "ayam",
    "beef",
    "daging",
    "lamb",
    "mutton",
    "kambing",
    "pork",
    "babi",
    "duck",
    "itik",
    "sausage",
    "burger",
    "steak",
    "satay",
    "tandoori",
    "rendang",
  ],
  vegetable: [
    "vegetable",
    "sayur",
    "salad",
    "ulam",
    "kerabu",
    "gado-gado",
    "acar",
    "vegan",
    "vegetarian",
  ],
  dessert: [
    "dessert",
    "pencuci mulut",
    "cake",
    "kek",
    "ice cream",
    "aiskrim",
    "pudding",
    "cendol",
    "kuih",
    "ais kacang",
    "ice kacang",
    "sweet",
    "chocolate",
    "pastry",
    "tart",
    "pie",
  ],
  beverages: [
    "drink",
    "minuman",
    "coffee",
    "kopi",
    "tea",
    "teh",
    "juice",
    "jus",
    "boba",
    "bubble tea",
    "teh tarik",
    "milo",
    "neslo",
    "horlicks",
    "sirap",
    "bandung",
    "iced",
    "cold",
  ],
  snacks: [
    "snack",
    "keropok",
    "crackers",
    "chips",
    "crisps",
    "nuts",
    "kacang",
    "goreng pisang",
    "cucur",
    "fritter",
    "kuih",
    "popiah",
    "dim sum",
    "sushi",
    "finger food",
    "satay",
  ],
  spicy: [
    "spicy",
    "pedas",
    "sambal",
    "chili",
    "curry",
    "kari",
    "masala",
    "hot",
    "asam pedas",
    "kimchi",
    "tom yum",
  ],
};

/**
 * Analyze a restaurant name and food items to determine various characteristics
 */
const analyzeLocation = (
  locationName: string,
  foodItems: string[]
): LocationAnalysis => {
  const normalizedLocationName = locationName.toLowerCase();
  const normalizedFoodItems = foodItems.map((item) => item.toLowerCase());
  const allText = [normalizedLocationName, ...normalizedFoodItems].join(" ");

  // Helper function to check if text contains any keyword from a list
  const containsAny = (text: string, keywords: string[]): boolean => {
    return keywords.some((keyword) => text.includes(keyword));
  };

  // Helper function to count matches from a list
  const countMatches = (text: string, keywords: string[]): number => {
    return keywords.filter((keyword) => text.includes(keyword)).length;
  };

  // Helper function to find the highest matching category
  const findHighestMatch = <T extends keyof any>(
    categories: Record<T, string[]>,
    text: string
  ): T => {
    let highestCategory: T | null = null;
    let highestCount = -1;

    for (const [category, keywords] of Object.entries(categories) as [
      T,
      string[]
    ][]) {
      const count = countMatches(text, keywords);
      if (count > highestCount) {
        highestCount = count;
        highestCategory = category;
      }
    }

    return highestCategory as T;
  };

  // Helper function to find all matching categories above a threshold
  const findAllMatches = <T extends keyof any>(
    categories: Record<T, string[]>,
    text: string,
    threshold: number = 1
  ): T[] => {
    const matches: T[] = [];

    for (const [category, keywords] of Object.entries(categories) as [
      T,
      string[]
    ][]) {
      const count = countMatches(text, keywords);
      if (count >= threshold) {
        matches.push(category);
      }
    }

    return matches;
  };

  // Determine the restaurant type
  const restaurantType = findHighestMatch(restaurantTypeKeywords, allText);

  // Determine cuisine type
  const cuisineType = findHighestMatch(cuisineKeywords, allText);

  // Determine meal weight
  let mealWeight = "medium"; // Default
  const heavyScore = countMatches(allText, mealWeightKeywords.heavy);
  const mediumScore = countMatches(allText, mealWeightKeywords.medium);
  const lightScore = countMatches(allText, mealWeightKeywords.light);

  if (heavyScore > mediumScore && heavyScore > lightScore) {
    mealWeight = "heavy";
  } else if (lightScore > heavyScore && lightScore > mediumScore) {
    mealWeight = "light";
  }

  // Determine setting
  let setting = "casual indoor"; // Default
  const formalScore = countMatches(allText, settingKeywords.formal);
  const casualScore = countMatches(allText, settingKeywords.casual);
  const indoorScore = countMatches(allText, settingKeywords.indoor);
  const outdoorScore = countMatches(allText, settingKeywords.outdoor);

  if (formalScore > casualScore) {
    setting = indoorScore >= outdoorScore ? "formal indoor" : "formal outdoor";
  } else {
    setting = indoorScore >= outdoorScore ? "casual indoor" : "casual outdoor";
  }

  // Determine meal timing
  const mealTiming: string[] = [];
  if (countMatches(allText, mealTimingKeywords.breakfast) > 0)
    mealTiming.push("breakfast");
  if (countMatches(allText, mealTimingKeywords.lunch) > 0)
    mealTiming.push("lunch");
  if (countMatches(allText, mealTimingKeywords.dinner) > 0)
    mealTiming.push("dinner");
  if (countMatches(allText, mealTimingKeywords.supper) > 0)
    mealTiming.push("supper");

  // If no specific meal timing is detected, use defaults based on restaurant type
  if (mealTiming.length === 0) {
    if (restaurantType === "bakery" || restaurantType === "kopitiam") {
      mealTiming.push("breakfast", "lunch");
    } else if (restaurantType === "fastFood") {
      mealTiming.push("lunch", "dinner");
    } else if (restaurantType === "mamak") {
      mealTiming.push("breakfast", "lunch", "dinner", "supper");
    } else if (restaurantType === "fancyDining") {
      mealTiming.push("dinner");
    } else {
      mealTiming.push("lunch", "dinner"); // default for most restaurants
    }
  }

  // Determine social energy
  let socialEnergy = "medium"; // Default
  const highEnergyScore = countMatches(allText, socialEnergyKeywords.high);
  const mediumEnergyScore = countMatches(allText, socialEnergyKeywords.medium);
  const lowEnergyScore = countMatches(allText, socialEnergyKeywords.low);

  if (highEnergyScore > mediumEnergyScore && highEnergyScore > lowEnergyScore) {
    socialEnergy = "high";
  } else if (
    lowEnergyScore > highEnergyScore &&
    lowEnergyScore > mediumEnergyScore
  ) {
    socialEnergy = "low";
  }

  // Determine noise level
  let noiseLevel = "medium"; // Default
  const highNoiseScore = countMatches(allText, noiseLevelKeywords.high);
  const mediumNoiseScore = countMatches(allText, noiseLevelKeywords.medium);
  const lowNoiseScore = countMatches(allText, noiseLevelKeywords.low);

  if (highNoiseScore > mediumNoiseScore && highNoiseScore > lowNoiseScore) {
    noiseLevel = "high";
  } else if (
    lowNoiseScore > highNoiseScore &&
    lowNoiseScore > mediumNoiseScore
  ) {
    noiseLevel = "low";
  }

  // Determine price range
  let priceRange = "moderate"; // Default
  const budgetScore = countMatches(allText, priceRangeKeywords.budget);
  const moderateScore = countMatches(allText, priceRangeKeywords.moderate);
  const expensiveScore = countMatches(allText, priceRangeKeywords.expensive);

  if (budgetScore > moderateScore && budgetScore > expensiveScore) {
    priceRange = "budget";
  } else if (expensiveScore > budgetScore && expensiveScore > moderateScore) {
    priceRange = "expensive";
  }

  // Determine main offerings
  let mainOfferings = [...foodItems]; // Start with provided food items

  if (mainOfferings.length < 3) {
    // Analyze the restaurant name for potential food categories
    const detectedCategories = findAllMatches(foodCategoryKeywords, allText);

    // Add cuisine-specific items if they aren't already in the offerings
    if (cuisineType === "malay") {
      if (!mainOfferings.some((item) => item.toLowerCase().includes("nasi"))) {
        mainOfferings.push("Nasi dishes");
      }
      if (
        !mainOfferings.some(
          (item) =>
            item.toLowerCase().includes("rendang") ||
            item.toLowerCase().includes("sambal")
        )
      ) {
        mainOfferings.push("Malay specialties");
      }
    } else if (cuisineType === "chinese") {
      if (
        !mainOfferings.some(
          (item) =>
            item.toLowerCase().includes("rice") ||
            item.toLowerCase().includes("noodle")
        )
      ) {
        mainOfferings.push("Rice and noodle dishes");
      }
    } else if (cuisineType === "indian") {
      if (
        !mainOfferings.some(
          (item) =>
            item.toLowerCase().includes("roti") ||
            item.toLowerCase().includes("thosai")
        )
      ) {
        mainOfferings.push("Roti and bread dishes");
      }
    } else if (cuisineType === "western") {
      if (
        !mainOfferings.some(
          (item) =>
            item.toLowerCase().includes("steak") ||
            item.toLowerCase().includes("burger")
        )
      ) {
        mainOfferings.push("Western mains");
      }
    }

    // Fill in with detected categories if still not enough
    if (mainOfferings.length < 3) {
      for (const category of detectedCategories) {
        const categoryName =
          category.charAt(0).toUpperCase() + category.slice(1);
        if (!mainOfferings.includes(categoryName)) {
          mainOfferings.push(categoryName);
        }
        if (mainOfferings.length >= 3) break;
      }
    }

    // Still not enough? Use restaurant type
    if (mainOfferings.length === 0) {
      if (restaurantType === "kopitiam") {
        mainOfferings = ["Coffee", "Toast", "Local breakfast"];
      } else if (restaurantType === "mamak") {
        mainOfferings = ["Roti canai", "Teh tarik", "Mee goreng"];
      } else if (restaurantType === "bakery") {
        mainOfferings = ["Bread", "Pastries", "Cakes"];
      } else if (restaurantType === "fastFood") {
        mainOfferings = ["Burgers", "Fried chicken", "Value meals"];
      } else {
        mainOfferings = ["Various local dishes"];
      }
    }
  }

  // Format cuisine type
  let formattedCuisineType: string;
  switch (cuisineType) {
    case "malay":
      formattedCuisineType = "Malaysian (Malay)";
      break;
    case "chinese":
      formattedCuisineType = "Malaysian (Chinese)";
      break;
    case "indian":
      formattedCuisineType = "Malaysian (Indian)";
      break;
    case "peranakan":
      formattedCuisineType = "Peranakan/Nyonya";
      break;
    default:
      formattedCuisineType =
        cuisineType.charAt(0).toUpperCase() + cuisineType.slice(1);
  }

  return {
    mealWeight,
    setting,
    mealTiming,
    socialEnergy,
    noiseLevel,
    mainOfferings,
    priceRange,
    cuisineType: formattedCuisineType,
  };
};

export default analyzeLocation;
