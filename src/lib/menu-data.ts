export type MenuItem = {
  name: string;
  description?: string;
  price: string;
  addOns?: { label: string; price: string }[];
};

export type MenuSubgroup = {
  title?: string;
  note?: string;
  items: MenuItem[];
};

export type MenuCategory = {
  slug: string;
  title: string;
  subtitle?: string;
  groups: MenuSubgroup[];
};

export const menuCategories: MenuCategory[] = [
  {
    slug: "coffee",
    title: "Coffee & Milk",
    groups: [
      {
        title: "Coffee",
        items: [
          { name: "Espresso", price: "2,50 €" },
          { name: "Americano", price: "3,00 € / 4,00 €" },
          { name: "Cappuccino", price: "3,50 € / 5,00 €" },
          { name: "Latte Macchiato", price: "4,00 €" },
          { name: "Milchkaffee", price: "4,00 €" },
          { name: "Flat White", price: "4,50 €" },
          { name: "Pumpkin Spice Latte", price: "5,00 €" },
          { name: "Lotus Latte", price: "5,50 €" },
        ],
      },
      {
        title: "Iced",
        items: [
          { name: "Cold Brew", price: "4,00 €" },
          { name: "Iced Latte", price: "4,00 €" },
          { name: "Iced Matcha Latte", price: "5,00 €" },
          { name: "Iced Mango / Strawberry Matcha Latte", price: "6,00 €" },
          { name: "Espresso Tonic", price: "5,00 €" },
          { name: "Iced Chai Latte", price: "4,00 €" },
        ],
      },
      {
        title: "Milk",
        items: [
          { name: "Kakao", price: "3,50 €" },
          { name: "Chai Latte", price: "4,00 €" },
          { name: "Golden Milk", description: "Ingwer – Kurkuma – Zimt – Pfeffer", price: "4,00 €" },
          { name: "Pink Latte", description: "Rote Beete", price: "4,00 €" },
          { name: "Matcha Latte", price: "5,00 €" },
        ],
      },
      {
        title: "Milchalternativen & Sirup",
        items: [
          { name: "Soja / Hafer", price: "+ 0,50 €" },
          { name: "Kokos", price: "+ 1,00 €" },
          { name: "Vanille / Karamell / Vanille Zero", price: "+ 1,00 €" },
        ],
      },
    ],
  },
  {
    slug: "tee",
    title: "Tee",
    groups: [
      {
        items: [
          { name: "Schwarz", price: "3,50 €" },
          { name: "Grün", price: "3,50 €" },
          { name: "Kräuter", price: "3,50 €" },
          { name: "Früchte", price: "3,50 €" },
          { name: "Ingwer", price: "3,50 €" },
          { name: "Frische Minze", price: "3,50 €" },
          { name: "Frische Minze Ingwer", price: "4,50 €" },
          { name: "Orange Ingwer", description: "mit frischem O-Saft", price: "5,00 €" },
        ],
      },
    ],
  },
  {
    slug: "smoothies",
    title: "Smoothies",
    groups: [
      {
        items: [
          { name: "Green", description: "Spinat – Apfel – Ananas – Ingwer", price: "6,00 €" },
          { name: "Purple", description: "Beerenmix – Banane", price: "6,00 €" },
          { name: "Yellow", description: "Mango – Banane – Maracuja – Kurkuma", price: "6,00 €" },
          {
            name: "Moonlight",
            description: "Avocado – Banane – Mango – Sojajoghurt – Sojadrink – Spirulina – Kollagen",
            price: "8,50 €",
          },
          {
            name: "Monkey Power",
            description: "Banane – veganes Proteinpulver (Schoko) – Datteln – Zimt – Erdnussbutter – Sojajoghurt – Sojadrink",
            price: "8,50 €",
          },
          {
            name: "Magic Dragon",
            description: "Drachenfrucht – Ananas – Banane – Kokosdrink – Sojajoghurt – Acerola",
            price: "8,50 €",
          },
        ],
      },
    ],
  },
  {
    slug: "drinks",
    title: "Drinks",
    groups: [
      {
        title: "Wasser",
        items: [{ name: "Medium / Still", description: "0,25 l", price: "2,50 €" }],
      },
      {
        title: "Säfte / Schorlen",
        items: [
          { name: "Apfel naturtrüb", price: "3,50 € / 5,50 €" },
          { name: "Maracuja", price: "3,50 € / 5,50 €" },
          { name: "Johannisbeere", price: "3,50 € / 5,50 €" },
          { name: "Schorle", price: "3,00 € / 4,50 €" },
          { name: "Frisch gepresster O-Saft", price: "5,00 €" },
        ],
      },
      {
        title: "Hausgemachte Limo's",
        note: "0,4 l",
        items: [
          { name: "DOA Limo (Zitrone)", price: "5,00 €" },
          { name: "DOA Limo Zero", price: "5,00 €" },
          { name: "Lemon Soda", description: "ohne Zucker", price: "4,00 €" },
          { name: "Holunder – Minze", price: "5,50 €" },
          { name: "Lavendel – Butterfly Pea", price: "5,50 €" },
          { name: "Hibiskus – Himbeere", price: "5,50 €" },
          { name: "Gurke – Zitrone", price: "6,00 €" },
          { name: "Orange – Ingwer", price: "6,50 €" },
        ],
      },
      {
        title: "Prosecco & Co",
        items: [
          { name: "Corona 0,33 l", price: "4,00 €" },
          { name: "Corona Zero 0,33 l (alkoholfrei)", price: "4,00 €" },
          { name: "Franziskaner Weissbier 0,5 l", price: "5,00 €" },
          { name: "Franziskaner Weissbier 0,5 l (alkoholfrei)", price: "5,00 €" },
          { name: "Prosecco", price: "5,00 €" },
          { name: "Aperol Spritz", price: "7,50 €" },
          { name: "Hibiskus-Himbeer Spritz", price: "7,50 €" },
          { name: "Sarti Spritz", price: "7,50 €" },
        ],
      },
    ],
  },
  {
    slug: "sweet-bowls",
    title: "Sweet Bowls",
    groups: [
      {
        items: [
          {
            name: "Granola Fruit",
            description: "Granola – frische Früchte – Naturjoghurt",
            price: "9,00 €",
          },
          {
            name: "Granola Lotus",
            description: "Granola – Blaubeeren – Banane – Lotus-Creme – Naturjoghurt",
            price: "9,00 €",
          },
          {
            name: "Mini Granola Fruit",
            description: "Granola – frische Früchte – Naturjoghurt",
            price: "4,00 €",
          },
          {
            name: "Mini Granola Lotus",
            description: "Granola – Blaubeeren – Banane – Lotus-Creme – Naturjoghurt",
            price: "4,00 €",
          },
          { name: "Acai Classic", description: "Granola – frische Früchte – Erdnussbutter", price: "10,50 €" },
          { name: "Acai Lotus", description: "Granola – Erdbeere – Banane – Lotus-Creme", price: "10,50 €" },
          { name: "Mango Sticky Rice", description: "Klebreis mit cremiger Kokosmilch – Mango", price: "6,50 €" },
        ],
      },
    ],
  },
  {
    slug: "breads",
    title: "Breads",
    groups: [
      {
        items: [
          { name: "Pincado", description: "Pink Hummus – Avocado – Schwarzkümmel – Sesam", price: "7,50 €" },
          { name: "Avocado Bread", description: "Avocado – Granatapfel – Sesam", price: "7,50 €" },
          { name: "Moztom", description: "Tomate – Avocado – Burrata – Pesto – Pistazie", price: "11,00 €" },
          {
            name: "Goat",
            description: "Ziegenkäse – Dattel Currycreme – Knoblauch – Birne – Walnuss",
            price: "10,50 €",
          },
        ],
      },
    ],
  },
  {
    slug: "poached-egg",
    title: "Poached Egg",
    subtitle: "Zwei pochierte Eier auf Brot",
    groups: [
      {
        items: [
          { name: "Pinkschado", description: "Pink Hummus – Avocado – Weichkäse", price: "10,00 €" },
          { name: "Salmocado", description: "Lachs – Avocado – Sauce Hollandaise", price: "11,00 €" },
          { name: "Tuffo", description: "Bresaola – Trüffelcreme – Rucola – Parmesan", price: "12,50 €" },
          { name: "Chili Billy", description: "Knoblauch Joghurt – Chilibutter – Rucola – Parmesan", price: "9,50 €" },
        ],
      },
    ],
  },
  {
    slug: "bowls",
    title: "Bowls",
    subtitle: "Küche täglich bis 18:00 Uhr",
    groups: [
      {
        items: [
          {
            name: "Vegan (kalt)",
            description:
              "Bulgur – Salat – Mango – Avocado – Pink Hummus – Kichererbsen – Minze – Mangodressing – Granatapfelsirup",
            price: "11,00 €",
            addOns: [
              { label: "Weichkäse", price: "+ 1,50 €" },
              { label: "Burrata", price: "+ 4,50 €" },
            ],
          },
          {
            name: "Chicken Curry (warm)",
            description: "Reis – Hähnchen – Rotes Curry – Kokosmilch – Möhre – Frühlingszwiebel – Koriander – Minze – Mango",
            price: "12,50 €",
          },
          {
            name: "Yoshi (kalt)",
            description: "Glasnudeln – Shrimps – Wakame – Gurke – Möhre – Frühlingszwiebel – Koriander – Avocado – Erdnuss Mayo – Sweet Chili Sauce",
            price: "12,50 €",
          },
          {
            name: "Istanbowl (warm)",
            description: "Reis – Rinderhackfleisch – Tomate – Gurke – Tzatziki – Weichkäse",
            price: "12,50 €",
          },
        ],
      },
    ],
  },
];

export const glutenfreiesBrotHinweis = "Glutenfreies Brot auf Anfrage (+ 1,00 €)";
