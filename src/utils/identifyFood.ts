export function identifyFood(query: string) {
  const foodMap = {
    // Fast Food Chains
    "McDonald": "Beef burger",
    "McDonalds": "Beef burger",
    "McDonald's": "Beef burger",
    "KFC": "Fried chicken",
    "Pizza Hut": "Cheese pizza",
    "Domino": "Pepperoni pizza",
    "Domino's": "Pepperoni pizza",
    "Subway": "Chicken teriyaki sandwich",
    "Texas Chicken": "Spicy fried chicken",
    "Marrybrown": "Crispy chicken rice",
    "Burger King": "Whopper beef burger",
    "A&W": "Root beer float",
    "Nandos": "Peri-peri grilled chicken",
    "Nando's": "Peri-peri grilled chicken",
    "TGIF": "Jack Daniel's glazed ribs",
    "TGI Fridays": "Jack Daniel's glazed ribs",
    "Chili's": "Fajitas",
    "Seoul Garden": "Korean BBQ & hotpot",
    "Sukiya": "Gyudon (beef bowl)",
    "Tony Roma's": "BBQ ribs",
    "Tea Live": "Bubble tea",

    // Coffee & Tea
    "Dome Café": "Coffee beans & breakfast platters",
    "Starbucks": "Arabica coffee beans",
    "The Coffee Bean & Tea Leaf": "Espresso coffee beans",
    "San Francisco Coffee": "Latte with Arabica beans",
    "Secret Recipe": "Cheesecake",
    "Lavender": "Artisan bread & pastries",

    // Bubble Tea & Juices
    "Tealive": "Bubble tea",
    "Gong Cha": "Earl Grey milk tea",
    "Chatime": "Matcha pearl milk tea",
    "Juice Works": "Mango smoothie",
    "Boost Juice": "Berry Crush smoothie",

    // Malaysian Favorites
    "PappaRich": "Nasi lemak with ayam rendang",
    "OldTown White Coffee": "Ipoh white coffee & kaya toast",
    "Kenny Rogers Roasters": "Rotisserie roasted chicken",
    "Mamak Stall": "Roti canai & teh tarik",
    "Banana Leaf Restaurant": "Banana leaf rice with mutton curry",
    "Hawker Stall": "Char kway teow",
    "Nasi Kandar Restaurant": "Nasi kandar with ayam madu",
    "Bak Kut Teh Shop": "Pork ribs herbal soup",
    "Dim Sum Restaurant": "Har gow (shrimp dumplings)",
    "Satay Stall": "Chicken & beef satay",
    "Lok Lok Stall": "Assorted skewers with peanut sauce",
    "Steamboat Restaurant": "Hotpot with sliced lamb & seafood",
    "Briyani House": "Chicken briyani",
    "Western Fusion Café": "Wagyu beef steak",

    // More General Coverage
    "Kopitiam": "Kaya butter toast & kopi o",
    "Café": "Espresso & croissant",
    "Restaurant": "Mixed rice with curry",
    "Fine Dining": "Wagyu steak & foie gras",
    "Food Court": "Chicken rice & fried noodles",
    "Night Market": "Apam balik & grilled squid",
    "Pasar Malam": "Ramly burger & bubble tea",
    "Street Food Stall": "Mee goreng mamak & cendol",
    "Warung": "Nasi campur with sambal belacan",
    "Malay Restaurant": "Rendang & nasi kerabu",
    "Chinese Restaurant": "Sweet and sour pork & fried rice",
    "Indian Restaurant": "Tandoori chicken & naan",
    "Thai Restaurant": "Tom yum & mango sticky rice",
    "Japanese Restaurant": "Salmon sashimi & ramen",
    "Korean Restaurant": "Kimchi stew & Korean BBQ",
    "Western Restaurant": "Grilled chicken chop & mashed potatoes",
    "Vegetarian Café": "Lei cha (thunder tea rice) & tofu dishes",
    "Dessert Shop": "Bingsu & waffles",
    "Bistro": "Grilled lamb chop & pasta",
    "Buffet Restaurant": "BBQ lamb & sushi",
    "Seafood Restaurant": "Chili crab & butter prawns",
    "Steakhouse": "Tomahawk steak & truffle fries",
    "Hotel Coffee House": "High tea set & scones",
    "Bar & Grill": "Beef steak & craft beer",
    "Ice Cream Shop": "Gelato & soft serve",
    "Fusion Restaurant": "Teriyaki chicken pizza & nasi lemak pasta",
    "Ramen Shop": "Tonkotsu ramen & gyoza",
    "Coffee": "coffee beans",
    "pork noodles": "soup noodles",
    "mee": "noodles",
    "bakers": "artisan bread",
  };

  const normalizedQuery = query.toLowerCase();
  for (const [place, food] of Object.entries(foodMap)) {
    if (normalizedQuery.includes(place.toLowerCase())) {
      return food;
    }
  }
  return "coffee beans";
}
