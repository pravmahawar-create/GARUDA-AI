import React, { useState, useMemo, useRef, useEffect } from "react";

// =================================================================
// 👑 GARUDA AAHAR — PERSONAL HEALTH & NUTRITION OPERATING SYSTEM
// =================================================================

// -----------------------------------------------------------------
// 1. 7-DAY DAY-WISE MASTER CULINARY CALENDAR (Somwar to Ravivar)
// -----------------------------------------------------------------
const SEVEN_DAY_MENU = {
  monday: {
    dayName: "Somwar (Monday)",
    themeTitle: "Metabolic Fire & Gut Reset (Agni Deepana)",
    themeDesc: "Weekend ke heavy khane ke baad gut detox, liver activation aur metabolic reset.",
    primaryDosha: "Vata-Kapha Pacifying",
    dailyTarget: { calories: 1580, protein: "78g", fiber: "38g", carbs: "175g", fats: "42g" },
    meals: [
      {
        time: "06:30 AM",
        type: "Detox Nectar",
        name: "Methi-Dana & Ginger Warm Elixir",
        qty: "250 ml",
        calories: 35,
        protein: "1.5g",
        fiber: "2.8g",
        desc: "Raat bhar bhigoi hui methi dana ko adrak ke sath boil karke gunguna chhan kar lein.",
        benefit: "Insulin sensitivity 30% boost karta hai aur pet ki gas aur toxins ko flush karta hai.",
        chefSecret: "Ek chutki dalchini (Ceylon cinnamon) milayein for natural sweet aroma without sugar."
      },
      {
        time: "08:30 AM",
        type: "Breakfast",
        name: "Moong Dal & Crumbled Paneer Stuffed Chilla",
        qty: "2 Crisp Chillas + Dhaniya Chutney",
        calories: 320,
        protein: "21.0g",
        fiber: "7.5g",
        desc: "Pili moong dal ka batter with grated fresh paneer, roasted jeera aur hing tadka.",
        benefit: "Sustained satiety deta hai — dopahar 1 baje tak blood sugar spike ya bhookh nahi lagti.",
        chefSecret: "Batter me 1 tsp adrak-hari mirch paste aur hing peesne se bilkul street style crunch aata hai."
      },
      {
        time: "11:00 AM",
        type: "Mid-Morning",
        name: "Fresh Coconut Water with Soaked Chia & Lime",
        qty: "250 ml",
        calories: 65,
        protein: "1.8g",
        fiber: "4.2g",
        desc: "Taza nariyal paani me 1 tsp bhigoi hui chia seeds aur 5 boond nimbu ras.",
        benefit: "Cellular hydration aur natural electrolytes (Potassium & Magnesium) ka power source.",
        chefSecret: "Chill karke serve karein with fresh crushed mint leaves."
      },
      {
        time: "01:30 PM",
        type: "Grand Ayur-Thali Lunch",
        name: "Palak Moong Dal + Methi Gajar + 2 Jowar Roti + Cumin Chaas",
        qty: "Full Ayurvedic Thali",
        calories: 490,
        protein: "24.5g",
        fiber: "14.2g",
        desc: "Garlic-tempered spinach moong dal, seasonal methi gajar sabzi, garam jowar rotis with 1/2 tsp A2 ghee, aur roasted jeera chaas.",
        benefit: "High iron, low glycemic index aur probiotic bacteria gut flora ko nourish karte hain.",
        chefSecret: "Chaas me kala namak aur bhuna jeera tadka lagayein — khane ke baad heaviness 0 ho jati hai."
      },
      {
        time: "05:00 PM",
        type: "Evening Reviver",
        name: "Roasted Makhana & Turmeric Peanuts with Green Tea",
        qty: "1 Bowl + 1 Cup Tea",
        calories: 160,
        protein: "6.2g",
        fiber: "3.5g",
        desc: "Lightly dry-roasted makhana with haldi, sendha namak, aur tulsi-adrak herbal green infusion.",
        benefit: "Cortisol (stress hormone) reduce karta hai aur evening sweet cravings ko block karta hai.",
        chefSecret: "Dry roast karte waqt last 30 sec me 2 boond mustard oil aur chaat masala toss karein."
      },
      {
        time: "07:30 PM",
        type: "Healing Dinner",
        name: "Lauki-Moong Restorative Stew with Crushed Pepper",
        qty: "350 ml Warm Stew Bowl",
        calories: 240,
        protein: "14.0g",
        fiber: "7.8g",
        desc: "Taza lauki aur pili moong dal ka creamy soup-stew with toasted pumpkin seeds & kali mirch.",
        benefit: "Raat ko liver aur pancreas par 0 digestive load — blood pressure naturally control rehta hai.",
        chefSecret: "Tadke me desi ghee me sirf jeera, hing aur hari mirch lagayein for soothing night aroma."
      },
      {
        time: "09:30 PM",
        type: "Bedtime Ojas Drink",
        name: "Haldi-Jayfal (Nutmeg) Warm Milk",
        qty: "150 ml",
        calories: 90,
        protein: "4.5g",
        fiber: "0.2g",
        desc: "Desi cow A2 milk ya almond milk me lakadong haldi aur ek chutki jayfal powder.",
        benefit: "GABA neurotransmitter stimulate karta hai for deep restorative REM sleep.",
        chefSecret: "Jayfal ko hamesha fresh ghis kar dalein, purana powder potency kho deta hai."
      }
    ]
  },
  tuesday: {
    dayName: "Mangalwar (Tuesday)",
    themeTitle: "High-Protein Cellular Repair (Mamsa Dhatu)",
    themeDesc: "Muscle recovery, tissue repair aur continuous energy bina kisi heaviness ke.",
    primaryDosha: "Pitta-Vata Balancing",
    dailyTarget: { calories: 1620, protein: "86g", fiber: "36g", carbs: "165g", fats: "44g" },
    meals: [
      {
        time: "06:30 AM",
        type: "Detox Nectar",
        name: "Fresh Amla, Mint & Chlorophyll Shot",
        qty: "100 ml",
        calories: 30,
        protein: "0.8g",
        fiber: "2.1g",
        desc: "Taza amla aur pudina patte ko koot kar paani ke sath fresh juice banayein.",
        benefit: "Pure Vitamin C ka mega-dose — collagen synthesis aur immunity booster.",
        chefSecret: "Ek pinch rock salt aur roasted jeera powder mila kar sip karein."
      },
      {
        time: "08:30 AM",
        type: "Breakfast",
        name: "Live Enzyme Protein Sprout Chaat with Anaar & Lemon",
        qty: "1 Large Bowl (200g)",
        calories: 260,
        protein: "16.5g",
        fiber: "11.0g",
        desc: "Sprouted moong & kala chana tossed with diced kheera, anaar, mint, kala namak & lemon.",
        benefit: "Sprouting phytic acid ko khatam karta hai jisse iron aur zinc 200% bio-available ho jate hain.",
        chefSecret: "Roasted alsi (flaxseed) aur roasted chana crush karke top par daalein for extra crunch."
      },
      {
        time: "11:00 AM",
        type: "Mid-Morning",
        name: "Chilled Sattu-Jeera Himalayan Cooler",
        qty: "300 ml",
        calories: 140,
        protein: "9.5g",
        fiber: "5.0g",
        desc: "Bhuna chana sattu whisked with chilled water, roasted jeera, mint, chopped onion & lemon.",
        benefit: "Desi plant protein cooler jo body internal temperature ko drop karke acid balance banata hai.",
        chefSecret: "Pyaaz ko ekdum barik chop karein aur serve karne se theek pehle add karein."
      },
      {
        time: "01:30 PM",
        type: "Grand Ayur-Thali Lunch",
        name: "Soya-Matar Masala + Beetroot Salad + 2 Missi Roti + Hing Curd",
        qty: "Full Protein Feast",
        calories: 520,
        protein: "31.0g",
        fiber: "13.5g",
        desc: "Nutritious soya & green peas simmered in tomato-ginger gravy, crisp beetroot salad, chana-gehu missi roti, aur dahi.",
        benefit: "31g complete amino acid profile bina cholesterol ke — pure muscle nourish hoti hai.",
        chefSecret: "Soya chunks ko 2 baar gungune paani me squeeze karke gravy me pakayein to eliminate soy odor."
      },
      {
        time: "05:00 PM",
        type: "Evening Reviver",
        name: "Steamed Sweet Corn & Black Pepper Chaat with Adrak Chai",
        qty: "1 Small Cup + 1 Cup Chai",
        calories: 170,
        protein: "4.8g",
        fiber: "3.2g",
        desc: "Bhuna ya ubla sweet corn with crushed black pepper, lime juice, aur bina cheeni ki jaggery-infused adrak chai.",
        benefit: "Lutein aur zeaxanthin eye strain ko reduce karte hain, evening energy revive hoti hai.",
        chefSecret: "Corn par 1 drop desi ghee rub karein taaki black pepper evenly coat ho jaye."
      },
      {
        time: "07:30 PM",
        type: "Healing Dinner",
        name: "Tandoori Paneer Tikka Salad with Mint-Curd Dressing",
        qty: "1 Large Salad Platter",
        calories: 310,
        protein: "22.5g",
        fiber: "5.5g",
        desc: "Marinated low-fat paneer cubes with grilled shimla mirch, tamatar & hung curd garlic dressing.",
        benefit: "Slow-digesting casein protein jo raat bhar muscle tissue ko repair karta hai.",
        chefSecret: "Paneer marination me kasuri methi aur mustard oil zaroor dalein authentic tandoori aroma ke liye."
      },
      {
        time: "09:30 PM",
        type: "Bedtime Ojas Drink",
        name: "Warm Saunf & Elaichi Digestive Water",
        qty: "200 ml",
        calories: 15,
        protein: "0.2g",
        fiber: "0.5g",
        desc: "Moti saunf aur hari elaichi ko boil karke halka gunguna strain karein.",
        benefit: "Pitta dosha ko cool karta hai aur agle din subah smooth bowel clearance deta hai.",
        chefSecret: "Boil karte waqt dhak kar rakhein taaki volatile aromatic oils evaporate na hon."
      }
    ]
  },
  wednesday: {
    dayName: "Budhwar (Wednesday)",
    themeTitle: "Cardiovascular & Blood Purity (Hridya Balya)",
    themeDesc: "Arterial flexibility, cholesterol reduction aur pure oxygenated blood flow.",
    primaryDosha: "Tridoshic Harmonizing",
    dailyTarget: { calories: 1540, protein: "72g", fiber: "42g", carbs: "170g", fats: "38g" },
    meals: [
      {
        time: "06:30 AM",
        type: "Detox Nectar",
        name: "Soaked Walnut, Almond & Munakka Water",
        qty: "Infused Water + 4 Almonds, 2 Walnuts, 3 Munakka",
        calories: 95,
        protein: "3.2g",
        fiber: "2.4g",
        desc: "Bhigoe hue dry fruits ka water peel karke chaba kar lein.",
        benefit: "Omega-3 fatty acids bad cholesterol (LDL) ko wash out karne me help karte hain.",
        chefSecret: "Badam ka chhilka zaroor utarein kyunki chhilke me tannin absorption slow karta hai."
      },
      {
        time: "08:30 AM",
        type: "Breakfast",
        name: "Steel-Cut Oats & Vegetable Masala Daliya",
        qty: "1 Big Warm Bowl",
        calories: 280,
        protein: "11.5g",
        fiber: "9.2g",
        desc: "Oats aur dalia cooked with carrots, beans, peas, mustard seeds, curry leaves & roasted peanuts.",
        benefit: "Beta-glucan soluble fiber blood vessels ki cleansing karta hai.",
        chefSecret: "Dalia ko pehle 2 min dry roast karein, nutty flavor 2x ho jayega."
      },
      {
        time: "11:00 AM",
        type: "Mid-Morning",
        name: "Ripe Papaya Bowl with Lime Zest & Sabja Seeds",
        qty: "150g Papaya",
        calories: 75,
        protein: "1.2g",
        fiber: "3.8g",
        desc: "Fresh papaya cubes topped with soaked sweet basil (sabja) seeds aur taza nimbu ras.",
        benefit: "Papain enzyme protein digestion fast karta hai aur bloating khatam karta hai.",
        chefSecret: "Thoda sa black salt aur mint leaves sprinkle karke thanda serve karein."
      },
      {
        time: "01:30 PM",
        type: "Grand Ayur-Thali Lunch",
        name: "Kashmiri Rajma Rasila + Steamed Brown Rice / 2 Bajra Roti + Kachumber",
        qty: "Full Traditional Thali",
        calories: 510,
        protein: "22.0g",
        fiber: "16.0g",
        desc: "Slow-cooked Kashmiri red kidney beans with whole spices, salad aur mint buttermilk.",
        benefit: "High soluble fiber and magnesium blood pressure ko stable rakhte hain.",
        chefSecret: "Rajma me sonth (dry ginger) aur hing ka use karein to eliminate heaviness completely."
      },
      {
        time: "05:00 PM",
        type: "Evening Reviver",
        name: "Roasted Kala Chana with Dry Ginger Spice & Tulsi Tea",
        qty: "1 Handful + 1 Cup Tea",
        calories: 140,
        protein: "7.0g",
        fiber: "4.8g",
        desc: "Chhilke wala bhuna chana tossed with sonth, amchur, sendha namak aur taza tulsi brew.",
        benefit: "Low glycemic satiety snack jo evening energy slump ko instantly reverse karta hai.",
        chefSecret: "Chana hamesha chhilke sahit khayein for highest prebiotic fiber."
      },
      {
        time: "07:30 PM",
        type: "Healing Dinner",
        name: "Drumstick (Moringa) & Tomato Lentil Stew with Paneer",
        qty: "350 ml Healing Bowl",
        calories: 260,
        protein: "17.0g",
        fiber: "6.5g",
        desc: "Fresh moringa pods and tomato broth with yellow lentils and lightly pan-seared paneer cubes.",
        benefit: "Moringa 92 nutrients provide karta hai aur cardiac arterial elasticity ko protect karta hai.",
        chefSecret: "Moringa ko pehle boil karke uska pulp extract karein aur soup me blend karein."
      },
      {
        time: "09:30 PM",
        type: "Bedtime Ojas Drink",
        name: "Chamomile & Cinnamon Golden Infusion",
        qty: "200 ml",
        calories: 10,
        protein: "0.1g",
        fiber: "0.2g",
        desc: "Chamomile flower brew with a small stick of Ceylon cinnamon.",
        benefit: "Heart rate slow karta hai, vascular tension relax karta hai aur deep sleep lata hai.",
        chefSecret: "Brew ko 5 minute steep hone dein, kabhi ubaal kar overheat na karein."
      }
    ]
  },
  thursday: {
    dayName: "Guruwar (Thursday)",
    themeTitle: "Sattvic Gut Microbiome & Mind Clarity (Sattva)",
    themeDesc: "No onion, no garlic pure sattvic gourmet nourishment for mental focus and light spirit.",
    primaryDosha: "Sattva Enhancing, Kapha Reducing",
    dailyTarget: { calories: 1520, protein: "70g", fiber: "40g", carbs: "178g", fats: "36g" },
    meals: [
      {
        time: "06:30 AM",
        type: "Detox Nectar",
        name: "Warm Lemon-Honey Water with Ceylon Cinnamon",
        qty: "250 ml",
        calories: 45,
        protein: "0.3g",
        fiber: "1.0g",
        desc: "Gungune paani me raw organic honey, nimbu aur ek chutki dalchini.",
        benefit: "Digestive juices stimulate karta hai aur lymphatic drainage activate karta hai.",
        chefSecret: "Paani ko kabhi boil karke honey na milayein — halka gunguna hona chahiye."
      },
      {
        time: "08:30 AM",
        type: "Breakfast",
        name: "Steamed Ragi & Vegetable Idlis with Fresh Coconut Chutney",
        qty: "3 Soft Idlis + 2 Tbsp Chutney",
        calories: 270,
        protein: "10.5g",
        fiber: "8.5g",
        desc: "Finger millet & fermented batter with grated carrots, beans & tempered curry leaves.",
        benefit: "Calcium-rich ragi bones aur joints ko strengthen karta hai, zero gluten spike.",
        chefSecret: "Coconut chutney me thoda roasted chana dal aur ginger mila kar pisein."
      },
      {
        time: "11:00 AM",
        type: "Mid-Morning",
        name: "Probiotic Buttermilk (Chaas) with Curry Leaves & Rock Salt",
        qty: "250 ml",
        calories: 60,
        protein: "3.5g",
        fiber: "0.5g",
        desc: "Ghar ka dahi churned with roasted jeera, crushed kadi patta, sendha namak & cold water.",
        benefit: "Millions of live lactobacillus gut lining ko repair karte hain aur acidity door karte hain.",
        chefSecret: "Kadi patta ko haath se crush karke daalein for instant essential oil release."
      },
      {
        time: "01:30 PM",
        type: "Grand Ayur-Thali Lunch",
        name: "Panchmel Dal + Smoky Baingan Bharta + 2 Phulka + Koshimbir",
        qty: "Pure Sattvic Feast",
        calories: 480,
        protein: "22.5g",
        fiber: "15.0g",
        desc: "5 dalon ka blend (Toor, Moong, Masoor, Chana, Urad) with roasted eggplant mash, soft phulkas aur cucumber-carrot salad.",
        benefit: "Complete plant protein diversity jo gut bacteria ke different strains ko feed karti hai.",
        chefSecret: "Baingan ko direct flame par roast karein aur sarson tel ka raw tadka lagayein."
      },
      {
        time: "05:00 PM",
        type: "Evening Reviver",
        name: "Roasted Flaxseed, Pumpkin Seed & Anjeer Platter",
        qty: "1 Small Bowl (35g)",
        calories: 160,
        protein: "5.8g",
        fiber: "4.5g",
        desc: "Alsi ke beej, kaddu ke beej lightly roasted with 2 dried figs (anjeer).",
        benefit: "Zinc aur natural lignans hormonal health aur skin radiance boost karte hain.",
        chefSecret: "Anjeer ko 15 min paani me soak karke khane se bio-availability 2x ho jati hai."
      },
      {
        time: "07:30 PM",
        type: "Healing Dinner",
        name: "Moong Dal & Vegetable Khichdi with Desi A2 Ghee & Hing",
        qty: "1 Warm Bowl (300g)",
        calories: 320,
        protein: "14.5g",
        fiber: "7.0g",
        desc: "Dhuli moong dal and aged rice cooked with beans, peas, carrots, hing, jeera aur 1 tsp pure ghee.",
        benefit: "Ayurveda me khichdi ko 'Maha-Aushadh' mana gaya hai — stomach lining ko soothe karta hai.",
        chefSecret: "Khichdi banate waqt 1/4 tsp haldi aur 2 laung (cloves) dalein for royal fragrance."
      },
      {
        time: "09:30 PM",
        type: "Bedtime Ojas Drink",
        name: "Warm Kesar-Badam Golden Ojas Milk",
        qty: "150 ml",
        calories: 105,
        protein: "4.8g",
        fiber: "0.8g",
        desc: "Cow milk infused with Kashmiri saffron strands, cardamom and slivered almonds.",
        benefit: "Ojas (vital life essence) build karta hai aur calm meditative sleep provide karta hai.",
        chefSecret: "Kesar ko 1 tsp gungune doodh me 10 min rub karke fir main doodh me mix karein."
      }
    ]
  },
  friday: {
    dayName: "Shukrawar (Friday)",
    themeTitle: "Glycemic Defense & Liver Cleanse (Yakrit Shodhan)",
    themeDesc: "Insulin sensitivity masterclass — blood glucose flattening aur liver fat detox.",
    primaryDosha: "Kapha-Pitta Pacifying",
    dailyTarget: { calories: 1560, protein: "80g", fiber: "41g", carbs: "160g", fats: "40g" },
    meals: [
      {
        time: "06:30 AM",
        type: "Detox Nectar",
        name: "Karela-Jamun-Cucumber Metabolic Shot",
        qty: "100 ml",
        calories: 25,
        protein: "1.0g",
        fiber: "2.5g",
        desc: "Fresh bitter gourd, jamun seed powder aur kheera ka raw cold-pressed shot.",
        benefit: "Charantin aur Polypeptide-p natural insulin mimetic ki tarah kaam karte hain.",
        chefSecret: "Karela ka kadwapan kam karne ke liye thoda sa sendha namak aur nimbu add karein."
      },
      {
        time: "08:30 AM",
        type: "Breakfast",
        name: "Besan-Palak Vegetable Cheela with Tomato-Garlic Dip",
        qty: "2 Crisp Cheelas + Home Chutney",
        calories: 290,
        protein: "16.8g",
        fiber: "8.2g",
        desc: "Gram flour batter loaded with finely shredded spinach, grated ginger, ajwain aur hing.",
        benefit: "Slow complex carbs jo post-prandial blood sugar spike ko completely prevent karte hain.",
        chefSecret: "Ajwain ko hatho se masal kar batter me dalein taaki digestion super light ho jaye."
      },
      {
        time: "11:00 AM",
        type: "Mid-Morning",
        name: "Fresh Crisp Guava with Black Salt & Roasted Jeera",
        qty: "1 Medium Guava (Amrood)",
        calories: 70,
        protein: "2.5g",
        fiber: "5.5g",
        desc: "Pink/White crunchy guava sliced with a dash of sendha namak.",
        benefit: "Extremely low glycemic index (GI: 12) with 4x Vitamin C of an orange.",
        chefSecret: "Guava ke beej chaba kar nahi khane chahiye, soft chew karein for healthy gut transit."
      },
      {
        time: "01:30 PM",
        type: "Grand Ayur-Thali Lunch",
        name: "Amritsari Chana (Low Oil) + 2 Ragi Rotis + Beetroot Raita",
        qty: "Full Glycemic Shield Thali",
        calories: 510,
        protein: "26.0g",
        fiber: "16.5g",
        desc: "Slow-simmered chickpeas in anardana & amchur gravy, ragi flour rotis, aur dahi beetroot raita.",
        benefit: "Resistant starch aur high protein glucose absorption ko 4 ghante tak slow karte hain.",
        chefSecret: "Chana boil karte waqt amla ka tukda ya tea bag dalein dark royal color aur flavor ke liye."
      },
      {
        time: "05:00 PM",
        type: "Evening Reviver",
        name: "Vegetable Poha with Roasted Peanuts & Green Tea",
        qty: "1 Bowl (150g) + 1 Cup Tea",
        calories: 180,
        protein: "5.5g",
        fiber: "3.5g",
        desc: "Rinsed flattened rice tossed with mustard seeds, green peas, carrots, turmeric & roasted peanuts.",
        benefit: "Easy iron absorption aur instant clean energy without insulin spike.",
        chefSecret: "Poha banate waqt gas band karke last me nimbu ras nichodein, kadwa nahi hoga."
      },
      {
        time: "07:30 PM",
        type: "Healing Dinner",
        name: "Pan-Tossed Paneer with Broccoli, Beans & Tamari Reduction",
        qty: "1 Sauté Bowl",
        calories: 280,
        protein: "23.0g",
        fiber: "6.2g",
        desc: "Steamed broccoli florets, French beans, bell peppers and paneer cubes tossed in garlic ginger paste.",
        benefit: "Sulforaphane in broccoli liver Phase-2 detoxification enzymes ko 80% boost karta hai.",
        chefSecret: "Broccoli ko 2 minute se zyada steam na karein taaki uska crunchy bite aur chlorophyll retain rahe."
      },
      {
        time: "09:30 PM",
        type: "Bedtime Ojas Drink",
        name: "Triphala & Warm Ajwain Infusion",
        qty: "150 ml",
        calories: 15,
        protein: "0.2g",
        fiber: "1.0g",
        desc: "Pure Triphala powder aur ajwain soaked in warm water.",
        benefit: "Colon wall cleansing, morning complete elimination, aur systemic detoxification.",
        chefSecret: "Sone se 30 min pehle piyein for peak digestive repair during sleep cycles."
      }
    ]
  },
  saturday: {
    dayName: "Shanivar (Saturday)",
    themeTitle: "Joint Longevity & Anti-Inflammatory (Sandhi Shoola)",
    themeDesc: "Uric acid reduction, joint lubricity, cartilage repair aur flexibility enhancement.",
    primaryDosha: "Vata Shamak, Asthi Poshan",
    dailyTarget: { calories: 1590, protein: "82g", fiber: "37g", carbs: "168g", fats: "45g" },
    meals: [
      {
        time: "06:30 AM",
        type: "Detox Nectar",
        name: "Fresh Turmeric & Ginger Bio-Curcumin Elixir",
        qty: "200 ml",
        calories: 30,
        protein: "0.5g",
        fiber: "1.5g",
        desc: "Kachi haldi aur adrak boiled with a pinch of fresh black pepper powder.",
        benefit: "Piperine in black pepper curcumin ki absorption ko 2000% badha deta hai (Arthritis defense).",
        chefSecret: "1/4 tsp pure desi ghee dalein — curcumin fat-soluble hota hai aur instant absorb hota hai."
      },
      {
        time: "08:30 AM",
        type: "Breakfast",
        name: "Desi Paneer Bhurji with Tomatoes & 2 Multigrain Toast",
        qty: "1 Platter (150g Bhurji + Toast)",
        calories: 330,
        protein: "22.5g",
        fiber: "6.0g",
        desc: "Crumbled fresh paneer sautéed with tomatoes, green chillies, fresh coriander & cumin.",
        benefit: "High bio-available calcium and phosphorus joint bone density ko strengthen karte hain.",
        chefSecret: "Paneer ko over-cook na karein, soft aur juicy rehne par gas band karein."
      },
      {
        time: "11:00 AM",
        type: "Mid-Morning",
        name: "Sweet Lime (Mosambi) / Orange Segments with Mint",
        qty: "1 Large Citrus Bowl",
        calories: 75,
        protein: "1.2g",
        fiber: "3.8g",
        desc: "Freshly peeled mosambi segments sprinkled with rock salt and crushed mint.",
        benefit: "High bioflavonoids aur citric acid body se excess uric acid crystal dissolve karte hain.",
        chefSecret: "Juice nikalne ke bajaye sabhi segments chaba kar khayein for intact fiber."
      },
      {
        time: "01:30 PM",
        type: "Grand Ayur-Thali Lunch",
        name: "Yellow Dal Tadka + Crisp Bhindi Masala + 2 Jowar Roti + Mint Raita",
        qty: "Full Joint Care Thali",
        calories: 490,
        protein: "21.0g",
        fiber: "14.5g",
        desc: "Arhar dal with garlic-jeera tadka, low-oil crispy okra with amchur, jowar flatbreads aur dahi.",
        benefit: "Bhindi ka natural mucilage digestive tract aur joints me synovial fluid support karta hai.",
        chefSecret: "Bhindi ko dhone ke baad bilkul sukha kar kaatein taaki sticky na bane."
      },
      {
        time: "05:00 PM",
        type: "Evening Reviver",
        name: "Roasted Makhana & Walnut Crunch with Ginger-Tulsi Tea",
        qty: "1 Bowl + 1 Cup Tea",
        calories: 175,
        protein: "6.0g",
        fiber: "3.5g",
        desc: "Slow-roasted foxnuts with 3 walnut halves tossed in turmeric and rock salt.",
        benefit: "Alpha-linolenic acid (ALA) joint inflammation aur morning stiffness ko wipe out karta hai.",
        chefSecret: "Walnuts ko light toast karne se unka bitter taste sweet buttery flavor me badal jata hai."
      },
      {
        time: "07:30 PM",
        type: "Healing Dinner",
        name: "Moong Dal & Palak Velvety Soup with Garlic Croutons",
        qty: "350 ml Healing Soup",
        calories: 230,
        protein: "16.0g",
        fiber: "7.5g",
        desc: "Pureed yellow moong dal and young spinach leaves with golden roasted garlic flakes.",
        benefit: "Alkalizing soup jo body ke night time acid load ko neutralize karta hai.",
        chefSecret: "Garlic ko desi ghee me golden brown crisp karke top par sprinkle karein."
      },
      {
        time: "09:30 PM",
        type: "Bedtime Ojas Drink",
        name: "Ashwagandha & Nutmeg Restorative Sleep Infusion",
        qty: "150 ml",
        calories: 85,
        protein: "4.2g",
        fiber: "0.5g",
        desc: "Warm milk/almond milk with organic Ashwagandha root powder and a dash of nutmeg.",
        benefit: "Deep joint rejuvenation, nervous system relaxation aur anti-catabolic night repair.",
        chefSecret: "Ashwagandha ko hamesha warm milk ke sath lein taaki bioavailability maximum ho."
      }
    ]
  },
  sunday: {
    dayName: "Ravivar (Sunday)",
    themeTitle: "Royal Ayur-Gourmet Healthy Feast (Shahi Sattvic)",
    themeDesc: "Five-star royal indulgence bina heavy cream, dalda ya refined maida ke.",
    primaryDosha: "Sarva Dhatu Vardhak (Total Nourishment)",
    dailyTarget: { calories: 1680, protein: "84g", fiber: "39g", carbs: "185g", fats: "48g" },
    meals: [
      {
        time: "06:30 AM",
        type: "Detox Nectar",
        name: "Fresh Tender Coconut Water with Lime & Rock Salt",
        qty: "300 ml",
        calories: 50,
        protein: "1.5g",
        fiber: "2.0g",
        desc: "Pure tender coconut water with 4 drops of lime juice and a micro-pinch of pink salt.",
        benefit: "Kidney filtration rate ko 25% boost karta hai aur Sunday morning freshness deta hai.",
        chefSecret: "Coconut water ko hamesha room temperature ya mild cool lein, ice kabhi na daalein."
      },
      {
        time: "08:30 AM",
        type: "Breakfast",
        name: "Multi-Millet Vegetable Upma with Roasted Cashews & Mint Chutney",
        qty: "1 Gourmet Bowl (200g)",
        calories: 310,
        protein: "11.5g",
        fiber: "8.0g",
        desc: "Foxtail & Little millet roasted with curry leaves, mustard, carrots, beans & 5 toasted cashews.",
        benefit: "Slow carbohydrates provide sustained physical stamina for Sunday outdoor activities.",
        chefSecret: "Millets ko 15 minute soak karke dry roast karein, upma ekdum khila-khila banega."
      },
      {
        time: "11:00 AM",
        type: "Mid-Morning",
        name: "Pomegranate & Sweet Lime Anti-Oxidant Platter",
        qty: "1 Fresh Platter (180g)",
        calories: 85,
        protein: "1.8g",
        fiber: "4.5g",
        desc: "Ruby red anaar arils with sweet lime segments tossed with black pepper & mint.",
        benefit: "Punicalagins in pomegranate heart blood flow ko drastically stimulate karte hain.",
        chefSecret: "Anaar ko fresh peel karein, packaged juice me 80% enzymes dead hote hain."
      },
      {
        time: "01:30 PM",
        type: "Grand Ayur-Thali Lunch",
        name: "Gourmet Shahi Paneer + Dal Makhani (Light) + 2 Missi Roti + Jeera Rice",
        qty: "Royal Sunday Health Thali",
        calories: 560,
        protein: "29.5g",
        fiber: "14.8g",
        desc: "Shahi paneer in melon seed & tomato-curd gravy (Zero heavy cream), slow-simmered whole urad dal with A2 milk, missi roti aur salad.",
        benefit: "Restaurant level taste with 70% lower saturated fat and 29.5g pure protein.",
        chefSecret: "Cream ki jagah cashew-magaz (melon seeds) ka paste use karein — silky velvet texture bina heavy feel ke."
      },
      {
        time: "05:00 PM",
        type: "Evening Reviver",
        name: "Baked Masala Methi Khakhra with Roasted Peanuts & Adrak Chai",
        qty: "2 Crisp Khakhras + 1 Cup Chai",
        calories: 180,
        protein: "5.5g",
        fiber: "4.0g",
        desc: "Whole wheat hand-roasted methi khakhra with light roasted peanuts and spiced ginger tea.",
        benefit: "Crunchy tea-time satisfaction without junk bakery biscuits or palm oil.",
        chefSecret: "Khakhra par 2 drop pure desi ghee laga kar chaat masala sprinkle karein."
      },
      {
        time: "07:30 PM",
        type: "Healing Dinner",
        name: "Quinoa / Broken Wheat (Daliya) Pulao with Spiced Curd",
        qty: "1 Warm Bowl (250g)",
        calories: 290,
        protein: "14.2g",
        fiber: "7.2g",
        desc: "Fluffy quinoa cooked with green peas, bell peppers, carrots, toasted cumin, served with fresh curd.",
        benefit: "Complete 9 essential amino acids with light digestability for uninterrupted deep sleep.",
        chefSecret: "Quinoa ko pehle strainer me acchi tarah wash karein to remove natural saponin coating."
      },
      {
        time: "09:30 PM",
        type: "Bedtime Ojas Drink",
        name: "Royal Kesar-Cardamom Restorative Night Cup",
        qty: "150 ml",
        calories: 95,
        protein: "4.5g",
        fiber: "0.2g",
        desc: "Warm A2 milk infused with saffron, cardamom and a drop of organic rose water.",
        benefit: "Body and mind complete calm restoration for the upcoming productive work week.",
        chefSecret: "Rose water ko natural edible grade use karein for aromatherapy calming effect."
      }
    ]
  }
};


const DAY_MEAL_TRANSLATIONS = {
  "punjabi": {
    "monday": {
      "name": "ਸੋਮਵਾਰ",
      "title": "ਪਾਚਨ ਅੱਗ ਤੇ ਪੇਟ ਦੀ ਸਫ਼ਾਈ (ਅਗਨੀ ਦੀਪਨ)",
      "desc": "ਭਾਰੀ ਖਾਣੇ ਤੋਂ ਬਾਅਦ ਪੇਟ ਦੀ ਸਫ਼ਾਈ, ਲਿਵਰ ਡਿਟੌਕਸ ਅਤੇ ਮੈਟਾਬੋਲਿਕ ਰੀਸੈਟ।",
      "meals": [
        {
          "type": "ਸਵੇਰ ਦਾ ਅੰਮ੍ਰਿਤ (ਡਿਟੌਕਸ)",
          "name": "ਮੇਥੀ-ਦਾਣਾ ਤੇ ਅਦਰਕ ਦਾ ਕੋਸਾ ਕਾੜ੍ਹਾ",
          "qty": "250 ਮਿ.ਲੀ.",
          "desc": "ਰਾਤ ਭਰ ਭਿੱਜੇ ਮੇਥੀ ਦਾਣੇ ਨੂੰ ਤਾਜ਼ੇ ਅਦਰਕ ਨਾਲ ਉਬਾਲ ਕੇ ਕੋਸਾ ਛਾਣ ਕੇ ਪੀਓ।",
          "benefit": "ਇੰਸੁਲਿਨ ਸੰਵੇਦਨਸ਼ੀਲਤਾ 30% ਵਧਾਉਂਦਾ ਹੈ, ਪੇਟ ਦੀ ਗੈਸ ਤੇ ਜ਼ਹਿਰੀਲੇ ਤੱਤ ਬਾਹਰ ਕੱਢਦਾ ਹੈ।",
          "chefSecret": "ਇੱਕ ਚੁਟਕੀ ਦਾਲਚੀਨੀ ਪਾਓ — ਬਿਨਾਂ ਖੰਡ ਤੋਂ ਮਿੱਠੀ ਖੁਸ਼ਬੂ ਆਵੇਗੀ।"
        },
        {
          "type": "ਸਵੇਰ ਦਾ ਨਾਸ਼ਤਾ",
          "name": "ਮੂੰਗੀ ਦਾਲ ਤੇ ਪਨੀਰ ਦਾ ਭਰਵਾਂ ਚਿੱਲਾ",
          "qty": "2 ਕਰਿਸਪੀ ਚਿੱਲੇ + ਪੁਦੀਨਾ ਚਟਨੀ",
          "desc": "ਪੀਲੀ ਮੂੰਗੀ ਦਾਲ ਦੇ ਘੋਲ ਵਿੱਚ ਕੱਦੂਕਸ ਕੀਤਾ ਤਾਜ਼ਾ ਪਨੀਰ, ਭੁੰਨਿਆ ਜੀਰਾ ਤੇ ਹਿੰਗ ਤੜਕਾ।",
          "benefit": "ਦੁਪਹਿਰ ਤੱਕ ਪੇਟ ਭਰਿਆ ਰੱਖਦਾ ਹੈ — ਸ਼ੂਗਰ ਸਪਾਈਕ ਬਿਲਕੁਲ ਨਹੀਂ ਹੁੰਦੀ।",
          "chefSecret": "ਘੋਲ ਪੀਸਦੇ ਵੇਲੇ ਅਦਰਕ-ਹਰੀ ਮਿਰਚ ਨਾਲ ਪੀਸੋ — ਸਟ੍ਰੀਟ ਸਟਾਈਲ ਸਵਾਦ ਆਵੇਗਾ।"
        },
        {
          "type": "ਦੁਪਹਿਰ ਤੋਂ ਪਹਿਲਾਂ",
          "name": "ਤਾਜ਼ਾ ਨਾਰੀਅਲ ਪਾਣੀ, ਭਿੱਜੀ ਚੀਆ ਸੀਡਜ਼ ਤੇ ਨਿੰਬੂ",
          "qty": "250 ਮਿ.ਲੀ.",
          "desc": "ਤਾਜ਼ੇ ਨਾਰੀਅਲ ਪਾਣੀ ਵਿੱਚ 1 ਚਮਚ ਭਿੱਜੀ ਚੀਆ ਸੀਡਜ਼ ਤੇ 5 ਬੂੰਦਾਂ ਨਿੰਬੂ ਰਸ।",
          "benefit": "ਕੁਦਰਤੀ ਇਲੈਕਟ੍ਰੋਲਾਈਟਸ (ਪੋਟਾਸ਼ੀਅਮ ਤੇ ਮੈਗਨੀਸ਼ੀਅਮ) ਨਾਲ ਸਰੀਰ ਨੂੰ ਹਾਈਡ੍ਰੇਟ ਕਰਦਾ ਹੈ।",
          "chefSecret": "ਠੰਡਾ ਕਰਕੇ ਤਾਜ਼ੇ ਪੁਦੀਨੇ ਦੇ ਪੱਤਿਆਂ ਨਾਲ ਪੀਓ।"
        },
        {
          "type": "ਸ਼ਾਹੀ ਆਯੁਰਵੇਦਿਕ ਥਾਲੀ (ਦੁਪਹਿਰ ਦਾ ਖਾਣਾ)",
          "name": "ਪਾਲਕ ਮੂੰਗੀ ਦਾਲ + ਮੇਥੀ ਗਾਜਰ + 2 ਜਵਾਰ ਰੋਟੀ + ਜੀਰਾ ਲੱਸੀ",
          "qty": "ਪੂਰੀ ਆਯੁਰਵੇਦਿਕ ਥਾਲੀ",
          "desc": "ਲਸਣ ਤੜਕਾ ਪਾਲਕ ਮੂੰਗੀ ਦਾਲ, ਮੇਥੀ ਗਾਜਰ ਸਬਜ਼ੀ, ਦੇਸੀ ਘਿਓ ਨਾਲ 2 ਜਵਾਰ ਰੋਟੀਆਂ ਤੇ ਭੁੰਨੇ ਜੀਰੇ ਵਾਲੀ ਲੱਸੀ।",
          "benefit": "ਹਾਈ ਆਇਰਨ, ਘੱਟ ਗਲਾਈਸੈਮਿਕ ਇੰਡੈਕਸ ਅਤੇ ਪੇਟ ਦੇ ਚੰਗੇ ਬੈਕਟੀਰੀਆ ਨੂੰ ਮਜ਼ਬੂਤ ਕਰਦਾ ਹੈ।",
          "chefSecret": "ਲੱਸੀ ਵਿੱਚ ਕਾਲਾ ਨਮਕ ਤੇ ਭੁੰਨਿਆ ਜੀਰਾ ਪਾਓ — ਖਾਣ ਤੋਂ ਬਾਅਦ ਭਾਰਾਪਨ ਜ਼ੀਰੋ ਰਹੇਗਾ।"
        },
        {
          "type": "ਸ਼ਾਮ ਦੀ ਤਾਜ਼ਗੀ (ਹਲਕਾ ਨਾਸ਼ਤਾ)",
          "name": "ਭੁੰਨੇ ਹੋਏ ਮਖਾਣੇ ਤੇ ਹਲਦੀ ਵਾਲੀ ਮੂੰਗਫਲੀ + ਗ੍ਰੀਨ ਟੀ",
          "qty": "1 ਬਾਊਲ + 1 ਕੱਪ ਚਾਹ",
          "desc": "ਹਲਕੇ ਭੁੰਨੇ ਮਖਾਣੇ, ਹਲਦੀ, ਸੇਂਧਾ ਨਮਕ ਅਤੇ ਤੁਲਸੀ-ਅਦਰਕ ਹਰਬਲ ਕਾੜ੍ਹਾ।",
          "benefit": "ਤਣਾਅ ਹਾਰਮੋਨ (ਕੋਰਟੀਸੋਲ) ਘਟਾਉਂਦਾ ਹੈ ਅਤੇ ਸ਼ਾਮ ਦੀ ਮਿੱਠੇ ਦੀ ਕ੍ਰੇਵਿੰਗ ਰੋਕਦਾ ਹੈ।",
          "chefSecret": "ਭੁੰਨਦੇ ਵੇਲੇ ਅਖੀਰਲੇ 30 ਸਕਿੰਟਾਂ ਵਿੱਚ 2 ਬੂੰਦਾਂ ਸਰ੍ਹੋਂ ਦਾ ਤੇਲ ਤੇ ਚਾਟ ਮਸਾਲਾ ਮਿਲਾਓ।"
        },
        {
          "type": "ਰਾਤ ਦਾ ਹਲਕਾ ਖਾਣਾ (ਸਿਹਤਮੰਦ ਡਿਨਰ)",
          "name": "ਘੀਆ-ਮੂੰਗੀ ਦਾ ਪੌਸ਼ਟਿਕ ਸਟੂਅ ਕਾਲੀ ਮਿਰਚ ਨਾਲ",
          "qty": "350 ਮਿ.ਲੀ. ਗਰਮ ਸੂਪ ਬਾਊਲ",
          "desc": "ਤਾਜ਼ਾ ਘੀਆ ਤੇ ਪੀਲੀ ਮੂੰਗੀ ਦਾਲ ਦਾ ਕਰੀਮੀ ਸੂਪ, ਕੱਦੂ ਦੇ ਬੀਜ ਤੇ ਕਾਲੀ ਮਿਰਚ।",
          "benefit": "ਰਾਤ ਨੂੰ ਲਿਵਰ ਤੇ ਪਾਚਨ 'ਤੇ ਕੋਈ ਬੋਝ ਨਹੀਂ — ਬਲੱਡ ਪ੍ਰੈਸ਼ਰ ਕੁਦਰਤੀ ਕੰਟਰੋਲ ਰਹਿੰਦਾ ਹੈ।",
          "chefSecret": "ਦੇਸੀ ਘਿਓ ਵਿੱਚ ਸਿਰਫ਼ ਜੀਰਾ, ਹਿੰਗ ਤੇ ਹਰੀ ਮਿਰਚ ਦਾ ਤੜਕਾ ਲਗਾਓ।"
        },
        {
          "type": "ਸੌਣ ਵੇਲੇ ਓਜਸ ਪੀਣ ਵਾਲਾ ਦੁੱਧ",
          "name": "ਕੋਸਾ ਹਲਦੀ ਤੇ ਜਾਇਫਲ ਵਾਲਾ ਦੁੱਧ",
          "qty": "150 ਮਿ.ਲੀ.",
          "desc": "ਦੇਸੀ ਗਾਂ ਦੇ ਏ2 ਦੁੱਧ ਜਾਂ ਬਦਾਮ ਦੁੱਧ ਵਿੱਚ ਸ਼ੁੱਧ ਹਲਦੀ ਤੇ ਇੱਕ ਚੁਟਕੀ ਜਾਇਫਲ।",
          "benefit": "ਡੂੰਘੀ ਤੇ ਸ਼ਾਂਤ ਨੀਂਦ ਲਿਆਉਂਦਾ ਹੈ, ਸਵੇਰੇ ਤਾਜ਼ਗੀ ਮਹਿਸੂਸ ਹੁੰਦੀ ਹੈ।",
          "chefSecret": "ਜਾਇਫਲ ਨੂੰ ਹਮੇਸ਼ਾ ਤਾਜ਼ਾ ਘਸਾ ਕੇ ਪਾਓ।"
        }
      ]
    },
    "tuesday": {
      "name": "ਮੰਗਲਵਾਰ",
      "title": "ਮਸਲ ਰਿਕਵਰੀ ਤੇ ਅੰਤੜੀਆਂ ਦੀ ਤਾਕਤ",
      "desc": "ਹਾਈ ਪ੍ਰੋਟੀਨ, ਪ੍ਰੋਬਾਇਓਟਿਕਸ ਅਤੇ ਪੇਟ ਦੇ ਚੰਗੇ ਬੈਕਟੀਰੀਆ ਲਈ ਸ਼ਾਨਦਾਰ ਖੁਰਾਕ।",
      "meals": [
        {
          "type": "ਸਵੇਰ ਦਾ ਅੰਮ੍ਰਿਤ (ਡਿਟੌਕਸ)",
          "name": "ਤਾਜ਼ਾ ਆਂਵਲਾ, ਪੁਦੀਨਾ ਤੇ ਕਲੋਰੋਫਿਲ ਸ਼ੌਟ",
          "qty": "60 ਮਿ.ਲੀ. ਤੀਬਰ ਸ਼ੌਟ",
          "desc": "ਤਾਜ਼ਾ ਆਂਵਲਾ, ਧਨੀਆ, ਪੁਦੀਨਾ ਤੇ ਚੁਟਕੀ ਸੇਂਧਾ ਨਮਕ ਦਾ ਤਾਜ਼ਾ ਜੂਸ।",
          "benefit": "ਵਿਟਾਮਿਨ ਸੀ ਨਾਲ ਭਰਪੂਰ, ਚਮੜੀ ਵਿੱਚ ਨਿਖਾਰ ਅਤੇ ਲਿਵਰ ਦੀ ਸਫ਼ਾਈ।",
          "chefSecret": "ਨਿਚੋੜਨ ਤੋਂ ਤੁਰੰਤ ਬਾਅਦ ਪੀਓ ਤਾਂ ਜੋ ਵਿਟਾਮਿਨ ਸੀ ਨਸ਼ਟ ਨਾ ਹੋਵੇ।"
        },
        {
          "type": "ਸਵੇਰ ਦਾ ਨਾਸ਼ਤਾ",
          "name": "ਅੰਕੁਰਿਤ ਮੂੰਗੀ ਤੇ ਛੋਲੇ ਪ੍ਰੋਟੀਨ ਚਾਟ ਅਨਾਰ ਨਾਲ",
          "qty": "1 ਵੱਡਾ ਬਾਊਲ (220 ਗ੍ਰਾਮ)",
          "desc": "ਅੰਕੁਰਿਤ ਮੂੰਗੀ, ਕਾਲੇ ਛੋਲੇ, ਬਾਰੀਕ ਖੀਰਾ, ਅਨਾਰ, ਭੁੰਨਿਆ ਜੀਰਾ ਤੇ ਨਿੰਬੂ ਰਸ।",
          "benefit": "14.5 ਗ੍ਰਾਮ ਸ਼ੁੱਧ ਪਲਾਂਟ ਪ੍ਰੋਟੀਨ ਤੇ ਲਾਈਵ ਐਂਜ਼ਾਈਮਜ਼ ਨਾਲ ਭਰਪੂਰ।",
          "chefSecret": "ਅੰਕੁਰਿਤ ਦਾਲਾਂ ਨੂੰ 2 ਮਿੰਟ ਹਲਕੀ ਸਟੀਮ ਦਿਓ — ਪਚਣ ਵਿੱਚ ਬਹੁਤ ਆਸਾਨ ਹੋ ਜਾਂਦੀਆਂ ਹਨ।"
        },
        {
          "type": "ਦੁਪਹਿਰ ਤੋਂ ਪਹਿਲਾਂ",
          "name": "ਮਟਕਾ ਛਾਛ ਭੁੰਨੇ ਜੀਰੇ ਤੇ ਹਿੰਗ ਨਾਲ",
          "qty": "300 ਮਿ.ਲੀ.",
          "desc": "ਘਰ ਦੇ ਤਾਜ਼ਾ ਦਹੀਂ ਨੂੰ ਰਿੜਕ ਕੇ ਬਣੀ ਪਤਲੀ ਲੱਸੀ, ਭੁੰਨਿਆ ਜੀਰਾ ਤੇ ਹਿੰਗ।",
          "benefit": "ਅੰਤੜੀਆਂ ਨੂੰ ਅਰਬਾਂ ਚੰਗੇ ਪ੍ਰੋਬਾਇਓਟਿਕ ਬੈਕਟੀਰੀਆ ਪ੍ਰਦਾਨ ਕਰਦੀ ਹੈ।",
          "chefSecret": "ਮਿੱਟੀ ਦੇ ਕੁੱਜੇ ਵਿੱਚ 1 ਘੰਟਾ ਰੱਖ ਕੇ ਪੀਓ — ਕੁਦਰਤੀ ਠੰਡਕ ਮਿਲਦੀ ਹੈ।"
        },
        {
          "type": "ਸ਼ਾਹੀ ਆਯੁਰਵੇਦਿਕ ਥਾਲੀ (ਦੁਪਹਿਰ ਦਾ ਖਾਣਾ)",
          "name": "ਪੰਚਮੇਲ ਦਾਲ + ਭਿੰਡੀ ਮਸਾਲਾ + 2 ਬਾਜਰਾ ਰੋਟੀ + ਖੀਰਾ ਸਲਾਦ",
          "qty": "ਪੂਰੀ ਥਾਲੀ",
          "desc": "ਪੰਜ ਦਾਲਾਂ ਦਾ ਸੁਮੇਲ, ਘੱਟ ਤੇਲ ਵਿੱਚ ਪੱਕੀ ਭਿੰਡੀ, 2 ਗਰਮ ਬਾਜਰੇ ਦੀਆਂ ਰੋਟੀਆਂ।",
          "benefit": "ਪੂਰਾ ਅਮੀਨੋ ਐਸਿਡ ਪ੍ਰੋਫਾਈਲ, ਮਸਲ ਰਿਕਵਰੀ ਲਈ ਸੰਪੂਰਨ ਪ੍ਰੋਟੀਨ।",
          "chefSecret": "ਬਾਜਰੇ ਦੇ ਆਟੇ ਨੂੰ ਕੋਸੇ ਪਾਣੀ ਨਾਲ ਗੁੰਨ੍ਹੋ — ਰੋਟੀ ਨਰਮ ਤੇ ਫੁੱਲਵੀਂ ਬਣੇਗੀ।"
        },
        {
          "type": "ਸ਼ਾਮ ਦੀ ਤਾਜ਼ਗੀ (ਹਲਕਾ ਨਾਸ਼ਤਾ)",
          "name": "ਭੁੱਜੇ ਕਾਲੇ ਛੋਲੇ ਤੇ ਗੁੜ-ਅਖਰੋਟ + ਲੈਮਨਗ੍ਰਾਸ ਚਾਹ",
          "qty": "1 ਮੁੱਠੀ (40 ਗ੍ਰਾਮ)",
          "desc": "ਛਿਲਕੇ ਵਾਲੇ ਭੁੱਜੇ ਛੋਲੇ, ਅੱਧਾ ਚਮਚ ਦੇਸੀ ਗੁੜ ਤੇ 2 ਅਖਰੋਟ।",
          "benefit": "ਦਿਮਾਗੀ ਥਕਾਵਟ ਦੂਰ ਕਰਦਾ ਹੈ ਅਤੇ ਕੁਦਰਤੀ ਆਇਰਨ ਦਾ ਭੰਡਾਰ ਹੈ।",
          "chefSecret": "ਗੁੜ ਸਿਰਫ਼ ਦੇਸੀ ਕਾਲੇ ਰੰਗ ਵਾਲਾ ਵਰਤੋ।"
        },
        {
          "type": "ਰਾਤ ਦਾ ਹਲਕਾ ਖਾਣਾ (ਸਿਹਤਮੰਦ ਡਿਨਰ)",
          "name": "ਤੋਰੀ-ਟਮਾਟਰ ਹਲਕੀ ਸਬਜ਼ੀ + 1 ਜਵਾਰ ਫੁਲਕਾ",
          "qty": "300 ਗ੍ਰਾਮ ਬਾਊਲ",
          "desc": "ਤਾਜ਼ੀ ਤੋਰੀ, ਟਮਾਟਰ, ਹਿੰਗ ਤੇ ਜੀਰਾ ਤੜਕਾ ਨਾਲ 1 ਨਰਮ ਜਵਾਰ ਰੋਟੀ।",
          "benefit": "ਸਰੀਰ ਦੀ ਸੋਜਸ਼ ਘਟਾਉਂਦਾ ਹੈ ਅਤੇ ਪੇਟ ਨੂੰ ਬਿਲਕੁਲ ਹਲਕਾ ਰੱਖਦਾ ਹੈ।",
          "chefSecret": "ਤੋਰੀ ਵਿੱਚ ਪਾਣੀ ਨਾ ਪਾਓ — ਆਪਣੇ ਹੀ ਰਸ ਵਿੱਚ ਪੱਕਣ ਦਿਓ।"
        },
        {
          "type": "ਸੌਣ ਵੇਲੇ ਓਜਸ ਪੀਣ ਵਾਲਾ ਦੁੱਧ",
          "name": "ਕੋਸਾ ਸੌਂਫ਼ ਤੇ ਇਲਾਇਚੀ ਵਾਲਾ ਦੁੱਧ",
          "qty": "150 ਮਿ.ਲੀ.",
          "desc": "ਦੁੱਧ ਵਿੱਚ ਹਰੀ ਇਲਾਇਚੀ ਤੇ ਸੌਂਫ਼ ਉਬਾਲ ਕੇ ਛਾਣ ਕੇ ਲਵੋ।",
          "benefit": "ਛਾਤੀ ਦੀ ਜਲਣ ਤੇ ਗੈਸ ਨੂੰ ਸ਼ਾਂਤ ਕਰਕੇ ਗੂੜ੍ਹੀ ਨੀਂਦ ਦਿੰਦਾ ਹੈ।",
          "chefSecret": "ਇਲਾਇਚੀ ਦੇ ਦਾਣਿਆਂ ਨੂੰ ਹੱਥ ਨਾਲ ਕੁੱਟ ਕੇ ਪਾਓ।"
        }
      ]
    },
    "wednesday": {
      "name": "ਬੁੱਧਵਾਰ",
      "title": "ਦਿਲ ਦੀ ਸਿਹਤ ਤੇ ਖੂਨ ਦੀ ਸਫ਼ਾਈ",
      "desc": "ਕੋਲੈਸਟ੍ਰੋਲ ਕੰਟਰੋਲ, ਨਾੜੀਆਂ ਦੀ ਮਜ਼ਬੂਤੀ ਅਤੇ ਸਰੀਰ ਵਿੱਚੋਂ ਜ਼ਹਿਰੀਲੇ ਤੱਤ ਬਾਹਰ।",
      "meals": [
        {
          "type": "ਸਵੇਰ ਦਾ ਅੰਮ੍ਰਿਤ (ਡਿਟੌਕਸ)",
          "name": "ਭਿੱਜੇ ਅਖਰੋਟ, ਬਦਾਮ ਤੇ ਮੁਨੱਕਾ ਪਾਣੀ",
          "qty": "200 ਮਿ.ਲੀ. ਪਾਣੀ + ਗਿਰੀਆਂ",
          "desc": "ਰਾਤ ਭਰ ਕੱਚ ਦੇ ਭਾਂਡੇ ਵਿੱਚ ਭਿੱਜੇ 4 ਬਦਾਮ, 1 ਅਖਰੋਟ ਤੇ 3 ਮੁਨੱਕੇ।",
          "benefit": "ਦਿਲ ਦੀਆਂ ਨਾੜੀਆਂ ਨੂੰ ਲਚਕੀਲਾ ਬਣਾਉਂਦਾ ਹੈ ਅਤੇ ਓਮੇਗਾ-3 ਪ੍ਰਦਾਨ ਕਰਦਾ ਹੈ।",
          "chefSecret": "ਬਦਾਮ ਦਾ ਛਿਲਕਾ ਲਾਹ ਕੇ ਖਾਓ।"
        },
        {
          "type": "ਸਵੇਰ ਦਾ ਨਾਸ਼ਤਾ",
          "name": "ਸਟੀਲ-ਕੱਟ ਓਟਸ ਤੇ ਸਬਜ਼ੀਆਂ ਦਾ ਮਸਾਲਾ ਦਲੀਆ",
          "qty": "1 ਵੱਡਾ ਬਾਊਲ (250 ਗ੍ਰਾਮ)",
          "desc": "ਸਟੀਲ ਕੱਟ ਓਟਸ, ਗਾਜਰ, ਮਟਰ, ਸ਼ਿਮਲਾ ਮਿਰਚ, ਹਲਦੀ ਤੇ ਰਾਈ ਤੜਕਾ।",
          "benefit": "ਬੀਟਾ-ਗਲੂਕਨ ਫਾਈਬਰ ਬੁਰੇ ਕੋਲੈਸਟ੍ਰੋਲ (LDL) ਨੂੰ ਘਟਾਉਂਦਾ ਹੈ।",
          "chefSecret": "1 ਚਮਚ ਭੁੰਨੀ ਅਲਸੀ ਦਾ ਪਾਊਡਰ ਉੱਪਰ ਛਿੜਕੋ।"
        },
        {
          "type": "ਦੁਪਹਿਰ ਤੋਂ ਪਹਿਲਾਂ",
          "name": "ਕੱਚੀ ਹਲਦੀ ਤੇ ਚੁਕੰਦਰ ਦਾ ਡਿਟੌਕਸ ਜੂਸ",
          "qty": "150 ਮਿ.ਲੀ.",
          "desc": "ਚੁਕੰਦਰ, ਖੀਰਾ, ਅੱਧਾ ਸੇਬ ਤੇ ਕੱਚੀ ਹਲਦੀ ਦਾ ਤਾਜ਼ਾ ਜੂਸ।",
          "benefit": "ਨਾਈਟ੍ਰਿਕ ਆਕਸਾਈਡ ਵਧਾਉਂਦਾ ਹੈ, ਬੀਪੀ ਨਾਰਮਲ ਰੱਖਦਾ ਹੈ।",
          "chefSecret": "ਕਾਲੀ ਮਿਰਚ ਦੀ ਇੱਕ ਚੁਟਕੀ ਕਰਕਿਊਮਿਨ ਦਾ ਸੋਖਣ 2000% ਵਧਾਉਂਦੀ ਹੈ।"
        },
        {
          "type": "ਸ਼ਾਹੀ ਆਯੁਰਵੇਦਿਕ ਥਾਲੀ (ਦੁਪਹਿਰ ਦਾ ਖਾਣਾ)",
          "name": "ਰਾਜਗੀਰਾ ਕੜ੍ਹੀ + ਮੇਥੀ ਸਬਜ਼ੀ + ਲਾਲ ਚੌਲ / ਜਵਾਰ ਰੋਟੀ",
          "qty": "ਪੂਰੀ ਥਾਲੀ",
          "desc": "ਘੱਟ ਤੇਲ ਵਾਲੀ ਬੇਸਨ/ਰਾਜਗੀਰਾ ਕੜ੍ਹੀ, ਹਰੀ ਮੇਥੀ ਸਬਜ਼ੀ ਤੇ ਜਵਾਰ ਰੋਟੀ।",
          "benefit": "ਖੂਨ ਵਿੱਚੋਂ ਐਸਿਡ ਘਟਾਉਂਦੀ ਹੈ ਅਤੇ ਦਿਲ ਨੂੰ ਸੁਰੱਖਿਅਤ ਰੱਖਦੀ ਹੈ।",
          "chefSecret": "ਕੜ੍ਹੀ ਵਿੱਚ ਮੇਥੀ ਦਾਣਾ ਤੇ ਹਿੰਗ ਦਾ ਤੜਕਾ ਜ਼ਰੂਰ ਲਗਾਓ।"
        },
        {
          "type": "ਸ਼ਾਮ ਦੀ ਤਾਜ਼ਗੀ (ਹਲਕਾ ਨਾਸ਼ਤਾ)",
          "name": "ਸੂਰਜਮੁਖੀ ਤੇ ਕੱਦੂ ਦੇ ਭੁੰਨੇ ਬੀਜ + ਕੈਮੋਮਾਈਲ ਚਾਹ",
          "qty": "30 ਗ੍ਰਾਮ ਮਿਕਸ ਬੀਜ",
          "desc": "ਹਲਕੇ ਸੇਂਧਾ ਨਮਕ ਵਿੱਚ ਭੁੰਨੇ ਕੱਦੂ ਤੇ ਸੂਰਜਮੁਖੀ ਦੇ ਬੀਜ।",
          "benefit": "ਮੈਗਨੀਸ਼ੀਅਮ ਤੇ ਜ਼ਿੰਕ ਦਾ ਪਾਵਰਹਾਊਸ, ਬਲੱਡ ਪ੍ਰੈਸ਼ਰ ਕੰਟਰੋਲ ਕਰਦਾ ਹੈ।",
          "chefSecret": "ਬੀਜਾਂ ਨੂੰ ਹਲਕੀ ਅੱਗ 'ਤੇ 2 ਮਿੰਟ ਸੁੱਕਾ ਭੁੰਨੋ।"
        },
        {
          "type": "ਰਾਤ ਦਾ ਹਲਕਾ ਖਾਣਾ (ਸਿਹਤਮੰਦ ਡਿਨਰ)",
          "name": "ਕੱਦੂ (ਸੀਤਾਫਲ) ਤੇ ਮੂੰਗੀ ਦਾ ਮਲਾਈਦਾਰ ਸੂਪ",
          "qty": "350 ਮਿ.ਲੀ. ਬਾਊਲ",
          "desc": "ਪੀਲਾ ਕੱਦੂ, ਧੋਤੀ ਮੂੰਗੀ ਦਾਲ, ਅਦਰਕ ਤੇ ਕਾਲੀ ਮਿਰਚ ਦਾ ਗਰਮ ਸੂਪ।",
          "benefit": "ਦਿਲ 'ਤੇ ਜ਼ੀਰੋ ਤਣਾਅ, ਆਸਾਨੀ ਨਾਲ ਪਚਣਯੋਗ।",
          "chefSecret": "ਸਰਵ ਕਰਦੇ ਸਮੇਂ ਧਨੀਆ ਪੱਤੇ ਤੇ ਨਿੰਬੂ ਰਸ ਮਿਲਾਓ।"
        },
        {
          "type": "ਸੌਣ ਵੇਲੇ ਓਜਸ ਪੀਣ ਵਾਲਾ ਦੁੱਧ",
          "name": "ਅਰਜੁਨ ਦੀ ਛਿੱਲ ਦਾ ਕੋਸਾ ਕਾੜ੍ਹਾ ਜਾਂ ਦੁੱਧ",
          "qty": "150 ਮਿ.ਲੀ.",
          "desc": "ਅਰਜੁਨ ਦੀ ਛਿੱਲ ਨੂੰ ਦੁੱਧ-ਪਾਣੀ ਵਿੱਚ ਉਬਾਲ ਕੇ ਤਿਆਰ ਕੀਤਾ ਦਿਲ ਦਾ ਟੌਨਿਕ।",
          "benefit": "ਦਿਲ ਦੀਆਂ ਮਾਸਪੇਸ਼ੀਆਂ ਨੂੰ ਮਜ਼ਬੂਤ ਕਰਦਾ ਹੈ।",
          "chefSecret": "ਹਲਕੀ ਮਿਸ਼ਰੀ ਜਾਂ ਬਿਨਾਂ ਮਿੱਠੇ ਤੋਂ ਲਵੋ।"
        }
      ]
    },
    "thursday": {
      "name": "ਵੀਰਵਾਰ",
      "title": "ਹਾਰਮੋਨ ਸੰਤੁਲਨ ਤੇ ਤਣਾਅ ਮੁਕਤੀ (ਓਜਸ ਵਾਧਾ)",
      "desc": "ਤਣਾਅ ਘਟਾਉਣ, ਥਾਇਰਾਇਡ ਠੀਕ ਰੱਖਣ ਅਤੇ ਤਾਜ਼ਗੀ ਭਰਪੂਰ ਖੁਰਾਕ।",
      "meals": [
        {
          "type": "ਸਵੇਰ ਦਾ ਅੰਮ੍ਰਿਤ (ਡਿਟੌਕਸ)",
          "name": "ਕੋਸਾ ਨਿੰਬੂ-ਸ਼ਹਿਦ ਪਾਣੀ ਦਾਲਚੀਨੀ ਨਾਲ",
          "qty": "250 ਮਿ.ਲੀ.",
          "desc": "ਕੋਸੇ ਪਾਣੀ ਵਿੱਚ ਅੱਧਾ ਨਿੰਬੂ, ਅੱਧਾ ਚਮਚ ਸ਼ੁੱਧ ਸ਼ਹਿਦ ਤੇ ਇੱਕ ਚੁਟਕੀ ਦਾਲਚੀਨੀ।",
          "benefit": "ਸਰੀਰ ਵਿੱਚੋਂ ਫੈਟ ਬਰਨ ਸ਼ੁਰੂ ਕਰਦਾ ਹੈ ਤੇ ਮੈਟਾਬੋਲਿਜ਼ਮ ਤੇਜ਼ ਕਰਦਾ ਹੈ।",
          "chefSecret": "ਪਾਣੀ ਜ਼ਿਆਦਾ ਗਰਮ ਨਾ ਹੋਵੇ, ਸ਼ਹਿਦ ਗਰਮ ਪਾਣੀ ਵਿੱਚ ਨਹੀਂ ਪਾਈਦਾ।"
        },
        {
          "type": "ਸਵੇਰ ਦਾ ਨਾਸ਼ਤਾ",
          "name": "ਸਟੀਮਡ ਰਾਗੀ ਤੇ ਸਬਜ਼ੀਆਂ ਦੀ ਇਡਲੀ ਨਾਰੀਅਲ ਚਟਨੀ ਨਾਲ",
          "qty": "3 ਨਰਮ ਇਡਲੀਆਂ + ਤਾਜ਼ੀ ਚਟਨੀ",
          "desc": "ਰਾਗੀ ਤੇ ਸੂਜੀ ਵਿੱਚ ਬਾਰੀਕ ਗਾਜਰ, ਬੀਨਜ਼ ਤੇ ਕੜੀ ਪੱਤਾ ਮਿਲਾ ਕੇ ਬਣੀ ਇਡਲੀ।",
          "benefit": "ਕੈਲਸ਼ੀਅਮ ਤੇ ਆਇਰਨ ਨਾਲ ਭਰਪੂਰ, ਗਲੂਟਨ-ਮੁਕਤ ਸੁਪਰਫੂਡ।",
          "chefSecret": "ਚਟਨੀ ਵਿੱਚ ਭੁੱਜੇ ਛੋਲਿਆਂ ਦੀ ਦਾਲ ਪਾਓ — ਟੈਕਸਚਰ ਕ੍ਰੀਮੀ ਬਣੇਗਾ।"
        },
        {
          "type": "ਦੁਪਹਿਰ ਤੋਂ ਪਹਿਲਾਂ",
          "name": "ਪਪੀਤਾ ਤੇ ਚਿਆ ਸੀਡਜ਼ ਕਟੋਰੀ",
          "qty": "150 ਗ੍ਰਾਮ ਤਾਜ਼ਾ ਕੱਟਿਆ ਪਪੀਤਾ",
          "desc": "ਪੱਕੇ ਪਪੀਤੇ 'ਤੇ ਭੁੰਨੀ ਚੀਆ ਸੀਡਜ਼ ਤੇ ਨਿੰਬੂ ਰਸ।",
          "benefit": "ਪੈਪਿਨ ਐਂਜ਼ਾਈਮ ਪਾਚਨ ਕਿਰਿਆ ਨੂੰ ਬਿਲਕੁਲ ਠੀਕ ਕਰਦਾ ਹੈ।",
          "chefSecret": "ਹਲਕਾ ਕਾਲਾ ਨਮਕ ਪਾਉਣ ਨਾਲ ਸਵਾਦ ਦੁੱਗਣਾ ਹੁੰਦਾ ਹੈ।"
        },
        {
          "type": "ਸ਼ਾਹੀ ਆਯੁਰਵੇਦਿਕ ਥਾਲੀ (ਦੁਪਹਿਰ ਦਾ ਖਾਣਾ)",
          "name": "ਪਰਵਲ-ਆਲੂ ਦੇਸੀ ਸਬਜ਼ੀ + ਪੀਲੀ ਮੂੰਗੀ ਦਾਲ + 2 ਮਲਟੀਗ੍ਰੇਨ ਰੋਟੀ",
          "qty": "ਪੂਰੀ ਥਾਲੀ",
          "desc": "ਜੀਰੇ ਵਿੱਚ ਬਣੀ ਪਰਵਲ ਦੀ ਸਬਜ਼ੀ, ਹਿੰਗ ਵਾਲੀ ਮੂੰਗੀ ਦਾਲ ਤੇ ਮਲਟੀਗ੍ਰੇਨ ਰੋਟੀ।",
          "benefit": "ਪਿੱਤ ਸ਼ਾਂਤ ਕਰਦੀ ਹੈ ਅਤੇ ਲਿਵਰ ਦੇ ਐਂਜ਼ਾਈਮਜ਼ ਨੂੰ ਸੰਤੁਲਿਤ ਰੱਖਦੀ ਹੈ।",
          "chefSecret": "ਪਰਵਲ ਨੂੰ ਹਲਕਾ ਕੱਟ ਲਗਾ ਕੇ ਭੁੰਨੋ।"
        },
        {
          "type": "ਸ਼ਾਮ ਦੀ ਤਾਜ਼ਗੀ (ਹਲਕਾ ਨਾਸ਼ਤਾ)",
          "name": "ਸੱਤੂ ਡ੍ਰਿੰਕ ਨਿੰਬੂ ਤੇ ਜੀਰੇ ਨਾਲ",
          "qty": "250 ਮਿ.ਲੀ. ਗਲਾਸ",
          "desc": "2 ਚਮਚ ਜੌਂ-ਛੋਲੇ ਦਾ ਸੱਤੂ, ਠੰਡਾ ਪਾਣੀ, ਨਿੰਬੂ, ਕਾਲਾ ਨਮਕ ਤੇ ਪੁਦੀਨਾ।",
          "benefit": "ਕੁਦਰਤੀ ਪ੍ਰੋਟੀਨ ਸ਼ੇਕ — 100% ਸ਼ੁੱਧ ਦੇਸੀ ਠੰਡਕ ਤੇ ਤਾਕਤ।",
          "chefSecret": "ਚੰਗੀ ਤਰ੍ਹਾਂ ਘੋਲੋ ਤਾਂ ਜੋ ਗੰਢਾਂ ਨਾ ਬਣਨ।"
        },
        {
          "type": "ਰਾਤ ਦਾ ਹਲਕਾ ਖਾਣਾ (ਸਿਹਤਮੰਦ ਡਿਨਰ)",
          "name": "ਮੂੰਗੀ ਦਾਲ ਤੇ ਪਾਲਕ ਦੀ ਨਰਮ ਖਿਚੜੀ ਘਿਓ ਨਾਲ",
          "qty": "300 ਗ੍ਰਾਮ ਬਾਊਲ",
          "desc": "ਛਿਲਕੇ ਵਾਲੀ ਮੂੰਗੀ ਦਾਲ, ਪਾਲਕ ਤੇ ਚੌਲਾਂ ਦੀ ਪਤਲੀ ਖਿਚੜੀ ਉੱਤੇ 1 ਚਮਚ ਦੇਸੀ ਘਿਓ।",
          "benefit": "ਸਰੀਰ ਨੂੰ ਡੂੰਘੀ ਸ਼ਾਂਤੀ ਦਿੰਦੀ ਹੈ, ਕਬਜ਼ ਤੇ ਗੈਸ ਦੂਰ ਕਰਦੀ ਹੈ।",
          "chefSecret": "ਤੜਕੇ ਵਿੱਚ ਹਿੰਗ ਤੇ ਜੀਰਾ ਜ਼ਿਆਦਾ ਮਾਤਰਾ ਵਿੱਚ ਵਰਤੋ।"
        },
        {
          "type": "ਸੌਣ ਵੇਲੇ ਓਜਸ ਪੀਣ ਵਾਲਾ ਦੁੱਧ",
          "name": "ਅਸ਼ਵਗੰਧਾ ਤੇ ਦਾਲਚੀਨੀ ਕੋਸਾ ਦੁੱਧ",
          "qty": "150 ਮਿ.ਲੀ.",
          "desc": "ਦੁੱਧ ਵਿੱਚ ਅੱਧਾ ਚਮਚ ਅਸ਼ਵਗੰਧਾ ਚੂਰਨ ਤੇ ਚੁਟਕੀ ਦਾਲਚੀਨੀ।",
          "benefit": "ਕੋਰਟੀਸੋਲ ਘਟਾਉਂਦਾ ਹੈ, ਹਾਰਮੋਨਜ਼ ਨੂੰ ਸੰਤੁਲਿਤ ਕਰਦਾ ਹੈ।",
          "chefSecret": "ਦੁੱਧ ਨੂੰ 3 ਵਾਰ ਉਬਾਲ ਦਿਓ।"
        }
      ]
    },
    "friday": {
      "name": "ਸ਼ੁੱਕਰਵਾਰ",
      "title": "ਸ਼ੂਗਰ ਕੰਟਰੋਲ ਤੇ ਲਿਵਰ ਦੀ ਸਫ਼ਾਈ",
      "desc": "ਇੰਸੁਲਿਨ ਵਧਾਉਣ ਅਤੇ ਲਿਵਰ ਦੀ ਚਰਬੀ ਪਿਘਲਾਉਣ ਦਾ ਖਾਸ ਪਲਾਨ।",
      "meals": [
        {
          "type": "ਸਵੇਰ ਦਾ ਅੰਮ੍ਰਿਤ (ਡਿਟੌਕਸ)",
          "name": "ਕਰੇਲਾ-ਜਾਮੁਣ ਤੇ ਖੀਰਾ ਮੈਟਾਬੋਲਿਕ ਸ਼ੌਟ",
          "qty": "70 ਮਿ.ਲੀ. ਅਰਕ",
          "desc": "ਛੋਟਾ ਕਰੇਲਾ, ਜਾਮੁਣ ਸਿਰਕਾ ਤੇ ਖੀਰੇ ਦਾ ਤਾਜ਼ਾ ਕੱਢਿਆ ਰਸ।",
          "benefit": "ਖਾਲੀ ਪੇਟ ਬਲੱਡ ਸ਼ੂਗਰ ਨੂੰ ਤੁਰੰਤ ਕੰਟਰੋਲ ਕਰਦਾ ਹੈ।",
          "chefSecret": "1 ਚੁਟਕੀ ਸੇਂਧਾ ਨਮਕ ਪਾਉਣ ਨਾਲ ਕੌੜਾਪਨ ਘੱਟ ਜਾਂਦਾ ਹੈ।"
        },
        {
          "type": "ਸਵੇਰ ਦਾ ਨਾਸ਼ਤਾ",
          "name": "ਬੇਸਨ-ਪਾਲਕ ਸਬਜ਼ੀ ਚੀਲਾ ਟਮਾਟਰ ਚਟਨੀ ਨਾਲ",
          "qty": "2 ਕਰਿਸਪੀ ਚੀਲੇ",
          "desc": "ਚਨੇ ਦੇ ਬੇਸਨ ਵਿੱਚ ਬਾਰੀਕ ਪਾਲਕ, ਪਿਆਜ਼, ਅਜਵਾਇਣ ਤੇ ਹਿੰਗ ਤੜਕਾ।",
          "benefit": "ਘੱਟ ਗਲਾਈਸੈਮਿਕ ਇੰਡੈਕਸ, ਫਾਈਬਰ ਤੇ ਪ੍ਰੋਟੀਨ ਦਾ ਵਧੀਆ ਸਰੋਤ।",
          "chefSecret": "ਅਜਵਾਇਣ ਹੱਥ ਨਾਲ ਮਸਲ ਕੇ ਪਾਓ — ਗੈਸ ਨਹੀਂ ਬਣੇਗੀ।"
        },
        {
          "type": "ਦੁਪਹਿਰ ਤੋਂ ਪਹਿਲਾਂ",
          "name": "ਆਂਵਲਾ ਕੈਂਡੀ ਜਾਂ ਤਾਜ਼ਾ ਅਮਰੂਦ ਕਾਲੀ ਮਿਰਚ ਨਾਲ",
          "qty": "1 ਦਰਮਿਆਨਾ ਅਮਰੂਦ",
          "desc": "ਤਾਜ਼ਾ ਅਮਰੂਦ ਕਾਲੇ ਨਮਕ ਤੇ ਭੁੰਨੇ ਜੀਰੇ ਨਾਲ।",
          "benefit": "ਉੱਚ ਫਾਈਬਰ ਸ਼ੂਗਰ ਦੇ ਸੋਖਣ ਨੂੰ ਹੌਲੀ ਕਰਦਾ ਹੈ।",
          "chefSecret": "ਬੀਜ ਚਬਾ ਕੇ ਨਾ ਖਾਓ, ਨਰਮ ਹਿੱਸਾ ਚੰਗੀ ਤਰ੍ਹਾਂ ਚਬਾਓ।"
        },
        {
          "type": "ਸ਼ਾਹੀ ਆਯੁਰਵੇਦਿਕ ਥਾਲੀ (ਦੁਪਹਿਰ ਦਾ ਖਾਣਾ)",
          "name": "ਮੇਥੀ-ਮੂੰਗੀ ਦਾਲ + ਕਰੇਲਾ ਫਰਾਈ + 2 ਜਵਾਰ ਰੋਟੀ + ਖੀਰਾ ਰਾਇਤਾ",
          "qty": "ਪੂਰੀ ਥਾਲੀ",
          "desc": "ਘੱਟ ਕੌੜਾ ਕਰੇਲਾ, ਮੇਥੀ ਵਾਲੀ ਪੀਲੀ ਦਾਲ, 2 ਗਰਮ ਜਵਾਰ ਰੋਟੀਆਂ ਤੇ ਖੀਰੇ ਦਾ ਰਾਇਤਾ।",
          "benefit": "ਸ਼ੂਗਰ ਦੇ ਮਰੀਜ਼ਾਂ ਲਈ ਰਾਮਬਾਣ ਥਾਲੀ।",
          "chefSecret": "ਕਰੇਲੇ ਨੂੰ ਕੱਟ ਕੇ ਨਮਕ ਲਗਾ ਕੇ 15 ਮਿੰਟ ਧੁੱਪੇ ਰੱਖੋ।"
        },
        {
          "type": "ਸ਼ਾਮ ਦੀ ਤਾਜ਼ਗੀ (ਹਲਕਾ ਨਾਸ਼ਤਾ)",
          "name": "ਭੁੰਨੇ ਹੋਏ ਸੋਇਆਬੀਨ ਦਾਣੇ ਤੇ ਗ੍ਰੀਨ ਟੀ",
          "qty": "35 ਗ੍ਰਾਮ",
          "desc": "ਹਲਕੇ ਭੁੰਨੇ ਸੋਇਆਬੀਨ ਜਾਂ ਛੋਲੇ ਕਾਲੀ ਮਿਰਚ ਨਾਲ।",
          "benefit": "ਸ਼ਾਮ ਦੀ ਭੁੱਖ ਲਈ 13 ਗ੍ਰਾਮ ਸ਼ੁੱਧ ਪਲਾਂਟ ਪ੍ਰੋਟੀਨ।",
          "chefSecret": "ਕੁਰਕੁਰਾ ਰੱਖਣ ਲਈ ਏਅਰ-ਟਾਈਟ ਡੱਬੇ ਵਿੱਚ ਰੱਖੋ।"
        },
        {
          "type": "ਰਾਤ ਦਾ ਹਲਕਾ ਖਾਣਾ (ਸਿਹਤਮੰਦ ਡਿਨਰ)",
          "name": "ਮਸ਼ਰੂਮ ਜਾਂ ਪਨੀਰ ਤੇ ਸਬਜ਼ੀਆਂ ਦਾ ਕਲੀਅਰ ਸੂਪ",
          "qty": "350 ਮਿ.ਲੀ. ਬਾਊਲ",
          "desc": "ਤਾਜ਼ਾ ਪਨੀਰ ਕਿਊਬਸ, ਬਰੋਕਲੀ, ਗਾਜਰ ਤੇ ਕਾਲੀ ਮਿਰਚ ਦਾ ਗਰਮ ਸੂਪ।",
          "benefit": "ਰਾਤ ਨੂੰ ਸ਼ੂਗਰ ਸਪਾਈਕ ਨਹੀਂ ਹੁੰਦੀ, ਸਰੀਰ ਚਰਬੀ ਪਿਘਲਾਉਂਦਾ ਹੈ।",
          "chefSecret": "ਅਦਰਕ ਦਾ ਰਸ ਅਖੀਰ ਵਿੱਚ ਪਾਓ।"
        },
        {
          "type": "ਸੌਣ ਵੇਲੇ ਓਜਸ ਪੀਣ ਵਾਲਾ ਦੁੱਧ",
          "name": "ਤ੍ਰਿਫਲਾ ਕੋਸਾ ਪਾਣੀ ਜਾਂ ਹਲਦੀ ਦੁੱਧ",
          "qty": "150 ਮਿ.ਲੀ.",
          "desc": "ਅੱਧਾ ਚਮਚ ਤ੍ਰਿਫਲਾ ਚੂਰਨ ਕੋਸੇ ਪਾਣੀ ਵਿੱਚ।",
          "benefit": "ਪੇਟ ਦੀ ਪੂਰੀ ਸਫ਼ਾਈ ਕਰਦਾ ਹੈ ਅਤੇ ਅੱਖਾਂ ਤੇ ਵਾਲਾਂ ਲਈ ਲਾਹੇਵੰਦ ਹੈ।",
          "chefSecret": "ਸੌਣ ਤੋਂ 30 ਮਿੰਟ ਪਹਿਲਾਂ ਲਵੋ।"
        }
      ]
    },
    "saturday": {
      "name": "ਸ਼ਨਿੱਚਰਵਾਰ",
      "title": "ਹੱਡੀਆਂ ਤੇ ਜੋੜਾਂ ਦੀ ਮਜ਼ਬੂਤੀ",
      "desc": "ਕੈਲਸ਼ੀਅਮ, ਮੈਗਨੀਸ਼ੀਅਮ ਅਤੇ ਜੋੜਾਂ ਦੇ ਦਰਦ ਤੋਂ ਰਾਹਤ ਵਾਲਾ ਦੇਸੀ ਆਹਾਰ।",
      "meals": [
        {
          "type": "ਸਵੇਰ ਦਾ ਅੰਮ੍ਰਿਤ (ਡਿਟੌਕਸ)",
          "name": "ਕੱਚੀ ਹਲਦੀ ਤੇ ਅਦਰਕ ਦਾ ਕਰਕਿਊਮਿਨ ਅਰਕ",
          "qty": "200 ਮਿ.ਲੀ.",
          "desc": "ਕੱਚੀ ਹਲਦੀ, ਅਦਰਕ ਤੇ ਕਾਲੀ ਮਿਰਚ ਨੂੰ ਉਬਾਲ ਕੇ ਛਾਣ ਕੇ ਲਵੋ।",
          "benefit": "ਜੋੜਾਂ ਦੇ ਦਰਦ ਤੇ ਸੋਜਸ਼ ਵਿੱਚ ਤੁਰੰਤ ਰਾਹਤ ਦਿੰਦਾ ਹੈ।",
          "chefSecret": "1 ਬੂੰਦ ਸ਼ੁੱਧ ਦੇਸੀ ਘਿਓ ਮਿਲਾਓ — ਕਰਕਿਊਮਿਨ ਫੈਟ ਵਿੱਚ ਘੁਲਦਾ ਹੈ।"
        },
        {
          "type": "ਸਵੇਰ ਦਾ ਨਾਸ਼ਤਾ",
          "name": "ਦੇਸੀ ਪਨੀਰ ਭੁਰਜੀ ਟਮਾਟਰ ਨਾਲ ਤੇ 2 ਮਲਟੀਗ੍ਰੇਨ ਟੋਸਟ",
          "qty": "1 ਪਲੇਟ (180 ਗ੍ਰਾਮ)",
          "desc": "100 ਗ੍ਰਾਮ ਤਾਜ਼ਾ ਦੇਸੀ ਪਨੀਰ, ਟਮਾਟਰ, ਹਰੀ ਮਿਰਚ, ਧਨੀਆ ਤੇ ਹਲਦੀ।",
          "benefit": "20 ਗ੍ਰਾਮ ਪ੍ਰੋਟੀਨ ਅਤੇ ਉੱਚ ਕੈਲਸ਼ੀਅਮ ਹੱਡੀਆਂ ਲਈ।",
          "chefSecret": "ਪਨੀਰ ਨੂੰ ਜ਼ਿਆਦਾ ਨਾ ਪਕਾਓ, ਨਰਮ ਰੱਖੋ।"
        },
        {
          "type": "ਦੁਪਹਿਰ ਤੋਂ ਪਹਿਲਾਂ",
          "name": "ਤਿਲ ਤੇ ਗੁੜ ਦੀ ਛੋਟੀ ਪਿੰਨੀ + ਕੋਸਾ ਪਾਣੀ",
          "qty": "1 ਛੋਟੀ ਪਿੰਨੀ (25 ਗ੍ਰਾਮ)",
          "desc": "ਕਾਲੇ ਜਾਂ ਚਿੱਟੇ ਤਿਲ ਦੇਸੀ ਗੁੜ ਵਿੱਚ ਬਣੇ ਹੋਏ।",
          "benefit": "ਦੁੱਧ ਨਾਲੋਂ ਵੀ ਵੱਧ ਕੈਲਸ਼ੀਅਮ ਪ੍ਰਦਾਨ ਕਰਦਾ ਹੈ।",
          "chefSecret": "ਤਿਲਾਂ ਨੂੰ ਹਲਕਾ ਭੁੰਨ ਕੇ ਗੁੜ ਵਿੱਚ ਮਿਲਾਓ।"
        },
        {
          "type": "ਸ਼ਾਹੀ ਆਯੁਰਵੇਦਿਕ ਥਾਲੀ (ਦੁਪਹਿਰ ਦਾ ਖਾਣਾ)",
          "name": "ਕਾਲੇ ਛੋਲੇ ਮਸਾਲਾ + ਘੀਆ ਰਾਇਤਾ + 2 ਰਾਗੀ-ਜਵਾਰ ਰੋਟੀ",
          "qty": "ਪੂਰੀ ਥਾਲੀ",
          "desc": "ਦੇਸੀ ਕਾਲੇ ਛੋਲੇ, ਘੀਆ ਰਾਇਤਾ, ਕੱਚਾ ਸਲਾਦ ਤੇ ਰਾਗੀ ਦੀ ਰੋਟੀ।",
          "benefit": "ਹੱਡੀਆਂ ਦੀ ਘਣਤਾ ਵਧਾਉਂਦਾ ਹੈ ਅਤੇ ਜੋੜਾਂ ਨੂੰ ਮਜ਼ਬੂਤ ਕਰਦਾ ਹੈ।",
          "chefSecret": "ਛੋਲਿਆਂ ਵਿੱਚ ਸੁੱਕਾ ਆਂਵਲਾ ਪਾ ਕੇ ਉਬਾਲੋ — ਕਾਲਾ ਰੰਗ ਤੇ ਆਇਰਨ ਵਧੇਗਾ।"
        },
        {
          "type": "ਸ਼ਾਮ ਦੀ ਤਾਜ਼ਗੀ (ਹਲਕਾ ਨਾਸ਼ਤਾ)",
          "name": "ਮਖਾਣਾ ਖੀਰ (ਬਿਨਾਂ ਖੰਡ ਤੋਂ, ਖਜੂਰ ਵਾਲੀ)",
          "qty": "150 ਮਿ.ਲੀ. ਬਾਊਲ",
          "desc": "ਭੁੰਨੇ ਮਖਾਣੇ ਨੂੰ ਦੁੱਧ ਵਿੱਚ ਪਕਾ ਕੇ ਖਜੂਰ ਨਾਲ ਮਿੱਠਾ ਕੀਤਾ ਹੋਇਆ।",
          "benefit": "ਮਿੱਠੇ ਦੀ ਭੁੱਖ ਮਿਟਾਉਂਦਾ ਹੈ ਬਿਨਾਂ ਭਾਰ ਵਧਾਏ।",
          "chefSecret": "ਇਲਾਇਚੀ ਪਾਊਡਰ ਜ਼ਰੂਰ ਮਿਲਾਓ।"
        },
        {
          "type": "ਰਾਤ ਦਾ ਹਲਕਾ ਖਾਣਾ (ਸਿਹਤਮੰਦ ਡਿਨਰ)",
          "name": "ਮੂੰਗੀ ਦਾਲ ਪਾਲਕ ਸੂਪ ਤੇ 1 ਜਵਾਰ ਫੁਲਕਾ",
          "qty": "300 ਮਿ.ਲੀ. ਬਾਊਲ",
          "desc": "ਹਲਕੀ ਦਾਲ-ਪਾਲਕ ਦਾ ਕਰੀਮੀ ਸੂਪ ਕਾਲੀ ਮਿਰਚ ਨਾਲ।",
          "benefit": "ਜੋੜਾਂ ਦੇ ਯੂਰਿਕ ਐਸਿਡ ਨੂੰ ਸਾਫ਼ ਕਰਦਾ ਹੈ।",
          "chefSecret": "ਲਸਣ ਦਾ ਹਲਕਾ ਤੜਕਾ ਲਗਾਓ।"
        },
        {
          "type": "ਸੌਣ ਵੇਲੇ ਓਜਸ ਪੀਣ ਵਾਲਾ ਦੁੱਧ",
          "name": "ਗੋਂਦ ਕਤੀਰਾ ਜਾਂ ਕੇਸਰ ਵਾਲਾ ਕੋਸਾ ਦੁੱਧ",
          "qty": "150 ਮਿ.ਲੀ.",
          "desc": "ਦੁੱਧ ਵਿੱਚ 2 ਧਾਗੇ ਕੇਸਰ ਤੇ ਚੁਟਕੀ ਇਲਾਇਚੀ।",
          "benefit": "ਜੋੜਾਂ ਦੇ ਦਰਦ ਤੋਂ ਆਰਾਮ ਅਤੇ ਮਾਨਸਿਕ ਸ਼ਾਂਤੀ।",
          "chefSecret": "ਕੇਸਰ ਨੂੰ 2 ਚਮਚ ਗਰਮ ਦੁੱਧ ਵਿੱਚ ਪਹਿਲਾਂ ਭਿਓਂ ਲਓ।"
        }
      ]
    },
    "sunday": {
      "name": "ਐਤਵਾਰ",
      "title": "ਸ਼ਾਹੀ ਸਾਤਵਿਕ ਸਿਹਤਮੰਦ ਦਾਅਵਤ",
      "desc": "ਬਿਨਾਂ ਮੈਦੇ ਤੇ ਬਿਨਾਂ ਕਰੀਮ ਤੋਂ ਰਾਇਲ ਸਵਾਦਿਸ਼ਟ ਦੇਸੀ ਖਾਣਾ।",
      "meals": [
        {
          "type": "ਸਵੇਰ ਦਾ ਅੰਮ੍ਰਿਤ (ਡਿਟੌਕਸ)",
          "name": "ਤਾਜ਼ਾ ਕੋਮਲ ਨਾਰੀਅਲ ਪਾਣੀ ਨਿੰਬੂ ਤੇ ਸੇਂਧਾ ਨਮਕ ਨਾਲ",
          "qty": "250 ਮਿ.ਲੀ.",
          "desc": "ਤਾਜ਼ੇ ਨਾਰੀਅਲ ਦਾ ਪਾਣੀ ਚੁਟਕੀ ਸੇਂਧਾ ਨਮਕ ਤੇ ਨਿੰਬੂ ਰਸ ਨਾਲ।",
          "benefit": "ਸਾਰੇ ਅੰਗਾਂ ਨੂੰ ਨਵਿਆਉਂਦਾ ਹੈ ਅਤੇ ਹਫ਼ਤੇ ਦੀ ਥਕਾਵਟ ਮਿਟਾਉਂਦਾ ਹੈ।",
          "chefSecret": "ਮਲਾਈ ਹਲਕੀ ਖਾਓ।"
        },
        {
          "type": "ਸਵੇਰ ਦਾ ਨਾਸ਼ਤਾ",
          "name": "ਮਿਲਟਸ ਤੇ ਸਬਜ਼ੀਆਂ ਦਾ ਉਪਮਾ ਭੁੰਨੇ ਕਾਜੂ ਨਾਲ",
          "qty": "1 ਵੱਡਾ ਬਾਊਲ (220 ਗ੍ਰਾਮ)",
          "desc": "ਕੰਗਣੀ ਜਾਂ ਕੋਧਰਾ ਮਿਲਟ, ਗਾਜਰ, ਮਟਰ, ਰਾਈ, ਕੜੀ ਪੱਤਾ ਤੇ 4 ਭੁੰਨੇ ਕਾਜੂ।",
          "benefit": "ਹੌਲੀ-ਹੌਲੀ ਊਰਜਾ ਛੱਡਦਾ ਹੈ, ਐਤਵਾਰ ਦਾ ਸ਼ਾਹੀ ਨਾਸ਼ਤਾ।",
          "chefSecret": "ਮਿਲਟਸ ਨੂੰ ਪਕਾਉਣ ਤੋਂ ਪਹਿਲਾਂ ਸੁੱਕਾ ਭੁੰਨ ਲਓ।"
        },
        {
          "type": "ਦੁਪਹਿਰ ਤੋਂ ਪਹਿਲਾਂ",
          "name": "ਸੰਤਰਾ ਤੇ ਅਨਾਰ ਦਾ ਤਾਜ਼ਾ ਫਰੂਟ ਬਾਊਲ",
          "qty": "1 ਬਾਊਲ",
          "desc": "ਤਾਜ਼ੇ ਸੰਤਰੇ ਦੇ ਟੁਕੜੇ ਤੇ ਅਨਾਰ ਦੇ ਦਾਣੇ ਪੁਦੀਨੇ ਨਾਲ।",
          "benefit": "ਐਂਟੀਆਕਸੀਡੈਂਟਸ ਨਾਲ ਭਰਪੂਰ, ਚਮੜੀ ਵਿੱਚ ਰੌਣਕ ਲਿਆਉਂਦਾ ਹੈ।",
          "chefSecret": "ਕਾਲਾ ਨਮਕ ਹਲਕਾ ਛਿੜਕੋ।"
        },
        {
          "type": "ਸ਼ਾਹੀ ਆਯੁਰਵੇਦਿਕ ਥਾਲੀ (ਦੁਪਹਿਰ ਦਾ ਖਾਣਾ)",
          "name": "ਸ਼ਾਹੀ ਪਨੀਰ (ਕਾਜੂ-ਤਰਬੂਜ ਬੀਜ ਗ੍ਰੇਵੀ ਵਿੱਚ) + 2 ਮਿਸਾਈ ਰੋਟੀ + ਜੀਰਾ ਰਾਈਤਾ",
          "qty": "ਸ਼ਾਹੀ ਦਾਅਵਤ ਥਾਲੀ",
          "desc": "ਬਿਨਾਂ ਕਰੀਮ ਤੋਂ ਤਰਬੂਜ ਦੇ ਬੀਜਾਂ ਦੀ ਗ੍ਰੇਵੀ ਵਿੱਚ ਪਨੀਰ, ਬੇਸਨ-ਕਣਕ ਦੀ ਮਿਸੀ ਰੋਟੀ ਤੇ ਬੂੰਦੀ-ਜੀਰਾ ਰਾਇਤਾ।",
          "benefit": "ਬਿਨਾਂ ਮੋਟਾਪੇ ਜਾਂ ਕੋਲੈਸਟ੍ਰੋਲ ਦੇ ਸ਼ਾਹੀ ਰੈਸਟੋਰੈਂਟ ਵਰਗਾ ਸਵਾਦ।",
          "chefSecret": "ਗ੍ਰੇਵੀ ਨੂੰ ਰਿਚ ਬਣਾਉਣ ਲਈ ਭਿੱਜੇ ਮਗਜ਼ (ਤਰਬੂਜ ਦੇ ਬੀਜ) ਪੀਸੋ।"
        },
        {
          "type": "ਸ਼ਾਮ ਦੀ ਤਾਜ਼ਗੀ (ਹਲਕਾ ਨਾਸ਼ਤਾ)",
          "name": "ਮਸਾਲਾ ਕਾਹਵਾ ਚਾਹ ਬਦਾਮ ਤੇ ਕੇਸਰ ਨਾਲ",
          "qty": "1 ਕੱਪ (150 ਮਿ.ਲੀ.)",
          "desc": "ਕਸ਼ਮੀਰੀ ਕਾਹਵਾ ਗ੍ਰੀਨ ਟੀ, ਦਾਲਚੀਨੀ, ਇਲਾਇਚੀ ਤੇ ਕੱਟੇ ਬਦਾਮ।",
          "benefit": "ਪਾਚਨ ਨੂੰ ਤੇਜ਼ ਕਰਦਾ ਹੈ ਅਤੇ ਸਰੀਰ ਨੂੰ ਗਰਮਾਹਟ ਦਿੰਦਾ ਹੈ।",
          "chefSecret": "ਮਿੱਠੇ ਲਈ ਸ਼ਹਿਦ ਚਾਹ ਥੋੜ੍ਹੀ ਠੰਡੀ ਹੋਣ 'ਤੇ ਮਿਲਾਓ।"
        },
        {
          "type": "ਰਾਤ ਦਾ ਹਲਕਾ ਖਾਣਾ (ਸਿਹਤਮੰਦ ਡਿਨਰ)",
          "name": "ਮੂੰਗੀ ਦਾਲ ਖਿਚੜੀ ਘੀਆ ਤੇ ਦੇਸੀ ਘਿਓ ਨਾਲ",
          "qty": "300 ਗ੍ਰਾਮ ਬਾਊਲ",
          "desc": "ਹਫ਼ਤੇ ਦੇ ਅੰਤ 'ਤੇ ਪੇਟ ਨੂੰ ਅਰਾਮ ਦੇਣ ਵਾਲੀ ਹਲਕੀ ਖਿਚੜੀ।",
          "benefit": "ਸੋਮਵਾਰ ਲਈ ਪੇਟ ਨੂੰ ਬਿਲਕੁਲ ਸਾਫ਼ ਤੇ ਤਿਆਰ ਕਰਦੀ ਹੈ।",
          "chefSecret": "ਦੇਸੀ ਘਿਓ ਵਿੱਚ ਹਿੰਗ ਤੇ ਜੀਰੇ ਦਾ ਗਰਮ ਤੜਕਾ ਉੱਪਰੋਂ ਪਾਓ।"
        },
        {
          "type": "ਸੌਣ ਵੇਲੇ ਓਜਸ ਪੀਣ ਵਾਲਾ ਦੁੱਧ",
          "name": "ਸੌਂਫ਼ ਤੇ ਗੁਲਾਬ ਦੀਆਂ ਪੱਤੀਆਂ ਵਾਲਾ ਕੋਸਾ ਦੁੱਧ",
          "qty": "150 ਮਿ.ਲੀ.",
          "desc": "ਦੁੱਧ ਵਿੱਚ ਦੇਸੀ ਗੁਲਾਬ ਦੀਆਂ ਪੱਤੀਆਂ ਤੇ ਸੌਂਫ਼।",
          "benefit": "ਸ਼ਾਂਤ ਤੇ ਡੂੰਘੀ ਨੀਂਦ, ਅਗਲੇ ਹਫ਼ਤੇ ਲਈ ਨਵੀਂ ਊਰਜਾ।",
          "chefSecret": "ਗੁਲਾਬ ਦੀਆਂ ਪੱਤੀਆਂ ਸੁੱਕੀਆਂ ਦੇਸੀ ਹੋਣ।"
        }
      ]
    }
  },
  "hindi": {
    "monday": {
      "name": "सोमवार",
      "title": "मेटाबॉलिक अग्नि व पेट शुद्धि (अग्नि दीपन)",
      "desc": "सप्ताहांत के भारी खान-पान के बाद आंतों की शुद्धि, लिवर सक्रियण व मेटाबॉलिज्म रीसेट।",
      "meals": [
        {
          "type": "प्रातः डिटॉक्स अमृत",
          "name": "मेथी-दाना व अदरक गुनगुना काढ़ा",
          "qty": "250 मिली",
          "desc": "रात भर भीगी मेथी को ताज़ा अदरक के साथ उबालकर गुनगुना छान कर पिएं।",
          "benefit": "इंसुलिन संवेदनशीलता 30% बढ़ाता है और पेट की गैस व टॉक्सिन्स बाहर निकालता है।",
          "chefSecret": "एक चुटकी दालचीनी मिलाएं — बिना चीनी के प्राकृतिक मीठी सुगंध आएगी।"
        },
        {
          "type": "पौष्टिक नाश्ता",
          "name": "मूँग दाल व पनीर भरवां चीला",
          "qty": "2 क्रिस्पी चीले + पुदीना चटनी",
          "desc": "पीली मूँग दाल के बैटर में कद्दूकस ताज़ा पनीर, भुना जीरा व हींग तड़का।",
          "benefit": "दोपहर 1 बजे तक पेट भरा रखता है — ब्लड शुगर स्पाइक बिल्कुल नहीं होती।",
          "chefSecret": "बैटर पीसते समय 1 टुकड़ा अदरक व 1 हरी मिर्च साथ पीसें।"
        },
        {
          "type": "मिड-मॉर्निंग स्नैक",
          "name": "ताज़ा नारियल पानी, भीगी चिया सीड्स व नींबू",
          "qty": "250 मिली",
          "desc": "ताज़ा नारियल पानी में 1 चम्मच भीगी चिया सीड्स व 5 बूँद नींबू रस।",
          "benefit": "नेचुरल इलेक्ट्रोलाइट्स (पोटैशियम व मैग्नीशियम) से भरपूर हाइड्रेशन।",
          "chefSecret": "ठंडा करके ताज़ा पुदीने की पत्तियों के साथ सर्व करें।"
        },
        {
          "type": "शाही आयुर्वेदिक थाली (दोपहर का भोजन)",
          "name": "पालक मूँग दाल + मेथी गाजर + 2 ज्वार रोटी + जीरा छाछ",
          "qty": "पूर्ण आयुर्वेदिक थाली",
          "desc": "लहसुन तड़का पालक मूँग दाल, मौसमी मेथी गाजर सब्जी, 2 ज्वार रोटियां व भुना जीरा छाछ।",
          "benefit": "उच्च आयरन, लो ग्लाइसेमिक इंडेक्स और गट माइक्रोबायोम को शक्ति देता है।",
          "chefSecret": "छाछ में काला नमक व भुना जीरा डालें — भारीपन शून्य रहेगा।"
        },
        {
          "type": "सायंकालीन स्नैक व ताजगी",
          "name": "रोस्टेड मखाना व हल्दी मूँगफली + ग्रीन टी",
          "qty": "1 बाउल + 1 कप चाय",
          "desc": "हल्के भुने मखाने, हल्दी, सेंधा नमक और तुलसी-अदरक हर्बल काढ़ा।",
          "benefit": "तनाव हार्मोन (कोर्टिसोल) कम करता है और शाम की मीठे की क्रेविंग रोकता है।",
          "chefSecret": "रोस्ट करते समय अंत में 2 बूँद सरसों तेल व चाट मसाला टॉस करें।"
        },
        {
          "type": "सुपाच्य हल्का रात्रिभोज",
          "name": "लौकी-मूँग पौष्टिक स्टू काली मिर्च के साथ",
          "qty": "350 मिली गर्म सूप बाउल",
          "desc": "ताज़ी लौकी व पीली मूँग दाल का क्रीमी सूप, कद्दू के बीज व काली मिर्च।",
          "benefit": "रात को लिवर व पाचन पर शून्य भार — ब्लड प्रेशर प्राकृतिक नियंत्रित रहता है।",
          "chefSecret": "देसी घी में सिर्फ जीरा, हींग व हरी मिर्च का तड़का लगाएं।"
        },
        {
          "type": "शयन पूर्व ओजस पेय",
          "name": "हल्दी-जायफल गुनगुना दूध",
          "qty": "150 मिली",
          "desc": "देसी गाय के ए2 दूध या बादाम दूध में शुद्ध हल्दी व चुटकी भर जायफल।",
          "benefit": "गहरी व सुकून भरी नींद देता है, सुबह ताजगी महसूस होती है।",
          "chefSecret": "जायफल हमेशा ताज़ा घिस कर डालें।"
        }
      ]
    },
    "tuesday": {
      "name": "मंगलवार",
      "title": "मसल रिकवरी व आंत माइक्रोबायोम पोषण",
      "desc": "उच्च पादप प्रोटीन, प्रोबायोटिक्स और आंतों के मित्र बैक्टीरिया को पोषण देने वाला आहार।",
      "meals": [
        {
          "type": "प्रातः डिटॉक्स अमृत",
          "name": "ताज़ा आंवला, पुदीना व क्लोरोफिल शॉट",
          "qty": "60 मिली शॉट",
          "desc": "ताज़ा आंवला, हरा धनिया, पुदीना और सेंधा नमक का ताज़ा रस।",
          "benefit": "विटामिन सी का पावरहाउस, त्वचा में चमक और लिवर एंजाइम सक्रिय करता है।",
          "chefSecret": "बनाने के 5 मिनट के अंदर पिएं।"
        },
        {
          "type": "पौष्टिक नाश्ता",
          "name": "अंकुरित मूँग-चना प्रोटीन चाट अनार के साथ",
          "qty": "1 बड़ा बाउल (220 ग्राम)",
          "desc": "अंकुरित मूँग, काले चने, खीरा, अनार, भुना जीरा व नींबू रस।",
          "benefit": "14.5 ग्राम शुद्ध प्लांट प्रोटीन व लाइव एंजाइम्स से भरपूर।",
          "chefSecret": "अंकुरित दानों को 2 मिनट हल्की भाप दें — गैस बिल्कुल नहीं बनती।"
        },
        {
          "type": "मिड-मॉर्निंग स्नैक",
          "name": "मटका छाछ भुना जीरा व हींग के साथ",
          "qty": "300 मिली",
          "desc": "घर के ताज़ा दही की पतली छाछ, भुना जीरा, हींग व पुदीना।",
          "benefit": "आंतों को अरबों जीवित प्रोबायोटिक्स प्रदान करती है।",
          "chefSecret": "मिट्टी के कुल्हड़ में रखें।"
        },
        {
          "type": "शाही आयुर्वेदिक थाली (दोपहर का भोजन)",
          "name": "पंचमेल दाल + भिंडी मसाला + 2 बाजरा रोटी + ककड़ी सलाद",
          "qty": "पूर्ण थाली",
          "desc": "पाँच दालों का मिश्रण, कम तेल में पकी भिंडी और 2 बाजरा रोटियां।",
          "benefit": "पूर्ण अमीनो एसिड प्रोफाइल, मसल रिकवरी व फैट बर्न।",
          "chefSecret": "बाजरे के आटे को गुनगुने पानी से गूंथें।"
        },
        {
          "type": "सायंकालीन स्नैक व ताजगी",
          "name": "भुने काले चने व गुड़-अखरोट + लेमनग्रास टी",
          "qty": "1 मुट्ठी (40 ग्राम)",
          "desc": "छिलके वाले भुने चने, 1/2 चम्मच देसी गुड़ और 2 अखरोट।",
          "benefit": "मानसिक थकान दूर करता है, प्राकृतिक आयरन का खजाना।",
          "chefSecret": "गुड़ हमेशा बिना केमिकल वाला काला गुड़ चुनें।"
        },
        {
          "type": "सुपाच्य हल्का रात्रिभोज",
          "name": "तोरी-टमाटर सुपाच्य सब्जी + 1 ज्वार फुल्का",
          "qty": "300 ग्राम बाउल",
          "desc": "हरी तोरी, टमाटर, हींग-जीरा तड़का और 1 ज्वार रोटी।",
          "benefit": "सूजन घटाता है और पेट को पूर्ण विश्राम देता है।",
          "chefSecret": "सब्जी में अतिरिक्त पानी न डालें।"
        },
        {
          "type": "शयन पूर्व ओजस पेय",
          "name": "सौंफ व हरी इलायची गुनगुना दूध",
          "qty": "150 मिली",
          "desc": "दूध में सौंफ व कुटी इलायची उबालकर पिएं।",
          "benefit": "एसिडिटी शांत करता है और मन को सुकून देता है।",
          "chefSecret": "इलायची के दाने कूट कर डालें।"
        }
      ]
    },
    "wednesday": {
      "name": "बुधवार",
      "title": "कार्डियो-मेटाबॉलिक शील्ड व रक्त शुद्धि",
      "desc": "कोलेस्ट्रॉल नियंत्रण, धमनियों की सुरक्षा व विषैले तत्वों को बाहर निकालने वाला देसी आहार।",
      "meals": [
        {
          "type": "प्रातः डिटॉक्स अमृत",
          "name": "भीगे अखरोट, बादाम व मुनक्का जल",
          "qty": "200 मिली जल + मेवे",
          "desc": "रात भर भीगे 4 बादाम, 1 अखरोट व 3 मुनक्का का जल।",
          "benefit": "धमनियों को लचीला रखता है और ओमेगा-3 प्रदान करता है।",
          "chefSecret": "बादाम का छिलका उतार कर खाएं।"
        },
        {
          "type": "पौष्टिक नाश्ता",
          "name": "स्टील-कट ओट्स व सब्जियों का मसाला दलिया",
          "qty": "1 बड़ा बाउल (250 ग्राम)",
          "desc": "ओट्स, गाजर, मटर, शिमला मिर्च, हल्दी व राई तड़का।",
          "benefit": "बीटा-ग्लूकन फाइबर एलडीएल खराब कोलेस्ट्रॉल घटाता है।",
          "chefSecret": "ऊपर से 1 चम्मच भुनी अलसी का पाउडर छिड़कें।"
        },
        {
          "type": "मिड-मॉर्निंग स्नैक",
          "name": "कच्ची हल्दी व चुकंदर डिटॉक्स रस",
          "qty": "150 मिली",
          "desc": "चुकंदर, खीरा, आधा सेब और कच्ची हल्दी का ताजा रस।",
          "benefit": "नाइट्रिक ऑक्साइड बढ़ाता है, बीपी सामान्य रखता है।",
          "chefSecret": "एक चुटकी काली मिर्च करक्यूमिन का अवशोषण 2000% बढ़ाती है।"
        },
        {
          "type": "शाही आयुर्वेदिक थाली (दोपहर का भोजन)",
          "name": "राजगीरा कढ़ी + मेथी सब्जी + 2 ज्वार रोटी",
          "qty": "पूर्ण थाली",
          "desc": "कम तेल की कढ़ी, हरी मेथी सब्जी व गर्म ज्वार रोटियां।",
          "benefit": "एसिडिटी घटाती है और हृदय को सुरक्षित रखती है।",
          "chefSecret": "कढ़ी में मेथी दाना व हींग तड़का जरूर लगाएं।"
        },
        {
          "type": "सायंकालीन स्नैक व ताजगी",
          "name": "सूरजमुखी व कद्दू के भुने बीज + कैमोमाइल चाय",
          "qty": "30 ग्राम बीज",
          "desc": "सेंधा नमक में हल्के भुने कद्दू व सूरजमुखी के बीज।",
          "benefit": "मैग्नीशियम व जिंक का खजाना, ब्लड प्रेशर नियंत्रित करता है।",
          "chefSecret": "धीमी आंच पर 2 मिनट सूखा भूनें।"
        },
        {
          "type": "सुपाच्य हल्का रात्रिभोज",
          "name": "कद्दू (सीताफल) व मूँग का मखमली सूप",
          "qty": "350 मिली बाउल",
          "desc": "पीला कद्दू, मूँग दाल, अदरक व काली मिर्च का सूप।",
          "benefit": "हृदय पर शून्य भार, सुपाच्य व पौष्टिक।",
          "chefSecret": "धनिया पत्ती व नींबू रस से गार्निश करें।"
        },
        {
          "type": "शयन पूर्व ओजस पेय",
          "name": "अर्जुन की छाल का गुनगुना काढ़ा या दूध",
          "qty": "150 मिली",
          "desc": "अर्जुन छाल को दूध-पानी में उबालकर तैयार हृदय टॉनिक।",
          "benefit": "हृदय की मांसपेशियों को शक्ति देता है।",
          "chefSecret": "हल्की मिश्री या बिना मीठे के पिएं।"
        }
      ]
    },
    "thursday": {
      "name": "गुरुवार",
      "title": "हार्मोन्स संतुलन व तनाव मुक्ति (ओजस वर्धन)",
      "desc": "कोर्टिसोल शांत करने वाला, थायरॉयड-अनुकूल और गहरी ऊर्जा देने वाला पोषण।",
      "meals": [
        {
          "type": "प्रातः डिटॉक्स अमृत",
          "name": "गुनगुना नींबू-शहद जल दालचीनी के साथ",
          "qty": "250 मिली",
          "desc": "गुनगुने पानी में आधा नींबू, आधा चम्मच शहद व चुटकी भर दालचीनी।",
          "benefit": "फैट मोबिलाइजेशन शुरू करता है और मेटाबॉलिज्म तेज करता है।",
          "chefSecret": "पानी बहुत गर्म न हो, गुनगुने पानी में ही शहद मिलाएं।"
        },
        {
          "type": "पौष्टिक नाश्ता",
          "name": "रागी व सब्जियों की इडली ताज़ी नारियल चटनी के साथ",
          "qty": "3 सॉफ्ट इडली",
          "desc": "रागी बैटर में बारीक गाजर, बीन्स व करी पत्ता मिलाकर बनी इडली।",
          "benefit": "कैल्शियम व आयरन से भरपूर, ग्लूटेन-मुक्त सुपरफूड।",
          "chefSecret": "चटनी में भुनी चना दाल मिलाएं।"
        },
        {
          "type": "मिड-मॉर्निंग स्नैक",
          "name": "पपीता व चिया सीड्स बाउल",
          "qty": "150 ग्राम ताज़ा पपीता",
          "desc": "पपीते पर भुनी चिया सीड्स व नींबू का रस।",
          "benefit": "पाचन तंत्र व आंतों की सफाई करता है।",
          "chefSecret": "हल्का काला नमक छिड़कें।"
        },
        {
          "type": "शाही आयुर्वेदिक थाली (दोपहर का भोजन)",
          "name": "परवल-आलू देसी सब्जी + पीली मूँग दाल + 2 मल्टीग्रेन रोटी",
          "qty": "पूर्ण थाली",
          "desc": "जीरे में बनी परवल की सब्जी, हींग वाली मूँग दाल और 2 रोटियां।",
          "benefit": "पित्त शांत करता है और लिवर एंजाइम्स संतुलित रखता है।",
          "chefSecret": "परवल में हल्का कट लगाकर भूनें।"
        },
        {
          "type": "सायंकालीन स्नैक व ताजगी",
          "name": "देसी सत्तू ड्रिंक नींबू व जीरे के साथ",
          "qty": "250 मिली ग्लास",
          "desc": "2 चम्मच चने का सत्तू, ठंडा पानी, नींबू, काला नमक व पुदीना।",
          "benefit": "प्राकृतिक प्रोटीन शेक — 100% शुद्ध देसी ठंडक व ऊर्जा।",
          "chefSecret": "अच्छी तरह फेंटें ताकि गुठली न बने।"
        },
        {
          "type": "सुपाच्य हल्का रात्रिभोज",
          "name": "मूँग दाल व पालक की खिचड़ी देसी घी के साथ",
          "qty": "300 ग्राम बाउल",
          "desc": "छिलके वाली मूँग दाल, पालक व चावल की पतली खिचड़ी + 1 चम्मच देसी घी।",
          "benefit": "कब्ज व गैस दूर करती है और सुपाच्य है।",
          "chefSecret": "तड़के में हींग-जीरा प्रचुर मात्रा में डालें।"
        },
        {
          "type": "शयन पूर्व ओजस पेय",
          "name": "अश्वगंधा व दालचीनी गुनगुना दूध",
          "qty": "150 मिली",
          "desc": "दूध में आधा चम्मच अश्वगंधा चूर्ण व दालचीनी।",
          "benefit": "कोर्टिसोल घटाता है, हार्मोन संतुलित करता है।",
          "chefSecret": "दूध को 3 बार उबालें।"
        }
      ]
    },
    "friday": {
      "name": "शुक्रवार",
      "title": "ग्लूकोज नियंत्रण व लिवर डिटॉक्स (यकृत शोधन)",
      "desc": "इंसुलिन संवेदनशीलता बढ़ाने और लिवर की चर्बी पिघलाने का अचूक देसी प्लान।",
      "meals": [
        {
          "type": "प्रातः डिटॉक्स अमृत",
          "name": "करेला-जामुन व खीरा मेटाबॉलिक शॉट",
          "qty": "70 मिली अर्क",
          "desc": "छोटा करेला, जामुन सिरका और खीरे का ताज़ा रस।",
          "benefit": "फास्टिंग ब्लड शुगर को तेजी से सामान्य करता है।",
          "chefSecret": "1 चुटकी सेंधा नमक से कड़वाहट कम हो जाती है।"
        },
        {
          "type": "पौष्टिक नाश्ता",
          "name": "बेसन-पालक चीला टमाटर चटनी के साथ",
          "qty": "2 क्रिस्पी चीले",
          "desc": "चने के बेसन में बारीक पालक, प्याज, अजवाइन व हींग तड़का।",
          "benefit": "लो ग्लाइसेमिक इंडेक्स, फाइबर व प्रोटीन का भंडार।",
          "chefSecret": "अजवाइन हाथ से मसल कर डालें।"
        },
        {
          "type": "मिड-मॉर्निंग स्नैक",
          "name": "आंवला कैंडी या ताज़ा अमरूद काली मिर्च के साथ",
          "qty": "1 मध्यम अमरूद",
          "desc": "ताज़ा अमरूद काले नमक व भुने जीरे के साथ।",
          "benefit": "उच्च फाइबर शुगर अवशोषण को धीमा करता है।",
          "chefSecret": "बीज चबाएं नहीं, गूदा अच्छी तरह चबाएं।"
        },
        {
          "type": "शाही आयुर्वेदिक थाली (दोपहर का भोजन)",
          "name": "मेथी-मूँग दाल + करेला भुजिया + 2 ज्वार रोटी + खीरा रायता",
          "qty": "पूर्ण थाली",
          "desc": "कम तेल का करेला, मेथी वाली दाल, 2 ज्वार रोटियां व खीरा रायता।",
          "benefit": "शुगर व फैटी लिवर के लिए सर्वश्रेष्ठ थाली।",
          "chefSecret": "करेले को नमक लगाकर 15 मिनट धूप में रखें।"
        },
        {
          "type": "सायंकालीन स्नैक व ताजगी",
          "name": "रोस्टेड सोयाबीन दाने + ग्रीन टी",
          "qty": "35 ग्राम",
          "desc": "हल्के भुने सोयाबीन या चने काली मिर्च के साथ।",
          "benefit": "13 ग्राम शुद्ध प्लांट प्रोटीन।",
          "chefSecret": "एयर टाइट डिब्बे में रखें।"
        },
        {
          "type": "सुपाच्य हल्का रात्रिभोज",
          "name": "पनीर/मशरूम व सब्जियों का क्लियर सूप",
          "qty": "350 मिली बाउल",
          "desc": "ताज़ा पनीर क्यूब्स, ब्रोकली, गाजर व काली मिर्च का सूप।",
          "benefit": "रात में शुगर स्पाइक शून्य, फैट बर्निंग एक्टिव।",
          "chefSecret": "अदरक का रस अंत में डालें।"
        },
        {
          "type": "शयन पूर्व ओजस पेय",
          "name": "त्रिफला गुनगुना जल या हल्दी दूध",
          "qty": "150 मिली",
          "desc": "आधा चम्मच त्रिफला चूर्ण गुनगुने जल में।",
          "benefit": "पेट की पूर्ण शुद्धि करता है।",
          "chefSecret": "सोने से 30 मिनट पूर्व लें।"
        }
      ]
    },
    "saturday": {
      "name": "शनिवार",
      "title": "हड्डी व जोड़ मजबूती (अस्थि-मज्जा पोषण)",
      "desc": "कैल्शियम, मैग्नीशियम और प्राकृतिक सूजन-रोधी मसालों से भरपूर आहार।",
      "meals": [
        {
          "type": "प्रातः डिटॉक्स अमृत",
          "name": "कच्ची हल्दी व अदरक करक्यूमिन अर्क",
          "qty": "200 मिली",
          "desc": "कच्ची हल्दी, अदरक व काली मिर्च को उबालकर छान कर लें।",
          "benefit": "जोड़ों के दर्द व सूजन में तुरंत राहत देता है।",
          "chefSecret": "1 बूँद देसी घी मिलाएं।"
        },
        {
          "type": "पौष्टिक नाश्ता",
          "name": "देसी पनीर भुर्जी टमाटर के साथ व 2 मल्टीग्रेन टोस्ट",
          "qty": "1 प्लेट (180 ग्राम)",
          "desc": "100 ग्राम ताज़ा पनीर, टमाटर, हरी मिर्च, हरा धनिया व हल्दी।",
          "benefit": "20 ग्राम प्रोटीन और हड्डियों के लिए भरपूर कैल्शियम।",
          "chefSecret": "पनीर को ज़्यादा न पकाएं।"
        },
        {
          "type": "मिड-मॉर्निंग स्नैक",
          "name": "तिल व गुड़ की छोटी पिन्नी + गुनगुना पानी",
          "qty": "1 पिन्नी (25 ग्राम)",
          "desc": "काले या सफेद तिल देसी गुड़ में बने हुए।",
          "benefit": "दूध से भी अधिक कैल्शियम प्रदान करता है।",
          "chefSecret": "तिल को हल्का भूनें।"
        },
        {
          "type": "शाही आयुर्वेदिक थाली (दोपहर का भोजन)",
          "name": "काले चने मसाला + लौकी रायता + 2 रागी-ज्वार रोटी",
          "qty": "पूर्ण थाली",
          "desc": "काले चने, लौकी रायता, कच्चा सलाद और रागी की रोटी।",
          "benefit": "हड्डियों का घनत्व बढ़ाता है और जोड़ों को शक्ति देता है।",
          "chefSecret": "चने में सूखा आंवला डालकर उबालें।"
        },
        {
          "type": "सायंकालीन स्नैक व ताजगी",
          "name": "मखाना खीर (बिना चीनी, खजूर युक्त)",
          "qty": "150 मिली बाउल",
          "desc": "भुने मखाने को दूध में पकाकर खजूर से मीठा किया हुआ।",
          "benefit": "मीठे की चाहत मिटाता है बिना वजन बढ़ाए।",
          "chefSecret": "इलायची पाउडर जरूर मिलाएं।"
        },
        {
          "type": "सुपाच्य हल्का रात्रिभोज",
          "name": "मूँग दाल पालक सूप व 1 ज्वार फुल्का",
          "qty": "300 मिली बाउल",
          "desc": "हल्की दाल-पालक का क्रीमी सूप काली मिर्च के साथ।",
          "benefit": "जोड़ों के यूरिक एसिड को साफ करता है।",
          "chefSecret": "लहसुन का हल्का तड़का लगाएं।"
        },
        {
          "type": "शयन पूर्व ओजस पेय",
          "name": "गोंद कतीरा या केसर युक्त गुनगुना दूध",
          "qty": "150 मिली",
          "desc": "दूध में 2 धागे केसर व चुटकी भर इलायची।",
          "benefit": "जोड़ों के दर्द से आराम व मानसिक शांति।",
          "chefSecret": "केसर को 2 चम्मच गर्म दूध में पहले भिगोएं।"
        }
      ]
    },
    "sunday": {
      "name": "रविवार",
      "title": "शाही सात्विक स्वस्थ दावत (सर्व धातु वर्धक)",
      "desc": "स्वादिष्ट फाइव-स्टार जायका बिना भारी क्रीम, मैदा या पाम ऑयल के।",
      "meals": [
        {
          "type": "प्रातः डिटॉक्स अमृत",
          "name": "ताज़ा नारियल पानी नींबू व सेंधा नमक के साथ",
          "qty": "250 मिली",
          "desc": "ताज़े नारियल का पानी चुटकी सेंधा नमक व नींबू रस के साथ।",
          "benefit": "सभी अंगों को पुनर्जीवित करता है और थकान मिटाता है।",
          "chefSecret": "मलाई हल्की खाएं।"
        },
        {
          "type": "पौष्टिक नाश्ता",
          "name": "मिलेट्स व सब्जियों का उपमा भुने काजू के साथ",
          "qty": "1 बड़ा बाउल (220 ग्राम)",
          "desc": "कंगनी या कोधरा मिलेट, गाजर, मटर, राई, करी पत्ता व 4 भुने काजू।",
          "benefit": "धीमी गति से ऊर्जा देता है, रविवार का शाही नाश्ता।",
          "chefSecret": "मिलेट्स को पकाने से पहले सूखा भूनें।"
        },
        {
          "type": "मिड-मॉर्निंग स्नैक",
          "name": "संतरा व अनार का ताज़ा फ्रूट बाउल",
          "qty": "1 बाउल",
          "desc": "ताज़ा संतरा व अनार के दाने पुदीने के साथ।",
          "benefit": "एंटीऑक्सीडेंट्स से भरपूर, चेहरे पर चमक लाता है।",
          "chefSecret": "काला नमक हल्का छिड़कें।"
        },
        {
          "type": "शाही आयुर्वेदिक थाली (दोपहर का भोजन)",
          "name": "शाही पनीर (तरबूज बीज ग्रेवी में) + 2 मिस्सी रोटी + जीरा रायता",
          "qty": "शाही दावत थाली",
          "desc": "बिना क्रीम के मगज (तरबूज के बीज) की ग्रेवी में पनीर, बेसन-गेहूं की मिस्सी रोटी व रायता।",
          "benefit": "बिना मोटापे या कोलेस्ट्रॉल के शाही रेस्टोरेंट जैसा स्वाद।",
          "chefSecret": "ग्रेवी को रिच बनाने के लिए भीगे मगज पीसें।"
        },
        {
          "type": "सायंकालीन स्नैक व ताजगी",
          "name": "मसाला कहवा चाय बादाम व केसर के साथ",
          "qty": "1 कप (150 मिली)",
          "desc": "कश्मीरी कहवा ग्रीन टी, दालचीनी, इलायची व कटे बादाम।",
          "benefit": "पाचन को तेज करता है और शरीर को ऊर्जा देता है।",
          "chefSecret": "शहद चाय थोड़ी ठंडी होने पर मिलाएं।"
        },
        {
          "type": "सुपाच्य हल्का रात्रिभोज",
          "name": "मूँग दाल खिचड़ी लौकी व देसी घी के साथ",
          "qty": "300 ग्राम बाउल",
          "desc": "सप्ताह के अंत में पेट को पूर्ण विश्राम देने वाली हल्की खिचड़ी।",
          "benefit": "सोमवार के लिए पेट को बिल्कुल साफ व तैयार करती है।",
          "chefSecret": "देसी घी में हींग-जीरे का गर्म तड़का ऊपर से डालें।"
        },
        {
          "type": "शयन पूर्व ओजस पेय",
          "name": "सौंफ व गुलाब की पंखुड़ियों वाला गुनगुना दूध",
          "qty": "150 मिली",
          "desc": "दूध में देसी गुलाब की पत्तियां व सौंफ।",
          "benefit": "गहरी नींद और अगले सप्ताह के लिए नई ऊर्जा।",
          "chefSecret": "गुलाब की पत्तियां देसी व सूखी हों।"
        }
      ]
    }
  },
  "english": {
    "monday": {
      "name": "Monday",
      "title": "Metabolic Fire & Gut Reset (Agni Deepana)",
      "desc": "Flush digestive toxins, awaken hepatic enzymes, and reset cellular metabolism.",
      "meals": [
        {
          "type": "Morning Detox Nectar",
          "name": "Methi-Dana & Ginger Warm Elixir",
          "qty": "250 ml",
          "desc": "Overnight soaked fenugreek seeds boiled with fresh ginger, strained warm.",
          "benefit": "Boosts insulin sensitivity by 30% and eliminates gastrointestinal bloating.",
          "chefSecret": "Add a pinch of Ceylon cinnamon for natural sweet aroma without sugar."
        },
        {
          "type": "Power Breakfast",
          "name": "Moong Dal & Desi Paneer Stuffed Chilla",
          "qty": "2 Crisp Chillas + Mint Chutney",
          "desc": "Yellow moong batter filled with grated fresh paneer, roasted cumin & asafoetida.",
          "benefit": "Sustained satiety — prevents glucose spikes and hunger until lunch.",
          "chefSecret": "Grind ginger and green chillies into the batter for street-style crunch."
        },
        {
          "type": "Mid-Morning Fuel",
          "name": "Fresh Coconut Water with Soaked Chia & Lime",
          "qty": "250 ml",
          "desc": "Tender coconut water with 1 tsp soaked chia seeds and fresh lime drops.",
          "benefit": "Cellular hydration and natural electrolytes (Potassium & Magnesium).",
          "chefSecret": "Serve chilled with crushed fresh mint leaves."
        },
        {
          "type": "Grand Ayurvedic Thali Lunch",
          "name": "Palak Moong Dal + Methi Gajar + 2 Jowar Rotis + Cumin Chaas",
          "qty": "Full Ayurvedic Thali",
          "desc": "Garlic-tempered spinach moong dal, seasonal fenugreek carrot sabzi, 2 jowar flatbreads with A2 ghee & cumin buttermilk.",
          "benefit": "High bioavailable iron, low glycemic index, and probiotic gut microbiome nourishment.",
          "chefSecret": "Add roasted jeera and black salt to buttermilk to eliminate post-meal heaviness."
        },
        {
          "type": "Evening Reviver Snack",
          "name": "Roasted Makhana & Turmeric Peanuts with Herbal Green Tea",
          "qty": "1 Bowl + 1 Cup Tea",
          "desc": "Lightly dry-roasted fox nuts with turmeric, rock salt, and ginger-tulsi herbal infusion.",
          "benefit": "Reduces cortisol (stress hormone) and blunts evening sweet cravings.",
          "chefSecret": "Toss with 2 drops mustard oil and chaat masala in the final 30 seconds."
        },
        {
          "type": "Light Healing Dinner",
          "name": "Lauki-Moong Restorative Stew with Crushed Pepper",
          "qty": "350 ml Warm Stew Bowl",
          "desc": "Fresh bottle gourd and yellow moong creamy stew with toasted pumpkin seeds & black pepper.",
          "benefit": "Zero digestive burden on liver and pancreas during night — stabilizes blood pressure.",
          "chefSecret": "Temper with pure desi cow ghee, cumin, asafoetida and green chillies."
        },
        {
          "type": "Restorative Bedtime Elixir",
          "name": "Haldi-Nutmeg Warm Restorative Milk",
          "qty": "150 ml",
          "desc": "Warm A2 cow milk or almond milk with Lakadong turmeric and a pinch of grated nutmeg.",
          "benefit": "Stimulates GABA neurotransmitters for deep restorative cellular sleep.",
          "chefSecret": "Always grate fresh nutmeg right before serving."
        }
      ]
    },
    "tuesday": {
      "name": "Tuesday",
      "title": "Muscle Synthesis & Microbiome Rebuild",
      "desc": "Bioavailable amino acids, natural probiotics, and complete gut flora nourishment.",
      "meals": [
        {
          "type": "Morning Detox Nectar",
          "name": "Fresh Amla, Mint & Chlorophyll Shot",
          "qty": "60 ml Potent Shot",
          "desc": "Cold-pressed Indian gooseberry, mint, coriander, and Himalayan rock salt.",
          "benefit": "Vitamin C antioxidant shield, collagen synthesis, and hepatic enzyme boost.",
          "chefSecret": "Consume within 5 minutes of pressing to prevent Vitamin C oxidation."
        },
        {
          "type": "Power Breakfast",
          "name": "Live Enzyme Protein Sprout Chaat with Anaar & Lemon",
          "qty": "1 Large Bowl (220g)",
          "desc": "Sprouted moong, black chana, cucumber, pomegranate, roasted cumin, and lime.",
          "benefit": "14.5g live bioavailable plant protein and active digestive enzymes.",
          "chefSecret": "Steam sprouts lightly for 2 minutes for effortless digestion."
        },
        {
          "type": "Mid-Morning Fuel",
          "name": "Earthen-Pot Spiced Buttermilk (Matka Chaas)",
          "qty": "300 ml",
          "desc": "Slow-churned curd diluted with roasted cumin, asafoetida, rock salt & mint.",
          "benefit": "Delivers billions of active probiotic cultures to replenish gut microbiome.",
          "chefSecret": "Rest in an unglazed clay pot for 1 hour for natural cooling minerals."
        },
        {
          "type": "Grand Ayurvedic Thali Lunch",
          "name": "Panchmel Dal + Bhindi Masala + 2 Bajra Rotis + Crisp Salad",
          "qty": "Full Thali",
          "desc": "Five-lentil protein stew, low-oil okra stir fry, and 2 warm pearl millet flatbreads.",
          "benefit": "Complete amino acid profile for muscle recovery and visceral fat burn.",
          "chefSecret": "Knead bajra flour with warm water for velvety soft rotis."
        },
        {
          "type": "Evening Reviver Snack",
          "name": "Roasted Black Chana with Jaggery & Walnuts + Lemongrass Tea",
          "qty": "1 Handful (40g)",
          "desc": "Crisp roasted Bengal gram with skin, half spoon organic dark jaggery & walnuts.",
          "benefit": "Combats late-afternoon mental fatigue and replenishes natural ferritin.",
          "chefSecret": "Always choose unrefined dark jaggery without bleaching agents."
        },
        {
          "type": "Light Healing Dinner",
          "name": "Ridge Gourd (Tori) Stew with 1 Jowar Phulka",
          "qty": "300g Bowl",
          "desc": "Tender ridge gourd cooked in cumin, tomatoes, asafoetida with 1 soft jowar flatbread.",
          "benefit": "Alleviates systemic inflammation and provides deep nocturnal digestive rest.",
          "chefSecret": "Cook in its own natural juices without adding extra water."
        },
        {
          "type": "Restorative Bedtime Elixir",
          "name": "Cardamom & Fennel Warm Milk",
          "qty": "150 ml",
          "desc": "Warm A2 milk simmered with crushed green cardamom pods and fennel seeds.",
          "benefit": "Neutralizes acidity and calms the central nervous system.",
          "chefSecret": "Crack cardamom pods open with a mortar and pestle."
        }
      ]
    },
    "wednesday": {
      "name": "Wednesday",
      "title": "Cardio-Metabolic Shield & Vascular Detox",
      "desc": "Lipid profile optimization, arterial flexibility, and anti-inflammatory cellular cleanse.",
      "meals": [
        {
          "type": "Morning Detox Nectar",
          "name": "Soaked Walnut, Almond & Munakka Infusion",
          "qty": "200 ml Water + Soaked Nuts",
          "desc": "4 soaked almonds, 1 walnut, and 3 golden raisins infused overnight in glass.",
          "benefit": "Maintains arterial elasticity and provides brain-healthy Omega-3 ALA.",
          "chefSecret": "Always peel almond skins to remove digestive enzyme inhibitors (tannins)."
        },
        {
          "type": "Power Breakfast",
          "name": "Steel-Cut Oats & Veggie Masala Daliya",
          "qty": "1 Large Bowl (250g)",
          "desc": "Coarse oats simmered with carrots, green peas, turmeric & mustard seeds.",
          "benefit": "Beta-glucan soluble fiber systematically reduces circulating LDL cholesterol.",
          "chefSecret": "Garnish with 1 tsp roasted flaxseed powder."
        },
        {
          "type": "Mid-Morning Fuel",
          "name": "Raw Turmeric & Beetroot Nitrate Elixir",
          "qty": "150 ml",
          "desc": "Cold-pressed beetroot, cucumber, half green apple, and raw turmeric.",
          "benefit": "Elevates nitric oxide levels, dilating blood vessels and stabilizing BP.",
          "chefSecret": "A pinch of black pepper increases curcumin absorption by 2000%."
        },
        {
          "type": "Grand Ayurvedic Thali Lunch",
          "name": "Rajgira Kadhi + Methi Sabzi + 2 Jowar Rotis",
          "qty": "Full Thali",
          "desc": "Low-fat amaranth buttermilk curry, fresh fenugreek greens, and 2 warm jowar rotis.",
          "benefit": "Alkalinizes the bloodstream and shields coronary endothelium.",
          "chefSecret": "Temper kadhi with fenugreek seeds and asafoetida."
        },
        {
          "type": "Evening Reviver Snack",
          "name": "Toasted Pumpkin & Sunflower Seeds + Chamomile Tea",
          "qty": "30g Seed Mix",
          "desc": "Slow-toasted pumpkin and sunflower seeds with pink Himalayan rock salt.",
          "benefit": "Powerhouse of bioavailable magnesium and zinc for arterial relaxation.",
          "chefSecret": "Dry-roast on low flame for exactly 2 minutes."
        },
        {
          "type": "Light Healing Dinner",
          "name": "Yellow Pumpkin & Moong Velvet Stew",
          "qty": "350 ml Bowl",
          "desc": "Golden pumpkin simmered with yellow moong, ginger, and cracked black pepper.",
          "benefit": "Zero workload on cardiac muscle, deeply restorative and easy to assimilate.",
          "chefSecret": "Garnish with fresh coriander leaves and a squeeze of lime."
        },
        {
          "type": "Restorative Bedtime Elixir",
          "name": "Terminalia Arjuna Bark Cardiac Infusion",
          "qty": "150 ml",
          "desc": "Arjun tree bark simmered in milk and water — ancient cardio-tonic.",
          "benefit": "Strengthens myocardial contraction and optimizes lipid balance.",
          "chefSecret": "Best taken unsweetened or with a drop of organic honey."
        }
      ]
    },
    "thursday": {
      "name": "Thursday",
      "title": "Endocrine Balance & Nervous System Recovery",
      "desc": "Cortisol reduction, thyroid support, and sustained natural vitality.",
      "meals": [
        {
          "type": "Morning Detox Nectar",
          "name": "Warm Lemon-Honey Water with Ceylon Cinnamon",
          "qty": "250 ml",
          "desc": "Lukewarm water with half lime, raw honey, and true Ceylon cinnamon.",
          "benefit": "Mobilizes visceral adipose tissue and sparks sluggish metabolic rate.",
          "chefSecret": "Never add honey to boiling water; ensure water is comfortable drinking temperature."
        },
        {
          "type": "Power Breakfast",
          "name": "Steamed Ragi & Vegetable Idlis with Fresh Coconut Chutney",
          "qty": "3 Soft Idlis",
          "desc": "Finger millet batter steamed with diced carrots, beans, and fresh curry leaves.",
          "benefit": "High calcium and iron density with complete gluten-free bioavailability.",
          "chefSecret": "Add roasted chana dal to coconut chutney for velvety texture."
        },
        {
          "type": "Mid-Morning Fuel",
          "name": "Papaya & Soaked Chia Seeds Bowl",
          "qty": "150g Fresh Diced Papaya",
          "desc": "Ripe papaya cubes topped with roasted chia seeds and fresh lime juice.",
          "benefit": "Papain enzymes optimize digestive transit and cleanse intestinal villi.",
          "chefSecret": "Sprinkle rock salt for enhanced flavor extraction."
        },
        {
          "type": "Grand Ayurvedic Thali Lunch",
          "name": "Parwal & Potato Desi Sabzi + Yellow Moong Dal + 2 Multigrain Rotis",
          "qty": "Full Thali",
          "desc": "Pointed gourd stir fry, cumin-tempered yellow lentils, and 2 multigrain flatbreads.",
          "benefit": "Pacifies Pitta dosha and normalizes liver metabolic enzymes.",
          "chefSecret": "Slit parwal lengthwise before sautéing."
        },
        {
          "type": "Evening Reviver Snack",
          "name": "Desi Roasted Chana Sattu Energy Cooler",
          "qty": "250 ml Glass",
          "desc": "2 tbsp roasted Bengal gram sattu, chilled water, lemon, black salt & mint.",
          "benefit": "Natural 100% clean protein drink — cooling sustained endurance.",
          "chefSecret": "Whisk thoroughly to prevent lump formation."
        },
        {
          "type": "Light Healing Dinner",
          "name": "Moong Dal & Spinach Restorative Khichdi with Desi Ghee",
          "qty": "300g Bowl",
          "desc": "Split moong lentils, tender spinach, and aged rice tempered with 1 tsp A2 cow ghee.",
          "benefit": "Calms the nervous system and eliminates gastrointestinal distress.",
          "chefSecret": "Generously temper with roasted asafoetida and cumin."
        },
        {
          "type": "Restorative Bedtime Elixir",
          "name": "Ashwagandha (KSM-66) & Cinnamon Warm Milk",
          "qty": "150 ml",
          "desc": "Warm milk infused with half tsp root Ashwagandha and Ceylon cinnamon.",
          "benefit": "Reduces cortisol, regulates endocrine output, and deepens slow-wave sleep.",
          "chefSecret": "Bring milk to a gentle boil 3 times."
        }
      ]
    },
    "friday": {
      "name": "Friday",
      "title": "Glycemic Defense & Hepatic Detoxification",
      "desc": "Insulin sensitization, glucose curve flattening, and visceral liver fat mobilization.",
      "meals": [
        {
          "type": "Morning Detox Nectar",
          "name": "Karela-Jamun & Cucumber Metabolic Shot",
          "qty": "70 ml Extract",
          "desc": "Fresh bitter gourd, Indian blackberry extract, and cucumber juice.",
          "benefit": "Charantin and Polypeptide-p rapidly lower fasting blood glucose.",
          "chefSecret": "A pinch of pink rock salt significantly balances natural bitterness."
        },
        {
          "type": "Power Breakfast",
          "name": "Besan-Palak Vegetable Cheela with Tomato-Garlic Dip",
          "qty": "2 Crisp Cheelas",
          "desc": "Gram flour batter loaded with baby spinach, carom seeds, onions & hing.",
          "benefit": "Low glycemic index, rich in plant fiber and bioavailable protein.",
          "chefSecret": "Rub carom seeds between palms before adding to release essential thymol oils."
        },
        {
          "type": "Mid-Morning Fuel",
          "name": "Fresh Pink Guava with Crushed Black Pepper",
          "qty": "1 Medium Guava",
          "desc": "Crisp sliced guava sprinkled with black salt and roasted cumin.",
          "benefit": "Exceptional dietary fiber retards sugar absorption in the small intestine.",
          "chefSecret": "Chew the pulp thoroughly rather than biting hard into the seeds."
        },
        {
          "type": "Grand Ayurvedic Thali Lunch",
          "name": "Methi-Moong Dal + Karela Stir-Fry + 2 Jowar Rotis + Cucumber Raita",
          "qty": "Full Thali",
          "desc": "Crisp bitter gourd, fenugreek yellow lentils, 2 jowar flatbreads & cucumber curd.",
          "benefit": "Gold-standard clinical combination for reversing insulin resistance.",
          "chefSecret": "Salt sliced bitter gourd for 15 minutes in sunlight to release excess bitterness."
        },
        {
          "type": "Evening Reviver Snack",
          "name": "Dry-Roasted Soyabean Crunch + Green Tea",
          "qty": "35g Crunch",
          "desc": "Slow-roasted non-GMO soybean nibs seasoned with black pepper.",
          "benefit": "Provides 13g clean plant protein to prevent evening sugar crashes.",
          "chefSecret": "Keep sealed in an airtight container for lasting crunch."
        },
        {
          "type": "Light Healing Dinner",
          "name": "Paneer or Mushroom Botanical Clear Soup",
          "qty": "350 ml Bowl",
          "desc": "Fresh paneer cubes, broccoli florets, carrots simmered in black pepper broth.",
          "benefit": "Zero nocturnal glycemic excursion; maximizes overnight lipolysis.",
          "chefSecret": "Add freshly pressed ginger juice at the very end."
        },
        {
          "type": "Restorative Bedtime Elixir",
          "name": "Triphala Warm Cleanse or Turmeric Milk",
          "qty": "150 ml",
          "desc": "Half teaspoon pure Triphala powder dissolved in warm water.",
          "benefit": "Deeply cleanses intestinal villi and supports hepatic bile secretion.",
          "chefSecret": "Consume 30 minutes before retiring to bed."
        }
      ]
    },
    "saturday": {
      "name": "Saturday",
      "title": "Skeletal & Musculoskeletal Rejuvenation",
      "desc": "High calcium bioavailability, magnesium, and restorative anti-arthritic nutrition.",
      "meals": [
        {
          "type": "Morning Detox Nectar",
          "name": "Fresh Turmeric & Ginger Bio-Curcumin Elixir",
          "qty": "200 ml",
          "desc": "Raw grated turmeric root, ginger, and cracked black pepper decoction.",
          "benefit": "Suppresses inflammatory cytokines (NF-kB), relieving joint and muscular pain.",
          "chefSecret": "Add 1 drop of A2 cow ghee — curcumin is lipid-soluble."
        },
        {
          "type": "Power Breakfast",
          "name": "Desi Paneer Bhurji with Tomatoes & 2 Multigrain Toast",
          "qty": "1 Plate (180g)",
          "desc": "100g fresh crumbled paneer sautéed with ripe tomatoes, green chillies & turmeric.",
          "benefit": "20g high biological value protein and calcium for skeletal integrity.",
          "chefSecret": "Do not overcook paneer; keep it succulent and soft."
        },
        {
          "type": "Mid-Morning Fuel",
          "name": "Sesame (Til) & Dark Jaggery Pinni + Warm Water",
          "qty": "1 Small Pinni (25g)",
          "desc": "Slow-roasted black and white sesame seeds rolled in organic jaggery.",
          "benefit": "Gram for gram, delivers more bioavailable calcium than commercial dairy.",
          "chefSecret": "Lightly roast sesame seeds until they gently pop."
        },
        {
          "type": "Grand Ayurvedic Thali Lunch",
          "name": "Kala Chana Masala + Lauki Raita + 2 Ragi-Jowar Rotis",
          "qty": "Full Thali",
          "desc": "Iron-dense black chickpeas, bottle gourd raita, and calcium-rich ragi flatbreads.",
          "benefit": "Enhances bone mineral density and reinforces connective tissue.",
          "chefSecret": "Boil black chana with dry amla pieces for deep color and bioavailable iron."
        },
        {
          "type": "Evening Reviver Snack",
          "name": "Fox Nut (Makhana) Kheer (Zero Sugar, Date Sweetened)",
          "qty": "150 ml Bowl",
          "desc": "Crushed roasted fox nuts simmered in A2 milk, sweetened with Medjool dates.",
          "benefit": "Satisfies sweet cravings with zero weight gain or glucose penalty.",
          "chefSecret": "Infuse with freshly ground green cardamom powder."
        },
        {
          "type": "Light Healing Dinner",
          "name": "Moong Dal & Spinach Stew with 1 Jowar Phulka",
          "qty": "300 ml Bowl",
          "desc": "Pureed spinach and yellow lentils tempered with cumin and black pepper.",
          "benefit": "Assists renal clearance of excess uric acid from joint capsules.",
          "chefSecret": "A very light garlic temper enhances anti-inflammatory qualities."
        },
        {
          "type": "Restorative Bedtime Elixir",
          "name": "Saffron (Kesar) & Cardamom Warm Restorative Milk",
          "qty": "150 ml",
          "desc": "Warm milk infused with 2 stigmas of pure Kashmir saffron and cardamom.",
          "benefit": "Alleviates musculoskeletal stiffness and promotes tranquil sleep.",
          "chefSecret": "Pre-steep saffron threads in 2 tablespoons of warm milk."
        }
      ]
    },
    "sunday": {
      "name": "Sunday",
      "title": "Royal Gourmet Ayurvedic Health Feast",
      "desc": "Five-star royal culinary indulgence with zero refined sugars, maida, or palm oils.",
      "meals": [
        {
          "type": "Morning Detox Nectar",
          "name": "Fresh Tender Coconut Water with Lime & Rock Salt",
          "qty": "250 ml",
          "desc": "Fresh coconut water with a pinch of Himalayan salt and lime drops.",
          "benefit": "Flushes cellular metabolic waste and restores Sunday morning vitality.",
          "chefSecret": "Consume fresh straight from the coconut."
        },
        {
          "type": "Power Breakfast",
          "name": "Multi-Millet Vegetable Upma with Roasted Cashews",
          "qty": "1 Large Bowl (220g)",
          "desc": "Foxtail millet cooked with diced carrots, peas, mustard seeds, and roasted cashews.",
          "benefit": "Complex sustained energy release for a leisurely active Sunday morning.",
          "chefSecret": "Dry-roast millet grain for 3 minutes before boiling for separate grains."
        },
        {
          "type": "Mid-Morning Fuel",
          "name": "Ruby Pomegranate & Orange Seasonal Fruit Bowl",
          "qty": "1 Bowl",
          "desc": "Ruby pomegranate arils and fresh sweet orange segments with mint.",
          "benefit": "Packed with polyphenols and anthocyanins for cellular glow.",
          "chefSecret": "Gently sprinkle rock salt to heighten natural sweetness."
        },
        {
          "type": "Grand Ayurvedic Thali Lunch",
          "name": "Shahi Paneer (Melon Seed Velvet Gravy) + 2 Missi Rotis + Jeera Raita",
          "qty": "Royal Feast Thali",
          "desc": "Soft paneer in a rich watermelon seed gravy (zero cream), gram flour missi rotis & raita.",
          "benefit": "Five-star restaurant indulgence with zero trans fats or refined flours.",
          "chefSecret": "Puree soaked watermelon seeds (magaz) for a luxurious creamy texture."
        },
        {
          "type": "Evening Reviver Snack",
          "name": "Masala Kahwa Tea with Sliced Almonds & Saffron",
          "qty": "1 Cup (150 ml)",
          "desc": "Kashmiri green tea simmered with cinnamon, green cardamom, and slivered almonds.",
          "benefit": "Sparks digestive fire and warms core body temperature.",
          "chefSecret": "Stir in raw honey only after pouring into the cup."
        },
        {
          "type": "Light Healing Dinner",
          "name": "Lauki & Moong Dal Soothing Khichdi with A2 Ghee",
          "qty": "300g Bowl",
          "desc": "Gentle lentil and bottle gourd khichdi to reset digestion before Monday.",
          "benefit": "Leaves the gastrointestinal tract rested and clean for the upcoming week.",
          "chefSecret": "Add a steaming top temper of asafoetida and cumin in pure cow ghee."
        },
        {
          "type": "Restorative Bedtime Elixir",
          "name": "Organic Rose Petal & Fennel Restorative Milk",
          "qty": "150 ml",
          "desc": "Warm A2 milk gently infused with sun-dried Indian Damask rose petals and fennel.",
          "benefit": "Soothes internal heat (Pitta) and induces calm, deep restorative sleep.",
          "chefSecret": "Use organic culinary dried rose petals."
        }
      ]
    }
  }
};

// -----------------------------------------------------------------
// 🧬 SOVEREIGN DYNAMIC CLINICAL PERSONALIZATION & TRANSLATION ENGINE
// -----------------------------------------------------------------
function getPersonalizedDayMenu(dayKey, profile, lang) {
  const base = SEVEN_DAY_MENU[dayKey] || SEVEN_DAY_MENU.monday;
  const menu = JSON.parse(JSON.stringify(base));

  // 1. Full 7-Day Localization of Day Header & All Meals
  if (DAY_MEAL_TRANSLATIONS[lang] && DAY_MEAL_TRANSLATIONS[lang][dayKey]) {
    const tDay = DAY_MEAL_TRANSLATIONS[lang][dayKey];
    menu.dayName = tDay.name;
    menu.themeTitle = tDay.title;
    menu.themeDesc = tDay.desc;
    if (Array.isArray(tDay.meals)) {
      tDay.meals.forEach((tm, idx) => {
        if (menu.meals[idx]) {
          menu.meals[idx].type = tm.type || menu.meals[idx].type;
          menu.meals[idx].name = tm.name || menu.meals[idx].name;
          menu.meals[idx].qty = tm.qty || menu.meals[idx].qty;
          menu.meals[idx].desc = tm.desc || menu.meals[idx].desc;
          menu.meals[idx].benefit = tm.benefit || menu.meals[idx].benefit;
          menu.meals[idx].chefSecret = tm.chefSecret || menu.meals[idx].chefSecret;
        }
      });
    }
  }

  // 2. Profile Conditions & Dietary Preference
  const conditions = profile?.conditions || [];
  const isSugar = conditions.some(c => /sugar|diabet/i.test(c));
  const isBP = conditions.some(c => /bp|hypertens|heart/i.test(c));
  const isLiver = conditions.some(c => /liver/i.test(c));
  const isUric = conditions.some(c => /uric/i.test(c));
  const isThyroid = conditions.some(c => /thyroid/i.test(c));
  const isAcidity = conditions.some(c => /acid|gerd|reflux/i.test(c));
  const isPCOD = conditions.some(c => /pcod|pcos|hormon/i.test(c));
  const isFit = conditions.some(c => /none|fit/i.test(c)) || conditions.length === 0;

  const diet = profile?.diet || "veg";
  const isNonVeg = diet === "non_veg";
  const isEgg = diet === "egg" || isNonVeg;
  const isSattvic = diet === "sattvic";
  const isJain = diet === "jain";
  const isVegan = diet === "vegan";
  const isMuscle = profile?.goal === "muscle_gain";
  const isWeightLoss = profile?.goal === "weight_loss";

  // Calorie & Macro adjustments based on Goal & Diet
  if (isNonVeg && isMuscle) {
    menu.dailyTarget = { calories: 2150, protein: "142g", fiber: "34g", carbs: "190g", fats: "52g" };
  } else if (isNonVeg) {
    menu.dailyTarget = { calories: 1720, protein: "128g", fiber: "35g", carbs: "155g", fats: "44g" };
  } else if (isEgg && isMuscle) {
    menu.dailyTarget = { calories: 1980, protein: "115g", fiber: "38g", carbs: "185g", fats: "48g" };
  } else if (isEgg) {
    menu.dailyTarget = { calories: 1650, protein: "102g", fiber: "38g", carbs: "165g", fats: "42g" };
  } else if (isMuscle) {
    menu.dailyTarget = { calories: 1950, protein: "108g", fiber: "40g", carbs: "205g", fats: "46g" };
  } else if (isWeightLoss) {
    menu.dailyTarget = { calories: 1460, protein: "82g", fiber: "42g", carbs: "145g", fats: "36g" };
  }

  // 3. Multi-Disease Composite Shield Badges
  const badges = [];
  if (isSugar) badges.push(lang === "punjabi" ? "🩺 ਸ਼ੂਗਰ ਕੰਟਰੋਲ (ਲੋਅ-GI)" : lang === "hindi" ? "🩺 शुगर नियंत्रण (लो ग्लाइसेमिक)" : lang === "english" ? "🩺 Diabetes Control (Low-GI)" : "🩺 Sugar Control (Low-GI)");
  if (isBP) badges.push(lang === "punjabi" ? "🫀 ਹਾਈ ਬੀਪੀ (ਘੱਟ ਸੋਡੀਅਮ)" : lang === "hindi" ? "🫀 हाई बीपी शील्ड (लो सोडियम)" : lang === "english" ? "🫀 Hypertension Shield (DASH)" : "🫀 High BP Shield (Low Sodium)");
  if (isLiver) badges.push(lang === "punjabi" ? "🌿 ਫੈਟੀ ਲਿਵਰ ਡਿਟੌਕਸ" : lang === "hindi" ? "🌿 फैटी लिवर डिटॉक्स" : lang === "english" ? "🌿 Fatty Liver Cleanse" : "🌿 Fatty Liver Detox");
  if (isUric) badges.push(lang === "punjabi" ? "🦶 ਯੂਰਿਕ ਐਸਿਡ (ਲੋਅ ਪਿਊਰੀਨ)" : lang === "hindi" ? "🦶 यूरिक एसिड / गठिया (लो प्यूरीन)" : lang === "english" ? "🦶 Low-Purine Anti-Gout" : "🦶 Low-Purine (Anti-Gout)");
  if (isThyroid) badges.push(lang === "punjabi" ? "🦋 ਥਾਇਰਾਇਡ ਸੰਤੁਲਨ" : lang === "hindi" ? "🦋 थायरॉयड हार्मोन संतुलन" : lang === "english" ? "🦋 Thyroid Hormone Balance" : "🦋 Thyroid Balance");
  if (isAcidity) badges.push(lang === "punjabi" ? "🔥 ਐਸੀਡਿਟੀ ਸ਼ਾਂਤ (ਅਲਕਲਾਈਨ)" : lang === "hindi" ? "🔥 एसिडिटी शमन (एल्कलाइन)" : lang === "english" ? "🔥 Alkaline Anti-Reflux" : "🔥 Acidity Relief (Alkaline)");
  if (isPCOD) badges.push(lang === "punjabi" ? "🌸 ਪੀਸੀਓਡੀ ਹਾਰਮੋਨ ਸ਼ੀਲਡ" : lang === "hindi" ? "🌸 पीसीओडी हार्मोनल शील्ड" : lang === "english" ? "🌸 PCOD / Hormonal Protocol" : "🌸 PCOD Hormonal Protocol");
  if (isFit && badges.length === 0) badges.push(lang === "punjabi" ? "⚡ ਪੂਰੀ ਤੰਦਰੁਸਤੀ ਤੇ ਐਥਲੈਟਿਕ ਊਰਜਾ" : lang === "hindi" ? "⚡ पूर्ण फिटनेस व एथलेटिक ऊर्जा" : lang === "english" ? "⚡ Peak Fitness & Vitality" : "⚡ Peak Vitality & Energy");

  if (isSattvic) badges.push(lang === "punjabi" ? "🧘 ਸਾਤਵਿਕ (ਬਿਨਾਂ ਪਿਆਜ਼/ਲਸਣ)" : lang === "hindi" ? "🧘 सात्विक (शून्य प्याज/लहसुन)" : lang === "english" ? "🧘 Sattvic Protocol" : "🧘 Sattvic Protocol");
  if (isJain) badges.push(lang === "punjabi" ? "🌾 ਜੈਨ ਮਰਯਾਦਾ (ਕੰਦਮੂਲ-ਮੁਕਤ)" : lang === "hindi" ? "🌾 जैन आहार (कंदमूल-रहित)" : lang === "english" ? "🌾 Jain Standard (No Root Veggies)" : "🌾 Jain Standard");
  if (isVegan) badges.push(lang === "punjabi" ? "🥗 100% ਵੀਗਨ (ਡੇਅਰੀ-ਮੁਕਤ)" : lang === "hindi" ? "🥗 100% वीगन (डेयरी-मुक्त)" : lang === "english" ? "🥗 100% Plant-Based Vegan" : "🥗 100% Vegan (Dairy-Free)");
  if (diet === "egg") badges.push(lang === "punjabi" ? "🥚 ਆਂਡਾ ਸ਼ਾਕਾਹਾਰੀ" : lang === "hindi" ? "🥚 एगेटेरियन प्रोटीन" : lang === "english" ? "🥚 Eggetarian Protocol" : "🥚 Eggetarian Protocol");
  if (diet === "non_veg") badges.push(lang === "punjabi" ? "🍗 ਹਾਈ-ਪ੍ਰੋਟੀਨ ਮੀਟ/ਆਂਡੇ" : lang === "hindi" ? "🍗 लीन प्रोटीन नॉन-वेज" : lang === "english" ? "🍗 High-Protein Non-Veg" : "🍗 High-Protein Non-Veg");

  menu.clinicalBadge = badges.join(" • ");

  // 4. Clinical Morning Detox Elixir Customization (Meals[0])
  if (menu.meals[0]) {
    if (isSugar && isLiver) {
      menu.meals[0].name = lang === "punjabi" ? "ਕਰੇਲਾ-ਜਾਮੁਣ ਤੇ ਭੂਮੀ-ਆਂਵਲਾ ਕੋਸਾ ਅਰਕ" : lang === "hindi" ? "करेला-जामुन व भूमि-आंवला गुनगुना अर्क" : lang === "english" ? "Bitter Gourd (Karela) & Bhumi-Amla Hepato-Glycemic Cleanse" : "Karela-Jamun & Bhumi-Amla Cleanse";
      menu.meals[0].benefit = lang === "punjabi" ? "ਸ਼ੂਗਰ ਸਪਾਈਕ ਰੋਕਦਾ ਹੈ ਅਤੇ ਲਿਵਰ ਦੇ ਫੈਟ ਸੈੱਲਾਂ ਨੂੰ ਡਿਟੌਕਸ ਕਰਦਾ ਹੈ।" : lang === "hindi" ? "इंसुलिन रिसेप्टर्स सक्रिय करता है और फैटी लिवर के एंजाइम्स सामान्य करता है।" : lang === "english" ? "Stimulates insulin receptors and reverses hepatic triglyceride accumulation." : "Insulin stimulate karta hai aur fatty liver fat mobilize karta hai.";
    } else if (isSugar && isBP) {
      menu.meals[0].name = lang === "punjabi" ? "ਮੇਥੀ-ਦਾਣਾ ਤੇ ਅਰਜੁਨ ਦੀ ਛਿੱਲ ਦਾ ਕੋਸਾ ਕਾੜ੍ਹਾ" : lang === "hindi" ? "मेथी-दाना व अर्जुन की छाल का गुनगुना अर्क" : lang === "english" ? "Fenugreek (Methi) & Terminalia Arjuna Cardio-Glycemic Elixir" : "Methi-Dana & Arjun Chaal Cleanse";
      menu.meals[0].benefit = lang === "punjabi" ? "ਬਲੱਡ ਪ੍ਰੈਸ਼ਰ ਅਤੇ ਫਾਸਟਿੰਗ ਸ਼ੂਗਰ ਦੋਵਾਂ ਨੂੰ ਇਕੱਠੇ ਕੰਟਰੋਲ ਕਰਦਾ ਹੈ।" : lang === "hindi" ? "धमनियों की जकड़न दूर करता है और इंसुलिन स्पाइक रोकता है।" : lang === "english" ? "Optimizes vascular compliance and blunts fasting blood glucose spikes." : "Arterial compliance improve karta hai aur glucose control karta hai.";
    } else if (isSugar) {
      menu.meals[0].name = lang === "punjabi" ? "ਕਰੇਲਾ-ਜਾਮੁਣ ਤੇ ਮੇਥੀ-ਦਾਣਾ ਕੋਸਾ ਅਰਕ" : lang === "hindi" ? "करेला-जामुन व मेथी-दाना गुनगुना अर्क" : lang === "english" ? "Bitter Gourd & Fenugreek Metabolic Extract" : "Karela-Jamun & Methi-Dana Warm Elixir";
      menu.meals[0].benefit = lang === "punjabi" ? "ਚਾਰੈਂਟਿਨ ਤੇ ਪੌਲੀਪੈਪਟਾਈਡ-ਪੀ ਕੁਦਰਤੀ ਇੰਸੁਲਿਨ ਵਾਂਗ ਕੰਮ ਕਰਦੇ ਹਨ।" : lang === "hindi" ? "चारेंटिन व पॉलीपेप्टाइड-पी प्राकृतिक इंसुलिन की तरह शुगर स्पाइक रोकते हैं।" : lang === "english" ? "Charantin & Polypeptide-p mimic endogenous insulin and suppress glucose spikes." : "Charantin aur polypeptide-p sugar control karte hain.";
    } else if (isBP) {
      menu.meals[0].name = lang === "punjabi" ? "ਅਰਜੁਨ ਦੀ ਛਿੱਲ ਤੇ ਤਾਜ਼ਾ ਨਾਰੀਅਲ ਪਾਣੀ ਦਾ ਪੇਯ" : lang === "hindi" ? "अर्जुन की छाल व ताज़ा नारियल पानी का पेय" : lang === "english" ? "Terminalia Arjuna & Coconut Electrolyte Water" : "Arjun Chaal & Tender Coconut Infusion";
      menu.meals[0].benefit = lang === "punjabi" ? "ਨਾੜੀਆਂ ਨੂੰ ਲਚਕੀਲਾ ਬਣਾਉਂਦਾ ਹੈ ਅਤੇ ਹਾਈ ਬੀਪੀ ਨਾਰਮਲ ਰੱਖਦਾ ਹੈ।" : lang === "hindi" ? "पोटैशियम व कोएंजाइम क्यू10 दिल की धड़कन व बीपी संतुलित रखते हैं।" : lang === "english" ? "CoQ10 and bioavailable potassium relax vascular tone and lower systemic BP." : "CoQ10 aur potassium BP ko regulate karte hain.";
    } else if (isLiver) {
      menu.meals[0].name = lang === "punjabi" ? "ਭੂਮੀ-ਆਂਵਲਾ ਤੇ ਕੋਸਾ ਨਿੰਬੂ ਅਦਰਕ ਪਾਣੀ" : lang === "hindi" ? "भूमि-आंवला व गुनगुना नींबू अदरक जल" : lang === "english" ? "Phyllanthus Niruri (Bhumi-Amla) Liver Cleanse Sip" : "Bhumi-Amla & Warm Lemon-Ginger Cleanse";
      menu.meals[0].benefit = lang === "punjabi" ? "ਲਿਵਰ ਵਿੱਚੋਂ ਜੰਮੀ ਚਰਬੀ ਤੇ ਜ਼ਹਿਰੀਲੇ ਤੱਤ ਬਾਹਰ ਕੱਢਦਾ ਹੈ।" : lang === "hindi" ? "लिवर सेल्स का कायाकल्प करता है और एसजीओटी/एसजीपीटी एंजाइम्स सामान्य करता है।" : lang === "english" ? "Supports hepatic glutathione synthesis and normalizes SGOT/SGPT enzymes." : "Glutathione synthesize karke liver enzymes normal karta hai.";
    } else if (isUric) {
      menu.meals[0].name = lang === "punjabi" ? "ਕੱਚਾ ਸੇਬ ਦਾ ਸਿਰਕਾ (ACV) ਤੇ ਧਨੀਆ ਕੋਸਾ ਪਾਣੀ" : lang === "hindi" ? "एप्पल साइडर विनेगर (ACV) व धनिया गुनगुना अर्क" : lang === "english" ? "Raw Apple Cider Vinegar & Coriander Seed Infusion" : "Raw ACV & Coriander Seed Cleanse";
      menu.meals[0].benefit = lang === "punjabi" ? "ਜੋੜਾਂ ਵਿੱਚੋਂ ਯੂਰਿਕ ਐਸਿਡ ਕ੍ਰਿਸਟਲਸ ਨੂੰ ਘੋਲ ਕੇ ਬਾਹਰ ਕੱਢਦਾ ਹੈ।" : lang === "hindi" ? "मैलिक एसिड यूरिक एसिड क्रिस्टल को पिघलाकर पेशाब के रास्ते बाहर करता है।" : lang === "english" ? "Malic acid solubilizes monosodium urate crystals, accelerating renal clearance." : "Uric acid crystals ko flush out karta hai.";
    } else if (isThyroid) {
      menu.meals[0].name = lang === "punjabi" ? "ਕੁੱਟੇ ਧਨੀਏ ਦਾ ਕੋਸਾ ਪਾਣੀ ਤੇ ਭਿੱਜੇ ਕੱਦੂ ਦੇ ਬੀਜ" : lang === "hindi" ? "कुटे हुए साबुत धनिए का गुनगुना पानी व भीगे कद्दू बीज" : lang === "english" ? "Crushed Coriander Seed Warm Infusion & Pumpkin Seeds" : "Coriander Seed Infusion & Pumpkin Seeds";
      menu.meals[0].benefit = lang === "punjabi" ? "ਕੁਦਰਤੀ ਸਿਲੇਨੀਅਮ ਤੇ ਜ਼ਿੰਕ ਥਾਇਰਾਇਡ ਟੀ3/ਟੀ4 ਹਾਰਮੋਨ ਸੰਤੁਲਿਤ ਕਰਦੇ ਹਨ।" : lang === "hindi" ? "थायरॉयड ग्रंथि को डिटॉक्स कर टीएसएच (TSH) स्तर संतुलित करता है।" : lang === "english" ? "Bioavailable selenium & zinc optimize T4-to-T3 peripheral thyroid conversion." : "TSH balance karta hai aur metabolism badhata hai.";
    } else if (isAcidity) {
      menu.meals[0].name = lang === "punjabi" ? "ਸੌਂਫ਼ ਤੇ ਜੀਰੇ ਦਾ ਠੰਡਾ ਅਲਕਲਾਈਨ ਪਾਣੀ" : lang === "hindi" ? "सौंफ व जीरा शीतल एल्कलाइन पेय" : lang === "english" ? "Cold-Steeped Fennel & Cumin Alkaline Water" : "Saunf-Jeera Cold-Steeped Alkaline Water";
      menu.meals[0].benefit = lang === "punjabi" ? "ਪੇਟ ਤੇ ਛਾਤੀ ਦੀ ਜਲਣ ਨੂੰ ਤੁਰੰਤ ਠੰਡਾ ਕਰਦਾ ਹੈ।" : lang === "hindi" ? "अमाशय की म्यूकोसल परत को एसिड से बचाता है और तुरंत ठंडक देता है।" : lang === "english" ? "Neutralizes excess hydrochloric acid and coats delicate gastric mucosa." : "Stomach acid ko neutralize karta hai.";
    } else if (isPCOD) {
      menu.meals[0].name = lang === "punjabi" ? "ਸਪੀਅਰਮਿੰਟ (ਪੁਦੀਨਾ) ਤੇ ਦਾਲਚੀਨੀ ਕੋਸਾ ਕਾੜ੍ਹਾ" : lang === "hindi" ? "स्पीयरमिंट (पुदीना) व दालचीनी गुनगुना अर्क" : lang === "english" ? "Organic Spearmint & Ceylon Cinnamon Hormone Cleanse" : "Spearmint & Ceylon Cinnamon Elixir";
      menu.meals[0].benefit = lang === "punjabi" ? "ਐਂਡਰੋਜਨ ਘਟਾਉਂਦਾ ਹੈ ਅਤੇ ਹਾਰਮੋਨਜ਼ ਨੂੰ ਸੰਤੁਲਿਤ ਰੱਖਦਾ ਹੈ।" : lang === "hindi" ? "फ्री टेस्टोस्टेरोन स्तर घटाता है और ओवुलेशन नियमित करता है।" : lang === "english" ? "Exerts potent anti-androgenic effects and restores ovulatory cyclicity." : "Androgen hormone kam karta hai aur periods regular karta hai.";
    } else if (isFit) {
      menu.meals[0].name = lang === "punjabi" ? "ਤਾਜ਼ਾ ਆਂਵਲਾ, ਅਦਰਕ ਤੇ ਸ਼ਹਿਦ ਦਾ ਸ਼ੌਟ" : lang === "hindi" ? "ताज़ा आंवला, अदरक व शुद्ध शहद का शॉट" : lang === "english" ? "Fresh Amla, Ginger & Raw Honey Vitality Shot" : "Amla, Ginger & Raw Honey Vitality Shot";
      menu.meals[0].benefit = lang === "punjabi" ? "ਪੂਰੀ ਊਰਜਾ, ਤਾਕਤ ਅਤੇ ਰੋਗ ਪ੍ਰਤੀਰੋਧਕ ਸਮਰੱਥਾ ਵਧਾਉਂਦਾ ਹੈ।" : lang === "hindi" ? "ओजस शक्ति बढ़ाता है और दिन भर अटूट स्फूर्ति देता है।" : lang === "english" ? "Stimulates cellular biogenesis and delivers all-day athletic endurance." : "Immunity aur energy boost karta hai.";
    }
  }

  // 5. Diet Overrides on Meals (Meals[1], Meals[3], Meals[4])
  if (isNonVeg) {
    if (menu.meals[1]) {
      menu.meals[1].name = lang === "punjabi" ? "ਦੇਸੀ ਮਸਾਲਾ 3-ਆਂਡੇ ਸਫ਼ੈਦੀ ਆਮਲੇਟ ਤੇ ਪਾਲਕ" : lang === "hindi" ? "देसी मसाला 3-एग व्हाइट ऑमलेट व पालक" : lang === "english" ? "Desi Masala 3-Egg White Spinach Omelette" : "Desi Masala 3-Egg White Omelette with Spinach";
      menu.meals[1].calories = 290;
      menu.meals[1].protein = "26.5g";
      menu.meals[1].desc = lang === "punjabi" ? "3 ਆਂਡੇ ਦੀ ਸਫ਼ੈਦੀ, ਹਰੀ ਮਿਰਚ, ਸ਼ਿਮਲਾ ਮਿਰਚ ਅਤੇ 1 ਮਲਟੀਗ੍ਰੇਨ ਟੋਸਟ।" : lang === "hindi" ? "3 अंडे की सफेदी और 1 पूरा अंडा, हरी मिर्च, शिमला मिर्च और 1 मल्टीग्रेन टोस्ट।" : lang === "english" ? "3 egg whites + 1 whole egg, bell peppers, green chillies & 1 multigrain toast." : "3 egg whites + 1 whole egg with veggies & toast.";
      menu.meals[1].benefit = lang === "punjabi" ? "ਲੀਨ ਮਸਲ ਪ੍ਰੋਟੀਨ ਅਤੇ ਜ਼ੀਰੋ ਸ਼ੂਗਰ ਸਪਾਈਕ।" : lang === "hindi" ? "लीन मसल प्रोटीन और शून्य शुगर स्पाइक। दोपहर तक संपूर्ण तृप्ति।" : lang === "english" ? "Bioavailable albumin protein with zero glycemic load." : "Pure bioavailable protein.";
    }
    if (menu.meals[3]) {
      menu.meals[3].name = lang === "punjabi" ? "ਆਯੁਰਵੇਦਿਕ ਸਟੀਮਡ ਚਿਕਨ ਸਟੂ / ਫਿਸ਼ ਕਰੀ + 2 ਜਵਾਰ ਰੋਟੀ" : lang === "hindi" ? "आयुर्वेदिक स्टीम्ड चिकन स्टू / फिश करी + 2 ज्वार रोटी" : lang === "english" ? "Ayurvedic Murgh Herb Stew / Steamed Fish Curry + 2 Jowar Rotis" : "Ayurvedic Light Murgh Stew / Fish Curry + 2 Jowar Rotis";
      menu.meals[3].calories = 520;
      menu.meals[3].protein = "38.5g";
      menu.meals[3].desc = lang === "punjabi" ? "ਘੱਟ ਤੇਲ ਵਿੱਚ ਪੱਕੀ ਚਿਕਨ ਬ੍ਰੈਸਟ, ਅਦਰਕ-ਲਸਣ, ਘੀਆ ਤੇ 2 ਜਵਾਰ ਰੋਟੀਆਂ।" : lang === "hindi" ? "कम तेल में पकी चिकन ब्रेस्ट, अदरक-लहसुन, लौकी के साथ और 2 ज्वार रोटियां।" : lang === "english" ? "Slow-simmered tender chicken breast with ginger, garlic, bottle gourd & 2 jowar flatbreads." : "Slow simmered chicken with veggies and jowar roti.";
      menu.meals[3].benefit = lang === "punjabi" ? "38.5 ਗ੍ਰਾਮ ਸ਼ੁੱਧ ਪ੍ਰੋਟੀਨ — ਮਸਲ ਰਿਕਵਰੀ ਅਤੇ ਫੈਟ ਲੌਸ ਦੋਵਾਂ ਲਈ ਉੱਤਮ।" : lang === "hindi" ? "38.5 ग्राम शुद्ध लीन प्रोटीन — मसल रिकवरी और फैट लॉस दोनों में सर्वोत्तम।" : lang === "english" ? "38.5g lean amino acid profile with zero visceral fat accumulation." : "High protein lean muscle.";
    }
    if (menu.meals[4]) {
      menu.meals[4].name = lang === "punjabi" ? "ਉਬਲੇ ਆਂਡੇ (2) ਕਾਲੀ ਮਿਰਚ ਨਾਲ ਤੇ ਗ੍ਰੀਨ ਟੀ" : lang === "hindi" ? "उबले अंडे (2) काली मिर्च के साथ व ग्रीन टी" : lang === "english" ? "Boiled Egg Whites (2) with Pepper & Green Tea" : "Boiled Egg Whites (2) with Black Pepper & Green Tea";
      menu.meals[4].protein = "12.0g";
    }
  } else if (diet === "egg") {
    if (menu.meals[1]) {
      menu.meals[1].name = lang === "punjabi" ? "ਦੇਸੀ ਆਂਡਾ ਭੁਰਜੀ (2 ਆਂਡੇ) ਤੇ 2 ਜਵਾਰ ਰੋਟੀ" : lang === "hindi" ? "देसी अंडा भुर्जी (2 अंडे) व 2 ज्वार रोटी" : lang === "english" ? "Desi Masala Egg Bhurji (2 Eggs) + Jowar Roti" : "Desi Masala Egg Bhurji (2 Eggs) with Jowar Roti";
      menu.meals[1].calories = 310;
      menu.meals[1].protein = "22.5g";
    }
  } else if (isVegan) {
    if (menu.meals[1]) {
      menu.meals[1].name = lang === "punjabi" ? "ਸਪਾਈਸਡ ਟੋਫੂ ਭੁਰਜੀ ਤੇ 2 ਜਵਾਰ ਰੋਟੀ" : lang === "hindi" ? "मसालेदार टोफू भुर्जी व 2 ज्वार रोटी" : lang === "english" ? "Spiced Organic Tofu Scramble with 2 Jowar Rotis" : "Spiced Tofu Bhurji with 2 Jowar Rotis";
      menu.meals[1].desc = lang === "punjabi" ? "100% ਪਲਾਂਟ ਬੇਸਡ ਸੋਇਆ ਟੋਫੂ, ਟਮਾਟਰ, ਪਾਲਕ ਤੇ ਸਰ੍ਹੋਂ ਦੇ ਤੇਲ ਵਿੱਚ ਤੜਕਾ।" : lang === "hindi" ? "100% पादप आधारित टोफू, टमाटर, पालक व सरसों तेल में भुना।" : lang === "english" ? "100% plant-based organic tofu, tomatoes, spinach sautéed in cold-pressed oil." : "100% plant-based tofu scramble.";
    }
    if (menu.meals[3]) {
      menu.meals[3].name = menu.meals[3].name.replace(/chaas|ਲੱਸੀ|छाछ/gi, lang === "punjabi" ? "ਕੋਕਮ ਚੀਆ ਵਾਟਰ" : lang === "hindi" ? "कोकम-चिया जल" : "Kokum Chia Drink");
    }
    if (menu.meals[6]) {
      menu.meals[6].name = lang === "punjabi" ? "ਬਦਾਮ ਦੁੱਧ ਹਲਦੀ ਤੇ ਜਾਇਫਲ ਨਾਲ" : lang === "hindi" ? "बादाम दूध हल्दी व जायफल के साथ" : lang === "english" ? "Warm Almond Milk with Turmeric & Nutmeg" : "Almond Milk with Turmeric & Nutmeg";
    }
  } else if (isJain) {
    if (menu.meals[3]) {
      menu.meals[3].desc = lang === "punjabi" ? "ਬਿਨਾਂ ਆਲੂ, ਪਿਆਜ਼ ਤੇ ਲਸਣ ਤੋਂ ਸ਼ੁੱਧ ਜੈਨ ਮਰਯਾਦਾ ਅਨੁਸਾਰ ਤਿਆਰ ਦਾਲ, ਪਰਵਲ ਤੇ ਰੋਟੀ।" : lang === "hindi" ? "बिना आलू, प्याज, लहसुन व कंदमूल के शुद्ध जैन मर्यादा अनुसार बनी दाल, परवल व रोटी।" : lang === "english" ? "Strict Jain preparation: zero root vegetables (no potato/onion/garlic), with pointed gourd and lentils." : "Strict Jain preparation: zero root veggies.";
    }
  } else if (isSattvic) {
    if (menu.meals[3]) {
      menu.meals[3].desc = lang === "punjabi" ? "ਬਿਨਾਂ ਪਿਆਜ਼ ਤੇ ਬਿਨਾਂ ਲਸਣ ਤੋਂ ਜੀਰਾ-ਹਿੰਗ ਤੜਕਾ ਦੇਸੀ ਘਿਓ ਵਿੱਚ ਬਣੀ ਸਾਤਵਿਕ ਖੁਰਾਕ।" : lang === "hindi" ? "शून्य प्याज, शून्य लहसुन — जीरा, हींग व गाय के बिलोना घी में बनी सात्विक थाली।" : lang === "english" ? "Zero onion, zero garlic — tempered with cumin, hing and A2 cow ghee." : "Pure sattvic preparation without onion or garlic.";
    }
  }

  return menu;
}


// -----------------------------------------------------------------
// 2. DESI RASOI: MASTER GOURMET HEALTHY RECIPES
// -----------------------------------------------------------------
const MASTER_RECIPES = [
  {
    id: "moong-paneer-chilla",
    name: "Moong Dal & Paneer Stuffed Chilla",
    name_hi: "मूँग दाल व पनीर भरवां चीला",
    name_pa: "ਮੂੰਗੀ ਦਾਲ ਤੇ ਪਨੀਰ ਦਾ ਭਰਵਾਂ ਚਿੱਲਾ",
    name_en: "Moong Dal & Desi Paneer Stuffed Chilla",
    category: "High Protein Breakfast",
    category_hi: "हाई प्रोटीन नाश्ता",
    category_pa: "ਹਾਈ ਪ੍ਰੋਟੀਨ ਨਾਸ਼ਤਾ",
    category_en: "High-Protein Breakfast",
    prepTime: "8 min",
    cookTime: "7 min",
    calories: 280,
    protein: "18.5g",
    fiber: "6.8g",
    isVeg: true,
    isEgg: false,
    isNonVeg: false,
    isSattvic: true,
    isJain: true,
    isVegan: false,
    tags: ["High Protein", "Pure Veg", "Weight Loss", "Sugar Safe"],
    ingredients: [
      "Yellow Moong Dal (soaked 3 hrs, ground): 60g",
      "Fresh Desi Paneer (crumbled): 50g",
      "Finely chopped Tomato & Coriander: 30g",
      "Desi Ghee / Cold-pressed Oil: 1 tsp",
      "Hing, Bhuna Jeera & Sendha Namak: 2g"
    ],
    timeline: [
      "0-2 min: Batter me hing, jeera aur sendha namak mix karein. Pouring consistency rakhein.",
      "2-5 min: Garam tawa par 1/2 tsp ghee lagayein, circular failayein aur golden hone dein.",
      "5-7 min: Center me crumbled paneer aur hara dhaniya dalein. Roll karke pudina chutney ke sath serve karein."
    ],
    chefSecret: "Batter peeste waqt 1 chota tukda adrak aur 1 hari mirch sath peesein for street-style aroma."
  },
  {
    id: "sprout-chaat-power",
    name: "Live Enzyme Protein Sprout Chaat",
    name_hi: "अंकुरित मूँग-चना प्रोटीन चाट",
    name_pa: "ਅੰਕੁਰਿਤ ਮੂੰਗੀ ਤੇ ਛੋਲੇ ਪ੍ਰੋਟੀਨ ਚਾਟ",
    name_en: "Live Enzyme Sprout Power Chaat",
    category: "0-Cook Raw Power",
    category_hi: "0-कुक कच्चा आहार",
    category_pa: "ਕੱਚਾ ਆਹਾਰ",
    category_en: "Zero-Cook Raw Cleanse",
    prepTime: "5 min",
    cookTime: "0 min",
    calories: 215,
    protein: "14.2g",
    fiber: "10.5g",
    isVeg: true,
    isEgg: false,
    isNonVeg: false,
    isSattvic: true,
    isJain: true,
    isVegan: true,
    tags: ["0-Cook", "Pure Veg", "Live Enzymes", "Gut Cleanse"],
    ingredients: [
      "Sprouted Moong & Kala Chana: 150g",
      "Crisp Cucumber (finely diced with peel): 60g",
      "Ruby Pomegranate Arils (Anaar): 40g",
      "Roasted Jeera & Kala Namak: 3g",
      "Fresh Lemon Juice & Crushed Mint: 10ml"
    ],
    timeline: [
      "0-2 min: Sprouts ko drinking water me rinse karke strainer me drain karein.",
      "2-4 min: Bowl me kheera, tamatar, anaar aur barik kata pudina add karein.",
      "4-5 min: Roasted jeera powder, kala namak aur taza nimbu ras squeeze karke toss karein."
    ],
    chefSecret: "Thoda roasted makhana top par crush karke daalein for extra crunchy bite."
  },
  {
    id: "palak-paneer-iron",
    name: "Sovereign Palak Paneer (High Iron)",
    name_hi: "देसी पालक पनीर (हाई आयरन)",
    name_pa: "ਦੇਸੀ ਪਾਲਕ ਪਨੀਰ (ਹਾਈ ਆਇਰਨ)",
    name_en: "Sovereign Palak Paneer (High Iron)",
    category: "Nutritious Lunch/Dinner",
    category_hi: "पौष्टिक दोपहर / रात का भोजन",
    category_pa: "ਦੁਪਹਿਰ / ਰਾਤ ਦਾ ਖਾਣਾ",
    category_en: "Wholesome Ayur Lunch/Dinner",
    prepTime: "10 min",
    cookTime: "12 min",
    calories: 290,
    protein: "19.8g",
    fiber: "6.2g",
    isVeg: true,
    isEgg: false,
    isNonVeg: false,
    isSattvic: false,
    isJain: false,
    isVegan: false,
    tags: ["High Iron", "Pure Veg", "Low Carb", "Keto Desi"],
    ingredients: [
      "Fresh Tender Spinach (Palak): 250g blanched",
      "Low-Fat Malai Paneer Cubes: 100g",
      "Garlic (Lahsun) crushed: 6 cloves",
      "Cold-Pressed Mustard Oil / Desi Ghee: 1 tsp",
      "Hing, Cumin & Garam Masala: 2g"
    ],
    timeline: [
      "0-4 min: Palak ko 2 min boil karke turant ice-cold water me dalein (vibrant green color lock hota hai).",
      "4-8 min: Pan me 1 tsp ghee me jeera, hing aur lehsun ko golden brown karein.",
      "8-12 min: Pureed palak aur paneer cubes dalein. 3 min simmer karke garam serve karein."
    ],
    chefSecret: "Palak ko over-cook na karein aur ice bath zaroor dein — chlorophyll aur iron preserve rehte hain."
  },
  {
    id: "sattu-cooler-energy",
    name: "Chilled Himalayan Sattu Energy Drink",
    name_hi: "ठंडा सत्तू-जीरा एनर्जी ड्रिंक",
    name_pa: "ਠੰਡਾ ਸੱਤੂ-ਜੀਰਾ ਐਨਰਜੀ ਡ੍ਰਿੰਕ",
    name_en: "Chilled Himalayan Sattu Protein Cooler",
    category: "Metabolic Cooler",
    category_hi: "मेटाबॉलिक कूलर",
    category_pa: "ਮੈਟਾਬੋਲਿਕ ਕੂਲਰ",
    category_en: "Metabolic Plant Cooler",
    prepTime: "3 min",
    cookTime: "0 min",
    calories: 145,
    protein: "10.0g",
    fiber: "5.5g",
    isVeg: true,
    isEgg: false,
    isNonVeg: false,
    isSattvic: true,
    isJain: true,
    isVegan: true,
    tags: ["Natural Protein", "Pure Veg", "Heat Detox", "Zero Cook"],
    ingredients: [
      "Roasted Bengal Gram Sattu: 30g (2 heaped tbsp)",
      "Chilled Matka Water: 250 ml",
      "Roasted Cumin Powder (Bhuna Jeera): 1/2 tsp",
      "Black Salt (Kala Namak): 1/4 tsp",
      "Fresh Lemon Juice & Chopped Mint: 1 tbsp"
    ],
    timeline: [
      "0-1 min: Glass me sattu, jeera powder aur kala namak dalein.",
      "1-2 min: Thoda paani daal kar paste banayein (lumps nahi banenge), fir pura chilled water dalein.",
      "2-3 min: Nimbu ras aur pudina daal kar stir karein. Drink immediately."
    ],
    chefSecret: "Agar sweet pasand ho to namak ki jagah 1/2 tsp organic jaggery powder mila sakte hain."
  },
  {
    id: "lauki-moong-stew",
    name: "Lauki-Moong Digestive Detox Stew",
    name_hi: "लौकी-मूँग पाचक डिटॉक्स सूप",
    name_pa: "ਘੀਆ-ਮੂੰਗੀ ਪਾਚਕ ਡਿਟੌਕਸ ਸੂਪ",
    name_en: "Lauki-Moong Restorative Light Stew",
    category: "Healing Night Dinner",
    category_hi: "हल्का रात्रि भोजन",
    category_pa: "ਰਾਤ ਦਾ ਹਲਕਾ ਖਾਣਾ",
    category_en: "Restorative Healing Dinner",
    prepTime: "8 min",
    cookTime: "12 min",
    calories: 220,
    protein: "13.5g",
    fiber: "7.5g",
    isVeg: true,
    isEgg: false,
    isNonVeg: false,
    isSattvic: true,
    isJain: true,
    isVegan: true,
    tags: ["Light Dinner", "Pure Veg", "Liver Detox", "Zero Acidity"],
    ingredients: [
      "Bottle Gourd (Lauki) peeled & cubed: 200g",
      "Yellow Moong Dal (washed): 40g",
      "Desi Cow Ghee / Mustard Oil: 1/2 tsp",
      "Jeera, Hing & Fresh Crushed Black Pepper: 2g",
      "Fresh Coriander Leaves: 1 handful"
    ],
    timeline: [
      "0-3 min: Pressure cooker me 1/2 tsp ghee garam karke jeera aur hing tadkayein.",
      "3-8 min: Lauki aur moong dal daalein, 2 cup paani aur sendha namak mila kar 2 whistle lagayein.",
      "8-12 min: Halka mash karein, black pepper aur hara dhaniya daal kar soup ki tarah enjoy karein."
    ],
    chefSecret: "Lauki check kar lein ki kadwi na ho. Raat ko ye khane se pet bilkul flat aur light rehta hai."
  },
  {
    id: "ragi-vegetable-idli",
    name: "Steamed Ragi & Veggie Idlis",
    name_hi: "भाप से बनी रागी व वेज इडली",
    name_pa: "ਭਾਫ਼ ਨਾਲ ਬਣੀ ਰਾਗੀ ਤੇ ਸਬਜ਼ੀ ਇਡਲੀ",
    name_en: "Steamed Ragi & Vegetable Idlis",
    category: "High Calcium Breakfast",
    category_hi: "हाई कैल्शियम नाश्ता",
    category_pa: "ਹਾਈ ਕੈਲਸ਼ੀਅਮ ਨਾਸ਼ਤਾ",
    category_en: "High-Calcium Breakfast",
    prepTime: "10 min",
    cookTime: "12 min",
    calories: 240,
    protein: "10.5g",
    fiber: "8.5g",
    isVeg: true,
    isEgg: false,
    isNonVeg: false,
    isSattvic: true,
    isJain: false,
    isVegan: false,
    tags: ["Gluten Free", "Pure Veg", "Bone Health", "Diabetes Safe"],
    ingredients: [
      "Ragi Flour (Nachni): 60g",
      "Fresh Curd (Dahi): 50g",
      "Grated French Beans & Lauki: 40g",
      "Mustard seeds, Curry leaves & Green chilli: 1 tsp",
      "Pinch of Baking Soda & Sendha Namak"
    ],
    timeline: [
      "0-4 min: Ragi flour, dahi aur thoda paani mila kar 10 min rest karein.",
      "4-7 min: Kadi patta aur mustard seeds ka tadka batter me dalein with grated veggies.",
      "7-12 min: Idli steamer me 10-12 min steam karein. Fresh coconut chutney ke sath serve karein."
    ],
    chefSecret: "Ragi me calcium doodh se 3x zyada hota hai — joint aur bones ke liye best desi superfood hai."
  },
  {
    id: "besan-methi-cheela",
    name: "Besan & Fresh Methi Fiber Cheela",
    name_hi: "बेसन व ताज़ा मेथी हाई-फाइबर चीला",
    name_pa: "ਬੇਸਣ ਤੇ ਤਾਜ਼ੀ ਮੇਥੀ ਫਾਈਬਰ ਚਿੱਲਾ",
    name_en: "Besan & Fresh Fenugreek Fiber Cheela",
    category: "Low Glycemic Breakfast",
    category_hi: "लो ग्लाइसेमिक नाश्ता",
    category_pa: "ਲੋਅ ਗਲਾਈਸੈਮਿਕ ਨਾਸ਼ਤਾ",
    category_en: "Low-GI Breakfast",
    prepTime: "6 min",
    cookTime: "6 min",
    calories: 230,
    protein: "12.5g",
    fiber: "7.2g",
    isVeg: true,
    isEgg: false,
    isNonVeg: false,
    isSattvic: true,
    isJain: true,
    isVegan: true,
    tags: ["Pure Veg", "Sugar Safe", "Low GI", "Fiber Rich"],
    ingredients: [
      "Bengal Gram Flour (Besan): 50g",
      "Finely chopped fresh Methi leaves: 40g",
      "Ajwain, Turmeric & Sendha Namak: 2g",
      "Cold-pressed Mustard Oil: 1/2 tsp"
    ],
    timeline: [
      "0-3 min: Besan me ajwain, haldi, methi aur paani mila kar smooth batter banayein.",
      "3-6 min: Tawa par 1/2 tsp mustard oil lagayein aur dono side golden crisp sekein."
    ],
    chefSecret: "Ajwain aur methi ka combination insulin receptors ko stimulate karta hai aur gas bilkul nahi hone deta."
  },
  {
    id: "egg-bhurji-power",
    name: "Desi Masala 3-Egg White & Bell Pepper Bhurji",
    name_hi: "देसी मसाला 3-एग व्हाइट व शिमला मिर्च भुर्जी",
    name_pa: "ਦੇਸੀ ਮਸਾਲਾ 3-ਆਂਡੇ ਸਫ਼ੈਦੀ ਭੁਰਜੀ",
    name_en: "Desi Masala 3-Egg White Bhurji",
    category: "High Protein Eggetarian",
    category_hi: "हाई प्रोटीन एगेटेरियन",
    category_pa: "ਹਾਈ ਪ੍ਰੋਟੀਨ ਐਗਟੇਰੀਅਨ",
    category_en: "High-Protein Eggetarian",
    prepTime: "5 min",
    cookTime: "6 min",
    calories: 210,
    protein: "24.0g",
    fiber: "4.2g",
    isVeg: false,
    isEgg: true,
    isNonVeg: false,
    isSattvic: false,
    isJain: false,
    isVegan: false,
    tags: ["Eggetarian", "High Protein", "Quick Prep", "Sugar Safe"],
    ingredients: [
      "Egg Whites: 3 + Whole Egg: 1",
      "Diced Capsicum, Onion & Tomato: 60g",
      "Green Chillies & Fresh Coriander",
      "Desi Ghee: 1 tsp",
      "Turmeric, Hing & Jeera"
    ],
    timeline: [
      "0-2 min: Ghee me jeera, hari mirch aur pyaaz-shimla mirch saute karein.",
      "2-5 min: Eggs ko beat karke dalein aur medium flame par scramble karein.",
      "5-6 min: Kasuri methi aur hara dhaniya sprinkle karein. Jowar roti ke sath lein."
    ],
    chefSecret: "Last me 1 pinch kasuri methi hath se masal kar dalne se pure dhaba style aroma aata hai."
  },
  {
    id: "desi-chicken-stew",
    name: "Desi Murgh Clear Broth & Herb Stew",
    name_hi: "देसी मुर्ग हर्ब ब्रॉथ व स्टू",
    name_pa: "ਦੇਸੀ ਚਿਕਨ ਹਰਬ ਸਟੂ",
    name_en: "Desi Murgh Herb Broth Stew",
    category: "High Protein Non-Veg",
    category_hi: "हाई प्रोटीन मांसाहारी",
    category_pa: "ਹਾਈ ਪ੍ਰੋਟੀਨ ਮਾਸਾਹਾਰੀ",
    category_en: "High-Protein Non-Veg",
    prepTime: "10 min",
    cookTime: "15 min",
    calories: 290,
    protein: "36.0g",
    fiber: "3.5g",
    isVeg: false,
    isEgg: false,
    isNonVeg: true,
    isSattvic: false,
    isJain: false,
    isVegan: false,
    tags: ["Non-Veg", "High Protein", "Fat Loss", "Immunity"],
    ingredients: [
      "Skinless Chicken Breast (cubed): 160g",
      "Crushed Ginger, Garlic & Green Chilli: 1 tbsp",
      "Diced Bottle Gourd (Lauki) & Carrots: 60g",
      "A2 Desi Cow Ghee: 1 tsp",
      "Crushed Black Peppercorns & Sendha Namak: to taste"
    ],
    timeline: [
      "0-3 min: Ghee me jeera, adrak aur lehsun saute karein.",
      "3-8 min: Chicken cubes aur sabziyan add karke 5 min halka bhunein.",
      "8-15 min: 2 cup paani aur kali mirch daal kar simmer karein. Garam bowl serve karein."
    ],
    chefSecret: "Chicken broth me natural collagen aur amino acids hote hain jo gut aur joints ko deeply repair karte hain."
  },
  {
    id: "tandoori-grilled-fish",
    name: "Turmeric Lemon Grilled Fish (Surmai/Rohu)",
    name_hi: "हल्दी-नींबू ग्रिल्ड फिश",
    name_pa: "ਹਲਦੀ-ਨਿੰਬੂ ਗ੍ਰਿਲਡ ਫਿਸ਼",
    name_en: "Turmeric Lemon Grilled Fish",
    category: "High Protein Non-Veg",
    category_hi: "हाई प्रोटीन मांसाहारी",
    category_pa: "ਹਾਈ ਪ੍ਰੋਟੀਨ ਮਾਸਾਹਾਰੀ",
    category_en: "High-Protein Non-Veg",
    prepTime: "8 min",
    cookTime: "10 min",
    calories: 240,
    protein: "32.0g",
    fiber: "1.5g",
    isVeg: false,
    isEgg: false,
    isNonVeg: true,
    isSattvic: false,
    isJain: false,
    isVegan: false,
    tags: ["Non-Veg", "Omega-3", "Heart Safe", "Fat Loss"],
    ingredients: [
      "Fresh Fish Fillet (Surmai/Rohu/Singhara): 160g",
      "Turmeric, Roasted Ajwain & Lemon Juice: 1 tbsp",
      "Hung Desi Curd (Dahi): 2 tbsp",
      "Cold-Pressed Mustard Oil: 1 tsp",
      "Sendha Namak & Chaat Masala"
    ],
    timeline: [
      "0-5 min: Dahi me haldi, ajwain aur nimbu mila kar fish par 10 min marinate karein.",
      "5-10 min: Tawa par 1 tsp mustard oil me dono side 4-4 min grill karein. Mint chutney ke sath serve karein."
    ],
    chefSecret: "Ajwain aur mustard oil fish ke omega-3 fatty acids ki absorption ko 2x badha dete hain."
  },
  {
    id: "pahadi-chicken-soup",
    name: "Pahadi Garlic-Coriander Chicken Immunity Soup",
    name_hi: "पहाड़ी लहसुन-धनिया चिकन सूप",
    name_pa: "ਪਹਾੜੀ ਲਸਣ-ਧਨੀਆ ਚਿਕਨ ਸੂਪ",
    name_en: "Pahadi Garlic-Coriander Chicken Soup",
    category: "High Protein Non-Veg",
    category_hi: "हाई प्रोटीन मांसाहारी",
    category_pa: "ਹਾਈ ਪ੍ਰੋਟੀਨ ਮਾਸਾਹਾਰੀ",
    category_en: "High-Protein Non-Veg",
    prepTime: "8 min",
    cookTime: "12 min",
    calories: 180,
    protein: "28.0g",
    fiber: "2.0g",
    isVeg: false,
    isEgg: false,
    isNonVeg: true,
    isSattvic: false,
    isJain: false,
    isVegan: false,
    tags: ["Non-Veg", "Immunity", "Fat Loss", "Zero Carbs"],
    ingredients: [
      "Chicken Breast Shreds: 130g",
      "Crushed Garlic (10 cloves)",
      "Fresh Coriander Stem Paste: 2 tbsp",
      "Desi Ghee: 1/2 tsp",
      "Fresh Lemon Juice & Crushed Peppercorns"
    ],
    timeline: [
      "0-3 min: Desi ghee me crushed garlic saute karein jab tak golden khushboo na aaye.",
      "3-8 min: Chicken shreds aur coriander stem paste add karein.",
      "8-12 min: 350ml paani daal kar 5 min simmer karein. Garam soup bowl me nimbu squeeze karein."
    ],
    chefSecret: "Dhaniya ki danthal (stems) me pattiyo se 4x zyada aroma aur electrolytes hote hain."
  }
];

// -----------------------------------------------------------------
// 3. CLINICAL HEALTH CONDITIONS & PARHEZ DOSSIERS
// -----------------------------------------------------------------
const HEALTH_DOSSIERS = [
  {
    id: "diabetes",
    condition: "Diabetes & High Blood Sugar",
    hindiName: "Madhumeha / Blood Sugar Control",
    color: "#10B981",
    summary: "Insulin sensitivity badhana aur khane ke baad sugar spike ko 100% prevent karna.",
    kyaKhayein: [
      "Yellow Moong Dal Chilla aur Besan-Palak Cheela",
      "Karela, Jamun, Methi dana warm water subah",
      "Jowar, Bajra aur Ragi rotis (Maida/Chawal ki jagah)",
      "Sprouts chaat with nimbu aur black pepper",
      "Lauki, Tinda, Parwal, French Beans aur Methi sabzi"
    ],
    kyaBilkoolNaKhayein: [
      "Chini, Gur (excess), Mithai, Packed Fruit Juices",
      "Refined Maida, Naan, Bhature, Bakery Biscuits",
      "Deep-fried samosa, kachori, pakode",
      "Excess Aloo, Arbi, Shakarkandi (Sweet Potato in excess)"
    ],
    ayurvedicHerb: "Methi Dana + Vijaysar Lakdi ka paani + Karela-Jamun Shot khali pet."
  },
  {
    id: "hypertension",
    condition: "High Blood Pressure & Cardiac Care",
    hindiName: "Uccha Raktachap / Heart Wellness",
    color: "#EF4444",
    summary: "Arterial pressure drop karna, excess sodium flush out karna aur potassium boost karna.",
    kyaKhayein: [
      "Taza Nariyal Paani with lemon",
      "Sendha Namak (Rock Salt) in limited qty — white table salt band",
      "Lauki ka soup, Steamed Daliya, Oats with flaxseed",
      "Moringa (Drumstick) pods aur garlic-tempered dals",
      "Pomegranate (Anaar) aur soaked walnuts"
    ],
    kyaBilkoolNaKhayein: [
      "Market ke Achaar, Papads, aur Processed Cheese",
      "Bahar ka Chinese food (Monosodium Glutamate / Ajinomoto)",
      "Namkeen, Bhujia, Salted chips",
      "Excess Chai/Coffee aur energy drinks"
    ],
    ayurvedicHerb: "Arjuna Ki Chaal ka decoction + Lehsun (Garlic) ki 1 kacchi kali subah."
  },
  {
    id: "fatty-liver",
    condition: "Fatty Liver & Sluggish Digestion",
    hindiName: "Yakrit Dosha / Fatty Liver Reversal",
    color: "#F59E0B",
    summary: "Liver cells se visceral fat deposit ko melt karna aur bile flow optimize karna.",
    kyaKhayein: [
      "Amla-Adrak warm shot subah khali pet",
      "Broccoli, Cauliflower aur Cabbage (Sulforaphane rich)",
      "Papaya aur Green apples",
      "Lauki-Moong Dal Stew with crushed kali mirch",
      "Triphala powder raat ko gungune paani ke sath"
    ],
    kyaBilkoolNaKhayein: [
      "Alcohol aur packed sweetened beverages",
      "Refined vegetable oils (Dalda, Palm oil, Vanaspati)",
      "Late night heavy dinners (post 8:30 PM)",
      "Heavy cream gravies, red meat, excessive butter"
    ],
    ayurvedicHerb: "Bhumyamalaki + Kutki + Taza Amla Juice daily."
  },
  {
    id: "uric-acid",
    condition: "High Uric Acid & Joint Pain (Gout)",
    hindiName: "Vatarakta / Gout & Joint Inflammation",
    color: "#8B5CF6",
    summary: "Purine load kam karna aur kidney filtration enhance karke crystals dissolve karna.",
    kyaKhayein: [
      "3.5 Litres alkaline water (Nimbu paani regular)",
      "Cucumber (Kheera), Lauki, Torai, Gourd vegetables",
      "Cherries, Mosambi, Oranges aur Pears",
      "Jowar aur Ragi rotis with jeera chaas",
      "Fresh Kachi Haldi boiled in water"
    ],
    kyaBilkoolNaKhayein: [
      "Red Rajma, Chhole (excess), Sabut Urad Dal",
      "Mushrooms, Palak (excess), Cauliflower in large qty",
      "Red meat, seafood, beer/alcohol",
      "High Fructose Corn Syrup & Soft drinks"
    ],
    ayurvedicHerb: "Guduchi (Giloy) kwath + Punarnava arisht for kidney filtration."
  },
  {
    id: "thyroid",
    condition: "Hypothyroidism & Slow Metabolism",
    hindiName: "Galagand / Thyroid Weight Management",
    color: "#06B6D4",
    summary: "Cellular basal metabolic rate badhana aur T4 se T3 conversion boost karna.",
    kyaKhayein: [
      "Dhaniya beej (Coriander seeds) ka ubla hua gunguna paani",
      "Soaked Brazil nuts ya Walnuts (Selenium power)",
      "Moong Dal, Sprouted Chana, Fresh Paneer",
      "Coconut water and cold-pressed coconut oil (MCTs)",
      "Ashwagandha night milk"
    ],
    kyaBilkoolNaKhayein: [
      "Kacchi gobhi, broccoli, patta gobhi (Raw cruciferous vegetables)",
      "Soy milk aur excessive processed soya products",
      "Gluten products (excess maida, white bread)",
      "White refined sugar"
    ],
    ayurvedicHerb: "Kanchnar Guggulu + Sabut Dhaniya ka kwath subah khali pet."
  },
  {
    id: "acidity",
    condition: "Acid Reflux, GERD & Severe Bloating",
    hindiName: "Amlapitta / Severe Acidity & Pet Ki Gas",
    color: "#EC4899",
    summary: "Stomach acid ko soothe karna aur lower esophageal sphincter ko heal karna.",
    kyaKhayein: [
      "Thandi Saunf aur Mishri ka paani",
      "Fresh Tender Coconut Water",
      "Moong Dal Khichdi with Desi Cow Ghee (Zero mirch)",
      "Chilled Chaas with roasted cumin and mint",
      "Soaked Munakka aur Black Raisins"
    ],
    kyaBilkoolNaKhayein: [
      "Khali pet tez kadak chai ya black coffee",
      "Tez lal mirch, garam masala, packaged schezwan sauce",
      "Deep fried pakode aur samosa",
      "Basi khana (Reheated leftover food)"
    ],
    ayurvedicHerb: "Avipattikar Churna + Yashtimadhu (Mulethi) tea."
  }
];

// -----------------------------------------------------------------
// 🩺 LOCALIZED CLINICAL HEALTH DOSSIERS ENGINE
// -----------------------------------------------------------------
function getLocalizedHealthDossiers(lang) {
  if (lang === "hindi") {
    return [
      {
        id: "diabetes",
        condition: "मधुमेह व हाई ब्लड शुगर",
        hindiName: "इंसुलिन सक्रियण व लो-ग्लाइसेमिक परहेज़",
        color: "#10B981",
        summary: "इंसुलिन संवेदनशीलता बढ़ाना और भोजन के बाद ब्लड शुगर स्पाइक को पूरी तरह रोकना।",
        kyaKhayein: [
          "पीली मूंग दाल व बेसन-पालक चीला",
          "करेला, जामुन व मेथी दाना का गुनगुना पानी सुबह खाली पेट",
          "ज्वार, बाजरा और रागी की रोटियां (मैदा/चावल की जगह)",
          "अंकुरित मूंग-चना चाट नींबू और काली मिर्च के साथ",
          "लौकी, टिंडा, परवल, बीन्स और मेथी की हरी सब्जी"
        ],
        kyaBilkoolNaKhayein: [
          "सफेद चीनी, गुड़, हलवाई की मिठाइयां और पैक्ड फ्रूट जूस",
          "मैदा, नान, भटूरे, बेकरी बिस्कुट और टोस्ट",
          "समोसा, कचौरी, पकौड़े और डीप-फ्राइड नमकीन",
          "अत्यधिक आलू, अरबी, शकरकंदी व सफेद चावल"
        ],
        ayurvedicHerb: "मेथी दाना + विजयसार की लकड़ी का पानी + करेला-जामुन शॉट।"
      },
      {
        id: "hypertension",
        condition: "हाई ब्लड प्रेशर व हृदय स्वास्थ्य",
        hindiName: "धमनी विश्राम व लो-सोडियम कार्डियक केयर",
        color: "#EF4444",
        summary: "धमनियों का दबाव घटाना, अतिरिक्त सोडियम बाहर निकालना और पोटैशियम का स्तर बढ़ाना।",
        kyaKhayein: [
          "ताज़ा नारियल पानी नींबू के साथ (पोटैशियम पावर)",
          "सफेद नमक बंद करके सीमित मात्रा में सिर्फ सेंधा नमक",
          "लौकी का सूप, दलिया, और ओट्स अलसी के बीज के साथ",
          "सहजन (मोरिंगा) की फली और लहसुन के तड़के वाली दाल",
          "अनार और भीगे हुए अखरोट"
        ],
        kyaBilkoolNaKhayein: [
          "बाजार के डिब्बाबंद अचार, पापड़ और प्रोसेस्ड चीज़",
          "बाहर का चाइनीज खाना (अजीनोमोटो / मोनोसोडियम ग्लूटामेट)",
          "बाजार की नमकीन, भुजिया और नमकीन आलू चिप्स",
          "अत्यधिक कड़क चाय, कॉफी और कोल्ड ड्रिंक्स"
        ],
        ayurvedicHerb: "अर्जुन की छाल का काढ़ा + सुबह 1 कली कच्चा देसी लहसुन।"
      },
      {
        id: "fatty-liver",
        condition: "फैटी लिवर व सुस्त पाचन",
        hindiName: "यकृत शुद्धि व लिवर डिटॉक्स",
        color: "#F59E0B",
        summary: "लिवर कोशिकाओं से विसरल फैट पिघलाना और पित्त (Bile) का प्रवाह संतुलित करना।",
        kyaKhayein: [
          "आंवला-अदरक का गुनगुना शॉट सुबह खाली पेट",
          "ब्रोकोली, पत्तागोभी और फूलगोभी (सल्फोराफेन युक्त)",
          "पपीता और हरा सेब",
          "लौकी-मूंग दाल स्टू कुटी काली मिर्च के साथ",
          "त्रिफला चूर्ण रात को गुनगुने पानी के साथ"
        ],
        kyaBilkoolNaKhayein: [
          "शराब, बियर और मीठे कोल्ड ड्रिंक्स",
          "रिफाइंड पाम ऑयल, डालडा और वनस्पति घी",
          "देर रात का भारी भोजन (रात 8:30 के बाद खाना)",
          "मलाईदार ग्रेवी, लाल मांस और अत्यधिक मक्खन"
        ],
        ayurvedicHerb: "भूमि-आंवला + कुटकी + ताज़ा आंवला रस।"
      },
      {
        id: "uric-acid",
        condition: "हाई यूरिक एसिड व गठिया (जोड़ों का दर्द)",
        hindiName: "वातरक्त व लो-प्यूरीन डाइट",
        color: "#8B5CF6",
        summary: "प्यूरीन लोड घटाना और किडनी से यूरिक एसिड क्रिस्टल घोलकर बाहर निकालना।",
        kyaKhayein: [
          "3.5 लीटर पानी (दिनभर नींबू पानी का नियमित सेवन)",
          "खीरा, लौकी, तोरई और ककड़ी जैसी पानीदार सब्जियां",
          "चेरी, मौसमी, संतरा और नाशपाती",
          "ज्वार और रागी की रोटियां भुने जीरा छाछ के साथ",
          "कच्ची हल्दी का पानी"
        ],
        kyaBilkoolNaKhayein: [
          "लाल राजमा, छोले (अधिक मात्रा में) और उड़द की दाल",
          "मशरूम, अधिक पालक, फूलगोभी",
          "रेड मीट, सीफूड और शराब/बियर",
          "हाई फ्रुक्टोज कॉर्न सिरप और सॉफ्ट ड्रिंक्स"
        ],
        ayurvedicHerb: "गिलोय (गुडूची) का काढ़ा + पुनर्नवारिष्ट।"
      },
      {
        id: "thyroid",
        condition: "थायरॉयड व धीमा मेटाबॉलिज्म",
        hindiName: "हार्मोन संतुलन व वजन नियंत्रण",
        color: "#06B6D4",
        summary: "बेसल मेटाबॉलिक रेट बढ़ाना और T4 से एक्टिव T3 हार्मोन रूपांतरण तेज करना।",
        kyaKhayein: [
          "साबुत धनिया के बीज का उबला हुआ गुनगुना पानी",
          "भीगे हुए अखरोट (सेलेनियम शक्ति)",
          "मूंग दाल, अंकुरित चना और ताज़ा पनीर",
          "नारियल पानी और कोल्ड-प्रेस्ड नारियल तेल",
          "अश्वगंधा युक्त रात का गुनगुना दूध"
        ],
        kyaBilkoolNaKhayein: [
          "कच्ची गोभी, ब्रोकली और पत्तागोभी (गॉइट्रोजेन्स)",
          "सोया मिल्क और अत्यधिक प्रोसेस्ड सोयाबीन उत्पाद",
          "मैदा, सफेद ब्रेड और अत्यधिक ग्लूटेन",
          "सफेद रिफाइंड चीनी"
        ],
        ayurvedicHerb: "कांचनार गुग्गुलु + साबुत धनिया का काढ़ा।"
      },
      {
        id: "acidity",
        condition: "एसिड रिफ्लक्स, गैस व बदहजमी",
        hindiName: "अम्लपित्त व पेट की जलन का निवारण",
        color: "#EC4899",
        summary: "पेट के अतिरिक्त एसिड को शांत करना और पेट की अंदरूनी परत को ठीक करना।",
        kyaKhayein: [
          "ठंडी सौंफ और धागे वाली मिश्री का पानी",
          "ताज़ा मीठा नारियल पानी",
          "मूंग दाल खिचड़ी देसी गाय के घी के साथ (बिना मिर्च)",
          "भुने जीरे और पुदीने वाली ठंडी छाछ",
          "भीगी हुई मुनक्का"
        ],
        kyaBilkoolNaKhayein: [
          "खाली पेट कड़क चाय या ब्लैक कॉफी",
          "तेज लाल मिर्च, गरम मसाला और शेजवान सॉस",
          "तले हुए समोसे, पकौड़े और कचौरी",
          "बासी या बार-बार गर्म किया हुआ खाना"
        ],
        ayurvedicHerb: "अविपत्तिकर चूर्ण + मुलेठी (यष्टिमधु) की चाय।"
      }
    ];
  } else if (lang === "punjabi") {
    return [
      {
        id: "diabetes",
        condition: "ਸ਼ੂਗਰ ਕੰਟਰੋਲ ਤੇ ਬਲੱਡ ਸ਼ੂਗਰ",
        hindiName: "ਇੰਸੁਲਿਨ ਵਾਧਾ ਤੇ ਲੋਅ-ਗਲਾਈਸੈਮਿਕ ਡਾਈਟ",
        color: "#10B981",
        summary: "ਇੰਸੁਲਿਨ ਦੀ ਤਾਕਤ ਵਧਾਉਣਾ ਅਤੇ ਖਾਣੇ ਤੋਂ ਬਾਅਦ ਸ਼ੂਗਰ ਸਪਾਈਕ ਨੂੰ ਰੋਕਣਾ।",
        kyaKhayein: [
          "ਪੀਲੀ ਮੂੰਗੀ ਦਾਲ ਤੇ ਬੇਸਣ-ਪਾਲਕ ਦਾ ਚੀਲਾ",
          "ਕਰੇਲਾ, ਜਾਮੁਣ ਤੇ ਮੇਥੀ ਦਾਣੇ ਦਾ ਕੋਸਾ ਪਾਣੀ",
          "ਜਵਾਰ, ਬਾਜਰਾ ਤੇ ਰਾਗੀ ਦੀਆਂ ਰੋਟੀਆਂ",
          "ਅੰਕੁਰਿਤ ਮੂੰਗੀ-ਛੋਲੇ ਨਿੰਬੂ ਤੇ ਕਾਲੀ ਮਿਰਚ ਨਾਲ",
          "ਘੀਆ, ਟੀਂਡੇ, ਬੀਨਜ਼ ਤੇ ਹਰੀ ਮੇਥੀ ਦੀ ਸਬਜ਼ੀ"
        ],
        kyaBilkoolNaKhayein: [
          "ਚਿੱਟੀ ਖੰਡ, ਗੁੜ ਤੇ ਹਲਵਾਈ ਦੀਆਂ ਮਿਠਾਈਆਂ",
          "ਮੈਦਾ, ਨਾਨ, ਭਟੂਰੇ ਤੇ ਬੇਕਰੀ ਦੇ ਬਿਸਕੁਟ",
          "ਸਮੋਸੇ, ਪਕੌੜੇ ਤੇ ਤਲੀਆਂ ਚੀਜ਼ਾਂ",
          "ਵੱਧ ਆਲੂ, ਚੌਲ ਤੇ ਸ਼ਕਰਕੰਦੀ"
        ],
        ayurvedicHerb: "ਮੇਥੀ ਦਾਣਾ + ਵਿਜੇਸਾਰ ਦੀ ਲੱਕੜੀ ਦਾ ਪਾਣੀ + ਕਰੇਲਾ-ਜਾਮੁਣ ਸ਼ੌਟ।"
      },
      {
        id: "hypertension",
        condition: "ਹਾਈ ਬਲੱਡ ਪ੍ਰੈਸ਼ਰ ਤੇ ਦਿਲ ਦੀ ਸਿਹਤ",
        hindiName: "ਘੱਟ ਸੋਡੀਅਮ ਤੇ ਦਿਲ ਦੀ ਦੇਖਭਾਲ",
        color: "#EF4444",
        summary: "ਨਾੜੀਆਂ ਦਾ ਦਬਾਅ ਘਟਾਉਣਾ, ਵਾਧੂ ਲੂਣ ਬਾਹਰ ਕੱਢਣਾ ਤੇ ਪੋਟਾਸ਼ੀਅਮ ਵਧਾਉਣਾ।",
        kyaKhayein: [
          "ਤਾਜ਼ਾ ਨਾਰੀਅਲ ਪਾਣੀ ਨਿੰਬੂ ਨਾਲ (ਪੋਟਾਸ਼ੀਅਮ ਭਰਪੂਰ)",
          "ਚਿੱਟਾ ਲੂਣ ਬੰਦ ਕਰਕੇ ਸਿਰਫ਼ ਸੰਧਾ ਲੂਣ ਵਰਤੋ",
          "ਘੀਆ ਦਾ ਸੂਪ, ਦਲੀਆ ਤੇ ਅਲਸੀ ਦੇ ਬੀਜ",
          "ਸੁਹਾਂਜਣਾ (ਮੋਰਿੰਗਾ) ਤੇ ਲਸਣ ਦੇ ਤੜਕੇ ਵਾਲੀ ਦਾਲ",
          "ਅਨਾਰ ਤੇ ਭਿੱਜੇ ਅਖਰੋਟ"
        ],
        kyaBilkoolNaKhayein: [
          "ਬਾਜ਼ਾਰ ਦਾ ਅਚਾਰ, ਪਾਪੜ ਤੇ ਚੀਜ਼",
          "ਬਾਹਰਲਾ ਚਾਈਨੀਜ਼ ਫੂਡ (ਅਜੀਨੋਮੋਟੋ)",
          "ਨਮਕੀਨ, ਭੁਜੀਆ ਤੇ ਤਲੇ ਚਿਪਸ",
          "ਬਹੁਤ ਤੇਜ਼ ਚਾਹ, ਕੌਫ਼ੀ ਤੇ ਕੋਲਡ ਡ੍ਰਿੰਕਸ"
        ],
        ayurvedicHerb: "ਅਰਜੁਨ ਦੀ ਛਿੱਲ ਦਾ ਕਾੜ੍ਹਾ + ਸਵੇਰੇ 1 ਕਲੀ ਦੇਸੀ ਲਸਣ।"
      },
      {
        id: "fatty-liver",
        condition: "ਫੈਟੀ ਲਿਵਰ ਤੇ ਪੇਟ ਦੀ ਸਫ਼ਾਈ",
        hindiName: "ਲਿਵਰ ਡਿਟੌਕਸ ਤੇ ਚਰਬੀ ਘਟਾਉਣਾ",
        color: "#F59E0B",
        summary: "ਲਿਵਰ ਦੀ ਚਰਬੀ ਪਿਘਲਾਉਣਾ ਅਤੇ ਪਾਚਨ ਕਿਰਿਆ ਨੂੰ ਤੇਜ਼ ਕਰਨਾ।",
        kyaKhayein: [
          "ਆਂਵਲਾ-ਅਦਰਕ ਦਾ ਕੋਸਾ ਸ਼ੌਟ ਸਵੇਰੇ ਖਾਲੀ ਪੇਟ",
          "ਬ੍ਰੋਕਲੀ, ਬੰਦਗੋਭੀ ਤੇ ਫੁੱਲਗੋਭੀ",
          "ਪਪੀਤਾ ਤੇ ਹਰਾ ਸੇਬ",
          "ਘੀਆ-ਮੂੰਗੀ ਦਾਲ ਸੂਪ ਕਾਲੀ ਮਿਰਚ ਨਾਲ",
          "ਤ੍ਰਿਫਲਾ ਚੂਰਨ ਰਾਤ ਨੂੰ ਕੋਸੇ ਪਾਣੀ ਨਾਲ"
        ],
        kyaBilkoolNaKhayein: [
          "ਸ਼ਰਾਬ, ਬੀਅਰ ਤੇ ਮਿੱਠੇ ਕੋਲਡ ਡ੍ਰਿੰਕਸ",
          "ਪਾਮ ਆਇਲ, ਡਾਲਡਾ ਘਿਓ ਤੇ ਰਿਫਾਇੰਡ ਤੇਲ",
          "ਦੇਰ ਰਾਤ ਦਾ ਭਾਰੀ ਖਾਣਾ",
          "ਲਾਲ ਮੀਟ, ਕਰੀਮ ਵਾਲੀਆਂ ਗਰੇਵੀਆਂ"
        ],
        ayurvedicHerb: "ਭੂਮੀ-ਆਂਵਲਾ + ਕੁਟਕੀ + ਤਾਜ਼ਾ ਆਂਵਲਾ ਰਸ।"
      },
      {
        id: "uric-acid",
        condition: "ਯੂਰਿਕ ਐਸਿਡ ਤੇ ਜੋੜਾਂ ਦਾ ਦਰਦ",
        hindiName: "ਲੋਅ-ਪਿਊਰੀਨ ਖੁਰਾਕ ਤੇ ਸਫ਼ਾਈ",
        color: "#8B5CF6",
        summary: "ਪਿਊਰੀਨ ਘਟਾਉਣਾ ਅਤੇ ਗੁਰਦਿਆਂ ਰਾਹੀਂ ਯੂਰਿਕ ਐਸਿਡ ਦੇ ਕ੍ਰਿਸਟਲ ਬਾਹਰ ਕੱਢਣਾ।",
        kyaKhayein: [
          "ਰੋਜ਼ਾਨਾ 3.5 ਲਿਟਰ ਪਾਣੀ (ਨਿੰਬੂ ਪਾਣੀ ਨਿਯਮਿਤ)",
          "ਖੀਰਾ, ਘੀਆ, ਤੋਰੀ ਤੇ ਹਲਕੀਆਂ ਸਬਜ਼ੀਆਂ",
          "ਚੈਰੀ, ਮੌਸੰਮੀ, ਸੰਤਰਾ ਤੇ ਨਾਸ਼ਪਾਤੀ",
          "ਜਵਾਰ ਤੇ ਰਾਗੀ ਦੀਆਂ ਰੋਟੀਆਂ ਜੀਰਾ ਛਾਛ ਨਾਲ",
          "ਕੱਚੀ ਹਲਦੀ ਦਾ ਪਾਣੀ"
        ],
        kyaBilkoolNaKhayein: [
          "ਰਾਜਮਾਹ, ਛੋਲੇ (ਜ਼ਿਆਦਾ ਮਾਤਰਾ) ਤੇ ਮਾਂਹ ਦੀ ਦਾਲ",
          "ਮਸ਼ਰੂਮ, ਜ਼ਿਆਦਾ ਪਾਲਕ ਤੇ ਫੁੱਲਗੋਭੀ",
          "ਰੈੱਡ ਮੀਟ, ਮੱਛੀ ਤੇ ਸ਼ਰਾਬ/ਬੀਅਰ",
          "ਸਾਫ਼ਟ ਡ੍ਰਿੰਕਸ ਤੇ ਪੈਕਟ ਜੂਸ"
        ],
        ayurvedicHerb: "ਗਿਲੋਏ ਦਾ ਕਾੜ੍ਹਾ + ਪੁਨਰਨਵਾ ਰਸ।"
      },
      {
        id: "thyroid",
        condition: "ਥਾਇਰਾਇਡ ਤੇ ਸੁਸਤ ਮੈਟਾਬੋਲਿਜ਼ਮ",
        hindiName: "ਹਾਰਮੋਨ ਸੰਤੁਲਨ ਤੇ ਭਾਰ ਕੰਟਰੋਲ",
        color: "#06B6D4",
        summary: "ਸਰੀਰਕ ਮੈਟਾਬੋਲਿਜ਼ਮ ਵਧਾਉਣਾ ਅਤੇ ਥਾਇਰਾਇਡ ਹਾਰਮੋਨ ਨੂੰ ਕਿਰਿਆਸ਼ੀਲ ਕਰਨਾ।",
        kyaKhayein: [
          "ਸਾਬਤ ਧਨੀਏ ਦੇ ਬੀਜਾਂ ਦਾ ਉਬਾਲਿਆ ਕੋਸਾ ਪਾਣੀ",
          "ਭਿੱਜੇ ਹੋਏ ਅਖਰੋਟ (ਸਿਲੇਨੀਅਮ ਭਰਪੂਰ)",
          "ਮੂੰਗੀ ਦਾਲ, ਅੰਕੁਰਿਤ ਛੋਲੇ ਤੇ ਤਾਜ਼ਾ ਪਨੀਰ",
          "ਨਾਰੀਅਲ ਪਾਣੀ ਤੇ ਕੋਲਡ-ਪ੍ਰੈੱਸਡ ਨਾਰੀਅਲ ਤੇਲ",
          "ਅਸ਼ਵਗੰਧਾ ਵਾਲਾ ਰਾਤ ਦਾ ਕੋਸਾ ਦੁੱਧ"
        ],
        kyaBilkoolNaKhayein: [
          "ਕੱਚੀ ਗੋਭੀ ਤੇ ਬ੍ਰੋਕਲੀ (ਗੋਇਟ੍ਰੋਜਨਸ)",
          "ਸੋਇਆ ਮਿਲਕ ਤੇ ਪ੍ਰੋਸੈੱਸਡ ਸੋਇਆ ਉਤਪਾਦ",
          "ਮੈਦਾ, ਵ੍ਹਾਈਟ ਬ੍ਰੈੱਡ ਤੇ ਗਲੂਟਨ",
          "ਚਿੱਟੀ ਰਿਫਾਇੰਡ ਖੰਡ"
        ],
        ayurvedicHerb: "ਕੰਚਨਾਰ ਗੁੱਗੂਲੁ + ਸਾਬਤ ਧਨੀਏ ਦਾ ਕਾੜ੍ਹਾ।"
      },
      {
        id: "acidity",
        condition: "ਐਸਿਡਿਟੀ, ਗੈਸ ਤੇ ਛਾਤੀ ਦੀ ਜਲਣ",
        hindiName: "ਤੇਜ਼ਾਬ ਸ਼ਾਂਤ ਕਰਨ ਵਾਲੀ ਖੁਰਾਕ",
        color: "#EC4899",
        summary: "ਪੇਟ ਦੇ ਵਧੇ ਤੇਜ਼ਾਬ ਨੂੰ ਸ਼ਾਂਤ ਕਰਨਾ ਅਤੇ ਅੰਦਰੂਨੀ ਪਰਤ ਨੂੰ ਠੀਕ ਕਰਨਾ।",
        kyaKhayein: [
          "ਠੰਡੀ ਸੌਂਫ਼ ਤੇ ਮਿਸ਼ਰੀ ਦਾ ਪਾਣੀ",
          "ਤਾਜ਼ਾ ਮਿੱਠਾ ਨਾਰੀਅਲ ਪਾਣੀ",
          "ਮੂੰਗੀ ਦਾਲ ਖਿਚੜੀ ਦੇਸੀ ਘਿਓ ਨਾਲ (ਬਿਨਾਂ ਮਿਰਚ)",
          "ਭੁੰਨੇ ਜੀਰੇ ਤੇ ਪੁਦੀਨੇ ਵਾਲੀ ਠੰਡੀ ਲੱਸੀ",
          "ਭਿੱਜੇ ਹੋਏ ਮੁਨੱਕੇ"
        ],
        kyaBilkoolNaKhayein: [
          "ਖਾਲੀ ਪੇਟ ਤੇਜ਼ ਕੜਕ ਚਾਹ ਜਾਂ ਕੌਫ਼ੀ",
          "ਤੇਜ਼ ਲਾਲ ਮਿਰਚ, ਗਰਮ ਮਸਾਲਾ ਤੇ ਸ਼ੈਜ਼ਵਾਨ ਸਾਸ",
          "ਤਲੇ ਹੋਏ ਸਮੋਸੇ, ਪਕੌੜੇ",
          "ਬਾਸੀ ਜਾਂ ਮੁੜ ਗਰਮ ਕੀਤਾ ਖਾਣਾ"
        ],
        ayurvedicHerb: "ਅਵਿਪੱਤੀਕਰ ਚੂਰਨ + ਮੁਲੱਠੀ ਦੀ ਚਾਹ।"
      }
    ];
  }
  return HEALTH_DOSSIERS;
}

// -----------------------------------------------------------------
// 🌐 GLOBAL 4-LANGUAGE MULTI-LINGUAL DICTIONARY (EN / HINGLISH / HI / PA)
// -----------------------------------------------------------------
const UI_STRINGS = {
  english: {
    appTitle: "GARUDA AAHAAR",
    appSubtitle: "Clinical Nutrition & Diet AI",
    welcome: "Welcome",
    tabs: {
      calendar: "7-Day Diet",
      recipes: "Desi Kitchen",
      health: "Medical Parhez",
      chat: "GARUDA AI"
    },
    days: [
      { id: "monday", label: "Mon", full: "Monday", icon: "🌱" },
      { id: "tuesday", label: "Tue", full: "Tuesday", icon: "🥩" },
      { id: "wednesday", label: "Wed", full: "Wednesday", icon: "❤️" },
      { id: "thursday", label: "Thu", full: "Thursday", icon: "🧘" },
      { id: "friday", label: "Fri", full: "Friday", icon: "🛡️" },
      { id: "saturday", label: "Sat", full: "Saturday", icon: "🦴" },
      { id: "sunday", label: "Sun", full: "Sunday", icon: "👑" }
    ],
    hydration: {
      title: "Daily Hydration & Detox",
      target: "8 Glasses Target (2.0L)",
      btnLog: "+1 Glass Water",
      toastLogged: "💧 1 glass logged! Stay hydrated.",
      toastReset: "💧 Hydration reset for new day."
    },
    profileBanner: {
      titleSuffix: "'s Personalized Diet Plan",
      changeBtn: "Edit Profile ⚙️",
      fallbackName: "Your"
    },
    tab2: {
      title: "Desi Kitchen: Master Chef Recipes",
      desc: "Zero refined flour (maida), zero palm oil — high-protein therapeutic dishes with step-by-step cooking."
    },
    tab3: {
      tag: "🩺 CLINICAL MEDICAL PARHEZ DOSSIER",
      title: "Medical Nutrition: What to Eat & What to Avoid?",
      desc: "Clinically verified therapeutic diets, healing superfoods and Ayurvedic herbal decoctions for 7 major health conditions."
    },
    labels: {
      dailyTargets: "Daily Target",
      protein: "Protein",
      fiber: "Fiber",
      carbs: "Carbs",
      fats: "Fats",
      portion: "Portion",
      chefSecret: "Chef's Secret",
      clinicalBenefit: "Clinical Benefit",
      swapMeal: "Swap Meal",
      markDone: "Eaten / Done",
      completed: "Completed",
      prepTime: "Prep Time",
      ingredients: "Ingredients",
      instructions: "Cooking Steps",
      viewRecipe: "View Recipe",
      close: "Close",
      whatToEat: "✅ What to Eat (Healing Foods)",
      whatToAvoid: "❌ What to Avoid (Strict Parhez)",
      clinicalAdvice: "💡 Clinical Medical Advisory",
      listen: "Listen",
      stop: "Stop",
      ask: "Ask",
      speak: "Speak",
      autoVoice: "Voice",
      listening: "🎙️ GARUDA is listening... Speak now!",
      thinking: "🎙️ GARUDA Clinical Intelligence is analyzing... 🌿",
      speaking: "🔊 GARUDA is speaking...",
      micNotAllowed: "Please allow microphone permission.",
      micError: "Could not hear properly. Please speak again."
    },
    chat: {
      placeholder: "Ask GARUDA about diet, cravings or health...",
      quickChips: [
        "Highest protein Indian breakfast?",
        "Pastry craving fix without gaining fat?",
        "Best drink on empty stomach?",
        "Sustainable belly fat loss plan?",
        "Paneer vs Tofu: which is better?",
        "How to reverse fatty liver naturally?"
      ]
    },
    categories: { all: "All", highProtein: "High Protein", nonVeg: "🍗 Non-Veg & Eggs", fatLoss: "Fat Loss", sugarControl: "Sugar Control", quickSnack: "Quick Snack" }
  },
  hinglish: {
    appTitle: "GARUDA AAHAAR",
    appSubtitle: "Clinical Nutrition & Diet AI",
    welcome: "Namaste",
    tabs: {
      calendar: "7-Day Diet",
      recipes: "Desi Rasoi",
      health: "Bimari Parhez",
      chat: "GARUDA AI"
    },
    days: [
      { id: "monday", label: "Somwar", full: "Somwar (Monday)", icon: "🌱" },
      { id: "tuesday", label: "Mangal", full: "Mangalwar (Tuesday)", icon: "🥩" },
      { id: "wednesday", label: "Budh", full: "Budhwar (Wednesday)", icon: "❤️" },
      { id: "thursday", label: "Guru", full: "Guruwar (Thursday)", icon: "🧘" },
      { id: "friday", label: "Shukra", full: "Shukrawar (Friday)", icon: "🛡️" },
      { id: "saturday", label: "Shani", full: "Shaniwar (Saturday)", icon: "🦴" },
      { id: "sunday", label: "Ravi", full: "Raviwar (Sunday)", icon: "👑" }
    ],
    hydration: {
      title: "Daily Hydration & Detox",
      target: "8 Glass Target (2.0L)",
      btnLog: "+1 Glass Paani Piya",
      toastLogged: "💧 1 glass paani log kiya! Shaandar.",
      toastReset: "💧 Hydration reset ho gaya."
    },
    profileBanner: {
      titleSuffix: " Ka Personalized Diet Plan",
      changeBtn: "Badlein ✏️",
      fallbackName: "Aapka"
    },
    tab2: {
      title: "Desi Rasoi: Master Chef Healthy Recipes",
      desc: "Bina maida, bina palm oil — high-protein swadisht dishes step-by-step cooking ke sath."
    },
    tab3: {
      tag: "🩺 CLINICAL MEDICAL PARHEZ DOSSIER",
      title: "Kaunsi Bimari Me Kya Khayein Aur Kya Chhodein?",
      desc: "7 pramukh bimariyon ke clinically verified parhez, healing foods aur Ayurvedic aushadhi."
    },
    labels: {
      dailyTargets: "Daily Target",
      protein: "Protein",
      fiber: "Fiber",
      carbs: "Carbs",
      fats: "Fats",
      portion: "Portion",
      chefSecret: "Chef Secret",
      clinicalBenefit: "Clinical Fayda",
      swapMeal: "Meal Badlein",
      markDone: "Kha Liya",
      completed: "Kha Chuke Hain",
      prepTime: "Taiyari Waqt",
      ingredients: "Samagri",
      instructions: "Banane ki Vidhi",
      viewRecipe: "Recipe Dekhein",
      close: "Band Karein",
      whatToEat: "✅ Kya Khayein (Faydemand Aahar)",
      whatToAvoid: "❌ Kya Na Khayein (Strict Parhez)",
      clinicalAdvice: "💡 Doctor & Clinical Salah",
      listen: "Suniye",
      stop: "Rokein",
      ask: "Pucho",
      speak: "Boliye",
      autoVoice: "Aawaz",
      listening: "🎙️ GARUDA sun raha hai... Boliye!",
      thinking: "🎙️ GARUDA Clinical Intelligence analyze kar raha hai... 🌿",
      speaking: "🔊 GARUDA bol raha hai...",
      micNotAllowed: "Mic permission allow karein taaki GARUDA sun sake.",
      micError: "Aawaz theek se nahi suni. Kripya dubara boliye."
    },
    chat: {
      placeholder: "GARUDA se diet ya craving ke baare me puchiye...",
      quickChips: [
        "Subah khali pet kya pina best hai?",
        "Breakfast me sabse high-protein nashta kya hai?",
        "Pastry khani hai par belly fat kam karna hai",
        "Belly fat aur vajan kaise kam karein?",
        "Chai ka healthy option kya hai?",
        "Fatty liver reverse karne ka desi plan"
      ]
    },
    categories: { all: "Sabhi", highProtein: "High Protein", nonVeg: "🍗 Non-Veg & Eggs", fatLoss: "Fat Loss", sugarControl: "Sugar Control", quickSnack: "Halka Nashta" }
  },
  hindi: {
    appTitle: "गरुड़ आहार",
    appSubtitle: "क्लिनिकल न्यूट्रिशन व डाइट AI",
    welcome: "नमस्ते",
    tabs: {
      calendar: "7-दिन डाइट",
      recipes: "देसी रसोई",
      health: "बीमारी परहेज़",
      chat: "गरुड़ AI"
    },
    days: [
      { id: "monday", label: "सोमवार", full: "सोमवार", icon: "🌱" },
      { id: "tuesday", label: "मंगलवार", full: "मंगलवार", icon: "🥩" },
      { id: "wednesday", label: "बुधवार", full: "बुधवार", icon: "❤️" },
      { id: "thursday", label: "गुरुवार", full: "गुरुवार", icon: "🧘" },
      { id: "friday", label: "शुक्रवार", full: "शुक्रवार", icon: "🛡️" },
      { id: "saturday", label: "शनिवार", full: "शनिवार", icon: "🦴" },
      { id: "sunday", label: "रविवार", full: "रविवार", icon: "👑" }
    ],
    hydration: {
      title: "दैनिक पानी व डिटॉक्स",
      target: "8 गिलास लक्ष्य (2.0 लीटर)",
      btnLog: "+1 गिलास पानी पिया",
      toastLogged: "💧 1 गिलास पानी दर्ज हुआ! स्वस्थ रहें।",
      toastReset: "💧 पानी का हिसाब रीसेट हुआ।"
    },
    profileBanner: {
      titleSuffix: " का पर्सनलाइज्ड डाइट प्लान",
      changeBtn: "बदलें ✏️",
      fallbackName: "आपका"
    },
    tab2: {
      title: "देसी रसोई: मास्टर शेफ हेल्दी रेसिपीज़",
      desc: "बिना मैदा, बिना पाम ऑयल — हाई-प्रोटीन स्वादिष्ट व्यंजन आसान विधि के साथ।"
    },
    tab3: {
      tag: "🩺 क्लिनिकल परहेज़ व बीमारी मार्गदर्शिका",
      title: "कौन सी बीमारी में क्या खाएं और क्या न खाएं?",
      desc: "प्रमुख बीमारियों के लिए डॉक्टरी दृष्टि से प्रमाणित परहेज़, लाभकारी भोजन और आयुर्वेदिक औषधियां।"
    },
    labels: {
      dailyTargets: "दैनिक लक्ष्य",
      protein: "प्रोटीन",
      fiber: "फाइबर",
      carbs: "कार्ब्स",
      fats: "फैट्स",
      portion: "मात्रा",
      chefSecret: "शेफ का सीक्रेट",
      clinicalBenefit: "स्वास्थ्य लाभ",
      swapMeal: "भोजन बदलें",
      markDone: "खा लिया",
      completed: "संपन्न",
      prepTime: "तैयारी का समय",
      ingredients: "सामग्री",
      instructions: "बनाने की विधि",
      viewRecipe: "रेसिपी देखें",
      close: "बंद करें",
      whatToEat: "✅ क्या खाएं (लाभकारी व स्वास्थ्यवर्धक)",
      whatToAvoid: "❌ क्या न खाएं (सख्त परहेज़)",
      clinicalAdvice: "💡 डॉक्टर व क्लिनिकल सलाह",
      listen: "सुनें",
      stop: "रोकें",
      ask: "पूछें",
      speak: "बोलिए",
      autoVoice: "आवाज़",
      listening: "🎙️ गरुड़ सुन रहा है... बोलिए!",
      thinking: "🎙️ गरुड़ क्लिनिकल इंटेलिजेंस से विश्लेषण कर रहा है... 🌿",
      speaking: "🔊 गरुड़ बोल रहा है...",
      micNotAllowed: "कृपया माइक अनुमति प्रदान करें ताकि गरुड़ सुन सके।",
      micError: "आवाज़ स्पष्ट नहीं आई। कृपया पुनः बोलें।"
    },
    chat: {
      placeholder: "गरुड़ से डाइट या क्रेविंग के बारे में पूछें...",
      quickChips: [
        "सुबह खाली पेट क्या पीना सबसे बेस्ट है?",
        "नाश्ते में सबसे हाई-प्रोटीन क्या खाएं?",
        "पेस्ट्री खानी है पर पेट की चर्बी भी घटानी है",
        "पेट की चर्बी और वजन घटाने का डाइट प्लान",
        "चाय का हेल्दी देसी विकल्प क्या है?",
        "फैटी लिवर रिवर्स करने का देसी प्लान"
      ]
    },
    categories: { all: "सभी", highProtein: "हाई प्रोटीन", nonVeg: "🍗 मांसाहारी व अंडा", fatLoss: "फैट लॉस", sugarControl: "शुगर कंट्रोल", quickSnack: "हल्का नाश्ता" }
  },
  punjabi: {
    appTitle: "ਗਰੁੜ ਆਹਾਰ",
    appSubtitle: "ਕਲੀਨਿਕਲ ਨਿਊਟ੍ਰੀਸ਼ਨ ਤੇ ਡਾਈਟ AI",
    welcome: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ",
    tabs: {
      calendar: "7-ਦਿਨ ਡਾਈਟ",
      recipes: "ਦੇਸੀ ਰਸੋਈ",
      health: "ਬਿਮਾਰੀ ਪਰਹੇਜ਼",
      chat: "ਗਰੁੜ AI"
    },
    days: [
      { id: "monday", label: "ਸੋਮਵਾਰ", full: "ਸੋਮਵਾਰ", icon: "🌱" },
      { id: "tuesday", label: "ਮੰਗਲਵਾਰ", full: "ਮੰਗਲਵਾਰ", icon: "🥩" },
      { id: "wednesday", label: "ਬੁੱਧਵਾਰ", full: "ਬੁੱਧਵਾਰ", icon: "❤️" },
      { id: "thursday", label: "ਵੀਰਵਾਰ", full: "ਵੀਰਵਾਰ", icon: "🧘" },
      { id: "friday", label: "ਸ਼ੁੱਕਰਵਾਰ", full: "ਸ਼ੁੱਕਰਵਾਰ", icon: "🛡️" },
      { id: "saturday", label: "ਸ਼ਨਿੱਚਰਵਾਰ", full: "ਸ਼ਨਿੱਚਰਵਾਰ", icon: "🦴" },
      { id: "sunday", label: "ਐਤਵਾਰ", full: "ਐਤਵਾਰ", icon: "👑" }
    ],
    hydration: {
      title: "ਰੋਜ਼ਾਨਾ ਪਾਣੀ ਤੇ ਡਿਟੌਕਸ",
      target: "8 ਗਲਾਸ ਟੀਚਾ (2.0 ਲਿਟਰ)",
      btnLog: "+1 ਗਲਾਸ ਪਾਣੀ ਪੀਤਾ",
      toastLogged: "💧 1 ਗਲਾਸ ਪਾਣੀ ਦਰਜ ਹੋਇਆ! ਤੰਦਰੁਸਤ ਰਹੋ।",
      toastReset: "💧 ਪਾਣੀ ਦਾ ਹਿਸਾਬ ਮੁੜ ਸੈੱਟ ਹੋਇਆ।"
    },
    profileBanner: {
      titleSuffix: " ਦਾ ਪਰਸਨਲਾਈਜ਼ਡ ਡਾਈਟ ਪਲਾਨ",
      changeBtn: "ਬਦਲੋ ✏️",
      fallbackName: "ਤੁਹਾਡਾ"
    },
    tab2: {
      title: "ਦੇਸੀ ਰਸੋਈ: ਮਾਸਟਰ ਸ਼ੈੱਫ ਸਿਹਤਮੰਦ ਰੈਸਿਪੀਆਂ",
      desc: "ਬਿਨਾਂ ਮੈਦੇ ਤੇ ਬਿਨਾਂ ਪਾਮ ਆਇਲ ਤੋਂ — ਹਾਈ-ਪ੍ਰੋਟੀਨ ਸਵਾਦਿਸ਼ਟ ਖਾਣੇ ਸੌਖੇ ਤਰੀਕੇ ਨਾਲ।"
    },
    tab3: {
      tag: "🩺 ਕਲੀਨਿਕਲ ਪਰਹੇਜ਼ ਤੇ ਬਿਮਾਰੀ ਗਾਈਡ",
      title: "ਕਿਹੜੀ ਬਿਮਾਰੀ ਵਿੱਚ ਕੀ ਖਾਓ ਤੇ ਕੀ ਨਾ ਖਾਓ?",
      desc: "ਮੁੱਖ ਬਿਮਾਰੀਆਂ ਲਈ ਡਾਕਟਰੀ ਜਾਂਚ ਕੀਤੇ ਪਰਹੇਜ਼, ਗੁਣਕਾਰੀ ਭੋਜਨ ਅਤੇ ਆਯੁਰਵੈਦਿਕ ਦਵਾਈਆਂ।"
    },
    labels: {
      dailyTargets: "ਰੋਜ਼ਾਨਾ ਟੀਚਾ",
      protein: "ਪ੍ਰੋਟੀਨ",
      fiber: "ਫਾਈਬਰ",
      carbs: "ਕਾਰਬਸ",
      fats: "ਫੈਟਸ",
      portion: "ਮਾਤਰਾ",
      chefSecret: "ਸ਼ੈੱਫ ਦਾ ਭੇਦ",
      clinicalBenefit: "ਸਿਹਤ ਲਾਭ",
      swapMeal: "ਭੋਜਨ ਬਦਲੋ",
      markDone: "ਖਾ ਲਿਆ",
      completed: "ਪੂਰਾ ਹੋਇਆ",
      prepTime: "ਤਿਆਰੀ ਦਾ ਸਮਾਂ",
      ingredients: "ਸਮੱਗਰੀ",
      instructions: "ਬਣਾਉਣ ਦਾ ਤਰੀਕਾ",
      viewRecipe: "ਰੈਸਿਪੀ ਦੇਖੋ",
      close: "ਬੰਦ ਕਰੋ",
      whatToEat: "✅ ਕੀ ਖਾਓ (ਸਿਹਤਮੰਦ ਭੋਜਨ)",
      whatToAvoid: "❌ ਕੀ ਨਾ ਖਾਓ (ਸਖ਼ਤ ਪਰਹੇਜ਼)",
      clinicalAdvice: "💡 ਡਾਕਟਰੀ ਤੇ ਕਲੀਨਿਕਲ ਸਲਾਹ",
      listen: "ਸੁਣੋ",
      stop: "ਰੋਕੋ",
      ask: "ਪੁੱਛੋ",
      speak: "ਬੋਲੋ",
      autoVoice: "ਆਵਾਜ਼",
      listening: "🎙️ ਗਰੁੜ ਸੁਣ ਰਿਹਾ ਹੈ... ਬੋਲੋ ਜੀ!",
      thinking: "🎙️ ਗਰੁੜ ਕਲੀਨਿਕਲ ਇੰਟੈਲੀਜੈਂਸ ਨਾਲ ਵਿਸ਼ਲੇਸ਼ਣ ਕਰ ਰਿਹਾ ਹੈ... 🌿",
      speaking: "🔊 ਗਰੁੜ ਬੋਲ ਰਿਹਾ ਹੈ...",
      micNotAllowed: "ਕਿਰਪਾ ਕਰਕੇ ਮਾਈਕ ਇਜਾਜ਼ਤ ਦਿਓ ਤਾਂ ਜੋ ਗਰੁੜ ਸੁਣ ਸਕੇ।",
      micError: "ਆਵਾਜ਼ ਸਾਫ਼ ਨਹੀਂ ਆਈ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਬੋਲੋ।"
    },
    chat: {
      placeholder: "ਗਰੁੜ ਤੋਂ ਡਾਈਟ ਜਾਂ ਖੁਰਾਕ ਬਾਰੇ ਪੁੱਛੋ...",
      quickChips: [
        "ਸਵੇਰੇ ਖਾਲੀ ਪੇਟ ਕੀ ਪੀਣਾ ਸਭ ਤੋਂ ਵਧੀਆ ਹੈ?",
        "ਨਾਸ਼ਤੇ ਵਿੱਚ ਸਭ ਤੋਂ ਵੱਧ ਪ੍ਰੋਟੀਨ ਕੀ ਹੈ?",
        "ਮਿੱਠੇ ਦੀ ਕ੍ਰੇਵਿੰਗ ਦਾ ਇਲਾਜ ਬਿਨਾਂ ਮੋਟਾਪੇ ਤੋਂ",
        "ਢਿੱਡ ਦੀ ਚਰਬੀ ਤੇ ਭਾਰ ਘਟਾਉਣ ਦਾ ਪਲਾਨ",
        "ਚਾਹ ਦਾ ਸਿਹਤਮੰਦ ਦੇਸੀ ਵਿਕਲਪ ਕੀ ਹੈ?",
        "ਫੈਟੀ ਲਿਵਰ ਠੀਕ ਕਰਨ ਦਾ ਦੇਸੀ ਤਰੀਕਾ"
      ]
    },
    categories: { all: "ਸਾਰੇ", highProtein: "ਹਾਈ ਪ੍ਰੋਟੀਨ", nonVeg: "🍗 ਮੀਟ ਤੇ ਆਂਡੇ", fatLoss: "ਫੈਟ ਲੌਸ", sugarControl: "ਸ਼ੂਗਰ ਕੰਟਰੋਲ", quickSnack: "ਹਲਕਾ ਨਾਸ਼ਤਾ" }
  }
};

// -----------------------------------------------------------------
// ⚡ LIVE GARUDA CLINICAL AI INTELLIGENCE ENGINE (POWERED BY QWEN 27B / GROQ)
// -----------------------------------------------------------------
const GROQ_API_KEY = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_GROQ_API_KEY) || "";
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

async function askGarudaAI({ query, appLang, userProfile, conversationHistory }) {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    throw new Error("OFFLINE");
  }

  const langDirectives = {
    english: "Respond STRICTLY in fluent, empathetic, high-trust English. State 'I am GARUDA'.",
    hinglish: "Respond STRICTLY in natural, conversational Roman Hindi (Hinglish). State 'Mai GARUDA hoon'.",
    hindi: "Respond STRICTLY in pure, respectful Devanagari Hindi (हिन्दी). State 'मैं गरुड़ हूँ'.",
    punjabi: "Respond STRICTLY in authentic, warm Gurmukhi Punjabi (ਪੰਜਾਬੀ). State 'ਮੈਂ ਗਰੁੜ ਹਾਂ'."
  };
  const targetDirective = langDirectives[appLang] || langDirectives.hinglish;

  const systemInstruction = `You are GARUDA — India's premier Clinical Nutritionist, Ayurvedic Dietitian & Health Coach.
Your name is strictly GARUDA. NEVER refer to yourself as Gemini, ChatGPT, Qwen, or any other assistant. You are only GARUDA.
${targetDirective}

User Profile:
- Name: ${userProfile?.name || "Friend"}
- Goal: ${userProfile?.goal || "Sustainable Health & Vitality"}
- Conditions: ${userProfile?.conditions?.length ? userProfile.conditions.join(", ") : "Bilkul Fit / General Health"}
- Diet Preference: ${userProfile?.diet || "Vegetarian"}

Clinical Guidelines:
1. Provide scientifically rigorous, practical Indian dietary solutions (e.g. roti, sabzi, moong dal, paneer, sprouts, chilla, dahi, buttermilk, chia, desi spices).
2. If asked about cravings or cheat meals (pastry, cake, samosa, sweets), give an empathetic, non-judgmental metabolic rescue plan:
   - 10-15 minute walk (500-1000 steps)
   - Warm water with lemon or Ceylon cinnamon
   - Compensate with light restorative soup/salad dinner
   - How many minutes of brisk activity or hydration to flush excess glucose.
3. If asked about breakfast, dinner, or belly fat, provide exact desi ingredients, portion sizes, protein density, and cooking secrets.
4. Structure your response with two strict delimiters:
[SPOKEN]: 1 to 2 short, crisp, conversational sentences (maximum 150 characters) in the target language summarizing the main advice. NO asterisks, NO markdown, NO emojis, NO bullet numbers, only spoken words suitable for text-to-speech.
[WRITTEN]: Complete, beautifully formatted mobile response with emojis, bold headers, and clean bullet points.`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 9500);

  try {
    const res = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "qwen/qwen3.8-27b",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: query }
        ],
        temperature: 0.7,
        max_tokens: 900
      })
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`API_ERROR_${res.status}`);
    }

    const data = await res.json();
    const candidateText = data?.choices?.[0]?.message?.content;
    if (!candidateText) throw new Error("EMPTY_AI_RESPONSE");

    let spoken = "";
    let written = candidateText;

    if (candidateText.includes("[SPOKEN]:") && candidateText.includes("[WRITTEN]:")) {
      const parts = candidateText.split("[WRITTEN]:");
      spoken = parts[0].replace("[SPOKEN]:", "").trim();
      written = parts[1].trim();
    } else if (candidateText.includes("[SPOKEN]:")) {
      const parts = candidateText.split("[SPOKEN]:");
      spoken = parts[1].split("\n\n")[0].trim();
      written = candidateText.replace(/\[SPOKEN\]:.*?\n/gs, "").trim();
    } else {
      const firstLine = candidateText.split("\n")[0].replace(/[*#]/g, "").trim();
      spoken = firstLine.substring(0, 150);
      written = candidateText;
    }

    return {
      text: written,
      spokenText: spoken
    };
  } catch (e) {
    clearTimeout(timeoutId);
    throw e;
  }
}

function getDynamicFollowUps(query, lang) {
  const q = (query || "").toLowerCase();
  if (lang === "hindi") {
    if (q.includes("nashta") || q.includes("नाश्ता") || q.includes("breakfast")) {
      return ["नाश्ते में सबसे हाई-प्रोटीन क्या खाएं?", "अंडा vs पनीर नाश्ते में?", "नाश्ते के कितने देर बाद पानी पिएं?"];
    }
    if (q.includes("pastry") || q.includes("पेस्ट्री") || q.includes("sweet") || q.includes("मीठा")) {
      return ["500 कदम वॉक के नियम", "रात को हल्का डिटॉक्स सूप", "मीठे की क्रेविंग कैसे रोकें?"];
    }
    if (q.includes("fat") || q.includes("belly") || q.includes("पेट") || q.includes("चर्बी")) {
      return ["सुबह खाली पेट डिटॉक्स ड्रिंक", "शाम 7 बजे डिनर का नियम", "मेटाबॉलिज्म तेज करने के मसाले"];
    }
    return ["सुबह खाली पेट क्या पिएं?", "पेट की चर्बी कम करने का प्लान", "चाय का हेल्दी देसी विकल्प"];
  }
  if (lang === "punjabi") {
    if (q.includes("nashta") || q.includes("ਨਾਸ਼ਤਾ") || q.includes("breakfast")) {
      return ["ਨਾਸ਼ਤੇ ਵਿੱਚ ਸਭ ਤੋਂ ਵੱਧ ਪ੍ਰੋਟੀਨ ਕੀ ਹੈ?", "ਪਨੀਰ ਚਿੱਲਾ ਰੈਸਿਪੀ", "ਨਾਸ਼ਤੇ ਤੋਂ ਬਾਅਦ ਕਿੰਨਾ ਪਾਣੀ ਪੀਓ?"];
    }
    if (q.includes("pastry") || q.includes("sweet") || q.includes("ਮਿੱਠਾ")) {
      return ["ਖਾਣੇ ਤੋਂ ਬਾਅਦ 500 ਕਦਮ ਵਾਕ", "ਰਾਤ ਦਾ ਹਲਕਾ ਡਿਟੌਕਸ ਸੂਪ", "ਮਿੱਠੇ ਦੀ ਕ੍ਰੇਵਿੰਗ ਦਾ ਇਲਾਜ"];
    }
    if (q.includes("fat") || q.includes("belly") || q.includes("ਢਿੱਡ") || q.includes("ਚਰਬੀ")) {
      return ["ਸਵੇਰੇ ਖਾਲੀ ਪੇਟ ਕੋਸਾ ਪਾਣੀ", "ਰਾਤ ਦਾ ਖਾਣਾ 7 ਵਜੇ", "ਚਰਬੀ ਪਿਘਲਾਉਣ ਵਾਲੇ ਮਸਾਲੇ"];
    }
    return ["ਸਵੇਰੇ ਖਾਲੀ ਪੇਟ ਕੀ ਪੀਓ?", "ਢਿੱਡ ਦੀ ਚਰਬੀ ਘਟਾਓ", "ਸਿਹਤਮੰਦ ਚਾਹ ਦਾ ਵਿਕਲਪ"];
  }
  if (lang === "english") {
    if (q.includes("breakfast") || q.includes("nashta")) {
      return ["High-protein breakfast ideas?", "Paneer vs Eggs for breakfast?", "Hydration timing after breakfast?"];
    }
    if (q.includes("pastry") || q.includes("sweet") || q.includes("cheat")) {
      return ["500-step post-cheat walk", "Light dinner compensation", "How to block sugar spikes?"];
    }
    if (q.includes("fat") || q.includes("belly") || q.includes("weight")) {
      return ["Morning detox elixir recipe", "7 PM dinner golden rule", "Metabolic boosting spices"];
    }
    return ["Best empty stomach drink?", "Sustainable belly fat plan", "Healthy desi tea options"];
  }
  if (q.includes("nashta") || q.includes("breakfast")) {
    return ["Breakfast me sabse high-protein kya khayein?", "Paneer vs Anda nashte me?", "Nashte ke baad paani kab piyein?"];
  }
  if (q.includes("pastry") || q.includes("sweet") || q.includes("cheat")) {
    return ["500-step post-cheat walk", "Raat ko halka moong soup", "Meethe ki craving kaise rokein?"];
  }
  if (q.includes("fat") || q.includes("belly") || q.includes("vajan")) {
    return ["Subah khali pet detox elixir", "Shaam 7 baje dinner ka niyam", "Metabolism fast karne ke spices"];
  }
  return ["Subah khali pet kya pina best hai?", "Belly fat aur vajan kaise kam karein?", "Chai ka healthy desi option"];
}

// 4. SMART GARUDA AI CLINICAL ENGINE (CONVERSATIONAL & MULTI-LANGUAGE)
// -----------------------------------------------------------------
function generateDietitianResponse(query, userProfile, history = [], lang = "hinglish") {
  const q = (query || "").trim().toLowerCase();
  const userName = userProfile?.name?.trim() || (lang === "hindi" ? "प्रवीण जी" : "Praveen ji");
  const userCond = userProfile?.conditions?.length > 0 ? userProfile.conditions.join(", ") : (lang === "hindi" ? "सामान्य स्वास्थ्य" : "Normal Wellness");

  // Helper response builder for GARUDA Dual Dispatch
  const pack = (text, spoken, followUps = []) => ({
    text,
    spokenText: spoken || text.replace(/[*•#\-—_]/g, " ").replace(/\s+/g, " ").slice(0, 220),
    followUps
  });

  // Multi-Turn Context Detection: Check what was discussed in previous messages
  const recentUserMsgs = (history || []).filter(m => m && m.sender === "user").slice(-3).map(m => (m.text || "").toLowerCase());
  const prevContext = recentUserMsgs.join(" ");
  const isAfterSweetCheat = prevContext.includes("pastry") || prevContext.includes("cake") || prevContext.includes("cheat") || prevContext.includes("sweet") || prevContext.includes("meetha");
  const isAfterBreakfast = prevContext.includes("nashta") || prevContext.includes("breakfast") || prevContext.includes("subah");

  
  // 1. GREETINGS & INTRO
  if (/^(hi|hello|hey|namaste|namaskar|pranam|kaise ho|kya haal|bhai|bro|sun|suno|garuda|aahar)/.test(q) || q === "hi" || q === "hello") {
    if (lang === "punjabi") {
      return pack(
        `ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ${userName}! 🙏 ਮੈਂ ਹਾਂ ਗਰੁੜ — ਤੁਹਾਡਾ ਪਰਸਨਲ AI ਕਲੀਨਿਕਲ ਨਿਊਟ੍ਰੀਸ਼ਨਿਸਟ ਅਤੇ ਸਿਹਤ ਸਾਥੀ।\n\nਤੁਸੀਂ ਮੇਰੇ ਕੋਲੋਂ ਆਪਣੀ ਖੁਰਾਕ, ਨਾਸ਼ਤਾ, ਢਿੱਡ ਦੀ ਚਰਬੀ ਘਟਾਉਣ, ਬਿਮਾਰੀ ਦੇ ਪਰਹੇਜ਼ ਜਾਂ ਕਿਸੇ ਵੀ ਕ੍ਰੇਵਿੰਗ ਬਾਰੇ ਸਿੱਧਾ ਪੁੱਛ ਸਕਦੇ ਹੋ ਜਾਂ ਮਾਈਕ ਦਬਾ ਕੇ ਬੋਲ ਸਕਦੇ ਹੋ।\n\nਦੱਸੋ ਜੀ, ਅੱਜ ਤੁਹਾਡੀ ਸਿਹਤ ਲਈ ਮੈਂ ਕੀ ਮਦਦ ਕਰਾਂ?`,
        `ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ${userName}! ਮੈਂ ਗਰੁੜ ਹਾਂ, ਤੁਹਾਡਾ ਪਰਸਨਲ ਸਿਹਤ ਸਾਥੀ। ਅੱਜ ਤੁਸੀਂ ਆਪਣੀ ਖੁਰਾਕ ਬਾਰੇ ਕੀ ਪੁੱਛਣਾ ਚਾਹੁੰਦੇ ਹੋ?`,
        ["ਸਵੇਰੇ ਖਾਲੀ ਪੇਟ ਕੀ ਪੀਣਾ ਚਾਹੀਦਾ ਹੈ?", "ਢਿੱਡ ਦੀ ਚਰਬੀ ਕਿਵੇਂ ਘਟਾਈਏ?", "ਨਾਸ਼ਤੇ ਵਿੱਚ ਸਭ ਤੋਂ ਵੱਧ ਪ੍ਰੋਟੀਨ ਕੀ ਹੈ?"]
      );
    }
    if (lang === "hindi") {
      return pack(
        `नमस्ते ${userName}! 🙏 मैं हूँ गरुड़ — आपका पर्सनल AI क्लिनिकल न्यूट्रिशनिस्ट और हेल्थ साथी।\n\nआप मुझसे अपनी डाइट, नाश्ता, पेट की चर्बी कम करने, बीमारी के परहेज या किसी भी क्रेविंग के बारे में सीधा पूछ सकते हैं या माइक दबाकर बोल सकते हैं।\n\nबताइये, आज आपकी सेहत के लिए मैं क्या मदद करूँ?`,
        `नमस्ते ${userName}! मैं गरुड़ हूँ, आपका पर्सनल हेल्थ साथी। आज आप अपनी डाइट या सेहत के बारे में क्या जानना चाहते हैं?`,
        ["सुबह खाली पेट क्या पीना चाहिए?", "वजन और पेट की चर्बी कैसे घटाएं?", "नाश्ते में सबसे हाई-प्रोटीन क्या खाएं?"]
      );
    }
    if (lang === "english") {
      return pack(
        `Hello ${userName}! 🙏 I am GARUDA — your dedicated Clinical Nutrition & Health AI Coach.\n\nYou can ask me anything about your 7-day meal plan, sustainable fat loss, medical dietary restrictions, or craving fixes. You can also tap the mic to speak directly!\n\nHow can I empower your wellness journey today?`,
        `Hello ${userName}! I am GARUDA, your AI Health Coach. What would you like to plan for your diet today?`,
        ["Best morning empty-stomach drink?", "Sustainable belly fat loss plan?", "High-protein breakfast options?"]
      );
    }
    return pack(
      `Namaste ${userName}! 🙏 Mai hoon GARUDA — aapka Personal Clinical Nutritionist & Health Coach.\n\nAap mujhse apni diet, daily meal planning, bimari ke parhez ya fitness ke baare me seedha pooch sakte hain ya mic daba kar bol sakte hain. Jaise:\n• "Subah khali pet kya pina chahiye?"\n• "Breakfast me sabse high-protein nashta kaunsa hai?"\n• "Belly fat aur vajan kaise kam karein?"\n• "Pastry ya cheat meal khane par fat kaise rokein?"\n\nBataiye, aaj aapka primary goal kya hai?`,
      `Namaste ${userName}! Mai GARUDA hoon. Aap apni diet, craving ya kisi bhi bimari ke parhez ke baare me mujhse pooch sakte hain. Aaj mai aapki kya madad karun?`,
      ["Subah khali pet kya pina best hai?", "Belly fat aur vajan kaise kam karein?", "Pastry khani hai par belly fat kam karna hai"]
    );
  }

  // 1.5 NAUSEA / DIL MATLANA / PET KHARAB / INDIGESTION
  if (
    q.includes("matla") || q.includes("मतला") || q.includes("michla") || q.includes("मिचला") ||
    q.includes("ulti") || q.includes("उल्टी") || q.includes("nausea") || q.includes("vomit") ||
    q.includes("dil ghabra") || q.includes("घबराहट") || q.includes("dil mat") || q.includes("ji machal") ||
    q.includes("pet kharab") || q.includes("hazam nahi") || q.includes("apach")
  ) {
    if (lang === "hindi") {
      return pack(
        `${userName}, अगर आपका जी मिचला रहा है (दिल मतला रहा है) या पेट में असहजता है, तो यह करें:\n\n🌿 तुरंत राहत के 3 क्लिनिकल देसी उपाय:\n1. अदरक और सेंधा नमक: 1 छोटा टुकड़ा ताजा अदरक घिसकर गुनगुने पानी में निचोड़ें, चुटकी भर सेंधा नमक और 4 बूंद नींबू डालकर धीरे-धीरे पिएं।\n2. सौंफ-इलायची का पानी: 1 चम्मच सौंफ और 1 हरी इलायची उबालकर गुनगुना छान लें। यह जी मिचलाने को 5 मिनट में शांत करता है।\n3. क्या न खाएं: अगले 3 घंटे तक दूध, चाय, भारी तेल-मसाला या भारी अनाज बिल्कुल न लें।\n\n🥣 जब भूख लगे: केवल हल्का मूँग दाल का पानी या 2 चम्मच ताज़ा मीठा दही लें।`,
        `${userName}, अगर आपका जी मिचला रहा है, तो 1 कप गुनगुने पानी में थोड़ा अदरक का रस और चुटकी भर सेंधा नमक डालकर घूंट-घूंट पिएं। दूध और चाय अगले 3 घंटे बिल्कुल न लें।`,
        ["गैस और एसिडिटी के उपाय", "हल्का मूँग दाल सूप", "पेट साफ करने का नियम"]
      );
    }
    if (lang === "english") {
      return pack(
        `${userName}, if you are feeling nauseous or experiencing stomach distress, follow this protocol:\n\n🌿 3 Clinical Emergency Relief Steps:\n1. Warm Ginger-Lemon Sip: Grate fresh ginger in warm water with a micro-pinch of rock salt and lemon. Gingerols suppress gastric reflux rapidly.\n2. Fennel & Cardamom Infusion: Boil 1 tsp fennel and 1 crushed cardamom. It relaxes gastrointestinal spasms.\n3. Avoid: No dairy, heavy fats, caffeine, or fried foods for the next 3 hours.\n\n🥣 Recovery Food: Clear yellow moong dal broth once your stomach settles.`,
        `${userName}, for nausea, sip warm water with fresh ginger and a pinch of rock salt. Avoid all dairy, caffeine, and heavy fats for the next three hours.`,
        ["Acidity and gas relief", "Light digestive broth recipe"]
      );
    }
    return pack(
      `${userName}, agar aapka jee michla raha hai (dil matla raha hai) ya pet kharab lag raha hai, toh turant ye follow karein:\n\n🌿 Instant Nausea & Digestion Reset Protocol:\n1. Adrak & Sendha Namak Warm Sip: 1 chota tukda taza adrak crush karke gungune paani me nichodein, 1 chutki sendha namak aur 4 boond nimbu daal kar ghoont-ghoont piyein. Adrak ke gingerols nausea ko 5 minute me shaant karte hain.\n2. Saunf-Elaichi Water: 1 chamach saunf aur 1 hari elaichi boil karke gunguna chhan lein — stomach lining relax hoti hai.\n3. Strictly Avoid: Agle 3 ghante tak doodh, chai, tel-masala ya heavy grains bilkul na lein.\n\n🥣 Recovery Meal: Jab pet shaant ho jaye, sirf patla Peeli Moong Dal ka paani ya Dalia lein.`,
      `${userName}, agar aapka dil matla raha hai, toh 1 cup gungune paani me taza adrak ka ras aur chutki bhar sendha namak daal kar ghoont-ghoont piyein. Doodh aur chai agle 3 ghante bilkul na lein.`,
      ["Gas aur acidity ke nuskhe", "Patla moong dal soup", "Pet reset timetable"]
    );
  }

  // 2. CONTEXTUAL FOLLOW-UP: POST-CHEAT WALK OR TIMING
  if (isAfterSweetCheat && (q.includes("walk") || q.includes("chalna") || q.includes("kadam") || q.includes("step") || q.includes("kitna chal") || q.includes("kitni walk") || q.includes("टहल") || q.includes("कदम") || q.includes("वॉक"))) {
    if (lang === "hindi") {
      return pack(
        `${userName}, पेस्ट्री या मीठे के बाद वॉक का साइंटिफिक नियम:\n\n🚶‍♂️ GLUT-4 वॉक गाइड:\n1. कदम: ठीक 1,000 कदम (लगभग 10-12 मिनट) सामान्य गति से टहलें।\n2. समय: मीठा खाने के 15 मिनट के अंदर टहलना शुरू करें।\n3. फायदा: चलने से खून में आई शुगर पेट पर चर्बी बनने के बजाय सीधे पैरों की मांसपेशियों में बर्न हो जाती है।\n4. सावधानी: दौड़ना या भारी कार्डियो न करें, केवल आराम से ब्रिस्क वॉक करें।`,
        `${userName}, पेस्ट्री के बाद बस 10 से 12 मिनट आराम से 1000 कदम टहलें। इससे शुगर चर्बी नहीं बनेगी और सीधे मांसपेशियों में बर्न हो जाएगी।`,
        ["रात के डिनर में क्या खाएं?", "क्या इसके बाद पानी पी सकते हैं?", "कल का डाइट रूटीन कैसा हो?"]
      );
    }
    return pack(
      `${userName}, pastry ya meethe ke baad walk ka scientific protocol:\n\n🚶‍♂️ GLUT-4 Activation Walk Guide:\n1. Target: Theek 1,000 kadam (lagbhag 10-12 minute) normal pace par walk karein.\n2. Timing: Pastry khane ke agle 15 minute ke andar chalna shuru karein.\n3. Science: Walk karne se blood ka glucose pet me charbi banne ke bajaye seedha pairon ki muscles me glycogen ban kar burn ho jata hai.\n4. No Running: Daudne ya heavy exercise ki zaroorat nahi hai, gentle brisk walk kaafi hai.`,
      `${userName}, pastry ke baad sirf 10 se 12 minute me 1000 kadam normal walk karein. Glucose charbi banne ke bajaye muscles me burn ho jayega.`,
      ["Raat ke dinner me kya khayein?", "Kya iske baad paani pi sakte hain?", "Kal ka detox plan"]
    );
  }

  // 3. PASTRY / CAKE / SWEET & BELLY FAT CHEAT DILEMMA
  if (q.includes("pastry") || q.includes("पेस्ट्री") || q.includes("cake") || q.includes("केक") || q.includes("ice cream") || q.includes("gulab jamun") || q.includes("गुलाब जामुन") || q.includes("rasgulla") || q.includes("रसगुल्ला") || ((q.includes("meetha") || q.includes("मीठा") || q.includes("मिठाई")) && (q.includes("belly") || q.includes("vajan") || q.includes("वजन") || q.includes("fat") || q.includes("charbi") || q.includes("चर्बी") || q.includes("pet")))) {
    if (lang === "hindi") {
      return pack(
        `${userName}, बिल्कुल सच समझिये — आप पेस्ट्री खा सकते/सकती हैं! बस ये 4 साइंटिफिक "ग्लूकोज डैम्पनिंग" नियम फॉलो करें ताकि यह पेस्ट्री पेट की चर्बी न बने:\n\n🍰 गिल्ट-फ्री पेस्ट्री और बेली फैट प्रोटोकॉल:\n1. 5 मिनट पहले फाइबर: पेस्ट्री खाने से ठीक 5 मिनट पहले 5 भीगे बादाम या थोड़ा खीरा खा लें। यह शुगर स्पाइक को 45% तक रोक देता है।\n2. आधी स्लाइस का नियम: पूरी पेस्ट्री न खाएं — केवल आधी (1/2) स्लाइस लें। जीभ के प्लेज़र रिसेप्टर्स पहली 3 बाइट्स में ही संतुष्ट हो जाते हैं!\n3. खाने के बाद 10 मिनट वॉक (GLUT-4): पेस्ट्री खाते ही सोफे पर न बैठें। 15 मिनट के अंदर 1,000 कदम वॉक करें ताकि ग्लूकोज सीधे मांसपेशियों में बर्न हो जाए।\n4. डिनर रीसेट: रात का खाना कार्ब्स-फ्री रखें — केवल हल्का लौकी-मूँग सूप या पनीर सलाद लें।\n\n💡 बॉटम लाइन: खाने का आनंद लें, तनाव न लें — सही साइंस से पेट की चर्बी पूरी तरह सुरक्षित रहेगी!`,
        `${userName}, आप आधी स्लाइस पेस्ट्री बिल्कुल खा सकते हैं। बस खाने से पहले पाँच भीगे बादाम खा लें और खाने के बाद दस मिनट टहल लें। पेट पर कोई चर्बी नहीं जमेगी।`,
        ["वॉक कितनी देर करनी है?", "रात के हल्के सूप की रेसिपी", "मीठे की क्रेविंग रोकने के घरेलू नुस्खे"]
      );
    }
    if (lang === "english") {
      return pack(
        `${userName}, here is the scientific truth — you CAN enjoy your pastry without it turning into stubborn belly fat. Just apply these 4 Glucose-Dampening protocols:\n\n🍰 Zero-Guilt Pastry & Belly Fat Protocol:\n1. 5-Min Pre-Fiber Coat: Eat 5-6 soaked almonds or fresh cucumber 5 minutes before. This blunts the glucose spike by ~45%.\n2. The 1/2 Slice Rule: Eat half a slice slowly. Dopamine pleasure receptors saturate in the first 3 bites.\n3. 10-Minute Post-Dessert Walk (GLUT-4 Activation): Walk 1,000 steps within 15 minutes of eating. Glucose diverts directly into muscular glycogen rather than abdominal adipose tissue.\n4. Low-Carb Dinner Reset: Keep dinner light with warm bottle-gourd stew or grilled paneer.\n\n💡 Bottom Line: Enjoy your food with zero guilt — smart biochemistry prevents fat storage!`,
        `${userName}, you can safely enjoy half a pastry slice. Eat five soaked almonds beforehand and take a ten-minute walk right after to keep belly fat completely safe.`,
        ["How long should the walk be?", "Light dinner soup recipe", "Tips to prevent night sweet cravings"]
      );
    }
    return pack(
      `${userName}, bilkul sach samjhiye — aap pastry/meetha khaa sakte/sakti hain, bas ye 4 "Glucose Dampening" scientific hacks follow karein taaki ye pastry pet ki charbi (belly fat) na bane:\n\n🍰 Zero-Guilt Pastry & Belly Fat Protocol:\n1. 5-Minute Fiber Coat (Sabse Asardar): Pastry khane se theek 5 minute pehle 5-6 bhige huye badam (almonds) ya 1 chota bowl kheera khaa lein. Inka fiber aapke khoon me glucose spike ko 45% rok deta hai.\n2. 1/2 Slice Portion Hack: Puri pastry ek baar me na khayein — sirf aadhi (1/2) slice lein aur dheere-dheere enjoy karein. Tongue ke pleasure receptors pehli 3 bites me hi satisfy ho jate hain!\n3. Post-Sweet 10-Minute Walk (GLUT-4 Activation): Pastry khate hi sofa par baithne ya sone ki galti bilkul na karein. Agle 15 minute ke andar 1,000 kadam normal walk karein. Isse blood glucose pet ki charbi banne ke bajaye seedha muscle glycogen me burn ho jayega!\n4. Dinner Reset: Raat ka dinner carbs-free rakhein — sirf Lauki-Moong stew ya Grilled Paneer salad lein to balance the daily calorie budget.\n\n💡 Bottom Line: Khane ko enjoy karein, guilt mat lein — smart science se belly fat safe rahega!`,
      `${userName}, aadhi slice pastry bilkul khaa lijiye! Bas khane se pehle paanch badam kha lena aur khane ke theek baad dus minute walk zaroor karna. Raat ko light soup le lenge toh belly fat safe rahega.`,
      ["Walk kitni karni padegi?", "Raat ka light dinner menu", "Meethe ki craving rokne ke hacks"]
    );
  }

  // 4. MANN KA KHANA / ROUTINE TODNA / CHEAT DAY
  if (q.includes("mann ka") || q.includes("routine follow") || q.includes("routine nahi") || q.includes("cheat day") || q.includes("todna") || q.includes("aaj nahi") || q.includes("apne hisab") || q.includes("khana hai")) {
    if (lang === "hindi") {
      return pack(
        `${userName}, 100% इंसान बनो, रोबोट नहीं! किसी से भी 365 दिन सख्त डाइट चार्ट फॉलो नहीं होता। अगर आज आपको मन का खाना है, तो बिल्कुल खाएं:\n\n🍕 "मन का खाना" डैमेज-कंट्रोल नियम:\n1. 80/20 नियम: हफ्ते में 80% क्लीन देसी डाइट और 20% मनपसंद खाना मेटाबॉलिज्म को एक्टिव रखता है।\n2. पहले सलाद, फिर मन का खाना: बिरयानी या छोले भटूरे खाने से पहले 1 बड़ा बाउल खीरा-टमाटर खाएं ताकि ओवरईटिंग न हो।\n3. नो गिल्ट, नो उपवास: चीट मील के बाद अगले दिन भूखा रहने की गलती न करें। बस सामान्य रूटीन पर लौट आएं।\n4. समय: भारी खाना दोपहर (लंच) में खाएं, रात को नहीं।`,
        `${userName}, मन का खाना खुशी से खाएं! बस पहले एक कटोरी सलाद खा लें और दोपहर में खाएं, रात को नहीं। अगले दिन कोई भूखा रहने की ज़रूरत नहीं है।`,
        ["अगले दिन का डिटॉक्स प्लान", "पाचन अग्नि तेज करने के नुस्खे"]
      );
    }
    return pack(
      `${userName}, 100% human bano, robot nahi! Kisi se bhi 365 din strict diet chart follow nahi hota. Agar aaj aapko routine tod kar mann ka khana hai, toh bilkul khayein:\n\n🍕 "Mann Ka Khana" Damage-Control Rules:\n1. 80/20 Rule: Hafte me 80% clean Desi diet aur 20% "Mann Ka Khana" body ke metabolism ko shock dekar fat loss ko accelerate karta hai (leptin hormone reset).\n2. Pehle Salad, Phir Mann Ka Khana: Chahe biryani ho ya chole bhature — shuru karne se pehle 1 bada bowl tamatar-kheera salad khaa lein. Fiber glucose spike ko slow karega aur overeating nahi hogi.\n3. No Guilt, No Starvation: Cheat meal ke baad agle din bhookhe rehne ki galti na karein. Agle din bus hamare normal routine par wapas aa jayein aur 1 glass extra paani piyein.\n4. Timing: Mann ka heavy khana hamesha dopahar (Lunch) me karein, raat ko nahi, kyunki din me digestive agni sabse tezz hoti hai.`,
      `${userName}, bilkul mann ka khana khao! Bas pehle 1 bowl salad kha lena aur dopahar me khana, raat ko nahi. Agle din normal routine par laut aao, koi bhookha rehne ka natak nahi.`,
      ["Agle din ka detox schedule", "Heavy khane ke baad digestion kaise tezz karein?"]
    );
  }

  // 5. RESULT TIMELINE & BELLY FAT DURATION ("KITNA TIME LAGEGA")
  if (q.includes("kitna time") || q.includes("kitne din") || q.includes("kab tak") || q.includes("result kab") || q.includes("kitne mahine") || q.includes("asar") || q.includes("time lagega")) {
    if (lang === "hindi") {
      return pack(
        `${userName}, क्लीनिकल साइंस और शरीर क्रिया विज्ञान के अनुसार परिणाम का टाइमटेबल यह है:\n\n⏱️ रियलिस्टिक रिजल्ट टाइमलाइन (देसी प्रोटोकॉल + 8k स्टेप्स):\n1. दिन 1 से 3: गैस, ब्लोटिंग और भारीपन खत्म होता है (1 से 1.5 किलो वाटर वेट ड्रॉप)।\n2. दिन 7 से 14: एनर्जी डबल होती है, दोपहर का आलस बंद होता है, और कमर 0.5 से 1 इंच ढीली होती है।\n3. दिन 30 से 45: पेट की जिद्दी चर्बी गलती है (औसतन 2 से 4 इंच कमर कम होती है)।\n4. दिन 90: यह डाइट स्थायी आदत बन जाती है और वजन दोबारा नहीं बढ़ता।\n\n💡 नियम: निरंतरता > परफेक्शन। 80% भी फॉलो किया तो 30 दिन में कमाल दिखेगा!`,
        `${userName}, पहले 3 दिन में ब्लोटिंग खत्म होगी और डेढ़ किलो वजन गिरेगा। 14 दिन में कमर में 1 इंच का फर्क आएगा, और 30 दिन में जिद्दी पेट की चर्बी तेजी से कम होगी।`,
        ["सुबह खाली पेट क्या पीना है?", "बेली फैट घटाने का सटीक टाइमटेबल"]
      );
    }
    return pack(
      `${userName}, clinical science aur metabolic physiology ke hisab se result ka realistic timetable yeh hai:\n\n⏱️ Realistic Result Timeline (Desi Protocol + 8k Steps):\n1. Day 1 se Day 3 (Water & Gut Reset): Pet ki gas, bloating aur heaviness gayab hoti hai. Scale par 1 se 1.5 kg drop dikhta hai jo water retention hota hai.\n2. Day 7 se Day 14 (Metabolic Shift): Energy me 2x boost aata hai, dopahar ki susti band hoti hai, aur chehre par glow aane lagta hai. Pant ki kamar me 0.5 to 1 inch looseness feel hoti hai.\n3. Day 30 se Day 45 (Real Stubborn Belly Fat Loss): Visceral fat (pet ki charbi) tezi se burn hoti hai. Average 2 se 4 inches kamar kam hoti hai aur liver enzymes detox hote hain.\n4. Day 90 (Permanent Transformation): Yeh diet aadat ban chuki hoti hai aur rebound weight gain nahi hota.\n\n💡 Key: Consistency > Perfection. Agar 80% bhi follow kar liya toh 30 din me sab poochenge ki kya secret hai!`,
      `${userName}, pehle 3 din me bloating khatam hogi aur 1.5 kilo water weight girega. 14 din me kamar me 1 inch ka farq aayega, aur 30 din me ziddi pet ki charbi saaf hone lagegi.`,
      ["Subah khali pet kya pina hai?", "Belly fat kam karne ka meal timetable"]
    );
  }

  // 6. SUBAH KA NASHTA / BREAKFAST / KHALI PET
  if (q.includes("subah") || q.includes("nashta") || q.includes("breakfast") || q.includes("khali pet") || q.includes("morning") || q.includes("नाश्ता") || q.includes("नाश्ते") || q.includes("सुबह") || q.includes("खाली पेट")) {
    if (lang === "hindi") {
      return pack(
        `${userName}, सुबह का आदर्श देसी आयुर्वेदिक रूटीन:\n\n🌅 06:30 AM (डिटॉक्स ड्रिंक — खाली पेट):\n• 1 गिलास गुनगुना पानी + 1 चम्मच मेथी दाना (रात का भीगा उबला हुआ) या आंवला-अदरक फ्रेश शॉट।\n\n🥣 08:30 AM (हाई-प्रोटीन पावर नाश्ता — कोई 1 चुनें):\n1. मूँग दाल और पनीर चिल्ला (2 चिल्ले + धनिया चटनी) -> ~21g प्रोटीन।\n2. लाइव स्प्राउट्स चाट (मूँग + काला चना + अनार + खीरा + नींबू) -> ~16.5g प्रोटीन।\n3. स्टीम्ड रागी और वेजी इडली सांभर के साथ।\n\n💡 गोल्डन रूल: नाश्ता हमेशा उठने के 90 मिनट के भीतर करें!`,
        `${userName}, सुबह खाली पेट गुनगुना मेथी पानी या आंवला शॉट लें, और नाश्ते में मूँग दाल पनीर चिल्ला लें जिसमें 21 ग्राम प्रोटीन मिलता है।`,
        ["चाय पीने का सही समय", "दोपहर की थाली का नियम", "वजन घटाने का नाश्ता"]
      );
    }
    return pack(
      `${userName}, subah ka ideal Desi Ayurvedic schedule:\n\n🌅 06:30 AM (Detox Nectar — Khali Pet):\n• 1 glass gunguna paani + 1 tsp methi dana (raat bhar bhigo kar ubla hua) YA 1 amla-adrak fresh shot. Ye metabolism trigger karta hai aur gut toxins flush karta hai.\n\n🥣 08:30 AM (High-Protein Power Breakfast — Pick 1):\n1. Moong Dal & Paneer Stuffed Chilla (2 chillas + dhaniya chutney) -> ~21g Protein. Sustained energy deta hai, dopahar tak bhookh nahi lagti.\n2. Live Enzyme Sprout Chaat (sprouted moong + kala chana + anaar + kheera + nimbu) -> ~16.5g Protein. 200% bioavailable iron & zinc.\n3. Steamed Ragi & Veggie Idlis with Sambar -> Rich in calcium & fiber, diabetic-friendly.\n4. Vegetable Daliya with roasted flax seeds & roasted jeera.\n\n💡 Golden Rule: Nashta hamesha uthne ke 90 minutes ke andar karein aur usme 20g+ protein lock karein!`,
      `${userName}, subah khali pet gunguna methi paani piyein aur nashte me moong dal paneer chilla lein jisme 21 gram protein lock hota hai.`,
      ["Chai peene ka sahi time kya hai?", "Dopahar ke lunch ka plate rule", "Belly fat kam karne ka plan"]
    );
  }

  // 7. CHAI & COFFEE HABIT
  if (q.includes("chai") || q.includes("tea") || q.includes("coffee") || q.includes("caffeine") || q.includes("चाय") || q.includes("कॉफ़ी")) {
    if (lang === "hindi") {
      return pack(
        `${userName}, चाय के शौकीनों के लिए क्लिनिकल गाइड:\n\n☕ एसिड से बचने के नियम:\n1. खाली पेट चाय जहर समान: खाली पेट चाय पीने से पेट की दीवारें छिलती हैं और एसिडिटी बनती है।\n2. सही समय: नाश्ता करने के 30 से 45 मिनट बाद चाय पिएं।\n3. चीनी बदलें: सफेद चीनी हटाकर देसी खांड या गुड़ का इस्तेमाल करें।\n4. सीमा: दिन में केवल 1 या 2 छोटे कप तक सीमित रखें।\n5. विकल्प: जब भी चाय की लत सताए, गुनगुने पानी में सौंफ, अदरक और इलायची उबालकर पिएं।`,
        `${userName}, खाली पेट चाय कभी न पिएं। हमेशा नाश्ते के 45 मिनट बाद पिएं और सफेद चीनी की जगह देसी खांड या गुड़ इस्तेमाल करें।`,
        ["नाश्ते में क्या खाएं?", "एसिडिटी रोकने के घरेलू नुस्खे"]
      );
    }
    return pack(
      `${userName}, Chai lovers ke liye clinical guide:\n\n☕ Chai Se Banne Wale Acid Ko Kaise Rokein:\n1. Khali Pet Chai Strict Poison Hai: Subah khali pet chai pine se stomach lining irritate hoti hai, acid banta hai aur cortisol spike hota hai.\n2. Sahi Timing: Chai hamesha nashte ke 30 se 45 minute baad piyein.\n3. Sugar Switch: White refined sugar hata kar Desi Khand, raw gud (jaggery), ya stevia use karein.\n4. Limit: Din me maximum 1 ya 2 chote cup restrict karein.\n5. Craving Alternative: Jab bhi chai ki aadat sataye, 1 cup gungune paani me adrak, saunf aur elaichi boil karke sip karein!`,
      `${userName}, khali pet chai bilkul mat piyein. Hamesha nashte ke 30 se 45 minute baad piyein aur white sugar ki jagah Desi Khand ya Gud switch karein.`,
      ["Subah ka high-protein nashta", "Acidity khatam karne ke nuskhe", "Dahi lunch me khana kaisa hai?"]
    );
  }

  // 8. DOPAHAR KA LUNCH / THALI
  if (q.includes("dopahar") || q.includes("lunch") || q.includes("thali") || q.includes("afternoon") || q.includes("दोपहर") || q.includes("लंच") || q.includes("थाली")) {
    return pack(
      `${userName}, Dopahar ke Lunch ka 50-25-25 Indian Plate Rule:\n\n🥗 Thali Partition:\n• 50% Plate (Salad & Greens): Taza kheera, kakdi, tamatar aur seasonal sabzi (Palak, Lauki, Methi, ya Bhindi). Hamesha pehle salad khayein.\n• 25% Plate (Clean Protein): 1 bada bowl Yellow Moong ya Arhar Dal, ya Low-Fat Paneer Bhurji / Soya chunks.\n• 25% Plate (Complex Carbs): 2 Chana-Gehu Missi Roti ya Jowar Roti. Plain white maida/gehu se bachein.\n• Digestive Elixir: 1 glass fresh Chaas (buttermilk) bhuna jeera aur sendha namak ke sath.\n\n⏱️ Rule: Khane ke theek baad paani na piyein (kam se kam 45 minute ka gap rakhein taaki digestive enzymes dilute na hon).`,
      `${userName}, dopahar ke lunch me 50% salad, 25% dal ya paneer, aur 25% jowar ya missi roti rakhein. Sath me 1 glass jeera chaas zaroor lein.`,
      ["Shaam 4-5 PM snacks kya lein?", "Raat ke dinner ka rule", "Chaas kab peena best hai?"]
    );
  }

  // 9. SHAAM KI CRAVING / 4-5 PM SNACKS
  if (q.includes("shaam") || q.includes("snack") || q.includes("craving") || q.includes("bhookh") || q.includes("evening") || q.includes("4 baje") || q.includes("5 baje") || q.includes("शाम") || q.includes("स्नैक") || q.includes("भूख")) {
    return pack(
      `${userName}, shaam 4-5 baje ki bhookh hi sabka diet plan fail karti hai jab log chai-samosa ya biscuit kha lete hain.\n\n🥜 3 Instant Zero-Guilt Desi Snacks:\n1. Dry Roasted Makhana + Bhuna Chana: 1 mutthi mix karein (sirf 80 calories, high crunch, plant protein & magnesium).\n2. Chilled Sattu-Jeera Cooler: 2 tsp chana sattu + chilled water + lemon + roasted jeera + mint (10g pure protein + body cooler).\n3. Green Tea / Ginger-Lemon Herbal Infusion with 5 soaked almonds & 2 walnuts.\n\n🚫 Trap: Chai ke sath biscuit, rusk, bhujia ya mathri bilkul ban karein!`,
      `${userName}, shaam 4 baje samosa-biscuit lene ke bajaye roasted makhana aur bhuna chana lein ya 1 glass thanda sattu cooler piyein.`,
      ["Raat ka dinner menu", "Meethe ki craving rokne ke hacks", "Sattu cooler kaise banayein?"]
    );
  }

  // 10. RAAT KA DINNER / BEDTIME
  if (q.includes("dinner") || q.includes("raat") || q.includes("night") || q.includes("bedtime") || q.includes("sone") || q.includes("डिनर") || q.includes("रात") || q.includes("सोने")) {
    return pack(
      `${userName}, Raat ke dinner ka Ayurvedic aur scientific niyam:\n\n🌅 Suraj Dhalne Ke Baad Digestion Slow Ho Jata Hai:\n• Timing: Dinner 8:00 PM se pehle har haal me finish karein.\n• Best Dinners:\n  1. Lauki-Moong Digestive Stew: Moong dal aur lauki ka haldi-jeera soup (~13.5g protein, zero acidity, deep sleep inducer).\n  2. Grilled Paneer / Tofu Tikka + Sauteed Veggies salad.\n  3. Light Vegetable Daliya Khichdi with 1/2 tsp pure A2 cow ghee.\n\n🥛 09:30 PM (Bedtime Ojas Drink): 1/2 cup warm A2 cow milk with 1 pinch Lakadong Haldi & 1 pinch Jayfal (nutmeg) — GABA brain waves induce karta hai for deep REM recovery.`,
      `${userName}, dinner raat 8:00 baje se pehle khatam karein. Lauki moong stew ya paneer salad best hai. Sone se pehle haldi jaayfal doodh lein.`,
      ["Lauki moong stew ki recipe", "Deep sleep ke liye bedtime routine", "Weight loss dinner"]
    );
  }

  // 11. DAHI & CHAAS
  if (q.includes("dahi") || q.includes("curd") || q.includes("chaas") || q.includes("buttermilk") || q.includes("raita") || q.includes("दही") || q.includes("छाछ")) {
    return pack(
      `${userName}, Dahi aur Chaas ke Ayurvedic aur Medical rules:\n\n🥛 The Golden Rules:\n1. Raat Ko Dahi Strict Ban: Raat ko dahi khane se mucus (kaph dosha) badhta hai aur sinus/gala kharab hota hai.\n2. Best Time: Hamesha dopahar (Lunch) me taza dahi ya jeera chaas lein.\n3. Chaas Superiority: Chaas dahi se 10x light hoti hai. Isme bhuna jeera, kala namak aur pudina milakar piyein — gut microbiome instantly active hota hai.`,
      `${userName}, dahi hamesha dopahar ke lunch me lein, raat ko bilkul na lein. Chaas dahi se zyada halki aur digestion ke liye behtareen hai.`,
      ["Dopahar ka lunch plate", "Acidity khatam karne ke nuskhe"]
    );
  }

  // 12. DOODH & DESI GHEE
  if (q.includes("doodh") || q.includes("milk") || q.includes("ghee") || q.includes("दूध") || q.includes("घी")) {
    return pack(
      `${userName}, Doodh aur Desi Ghee ka sach:\n\n🥛 A2 Cow Milk & Shuddh Desi Ghee:\n1. Desi Ghee Fat Nahi Badhata: Pure A2 ghee me Butyric Acid hota hai jo gut inflammation kam karta hai aur joint lubrication deta hai.\n2. Daily Limit: Roz 1 se 2 choti chamach ghee daal ya roti par zaroor lagayein.\n3. Doodh: Raat ko sone se pehle gunguna haldi doodh lein. Khane ke theek baad doodh na piyein.`,
      `${userName}, roz 1 se 2 choti chamach pure desi ghee zaroor khayein. Ye pet ki charbi nahi badhata balki joints aur digestion ko majboot karta hai.`,
      ["Raat ka bedtime drink", "Protein sources comparison"]
    );
  }

  // 13. WEIGHT LOSS & BELLY FAT
  if (q.includes("weight") || q.includes("fat") || q.includes("motapa") || q.includes("vajan kam") || q.includes("pet kam") || q.includes("belly") || q.includes("slim") || q.includes("वजन") || q.includes("मोटापा") || q.includes("चर्बी") || q.includes("पेट कम")) {
    return pack(
      `${userName}, Sustainable Desi Fat Loss Blueprint (3-4 kg per month):\n\n⚖️ The 4 Pillars:\n1. 20g+ Protein in Every Meal: Protein digest hone me sharir 30% calories khud burn karta hai (TEF). Nashte me Moong Chilla aur lunch me Dal/Paneer lock karein.\n2. Liquid Calories Zero: Cold drinks, packed fruit juices, meethi chai aur alcohol 100% band karein. Sirf paani, nariyal paani aur sattu cooler piyein.\n3. 8:00 PM No-Carb Rule: Raat ko roti/chawal band karke soup, salad ya paneer tikka lein.\n4. Daily 8,000 to 10,000 Steps: Dinner ke theek baad 15 minute walk karein taaki blood sugar spike fat me convert na ho.`,
      `${userName}, fat loss ke 4 golden niyam hain: Har meal me 20 gram protein, liquid calories zero, raat 8 baje ke baad no-carb dinner, aur daily 8000 se 10000 steps.`,
      ["Subah ka fat loss nashta", "Walk kitni karni chahiye?", "Pastry khane ke baad kya karein?"]
    );
  }

  // 14. WEIGHT GAIN & MUSCLE BULK
  if (q.includes("gain") || q.includes("dubla") || q.includes("muscle") || q.includes("patla") || q.includes("vajan badhana")) {
    return pack(
      `${userName}, Clean Desi Muscle Gain Blueprint (Bina Fat Badhaye):\n\n💪 The Bulking Formula:\n1. Caloric Surplus: Daily maintenance se 400-500 extra clean calories lein.\n2. Desi Monster Shake (Evening): 1 glass milk + 1 banana + 2 tbsp sattu + 2 soaked khajoor + 1 tbsp peanut butter (~480 kcal, 22g protein).\n3. Target: Bodyweight ka 1.5x protein (e.g. 70kg vajan = 105g protein roz).\n4. Sleep: Raat ko 7-8 ghante sound sleep lein for growth hormone surge.`,
      `${userName}, vajan badhane ke liye doodh, kela, sattu aur khajoor ka Desi Monster Shake lein aur daily 1.5 gram protein per kg bodyweight target karein.`,
      ["High protein vegetarian diet", "Gym pre-workout meal"]
    );
  }

  // 15. GYM / WORKOUT NUTRITION
  if (q.includes("gym") || q.includes("workout") || q.includes("exercise") || q.includes("kasrat")) {
    return pack(
      `${userName}, Pre & Post Workout Desi Fuel:\n\n🏋️‍♂️ Workout Nutrition Timing:\n• Pre-Workout (45 mins pehle): 1 Kela (Banana) + 1 black coffee YA 2 Khajoor (instant energy + stamina).\n• Post-Workout (30 mins ke andar): 250ml Chaas with 2 tbsp Sattu Powder (~16g protein) YA 3 Boiled Egg whites / 100g Paneer.\n• Hydration: Workout ke beech me sip-sip karke paani piyein taaki muscle cramps na hon.`,
      `${userName}, gym se 45 minute pehle 1 kela ya khajoor lein, aur workout ke 30 minute ke andar sattu chaas ya paneer lein for fast muscle recovery.`,
      ["Protein sources comparison", "Muscle building timetable"]
    );
  }

  // 16. PROTEIN SOURCES (DESI VEG & NON-VEG)
  if (q.includes("protein") || q.includes("soya") || q.includes("paneer") || q.includes("anda") || q.includes("egg") || q.includes("tofu")) {
    return pack(
      `${userName}, Desi Protein Breakdown (Per 100g Real Values):\n\n🥗 Clean Protein Sources:\n1. Soya Chunks: ~52g Protein (Sabse high protein, hafte me 2-3 baar 40g le sakte hain).\n2. Low-Fat Paneer: ~18g Protein + Calcium.\n3. Tofu (Soy Paneer): ~15g Protein (Zero cholesterol, perfect for heart & fat loss).\n4. Sprouted Moong/Chana: ~14g Protein (Live enzymes + bioavailable iron).\n5. Chana Sattu: ~20g Protein / 100g.\n6. Egg Whites: ~3.6g Protein per egg white (Whole egg = ~6g).\n\n💡 Tip: Sirf daal par depend na rahein, uske sath Paneer, Sattu ya Sprouts zaroor jodein!`,
      `${userName}, 100 gram paneer me 18 gram, sattu me 20 gram, aur soya chunks me 52 gram protein hota hai. Roz nashte aur lunch me protein zaroor jodein.`,
      ["High protein breakfast options", "Paneer vs Tofu weight loss comparison"]
    );
  }

  // 17. ROTI VS RICE (CHAWAL)
  if (q.includes("roti") || q.includes("chawal") || q.includes("rice") || q.includes("gehu") || q.includes("jowar") || q.includes("bajra")) {
    return pack(
      `${userName}, Roti vs Chawal ka Scientific Sach:\n\n🌾 Glycemic Impact:\n1. White Rice: Fast digest hota hai aur insulin spike karta hai. Agar chawal khana hai, toh use ubaal kar mand (starch) nikaal dein aur 1 bada bowl salad ke baad khayein.\n2. Plain Gehu Roti: Maida aur processed wheat bloating karte hain.\n3. Best Choice: Jowar Roti, Bajra Roti (winter) ya Gehu-Chana Missi Roti. Inka fiber blood sugar ko stable rakhta hai aur lambe samay tak pet bhara lagta hai.`,
      `${userName}, plain white gehu ki jagah Jowar ya Missi roti lein. Agar chawal khana hai toh pehle 1 bowl salad khao taaki insulin spike na ho.`,
      ["Dopahar ki thali ka partition", "Sugar control diet plan"]
    );
  }

  // 18. DIABETES / SUGAR REVERSAL
  if (q.includes("sugar") || q.includes("diabetes") || q.includes("diabetic") || q.includes("madhumeh")) {
    return pack(
      `${userName}, Diabetes & Blood Sugar Normalization Protocol:\n\n🩸 Glycemic Control Blueprint:\n1. Morning Elixir: Subah khali pet 1 tsp Methi Dana paani + 1/2 tsp Jamun seed powder (insulin sensitivity badhata hai).\n2. Grain Switch: Pure white rice aur maida band karein. Jowar, Ragi aur Chana Missi roti par shift hon.\n3. Jamun, Karela & Methi: Karela-Jamun juice hafte me 3 baar lein.\n4. GLUT-4 Walk: Har meal ke theek baad 10 minute normal walk karein — muscles glucose ko bina insulin ke burn karti hain.`,
      `${userName}, sugar control karne ke liye subah methi dana paani lein, jowar roti khayein aur har meal ke theek baad 10 minute walk zaroor karein.`,
      ["High BP control tips", "Diabetic friendly breakfast"]
    );
  }

  // 19. HIGH BP / HEART / CHOLESTEROL
  if (q.includes("bp") || q.includes("बीपी") || q.includes("blood pressure") || q.includes("heart") || q.includes("हार्ट") || q.includes("cholesterol") || q.includes("कोलेस्ट्रॉल") || (q.includes("dil") && (q.includes("dhadkan") || q.includes("bimari") || q.includes("attack") || q.includes("cardio") || q.includes("seena")))) {
    if (lang === "hindi") {
      return pack(
        `${userName}, हाई बीपी और दिल की सेहत के लिए क्लिनिकल देसी प्रोटोकॉल:\n\n❤️ कार्डियोवैस्कुलर सपोर्ट नियम:\n1. नमक का बदलाव: सफेद रिफाइंड नमक हटाकर केवल थोड़ा सेंधा नमक इस्तेमाल करें और मात्रा 30% घटाएं।\n2. पोटैशियम वाले सुपरफूड्स: नारियल पानी, पालक, खीरा और लौकी का सूप (यह शरीर के अतिरिक्त सोडियम को बाहर निकालता है)।\n3. कच्ची लहसुन का नियम: रोज सुबह 1 कली लहसुन गुनगुने पानी या अर्जुन की छाल के काढ़े के साथ लें — यह नेचुरल ब्लड थिनर है।\n4. तनाव मुक्ति: रोजाना 15 मिनट अनुलोम-विलोम प्राणायाम करें।`,
        `${userName}, हाई बीपी और हार्ट के लिए सफेद नमक हटाकर सेंधा नमक लें, सुबह लहसुन की एक कली पानी के साथ लें, और रोज एक नारियल पानी पिएं।`,
        ["कोलेस्ट्रॉल डाइट चार्ट", "लौकी सूप की रेसिपी", "फैटी लिवर का परहेज"]
      );
    }
    return pack(
      `${userName}, High BP aur Heart Health ka Desi Protocol:\n\n❤️ Cardiovascular Support:\n1. Salt Switch: White refined namak hata kar Sendha Namak (Rock Salt) use karein aur quantity 30% kam karein.\n2. Potassium Rich Superfoods: Nariyal paani, Palak, Kheera, aur Lauki ka soup (sodium ko counter karta hai).\n3. Raw Garlic Hack: Roz subah 1 kachi lahsun (garlic) ki kali ko paani ke sath nigal lein (Arjuna bark water ke sath) — natural blood thinner & BP regulator.\n4. Stress Relief: Daily 15 minute Anulom-Vilom pranayama karein.`,
      `${userName}, high BP ke liye sendha namak switch karein, subah 1 lahsun ki kali paani ke sath lein, aur daily 1 glass nariyal paani piyein.`,
      ["Fatty liver reversal plan", "Cholesterol diet chart"]
    );
  }

  // 20. FATTY LIVER & ACIDITY
  if (q.includes("liver") || q.includes("fatty liver") || q.includes("acidity") || q.includes("gas") || q.includes("jalan") || q.includes("bloating")) {
    return pack(
      `${userName}, Fatty Liver & Acidity Elimination Protocol:\n\n🌿 Liver Detox & Gut Healing:\n1. Khali Pet Amla + Adrak Shot: Roz subah 1 taza amla aur adrak ka juice gungune paani me lein (liver enzymes SGOT/SGPT normalize hote hain).\n2. Vajrasana Magic: Lunch aur dinner ke theek baad 5-10 minute Vajrasana me baithein — acidity aur gas jad se gayab ho jayegi.\n3. Strictly Stop: Fried samosa, pakode, refined refined palm oil, late night dinner aur excess chai/coffee.\n4. Triphala Water: Raat ko sone se pehle 1/2 tsp Triphala churna gungune paani me lein for liver cleanse.`,
      `${userName}, fatty liver aur acidity ke liye subah taza amla shot lein aur har meal ke baad 5 minute Vajrasana me baithein. Gas bilkul nahi banegi.`,
      ["Acidity rokne ke liye chai ka rule", "Liver detox meal chart"]
    );
  }

  // 21. CONSTIPATION / KABZ
  if (q.includes("kabz") || q.includes("constipation") || q.includes("pet saaf") || q.includes("stool")) {
    return pack(
      `${userName}, Chronic Kabz (Constipation) Instant Relief Protocol:\n\n🚽 Natural Colon Flush:\n1. Raat Ko Sone Se Pehle: 1 glass gunguna cow milk + 1 tsp pure desi ghee lein (ayurvedic natural lubricant).\n2. Subah Uthkar: 2 gilas gunguna paani piyein aur 5 minute walk karein.\n3. High-Fiber Superfoods: Roz subah 2 bhigoye huye Anjeer (figs) aur 5 soaked Munakka khayein. Dopahar me 1 bowl Papaya (papita) zaroor lein.\n4. Water Intake: Kam se kam 3.5 Litres paani piyein taaki stool dry na ho.\n🚫 Chai, coffee, aur maida 10 din ke liye bilkul band rakhein.`,
      `${userName}, kabz ke liye raat ko gungune doodh me 1 chammach desi ghee lein aur subah bhigoye anjeer aur munakka khayein. Pet ekdum saaf hoga.`,
      ["Paani peene ke golden niyam", "High fiber fruits list"]
    );
  }

  // 22. THYROID
  if (q.includes("thyroid") || q.includes("tsh") || q.includes("gale")) {
    return pack(
      `${userName}, Thyroid Management ka Desi Nutrition Plan:\n\n🦋 Thyroid Support:\n1. Selenium & Zinc: Roz 2 soaked akhrot (walnuts) aur 1 tsp roasted pumpkin seeds lein (T4 se active T3 conversion ke liye zaroori).\n2. Dhaniya Paani: Subah 1 chamach sabut dhaniya (coriander seeds) ko paani me ubaal kar gunguna piyein.\n3. Goitrogens Precaution: Patta gobhi, phool gobhi aur broccoli kachi na khayein — ubaal kar hi khayein.\n4. Iodine Balance: Sendha namak ke sath natural iodine foods (soaked badam, dahi) lein.`,
      `${userName}, thyroid ke liye subah sabut dhaniya ka ubla paani piyein aur roz 2 soaked akhrot aur pumpkin seeds lein.`,
      ["Hormonal balance diet", "PCOS diet blueprint"]
    );
  }

  // 23. PCOS / HORMONES
  if (q.includes("pcos") || q.includes("pcod") || q.includes("period") || q.includes("hormone") || q.includes("irregular")) {
    return pack(
      `${userName}, PCOS & Hormonal Balance Blueprint:\n\n🌸 Hormone Harmony Protocol:\n1. Spearmint Tea: Roz 1 cup spearmint (pudina) tea piyein — clinical trials me ye excess androgens aur facial hair ko control karti hai.\n2. Seed Cycling:\n   • Day 1 to 14: 1 tbsp Alsi (Flaxseeds) + Pumpkin seeds.\n   • Day 15 to 28: 1 tbsp Til (Sesame) + Sunflower seeds.\n3. Insulin Spike Rokein: Refined white sugar, maida aur packaged dairy 80% cut down karein.\n4. Exercise: Daily 30 minute brisk walk aur yoga (Surya Namaskar & Baddha Konasana).`,
      `${userName}, PCOS ke liye roz 1 cup pudina spearmint tea piyein, seed cycling karein aur white sugar aur maida 80% kam karein.`,
      ["Seed cycling timetable", "Skin glow aur hair fall diet"]
    );
  }

  // 24. SKIN GLOW & HAIR FALL
  if (q.includes("skin") || q.includes("glow") || q.includes("hair") || q.includes("baal") || q.includes("hair fall") || q.includes("chehra") || q.includes("dandruff")) {
    return pack(
      `${userName}, Glowing Skin aur Strong Hair ka Desi Blueprint:\n\n✨ Radiant Health Protocol:\n1. Morning Amla Shot: Roz 1 taza amla ka juice gungune paani me piyein — natural Vitamin C aur collagen boost karta hai.\n2. Curry Leaves Magic: Subah khali pet 6-8 taza kadi patte chabayein — baalo ki roots majboot hoti hain aur premature greying rukti hai.\n3. Soaked Badam + Alsi: 5 soaked badam aur 1 tsp alsi seeds lein for Biotin & Omega-3.\n4. Hydration: Daily 3 Litres paani aur 1 glass fresh Nariyal paani — chehre par natural shine aayegi.`,
      `${userName}, glowing skin aur strong baalon ke liye subah amla shot piyein, 6 kadi patte chabayein aur roz 5 soaked badam lein.`,
      ["Paani ka sahi tracker", "High protein diet chart"]
    );
  }

  // 25. URIC ACID & JOINT PAIN
  if (q.includes("uric") || q.includes("gout") || q.includes("joint") || q.includes("ghutna") || q.includes("pain") || q.includes("arthritis") || q.includes("sujan")) {
    return pack(
      `${userName}, Uric Acid aur Joint Pain ka Parhez:\n\n🦵 Purine Flush Plan:\n1. Strictly Avoid: Red Rajma, Chhole, Urad dal, Mushrooms, Paneer (heavy) aur Alcohol.\n2. Healing Foods: Lauki ka soup, Kheera, Mosambi, aur daily 3.5 Litres paani piyein taaki kidney purine crystals ko flush kare.\n3. Ayurvedic Remedy: Giloy (Guduchi) ka kwath aur taza Kachi Haldi ka doodh joint pain aur inflammation ko shant karta hai.`,
      `${userName}, uric acid me rajma aur urad dal band karein, daily 3.5 litre paani piyein aur lauki ka soup lein for purine flush.`,
      ["Joint pain ke liye haldi doodh", "Lauki soup recipe"]
    );
  }

  // 26. FRUITS
  if (q.includes("fruit") || q.includes("fal") || q.includes("kela") || q.includes("seb") || q.includes("apple") || q.includes("banana") || q.includes("papita") || q.includes("mango") || q.includes("juice")) {
    return pack(
      `${userName}, Fruits (Fal) khane ke Ayurvedic & Scientific niyam:\n\n🍎 Fruit Eating Rules:\n1. Standalone Snack: Fal hamesha akele khayein (best time: 11:00 AM mid-morning).\n2. Khane Ke Theek Baad Fal Strict Ban: Fruits fast digest hote hain jabki roti/dal slow — gas banti hai.\n3. Whole Fruit > Juice: Juice me fiber khatam ho jata hai. Hamesha pura fal chaba kar khayein.\n4. Diabetics ke liye: Seb, Papita, Jamun, aur Amarood best hain.`,
      `${userName}, fal hamesha subah 11 baje akele khayein, khana khane ke theek baad fruit khane se pet me gas banti hai. Pura fal chabayein, juice na piyein.`,
      ["Subah ka 11 AM snack", "Diabetic friendly fruits"]
    );
  }

  // 27. WATER / PAANI
  if (q.includes("paani") || q.includes("water") || q.includes("hydration")) {
    return pack(
      `${userName}, Paani peene ke 3 golden niyam:\n\n💧 Hydration Secrets:\n1. Daily Target: 8 se 10 Glasses (2.5L to 3L) roz piyein. Upar ke tracker se log karein.\n2. Khane Ke Sath Paani: Khana khate waqt ghoont-ghoont paani le sakte hain, lekin khane ke theek baad pura glass na piyein (45 minute baad piyein).\n3. Thanda Paani Avoid Karein: Fridge ka chilled paani digestive fire ko bujha deta hai. Normal ya gunguna paani piyein.`,
      `${userName}, din me 8 se 10 glass paani piyein, khane ke theek baad paani na piyein aur fridge ka thanda paani avoid karein.`,
      ["Detox nectar timings", "Acidity relief hacks"]
    );
  }

  // 28. MEETHA / SWEET CRAVINGS FIX
  if (q.includes("meetha") || q.includes("sweet") || q.includes("mithai") || q.includes("chocolate") || q.includes("sugar")) {
    return pack(
      `${userName}, Meethe ki craving se bachne ke instant hacks:\n\n🍯 2-Minute Sweet Craving Fix:\n1. 1 Pinch Dalchini (Ceylon Cinnamon): Gungune paani me daal kar piyein — tongue ke sweet receptors instantly satisfy ho jate hain.\n2. 2 Medjool Dates (Khajoor) ya 5 Munakka: Natural sweetness aur bioavailable iron milta hai bina insulin spike ke.\n3. 1 Chammach Saunf aur Mishri chabayein.\n🚫 Raat ko ice-cream, chocolate ya pastry ka man kare toh 1 glass thanda paani pi kar 5 minute wait karein, 80% craving dimaag ki fake thirst hoti hai!`,
      `${userName}, jab bhi meethe ki craving sataye, 1 chutki dalchini gungune paani me lein ya 2 khajoor chabayein. 5 minute me craving shaant ho jayegi.`,
      ["Pastry khani hai par belly fat kam karna hai", "Shaam 5 PM snacks"]
    );
  }

  // 29. FAST FOOD & JUNK RECOVERY
  if (q.includes("pizza") || q.includes("burger") || q.includes("maggi") || q.includes("momos") || q.includes("junk") || q.includes("cheat") || q.includes("samosa")) {
    return pack(
      `${userName}, Cheat Meal & Junk Food Damage Control:\n\n🍕 Agar Fast Food Kha Liya Hai Toh Kya Karein:\n1. Agle Meal Me Reset: Agla meal bilkul light rakhein — sirf Lauki-Moong Dal soup ya Sprout salad lein.\n2. Hydration: 1 Litre extra paani piyein taaki excess sodium aur water retention flush out ho jaye.\n3. 20-Minute Brisk Walk: Fast food ke baad baithne ki jagah walk karein taaki glucose muscle glycogen me store ho, belly fat me nahi.\n4. 80/20 Rule: Hafte me 80% clean Desi healthy khayein, 20% cheat meal se body adjust kar leti hai.`,
      `${userName}, agar fast food kha liya hai toh agla meal bilkul light rakhein, 1 litre extra paani piyein aur 20 minute walk karein to reset.`,
      ["Lauki moong stew recipe", "Agla meal reset plan"]
    );
  }

  // 30. COMPLETE DAY BLUEPRINT ("KYA KHAU" / "FULL DAY DIET")
  if (q.includes("kya khau") || q.includes("kya khaye") || q.includes("kya khana") || q.includes("diet plan") || q.includes("menu") || q.includes("क्या खाऊं") || q.includes("क्या खाएं") || q.includes("क्या खाना") || q.includes("डाइट प्लान")) {
    if (lang === "hindi") {
      return pack(
        `${userName}, यह रहा आपके लिए 1-दिन का मास्टर देसी स्वस्थ डाइट प्लान:\n\n🌿 सुबह से रात तक का आदर्श रूटीन:\n• 06:30 AM: गुनगुना मेथी-दाना पानी या ताजा आंवला शॉट (खाली पेट)।\n• 08:30 AM (नाश्ता): 2 मूँग दाल और पनीर चिल्ला + हरी धनिया चटनी (~21g प्रोटीन)।\n• 11:00 AM (मिड-मॉर्निंग): 1 गिलास ताज़ा नारियल पानी या 1 सेब।\n• 01:30 PM (दोपहर का खाना): 2 ज्वार या मिस्सी रोटी + 1 कटोरी पालक दाल + सलाद + 1 गिलास जीरा छाछ।\n• 05:00 PM (शाम का स्नैक): 1 मुट्ठी भुना मखाना और चना + ग्रीन टी।\n• 07:45 PM (डिनर): लौकी-मूँग पाचक सूप या ग्रिल्ड पनीर सलाद।\n• 09:30 PM: हल्दी-जायफल वाला गुनगुना दूध (गहरी नींद के लिए)।\n\nआप ऊपर "7-Day Diet" टैब में जाकर पूरे हफ्ते का मेनू भी देख सकते हैं!`,
        `${userName}, आपका 1-दिन का मास्टर डाइट प्लान तैयार है: सुबह मेथी पानी, नाश्ते में मूँग पनीर चिल्ला, दोपहर में ज्वार रोटी और दाल, और रात को हल्का लौकी सूप लें।`,
        ["नाश्ते की रेसिपी", "दोपहर की थाली का नियम", "हल्दी दूध के फायदे"]
      );
    }
    return pack(
      `${userName}, yeh raha aapke liye 1-Day Master Desi Swasth Blueprint:\n\n🌿 Subah Se Raat Tak Ka Ideal Routine:\n• 06:30 AM: Gunguna Methi-Dana paani ya Amla shot (khali pet).\n• 08:30 AM (Nashta): 2 Moong Dal & Paneer Chilla + Dhaniya Chutney (~21g Protein).\n• 11:00 AM (Mid-Morning): 1 Glass Taza Nariyal Paani ya 1 Seb (Apple).\n• 01:30 PM (Lunch): 2 Jowar/Missi Roti + 1 bowl Palak Dal + Salad + 1 Glass Jeera Chaas.\n• 05:00 PM (Shaam Snack): 1 Mutthi Roasted Makhana & Chana + Green Tea.\n• 07:45 PM (Dinner): Lauki-Moong Digestive Stew ya Grilled Paneer Salad.\n• 09:30 PM: Haldi-Jayfal Warm Milk (for deep sleep).\n\nAap upar diye gaye "7-Day Diet" tab me jaakar har din ka alag swasth menu bhi dekh sakte hain!`,
      `${userName}, aapka 1-day master plan ready hai: Subah methi paani, nashte me moong paneer chilla, lunch me jowar roti aur dal, aur dinner me lauki stew.`,
      ["Nashte ki recipe", "Lunch ka plate partition", "Bedtime haldi doodh"]
    );
  }

  // 31. DYNAMIC CONTEXTUAL FALLBACK (Smart & Personalized)
  if (lang === "hindi") {
    return pack(
      `${userName}, आपने "${query}" के बारे में पूछा है — स्वरा क्लिनिकल इंजन ने इसे नोट कर लिया है।\n\n🌿 क्लिनिकल सलाह (स्वास्थ्य स्थिति: ${userCond}):\n1. स्वस्थ देसी नियम: खाना हमेशा ताजा, गर्म और घर का बना खाएं। रिफाइंड तेल, चीनी और मैदा कम से कम रखें।\n2. पानी और वॉक: दिन में 8 से 10 गिलास पानी पिएं और हर भोजन के बाद 500 कदम जरूर टहलें।\n3. देसी रसोई: हमारे "Desi Rasoi" टैब में 14+ स्वादिष्ट और पौष्टिक रेसिपीज़ (जैसे मूँग पनीर चिल्ला, पालक पनीर) उपलब्ध हैं।\n\nआप मुझसे चाय, नाश्ता, दोपहर के भोजन, बेली फैट या किसी भी बीमारी के परहेज के बारे में सीधा पूछ सकते हैं!`,
      `${userName}, आपके सवाल के लिए सबसे पहला नियम है कि खाना घर का ताजा खाएं और हर भोजन के बाद 500 कदम टहलें। आप मुझसे किसी भी खाद्य पदार्थ के बारे में पूछ सकते हैं।`,
      ["सुबह का नाश्ता", "चाय का सही समय", "वजन घटाने का प्लान"]
    );
  }

  if (lang === "english") {
    return pack(
      `${userName}, you asked about "${query}" — GARUDA Clinical Intelligence has analyzed this.\n\n🌿 Clinical Guidance (Context: ${userCond}):\n1. Wholesome Desi Rule: Always prioritize fresh, home-cooked meals. Minimize refined oils and processed flour.\n2. Hydration & Movement: Drink 8-10 glasses of water daily and take 500 gentle steps after every meal.\n3. Desi Rasoi: Check our "Desi Rasoi" tab for 14+ step-by-step healing recipes.\n\nFeel free to ask me anything about breakfast, chai timing, dinner rules, or fat loss!`,
      `${userName}, always eat fresh home-cooked meals and take a 500-step gentle walk after eating. You can ask me any specific nutrition question.`,
      ["Healthy breakfast options", "Best time for tea", "Belly fat reduction"]
    );
  }

  return pack(
    `${userName}, aapne "${query}" ke baare me pucha hai — GARUDA Clinical Intelligence ne ise analyze kar liya hai.\n\n🌿 Clinical Recommendation (Context: ${userCond}):\n1. Swasth Desi Niyam: Khana hamesha garam, fresh aur ghar ka bana khayein. Tel-masale aur maida ko minimum rakhein.\n2. Hydration & Walk: Roz 8-10 glass paani piyein aur har meal ke baad 100-500 kadam gentle walk zaroor karein.\n3. Chef & Nutritionist Tip: Hamare "Desi Rasoi" tab me jakar aap 14+ swadisht healthy recipes (jaise Moong Paneer Chilla, Palak Paneer, Sattu Cooler) ki step-by-step cooking dekh sakte hain!\n\nAap mujhse kisi bhi specific item (jaise chai, dahi, nashta, dinner, sugar, weight loss) ke baare me direct pooch sakte hain!`,
    `${userName}, aapke sawal ke liye sabse pehla niyam hai ki khana ghar ka garam khayein aur har meal ke baad 500 kadam walk zaroor karein. Aap mujhse kisi bhi specific item ke baare me pooch sakte hain.`,
    ["Subah ka nashta", "Chai ka sahi time", "Belly fat plan"]
  );
}

// -----------------------------------------------------------------
// 5. MAIN REACT COMPONENT
// -----------------------------------------------------------------
export default function GarudaHealthApp() {
  // Theme State
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("garuda_theme_mode") || "warm-ivory";
  });

  // User Profile
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem("garuda_health_profile_v2");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      name: "",
      goal: "weight_loss",
      conditions: [],
      diet: "veg",
      completed: false
    };
  });

  const [showProfileModal, setShowProfileModal] = useState(!profile.completed);
  const [activeTab, setActiveTab] = useState("calendar"); // 'calendar', 'recipes', 'health', 'chat'
  const [selectedDay, setSelectedDay] = useState("monday");
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [recipeCategory, setRecipeCategory] = useState("all");

  const [waterCount, setWaterCount] = useState(() => {
    return parseInt(localStorage.getItem("garuda_water_count") || "4", 10);
  });
  const [toastMessage, setToastMessage] = useState("");
  const lastBackPressRef = useRef(0);

  // 📱 SOVEREIGN THUMB FLICK TAB-SWAP ENGINE
  const TAB_ORDER = ["calendar", "recipes", "health", "chat"];
  const touchStartRef = useRef({ x: 0, y: 0, time: 0, isIsolated: false });
  const swipeTriggeredRef = useRef(false);

  const handleTouchStart = (e) => {
    if (selectedRecipe || showProfileModal) return;
    if (!e.touches || e.touches.length === 0) return;
    const touch = e.touches[0];
    const target = e.target;
    // Don't trigger tab swap if touch originated inside an isolated horizontal scroller (Day pills or AI chips)
    const isIsolated = !!(target && typeof target.closest === "function" && target.closest('[data-scroll-isolated="true"]'));
    swipeTriggeredRef.current = false;
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
      isIsolated
    };
  };

  const handleTouchMove = (e) => {
    if (swipeTriggeredRef.current || touchStartRef.current.isIsolated) return;
    if (selectedRecipe || showProfileModal) return;
    if (!e.touches || e.touches.length === 0) return;
    const touch = e.touches[0];
    const diffX = touch.clientX - touchStartRef.current.x;
    const diffY = touch.clientY - touchStartRef.current.y;

    // Threshold: horizontal swipe >= 36px, predominantly horizontal (|diffX| > |diffY| * 1.05)
    if (Math.abs(diffX) > 36 && Math.abs(diffX) > Math.abs(diffY) * 1.05) {
      swipeTriggeredRef.current = true;
      const currentIndex = TAB_ORDER.indexOf(activeTab);
      if (diffX < 0) {
        // Flicked LEFT -> Next Tab (7-Day Diet -> Desi Rasoi -> Bimari Parhez -> Nutrition AI)
        if (currentIndex < TAB_ORDER.length - 1) {
          setActiveTab(TAB_ORDER[currentIndex + 1]);
        }
      } else {
        // Flicked RIGHT -> Previous Tab
        if (currentIndex > 0) {
          setActiveTab(TAB_ORDER[currentIndex - 1]);
        }
      }
    }
  };

  const handleTouchEnd = (e) => {
    if (swipeTriggeredRef.current || touchStartRef.current.isIsolated) {
      swipeTriggeredRef.current = false;
      return;
    }
    if (selectedRecipe || showProfileModal) return;
    if (!e.changedTouches || e.changedTouches.length === 0) return;
    const touch = e.changedTouches[0];
    const diffX = touch.clientX - touchStartRef.current.x;
    const diffY = touch.clientY - touchStartRef.current.y;
    const duration = Date.now() - touchStartRef.current.time;

    // Fast-lift fallback
    if (Math.abs(diffX) > 32 && Math.abs(diffX) > Math.abs(diffY) * 1.05 && duration < 750) {
      swipeTriggeredRef.current = true;
      const currentIndex = TAB_ORDER.indexOf(activeTab);
      if (diffX < 0) {
        if (currentIndex < TAB_ORDER.length - 1) {
          setActiveTab(TAB_ORDER[currentIndex + 1]);
        }
      } else {
        if (currentIndex > 0) {
          setActiveTab(TAB_ORDER[currentIndex - 1]);
        }
      }
    }
    swipeTriggeredRef.current = false;
  };

  const handleTouchCancel = () => {
    swipeTriggeredRef.current = false;
  };

  // Global Language State (english, hinglish, hindi, punjabi)
  const [appLang, setAppLang] = useState(() => {
    return localStorage.getItem("garuda_app_lang") || localStorage.getItem("garuda_chat_lang") || "hinglish";
  });
  const chatLang = appLang;
  const setChatLang = setAppLang;

  // Dynamic Clinical Meal Plan computed live from Profile & Language
  const activeMenu = useMemo(() => {
    return getPersonalizedDayMenu(selectedDay, profile, appLang);
  }, [selectedDay, profile, appLang]);

  const [autoVoice, setAutoVoice] = useState(() => localStorage.getItem("garuda_auto_voice") !== "false");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeAudioMsgId, setActiveAudioMsgId] = useState(null);
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);

  const [messages, setMessages] = useState(() => {
    const initialGreetings = {
      english: {
        text: "Hello! 🙏 I am GARUDA — your personal Clinical Nutrition & Diet AI Coach. Ask me anything about meal plans, cravings, fat loss, or disease parhez!",
        spokenText: "Hello! I am GARUDA. Ask me anything about your diet or health.",
        followUps: ["Best morning drink on empty stomach?", "Sustainable belly fat loss plan?", "Highest protein Indian breakfast?"]
      },
      hindi: {
        text: "नमस्ते! 🙏 मैं हूँ गरुड़ — आपका पर्सनल AI क्लिनिकल न्यूट्रिशनिस्ट और हेल्थ साथी। वजन घटाने, 7-दिन की डाइट, बीमारी के परहेज या किसी भी क्रेविंग के बारे में सीधा पूछें!",
        spokenText: "नमस्ते! मैं गरुड़ हूँ। आप मुझसे बोलकर या लिखकर अपनी डाइट के बारे में कुछ भी पूछ सकते हैं।",
        followUps: ["सुबह खाली पेट क्या पीना चाहिए?", "वजन और पेट की चर्बी कैसे घटाएं?", "नाश्ते में सबसे हाई-प्रोटीन क्या खाएं?"]
      },
      punjabi: {
        text: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! 🙏 ਮੈਂ ਹਾਂ ਗਰੁੜ — ਤੁਹਾਡਾ ਪਰਸਨਲ AI ਕਲੀਨਿਕਲ ਨਿਊਟ੍ਰੀਸ਼ਨਿਸਟ। ਭਾਰ ਘਟਾਉਣ, 7-ਦਿਨਾਂ ਦੇਸੀ ਖੁਰਾਕ, ਬਿਮਾਰੀ ਪਰਹੇਜ਼ ਜਾਂ ਰੈਸਿਪੀ ਬਾਰੇ ਕੁਝ ਵੀ ਪੁੱਛੋ!",
        spokenText: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਗਰੁੜ ਹਾਂ। ਤੁਸੀਂ ਮੇਰੇ ਨਾਲ ਬੋਲ ਕੇ ਜਾਂ ਲਿਖ ਕੇ ਆਪਣੀ ਖੁਰਾਕ ਬਾਰੇ ਪੁੱਛ ਸਕਦੇ ਹੋ।",
        followUps: ["ਸਵੇਰੇ ਖਾਲੀ ਪੇਟ ਕੀ ਪੀਣਾ ਚਾਹੀਦਾ ਹੈ?", "ਢਿੱਡ ਦੀ ਚਰਬੀ ਕਿਵੇਂ ਘਟਾਈਏ?", "ਨਾਸ਼ਤੇ ਵਿੱਚ ਸਭ ਤੋਂ ਵੱਧ ਪ੍ਰੋਟੀਨ ਕੀ ਹੈ?"]
      },
      hinglish: {
        text: "Namaste! 🙏 Mai hoon GARUDA — aapka Personal Clinical Nutritionist & Health Coach. Diet, daily meal planning, bimari ke parhez ya craving fixes ke baare me kuch bhi puchiye ya mic daba kar boliye!",
        spokenText: "Namaste! Mai GARUDA hoon. Aap mujhse bol kar ya likh kar apni diet ke baare me kuch bhi pooch sakte hain.",
        followUps: ["Subah khali pet kya pina best hai?", "Belly fat aur vajan kaise kam karein?", "Pastry khani hai par belly fat kam karna hai"]
      }
    };
    const init = initialGreetings[localStorage.getItem("garuda_app_lang") || "hinglish"] || initialGreetings.hinglish;
    return [{
      id: 1,
      sender: "bot",
      text: init.text,
      spokenText: init.spokenText,
      followUps: init.followUps
    }];
  });
    // Synchronize initial welcome greeting on language switch if user hasn't chatted yet
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 1) {
        const initialGreetings = {
          english: {
            text: "Hello! 🙏 I am GARUDA — your personal Clinical Nutrition & Diet AI Coach. Ask me anything about meal plans, cravings, fat loss, or disease parhez!",
            spokenText: "Hello! I am GARUDA. Ask me anything about your diet or health.",
            followUps: ["Best morning drink on empty stomach?", "Sustainable belly fat loss plan?", "Highest protein Indian breakfast?"]
          },
          hindi: {
            text: "नमस्ते! 🙏 मैं हूँ गरुड़ — आपका पर्सनल AI क्लिनिकल न्यूट्रिशनिस्ट और हेल्थ साथी। वजन घटाने, 7-दिन की डाइट, बीमारी के परहेज या किसी भी क्रेविंग के बारे में सीधा पूछें!",
            spokenText: "नमस्ते! मैं गरुड़ हूँ। आप मुझसे बोलकर या लिखकर अपनी डाइट के बारे में कुछ भी पूछ सकते हैं।",
            followUps: ["सुबह खाली पेट क्या पीना चाहिए?", "वजन और पेट की चर्बी कैसे घटाएं?", "नाश्ते में सबसे हाई-प्रोटीन क्या खाएं?"]
          },
          punjabi: {
            text: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! 🙏 ਮੈਂ ਹਾਂ ਗਰੁੜ — ਤੁਹਾਡਾ ਪਰਸਨਲ AI ਕਲੀਨਿਕਲ ਨਿਊਟ੍ਰੀਸ਼ਨਿਸਟ। ਭਾਰ ਘਟਾਉਣ, 7-ਦਿਨਾਂ ਦੇਸੀ ਖੁਰਾਕ, ਬਿਮਾਰੀ ਪਰਹੇਜ਼ ਜਾਂ ਰੈਸਿਪੀ ਬਾਰੇ ਕੁਝ ਵੀ ਪੁੱਛੋ!",
            spokenText: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਗਰੁੜ ਹਾਂ। ਤੁਸੀਂ ਮੇਰੇ ਨਾਲ ਬੋਲ ਕੇ ਜਾਂ ਲਿਖ ਕੇ ਆਪਣੀ ਖੁਰਾਕ ਬਾਰੇ ਪੁੱਛ ਸਕਦੇ ਹੋ।",
            followUps: ["ਸਵੇਰੇ ਖਾਲੀ ਪੇਟ ਕੀ ਪੀਣਾ ਚਾਹੀਦਾ ਹੈ?", "ਢਿੱਡ ਦੀ ਚਰਬੀ ਕਿਵੇਂ ਘਟਾਈਏ?", "ਨਾਸ਼ਤੇ ਵਿੱਚ ਸਭ ਤੋਂ ਵੱਧ ਪ੍ਰੋਟੀਨ ਕੀ ਹੈ?"]
          },
          hinglish: {
            text: "Namaste! 🙏 Mai hoon GARUDA — aapka Personal Clinical Nutritionist & Health Coach. Diet, daily meal planning, bimari ke parhez ya craving fixes ke baare me kuch bhi puchiye ya mic daba kar boliye!",
            spokenText: "Namaste! Mai GARUDA hoon. Aap mujhse bol kar ya likh kar apni diet ke baare me kuch bhi pooch sakte hain.",
            followUps: ["Subah khali pet kya pina best hai?", "Belly fat aur vajan kaise kam karein?", "Pastry khani hai par belly fat kam karna hai"]
          }
        };
        const init = initialGreetings[appLang] || initialGreetings.hinglish;
        return [{
          id: 1,
          sender: "bot",
          text: init.text,
          spokenText: init.spokenText,
          followUps: init.followUps
        }];
      }
      return prev;
    });
  }, [appLang]);

  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatBottomRef = useRef(null);

  // GARUDA Neural Voice Engine (TTS: Google Neural MP3 Stream + HTML5 Audio + WebSpeech Fallback)
  const stopSpeaking = () => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    } catch (e) {}
    setIsSpeaking(false);
    setActiveAudioMsgId(null);
  };

  const speakGaruda = (textToSpeak, msgId = null, overrideLang = null) => {
    // If already speaking this message, toggle stop
    if (isSpeaking && activeAudioMsgId === msgId) {
      stopSpeaking();
      return;
    }

    stopSpeaking();
    if (!textToSpeak) return;

    const activeL = overrideLang || appLang;

    // Clean text for audio: strip markdown, emojis, urls, numbers
    let clean = textToSpeak
      .replace(/https?:\/\/\S+/gi, "")
      .replace(/[*#`_~>[\]()]/g, " ")
      .replace(/[\u{1F300}-\u{1FAFF}]/gu, "")
      .replace(/\s+/g, " ")
      .trim();

    // If text is long, take the top 1-2 punchy sentences (under 180 chars) for instant crisp audio
    if (clean.length > 190) {
      const sentences = clean.match(/[^.!?।\n]+[.!?।\n]+/g);
      if (sentences && sentences.length > 0) {
        clean = sentences.slice(0, 2).join(" ").trim();
      }
      if (clean.length > 190) {
        clean = clean.substring(0, 185) + "...";
      }
    }

    if (!clean) return;

    let tl = "hi";
    if (activeL === "english") tl = "en";
    else if (activeL === "punjabi") tl = "pa";
    else tl = "hi"; // Hinglish and Hindi

    setIsSpeaking(true);
    if (msgId) setActiveAudioMsgId(msgId);

    // Primary: Google Neural MP3 Stream via Audio
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${tl}&q=${encodeURIComponent(clean)}`;

    try {
      const audio = new Audio(ttsUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        setActiveAudioMsgId(null);
        audioRef.current = null;
      };

      audio.onerror = () => {
        fallbackWebSpeech(clean, activeL, msgId);
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("Audio play blocked or offline, fallback to WebSpeech:", err);
          fallbackWebSpeech(clean, activeL, msgId);
        });
      }
    } catch (err) {
      fallbackWebSpeech(clean, activeL, msgId);
    }
  };

  const fallbackWebSpeech = (cleanText, activeL, msgId) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setIsSpeaking(false);
      setActiveAudioMsgId(null);
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = activeL === "english" ? "en-IN" : activeL === "punjabi" ? "pa-IN" : "hi-IN";
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      utterance.onend = () => {
        setIsSpeaking(false);
        setActiveAudioMsgId(null);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setActiveAudioMsgId(null);
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      setIsSpeaking(false);
      setActiveAudioMsgId(null);
    }
  };

  // GARUDA Mic Speech Recognition Engine (STT)
  const toggleListening = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      triggerToast("Aapke browser/device par mic voice recognition support nahi hai. Kripya type karein.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e){}
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = chatLang === "punjabi" ? "pa-IN" : chatLang === "hindi" ? "hi-IN" : chatLang === "english" ? "en-IN" : "hi-IN";

      recognition.onstart = () => {
        setIsListening(true);
        triggerToast("🎙️ GARUDA sun raha hai... boliye!");
      };

      recognition.onresult = (event) => {
        setIsListening(false);
        if (event.results && event.results[0] && event.results[0][0]) {
          const transcript = event.results[0][0].transcript;
          if (transcript && transcript.trim()) {
            setInputText(transcript);
            handleSendMessage(transcript);
          }
        }
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error === "not-allowed") {
          triggerToast("Microphone permission allow kijiye taaki GARUDA sun sake.");
        } else {
          triggerToast("Aawaz theek se nahi suni. Kripya dubara boliye.");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.warn("Recognition start error:", err);
      setIsListening(false);
      triggerToast("Mic shuru nahi ho paya. Kripya type karein.");
    }
  };

  // Theme Toggle
  const toggleTheme = () => {
    const nextTheme = theme === "warm-ivory" ? "emerald-noir" : "warm-ivory";
    setTheme(nextTheme);
    localStorage.setItem("garuda_theme_mode", nextTheme);
  };

  // Save Profile
  const handleSaveProfile = (newProfile) => {
    setProfile(newProfile);
    localStorage.setItem("garuda_health_profile_v2", JSON.stringify(newProfile));
    setShowProfileModal(false);
    triggerToast(`Welcome ${newProfile.name || "Ji"}! Aapka customized diet blueprint active hai.`);
  };

  // Water Tracker
  const updateWater = (delta) => {
    const next = Math.max(0, Math.min(12, waterCount + delta));
    setWaterCount(next);
    localStorage.setItem("garuda_water_count", next.toString());
  };

  // Toast Helper
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 2800);
  };

  // Auto Scroll Chat
  useEffect(() => {
    if (activeTab === "chat") {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

  // ---------------------------------------------------------------
  // 📱 ANDROID HARDWARE / GESTURE BACK-BUTTON HANDLER
  // ---------------------------------------------------------------
  useEffect(() => {
    const handleCustomBack = () => {
      // 1. If Recipe Modal open -> Close modal
      if (selectedRecipe) {
        setSelectedRecipe(null);
        return;
      }
      // 2. If Profile Modal open -> Close modal (if completed)
      if (showProfileModal && profile.completed) {
        setShowProfileModal(false);
        return;
      }
      // 3. If on sub-tab -> return to home calendar
      if (activeTab !== "calendar") {
        setActiveTab("calendar");
        return;
      }
      // 4. If on home tab -> double-tap to exit
      const now = Date.now();
      if (now - lastBackPressRef.current < 2500) {
        if (window.Capacitor?.Plugins?.App?.exitApp) {
          window.Capacitor.Plugins.App.exitApp();
        }
      } else {
        lastBackPressRef.current = now;
        triggerToast("App se bahar nikalne ke liye dubara Back dabayein");
      }
    };

    let capListener = null;
    try {
      if (window.Capacitor?.Plugins?.App?.addListener) {
        window.Capacitor.Plugins.App.addListener("backButton", () => {
          handleCustomBack();
        }).then((l) => {
          capListener = l;
        }).catch((e) => {
          console.warn("Capacitor backButton listener error:", e);
        });
      }
    } catch (err) {
      console.warn("Capacitor plugin access error:", err);
    }

    const onPopState = () => {
      handleCustomBack();
    };
    window.addEventListener("popstate", onPopState);

    return () => {
      if (capListener && capListener.remove) {
        capListener.remove();
      }
      window.removeEventListener("popstate", onPopState);
    };
  }, [selectedRecipe, showProfileModal, activeTab, profile.completed]);

  // Send Chat Message with Live Google Gemini Intelligence & Offline Fallback Notice
  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    stopSpeaking();

    const userMsg = { id: Date.now(), sender: "user", text: query };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    const botMsgId = Date.now() + 1;
    let botMsg = null;

    try {
      // 1. Live Google Gemini 2.5 Flash
      const geminiRes = await askGarudaAI({
        query,
        appLang,
        userProfile: profile,
        conversationHistory: messages
      });

      botMsg = {
        id: botMsgId,
        sender: "bot",
        text: geminiRes.text,
        spokenText: geminiRes.spokenText,
        followUps: getDynamicFollowUps(query, appLang)
      };
    } catch (err) {
      console.warn("Gemini Live offline/failed, using respectful clinical fallback:", err);

      // Exact respectful apology notice requested by Founder Praveen
      let apology = "";
      let prefixSpoken = "";
      if (appLang === "hindi") {
        apology = "⚠️ इस वक़्त आप इंटरनेट / नेटवर्क में नहीं हैं, इसलिए ऑफ़लाइन मोड में जवाब दे रहा हूँ। अगर जवाब में कुछ कमी लगे तो उसके लिए खेद है।\n\n";
        prefixSpoken = "ऑफ़लाइन मोड: मैं गरुड़ हूँ। ";
      } else if (appLang === "punjabi") {
        apology = "⚠️ ਇਸ ਸਮੇਂ ਤੁਸੀਂ ਇੰਟਰਨੈਟ / ਨੈਟਵਰਕ ਵਿੱਚ ਨਹੀਂ ਹੋ, ਇਸ ਲਈ ਆਫਲਾਈਨ ਮੋਡ ਵਿੱਚ ਜਵਾਬ ਦੇ ਰਿਹਾ ਹਾਂ। ਜੇਕਰ ਜਵਾਬ ਵਿੱਚ ਕੋਈ ਕਮੀ ਲੱਗੇ ਤਾਂ ਉਸ ਲਈ ਖਿਮਾ ਚਾਹੁੰਦਾ ਹਾਂ।\n\n";
        prefixSpoken = "ਆਫਲਾਈਨ ਮੋਡ: ਮੈਂ ਗਰੁੜ ਹਾਂ। ";
      } else if (appLang === "english") {
        apology = "⚠️ You are currently offline or out of network coverage, so I am answering in offline mode. Apologies for any limitations in this offline response.\n\n";
        prefixSpoken = "In offline mode: I am GARUDA. ";
      } else {
        // Hinglish
        apology = "⚠️ Iss waqt aap internet / network me nahi hain, isliye offline mode me reply kar raha hoon. Agar jawab me kuch kami lage toh uske liye khed hai.\n\n";
        prefixSpoken = "Offline mode me: Mai GARUDA hoon. ";
      }

      const offlineReply = generateDietitianResponse(query, profile, messages, appLang);
      const offlineText = typeof offlineReply === "string" ? offlineReply : offlineReply.text;
      const offlineSpoken = typeof offlineReply === "string" ? offlineReply : offlineReply.spokenText;

      botMsg = {
        id: botMsgId,
        sender: "bot",
        text: apology + offlineText,
        spokenText: prefixSpoken + offlineSpoken,
        followUps: offlineReply?.followUps || getDynamicFollowUps(query, appLang)
      };
    } finally {
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);

      if (autoVoice && botMsg?.spokenText) {
        speakGaruda(botMsg.spokenText, botMsgId, appLang);
      }
    }
  };

  // Color Styles
  const isLight = theme === "warm-ivory";
  const t = UI_STRINGS[appLang] || UI_STRINGS.hinglish;

  const styles = useMemo(() => {
    return {
      bgMain: isLight ? "#F7F5F0" : "#0A130E",
      cardBg: isLight ? "#FFFFFF" : "#121E17",
      cardBorder: isLight ? "rgba(212, 175, 55, 0.35)" : "rgba(212, 175, 55, 0.25)",
      textPrimary: isLight ? "#0F172A" : "#F8FAFC",
      textSecondary: isLight ? "#475569" : "#94A3B8",
      accentGold: "#D4AF37",
      accentEmerald: "#10B981",
      navBg: isLight ? "rgba(255, 255, 255, 0.95)" : "rgba(10, 19, 14, 0.95)",
      navBorder: isLight ? "rgba(212, 175, 55, 0.3)" : "rgba(212, 175, 55, 0.2)",
      headerBg: isLight ? "rgba(247, 245, 240, 0.96)" : "rgba(10, 19, 14, 0.96)",
      inputBg: "#FFFFFF",
      inputText: "#0F172A"
    };
  }, [isLight]);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      style={{
        width: "100%",
        maxWidth: "500px",
        margin: "0 auto",
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: styles.bgMain,
        color: styles.textPrimary,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        overflow: "hidden",
        position: "relative"
      }}
    >
      {/* 🔔 TOAST NOTIFICATION (POINTER-EVENTS NONE & BOTTOM FLOATING) */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "calc(72px + env(safe-area-inset-bottom, 0px))",
            left: "50%",
            transform: "translateX(-50%)",
            background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
            color: "#FFFFFF",
            padding: "0.55rem 1.1rem",
            borderRadius: "24px",
            fontSize: "0.76rem",
            fontWeight: 800,
            boxShadow: "0 6px 20px rgba(0,0,0,0.35)",
            zIndex: 999,
            textAlign: "center",
            maxWidth: "88%",
            pointerEvents: "none"
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* ======================================================== */}
      {/* 👑 FIXED LUXURY HEADER (BALANCED VIEWPORT LOCK)         */}
      {/* ======================================================== */}
      <header
        style={{
          flexShrink: 0,
          background: styles.headerBg,
          backdropFilter: "blur(16px)",
          borderBottom: `1.5px solid ${styles.cardBorder}`,
          paddingTop: "calc(0.55rem + env(safe-area-inset-top, 0px))",
          paddingBottom: "0.45rem",
          paddingLeft: "0.85rem",
          paddingRight: "0.85rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.35rem",
          zIndex: 40
        }}
      >
        {/* Row 1: Brand & Identity & Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <img
              src="/garuda-sigil.png"
              alt="Garuda"
              style={{
                width: "34px",
                height: "34px",
                objectFit: "contain",
                filter: "drop-shadow(0 2px 6px rgba(212, 175, 55, 0.45))"
              }}
            />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <span style={{ fontSize: "0.95rem", fontWeight: 900, color: styles.accentGold, letterSpacing: "0.03em" }}>
                  {t.appTitle}
                </span>
                <span
                  style={{
                    background: isLight ? "rgba(16, 185, 129, 0.12)" : "rgba(16, 185, 129, 0.25)",
                    color: "#10B981",
                    fontSize: "0.62rem",
                    fontWeight: 800,
                    padding: "0.1rem 0.4rem",
                    borderRadius: "6px"
                  }}
                >
                  PRO
                </span>
              </div>
              <div style={{ fontSize: "0.7rem", color: styles.textSecondary, fontWeight: 700 }}>
                {t.welcome}, {profile.name || "Praveen"} 🌿
              </div>
            </div>
          </div>

          {/* Action Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <button
              onClick={toggleTheme}
              title="Toggle Luxury Theme"
              style={{
                background: styles.cardBg,
                border: `1px solid ${styles.cardBorder}`,
                borderRadius: "18px",
                padding: "0.25rem 0.5rem",
                fontSize: "0.7rem",
                fontWeight: 800,
                color: styles.textPrimary,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.2rem"
              }}
            >
              {isLight ? "🌙 Dark" : "☀️ Silk"}
            </button>

            <button
              onClick={() => setShowProfileModal(true)}
              style={{
                background: "linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)",
                border: "none",
                borderRadius: "18px",
                padding: "0.28rem 0.6rem",
                fontSize: "0.7rem",
                fontWeight: 900,
                color: "#0A130E",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
                boxShadow: "0 2px 8px rgba(212, 175, 55, 0.35)"
              }}
            >
              👤 Profile
            </button>
          </div>
        </div>

        {/* Row 2: Global 4-Language Selector Bar (EN / HINGLISH / हिन्दी / ਪੰਜਾਬੀ) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: isLight ? "#F1F5F9" : "rgba(255,255,255,0.05)",
            padding: "0.22rem 0.4rem",
            borderRadius: "10px",
            border: `1px solid ${styles.cardBorder}`
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.64rem", fontWeight: 900, color: styles.accentGold, paddingLeft: "0.2rem" }}>
            <span>🌐 Bhasha:</span>
          </div>
          <div style={{ display: "flex", gap: "0.25rem" }}>
            {[
              { id: "english", label: "EN" },
              { id: "hinglish", label: "HINGLISH" },
              { id: "hindi", label: "हिन्दी" },
              { id: "punjabi", label: "ਪੰਜਾਬੀ" }
            ].map((l) => {
              const isSel = appLang === l.id;
              return (
                <button
                  key={l.id}
                  onClick={() => {
                    setAppLang(l.id);
                    localStorage.setItem("garuda_app_lang", l.id);
                    localStorage.setItem("garuda_chat_lang", l.id);
                    triggerToast(`Bhasha: ${l.label}`);
                  }}
                  style={{
                    padding: "0.2rem 0.5rem",
                    borderRadius: "8px",
                    border: isSel ? "1.5px solid #D4AF37" : "1px solid transparent",
                    background: isSel
                      ? "linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)"
                      : "transparent",
                    color: isSel ? "#0A130E" : styles.textPrimary,
                    fontSize: "0.64rem",
                    fontWeight: 900,
                    cursor: "pointer",
                    boxShadow: isSel ? "0 2px 6px rgba(212,175,55,0.35)" : "none",
                    transition: "all 0.15s ease"
                  }}
                >
                  {l.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 📜 SCROLLABLE BODY CONTENT                              */}
      {/* ======================================================== */}
      <main
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        style={{
          flex: 1,
          overflowY: activeTab === "chat" ? "hidden" : "auto",
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
          overscrollBehaviorY: "contain",
          overscrollBehaviorX: "none",
          scrollBehavior: "smooth",
          transform: "translateZ(0)",
          padding: activeTab === "chat"
            ? "0.5rem 0.85rem 0"
            : "0.85rem 0.9rem calc(75px + env(safe-area-inset-bottom, 0px))",
          display: "flex",
          flexDirection: "column"
        }}
      >
        {/* ======================================================== */}
        {/* TAB 1: 7-DAY DAY-WISE CULINARY CALENDAR (Somwar - Ravivar)*/}
        {/* ======================================================== */}
        {activeTab === "calendar" && (
          <div className="tab-content-active">
            {/* Daily Hydration Bar */}
            <div
              style={{
                background: isLight ? "#FFFFFF" : styles.cardBg,
                border: `1.2px solid ${styles.cardBorder}`,
                borderRadius: "14px",
                padding: "0.65rem 0.85rem",
                marginBottom: "0.85rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                boxShadow: isLight ? "0 2px 8px rgba(0,0,0,0.03)" : "0 4px 14px rgba(0,0,0,0.3)"
              }}
            >
              <div>
                <div style={{ fontSize: "0.72rem", fontWeight: 900, color: styles.accentEmerald }}>
                  💧 {t.hydration.title}
                </div>
                <div style={{ fontSize: "0.68rem", color: styles.textSecondary }}>
                  {waterCount} / 8 {t.hydration.target}
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                <button
                  onClick={() => updateWater(-1)}
                  style={{
                    background: isLight ? "#F1F5F9" : "rgba(255,255,255,0.08)",
                    border: "none",
                    borderRadius: "50%",
                    width: "28px",
                    height: "28px",
                    fontSize: "0.9rem",
                    fontWeight: 900,
                    color: styles.textPrimary,
                    cursor: "pointer"
                  }}
                >
                  -
                </button>
                <span style={{ fontSize: "0.85rem", fontWeight: 900, color: styles.accentGold }}>
                  {waterCount}
                </span>
                <button
                  onClick={() => updateWater(1)}
                  style={{
                    background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                    border: "none",
                    borderRadius: "50%",
                    width: "28px",
                    height: "28px",
                    fontSize: "0.9rem",
                    fontWeight: 900,
                    color: "#FFFFFF",
                    cursor: "pointer"
                  }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Header Title Card */}
            <div
              style={{
                background: isLight ? "#FFFFFF" : styles.cardBg,
                border: `1.5px solid ${styles.cardBorder}`,
                borderRadius: "16px",
                padding: "0.85rem",
                marginBottom: "0.85rem",
                boxShadow: isLight ? "0 4px 14px rgba(0,0,0,0.04)" : "0 4px 20px rgba(0,0,0,0.4)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span
                    style={{
                      background: "rgba(212, 175, 55, 0.15)",
                      color: styles.accentGold,
                      fontSize: "0.66rem",
                      fontWeight: 900,
                      padding: "0.15rem 0.5rem",
                      borderRadius: "6px"
                    }}
                  >
                    📅 7-DAY DESI TIMETABLE
                  </span>
                  <h2 style={{ margin: "0.35rem 0 0", fontSize: "1.15rem", fontWeight: 900, color: styles.textPrimary }}>
                    Har Din Ka Alag Swasth Menu
                  </h2>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.68rem", color: styles.textSecondary, fontWeight: 700 }}>{t.labels.dailyTargets}</div>
                  <div style={{ fontSize: "0.88rem", fontWeight: 900, color: styles.accentEmerald }}>
                    ~{activeMenu.dailyTarget.calories} kcal
                  </div>
                </div>
              </div>
              <p style={{ margin: "0.4rem 0 0", fontSize: "0.74rem", color: styles.textSecondary, lineHeight: 1.45 }}>
                Sunday se Saturday tak har meal ka exact time, protein, fiber aur Ayurvedic secret — bina boring uble khane ke!
              </p>
            </div>

            {/* Day Selector Pills (Soft Calm Touch Carousel) */}
            <div
              data-scroll-isolated="true"
              style={{
                display: "flex",
                gap: "0.45rem",
                overflowX: "auto",
                overflowY: "hidden",
                touchAction: "pan-x",
                overscrollBehaviorX: "contain",
                overscrollBehaviorY: "none",
                WebkitOverflowScrolling: "touch",
                scrollBehavior: "smooth",
                transform: "translateZ(0)",
                paddingBottom: "0.45rem",
                marginBottom: "0.85rem",
                scrollbarWidth: "none"
              }}
            >
              {t.days.map((d) => {
                const isSel = selectedDay === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDay(d.id)}
                    style={{
                      flexShrink: 0,
                      padding: "0.45rem 0.75rem",
                      borderRadius: "14px",
                      border: isSel ? "1.5px solid #D4AF37" : `1px solid ${styles.cardBorder}`,
                      background: isSel
                        ? "linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)"
                        : isLight ? "#FFFFFF" : styles.cardBg,
                      color: isSel ? "#0A130E" : styles.textPrimary,
                      fontSize: "0.74rem",
                      fontWeight: 900,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      boxShadow: isSel ? "0 4px 12px rgba(212, 175, 55, 0.35)" : "none",
                      transition: "transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), background 0.2s ease, box-shadow 0.2s ease"
                    }}
                  >
                    <span>{d.icon}</span>
                    <span>{d.label}</span>
                  </button>
                );
              })}
            </div>

                        {/* 🧬 LIVE CLINICAL PROFILE CUSTOMIZATION BADGE */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(212, 175, 55, 0.16) 0%, rgba(16, 185, 129, 0.14) 100%)",
                border: "1.5px solid rgba(212, 175, 55, 0.4)",
                borderRadius: "14px",
                padding: "0.65rem 0.85rem",
                marginBottom: "0.85rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div>
                <div style={{ fontSize: "0.66rem", fontWeight: 900, color: styles.accentGold, textTransform: "uppercase", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <span>⚡</span>
                  <span>{(profile.name || t.profileBanner.fallbackName) + t.profileBanner.titleSuffix}</span>
                </div>
                <div style={{ fontSize: "0.8rem", fontWeight: 900, color: styles.textPrimary, marginTop: "0.15rem" }}>
                  {profile.diet === "non_veg" ? "🍗 Non-Veg High-Protein" : profile.diet === "egg" ? "🥚 Eggetarian Fit" : profile.diet === "sattvic" ? "🧘 Sattvic Diet" : profile.diet === "jain" ? "🌾 Jain Satvik" : "🥬 Pure Vegetarian"} • {profile.goal === "muscle_gain" ? "💪 Muscle Strength" : profile.goal === "weight_loss" ? "⚖️ Fat Loss" : "🩺 Health Reversal"}
                </div>
                {activeMenu.clinicalBadge && (
                  <div style={{ fontSize: "0.66rem", color: styles.accentEmerald, fontWeight: 800, marginTop: "0.25rem" }}>
                    {activeMenu.clinicalBadge}
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowProfileModal(true)}
                style={{
                  padding: "0.32rem 0.65rem",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)",
                  color: "#0A130E",
                  border: "none",
                  fontSize: "0.66rem",
                  fontWeight: 900,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(212, 175, 55, 0.35)",
                  flexShrink: 0
                }}
              >
                {t.profileBanner.changeBtn}
              </button>
            </div>

            {/* Day Theme Banner */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(212, 175, 55, 0.12) 0%, rgba(16, 185, 129, 0.08) 100%)",
                border: "1px solid rgba(212, 175, 55, 0.3)",
                borderRadius: "14px",
                padding: "0.75rem",
                marginBottom: "0.85rem"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: "0.68rem", fontWeight: 800, color: styles.accentGold, textTransform: "uppercase" }}>
                    {activeMenu.dayName} Focus
                  </div>
                  <h3 style={{ margin: "0.2rem 0 0", fontSize: "0.98rem", fontWeight: 900, color: styles.textPrimary }}>
                    {activeMenu.themeTitle}
                  </h3>
                </div>
                <span
                  style={{
                    background: "rgba(16, 185, 129, 0.15)",
                    color: styles.accentEmerald,
                    fontSize: "0.64rem",
                    fontWeight: 800,
                    padding: "0.15rem 0.5rem",
                    borderRadius: "6px"
                  }}
                >
                  {activeMenu.primaryDosha}
                </span>
              </div>
              <p style={{ margin: "0.35rem 0 0", fontSize: "0.72rem", color: styles.textSecondary, lineHeight: 1.4 }}>
                {activeMenu.themeDesc}
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "0.8rem",
                  marginTop: "0.5rem",
                  fontSize: "0.7rem",
                  fontWeight: 800
                }}
              >
                <div>🥩 {t.labels.protein}: <span style={{ color: styles.accentEmerald }}>{activeMenu.dailyTarget.protein}</span></div>
                <div>🌾 {t.labels.fiber}: <span style={{ color: "#38BDF8" }}>{activeMenu.dailyTarget.fiber}</span></div>
                <div>⚡ {t.labels.carbs}: <span style={{ color: "#F59E0B" }}>{activeMenu.dailyTarget.carbs}</span></div>
              </div>
            </div>

            {/* Structured Meals Timeline for Selected Day */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {activeMenu.meals.map((meal, mIdx) => (
                <div
                  key={mIdx}
                  style={{
                    background: isLight ? "#FFFFFF" : styles.cardBg,
                    border: `1.2px solid ${styles.cardBorder}`,
                    borderRadius: "14px",
                    padding: "0.8rem",
                    boxShadow: isLight ? "0 2px 8px rgba(0,0,0,0.03)" : "0 4px 14px rgba(0,0,0,0.35)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                    <span
                      style={{
                        background: "rgba(212, 175, 55, 0.12)",
                        color: styles.accentGold,
                        fontSize: "0.68rem",
                        fontWeight: 900,
                        padding: "0.15rem 0.5rem",
                        borderRadius: "6px"
                      }}
                    >
                      ⏰ {meal.time} • {meal.type}
                    </span>
                    <span style={{ fontSize: "0.72rem", fontWeight: 900, color: styles.accentEmerald }}>
                      {meal.calories} kcal ({meal.protein} protein)
                    </span>
                  </div>

                  <h4 style={{ margin: "0.2rem 0", fontSize: "0.92rem", fontWeight: 900, color: styles.textPrimary }}>
                    {meal.name}
                  </h4>
                  <div style={{ fontSize: "0.7rem", color: styles.textSecondary, marginBottom: "0.4rem" }}>
                    📦 {t.labels.portion}: <strong style={{ color: styles.textPrimary }}>{meal.qty}</strong> • {t.labels.fiber}: {meal.fiber}
                  </div>

                  <p style={{ margin: "0 0 0.45rem", fontSize: "0.73rem", color: styles.textSecondary, lineHeight: 1.45 }}>
                    {meal.desc}
                  </p>

                  <div
                    style={{
                      background: isLight ? "rgba(16, 185, 129, 0.08)" : "rgba(16, 185, 129, 0.12)",
                      border: "1px solid rgba(16, 185, 129, 0.25)",
                      borderRadius: "10px",
                      padding: "0.45rem 0.6rem",
                      marginBottom: "0.4rem",
                      fontSize: "0.71rem",
                      lineHeight: 1.4
                    }}
                  >
                    <span style={{ fontWeight: 900, color: styles.accentEmerald }}>🩺 {t.labels.clinicalBenefit}: </span>
                    <span style={{ color: isLight ? "#1E293B" : "#E2E8F0" }}>{meal.benefit}</span>
                  </div>

                  <div
                    style={{
                      background: isLight ? "rgba(245, 158, 11, 0.08)" : "rgba(245, 158, 11, 0.12)",
                      border: "1px solid rgba(245, 158, 11, 0.25)",
                      borderRadius: "10px",
                      padding: "0.45rem 0.6rem",
                      fontSize: "0.71rem",
                      lineHeight: 1.4
                    }}
                  >
                    <span style={{ fontWeight: 900, color: "#F59E0B" }}>✨ {t.labels.chefSecret}: </span>
                    <span style={{ color: isLight ? "#1E293B" : "#FDE68A" }}>{meal.chefSecret}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: DESI RASOI (14+ GOURMET HEALTHY RECIPES)          */}
        {/* ======================================================== */}
        {activeTab === "recipes" && (
          <div className="tab-content-active">
            <div
              style={{
                background: isLight ? "#FFFFFF" : styles.cardBg,
                border: `1.5px solid ${styles.cardBorder}`,
                borderRadius: "16px",
                padding: "0.85rem",
                marginBottom: "0.85rem",
                boxShadow: isLight ? "0 4px 14px rgba(0,0,0,0.04)" : "0 4px 20px rgba(0,0,0,0.4)"
              }}
            >
              <span
                style={{
                  background: "rgba(212, 175, 55, 0.15)",
                  color: styles.accentGold,
                  fontSize: "0.66rem",
                  fontWeight: 900,
                  padding: "0.15rem 0.5rem",
                  borderRadius: "6px"
                }}
              >
                🍲 SWASTH DESI RASOI
              </span>
              <h2 style={{ margin: "0.35rem 0 0.15rem", fontSize: "1.15rem", fontWeight: 900, color: styles.textPrimary }}>
                Ghar Ki Asli Healthy Recipes
              </h2>
              <p style={{ margin: 0, fontSize: "0.74rem", color: styles.textSecondary, lineHeight: 1.4 }}>{t.tab2.desc}</p>
            </div>

                        {/* Category Filter Pills (Touch Isolated) */}
            <div
              data-scroll-isolated="true"
              style={{
                display: "flex",
                gap: "0.4rem",
                overflowX: "auto",
                overflowY: "hidden",
                touchAction: "pan-x",
                overscrollBehaviorX: "contain",
                overscrollBehaviorY: "none",
                WebkitOverflowScrolling: "touch",
                paddingBottom: "0.45rem",
                marginBottom: "0.85rem",
                scrollbarWidth: "none"
              }}
            >
              {(() => {
                const userDiet = profile?.diet || "veg";
                const isNonVegUser = userDiet === "non_veg";
                const isEggUser = userDiet === "egg";
                const catList = [
                  { id: "all", label: t.categories.all },
                  { id: "high_protein", label: t.categories.highProtein },
                  ...(isNonVegUser ? [{ id: "non_veg", label: t.categories.nonVeg || "🍗 Non-Veg & Eggs" }] : []),
                  ...(isEggUser ? [{ id: "egg", label: appLang === "punjabi" ? "🥚 ਆਂਡੇ ਵਾਲੇ ਖਾਣੇ" : appLang === "hindi" ? "🥚 अंडा स्पेशल" : appLang === "english" ? "🥚 Egg Specials" : "🥚 Egg Specials" }] : []),
                  { id: "fat_loss", label: t.categories.fatLoss },
                  { id: "sugar", label: t.categories.sugarControl },
                  { id: "zero_cook", label: appLang === "punjabi" ? "🌿 ਕੱਚਾ ਆਹਾਰ" : appLang === "hindi" ? "🌿 0-कुक कच्चा आहार" : appLang === "english" ? "🌿 Zero-Cook Cleanse" : "🌿 0-Cook Cleanse" }
                ];
                return catList.map((c) => {
                  const isSel = recipeCategory === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setRecipeCategory(c.id)}
                      style={{
                        flexShrink: 0,
                        padding: "0.35rem 0.7rem",
                        borderRadius: "12px",
                        border: isSel ? "1.5px solid #D4AF37" : `1px solid ${styles.cardBorder}`,
                        background: isSel ? "linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)" : (isLight ? "#FFFFFF" : styles.cardBg),
                        color: isSel ? "#0A130E" : styles.textPrimary,
                        fontSize: "0.68rem",
                        fontWeight: 900,
                        cursor: "pointer"
                      }}
                    >
                      {c.label}
                    </button>
                  );
                });
              })()}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {(() => {
                const userDiet = profile?.diet || "veg";
                const isStrictVeg = userDiet === "veg" || userDiet === "sattvic" || userDiet === "jain" || userDiet === "vegan";
                const isEggUser = userDiet === "egg";
                const isSattvicUser = userDiet === "sattvic";
                const isJainUser = userDiet === "jain";
                const isVeganUser = userDiet === "vegan";

                const filtered = MASTER_RECIPES.filter(r => {
                  // Safety: strictly eliminate non-veg/egg from strict vegetarians
                  if (isStrictVeg && (r.isNonVeg || r.isEgg)) return false;
                  if (isSattvicUser && !r.isSattvic) return false;
                  if (isJainUser && !r.isJain) return false;
                  if (isVeganUser && !r.isVegan) return false;
                  if (isEggUser && r.isNonVeg) return false;

                  if (recipeCategory === "all") return true;
                  if (recipeCategory === "non_veg") return r.isNonVeg || r.isEgg;
                  if (recipeCategory === "egg") return r.isEgg;
                  if (recipeCategory === "high_protein") return r.tags.includes("High Protein");
                  if (recipeCategory === "fat_loss") return r.tags.includes("Fat Loss") || r.tags.includes("Weight Loss");
                  if (recipeCategory === "sugar") return r.tags.includes("Sugar Safe");
                  if (recipeCategory === "zero_cook") return r.tags.includes("0-Cook");
                  return true;
                });

                return filtered.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setSelectedRecipe(r)}
                  style={{
                    background: isLight ? "#FFFFFF" : styles.cardBg,
                    border: `1.2px solid ${styles.cardBorder}`,
                    borderRadius: "14px",
                    padding: "0.85rem",
                    cursor: "pointer",
                    boxShadow: isLight ? "0 2px 10px rgba(0,0,0,0.03)" : "0 4px 14px rgba(0,0,0,0.3)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.4rem" }}>
                    <div>
                      <span
                        style={{
                          background: "rgba(212, 175, 55, 0.15)",
                          color: styles.accentGold,
                          fontSize: "0.64rem",
                          fontWeight: 900,
                          padding: "0.15rem 0.45rem",
                          borderRadius: "6px"
                        }}
                      >
                        {appLang === "punjabi" ? (r.category_pa || r.category) : appLang === "hindi" ? (r.category_hi || r.category) : appLang === "english" ? (r.category_en || r.category) : r.category}
                      </span>
                      <h3 style={{ margin: "0.3rem 0 0", fontSize: "0.96rem", fontWeight: 900, color: styles.textPrimary }}>
                        {appLang === "punjabi" ? (r.name_pa || r.name) : appLang === "hindi" ? (r.name_hi || r.name) : appLang === "english" ? (r.name_en || r.name) : r.name}
                      </h3>
                    </div>
                    <span
                      style={{
                        background: "rgba(16, 185, 129, 0.15)",
                        color: styles.accentEmerald,
                        fontSize: "0.74rem",
                        fontWeight: 900,
                        padding: "0.2rem 0.5rem",
                        borderRadius: "8px"
                      }}
                    >
                      {r.protein} Protein
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "0.8rem",
                      background: isLight ? "#F8FAFC" : "rgba(255,255,255,0.03)",
                      padding: "0.45rem 0.65rem",
                      borderRadius: "10px",
                      margin: "0.45rem 0",
                      fontSize: "0.7rem"
                    }}
                  >
                    <div>🔥 <strong>{r.calories}</strong> kcal</div>
                    <div>🌾 Fiber: <strong>{r.fiber}</strong></div>
                    <div>⏱ Prep: <strong>{r.prepTime}</strong></div>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginTop: "0.4rem" }}>
                    {r.tags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        style={{
                          background: isLight ? "rgba(16, 185, 129, 0.1)" : "rgba(255,255,255,0.05)",
                          color: styles.accentEmerald,
                          fontSize: "0.62rem",
                          fontWeight: 800,
                          padding: "0.1rem 0.4rem",
                          borderRadius: "4px"
                        }}
                      >
                        ✓ {tag}
                      </span>
                    ))}
                  </div>

                  <div style={{ marginTop: "0.55rem", fontSize: "0.72rem", color: styles.accentGold, fontWeight: 700 }}>
                    {appLang === "punjabi" ? "ਵਿਧੀ ਤੇ ਸ਼ੈੱਫ ਸੀਕ੍ਰੇਟ ਦੇਖੋ →" : appLang === "hindi" ? "विधि व शेफ सीक्रेट देखें →" : appLang === "english" ? "View step-by-step recipe & secrets →" : "Step-by-step recipe & chef secret dekhein →"}
                  </div>
                </div>
              ));
              })()}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: BIMARI PARHEZ & CLINICAL DOSSIERS                 */}
        {/* ======================================================== */}
        {activeTab === "health" && (
          <div className="tab-content-active">
            <div
              style={{
                background: isLight ? "#FFFFFF" : styles.cardBg,
                border: `1.5px solid ${styles.cardBorder}`,
                borderRadius: "16px",
                padding: "0.85rem",
                marginBottom: "0.85rem"
              }}
            >
              <span
                style={{
                  background: "rgba(239, 68, 68, 0.12)",
                  color: "#EF4444",
                  fontSize: "0.66rem",
                  fontWeight: 900,
                  padding: "0.15rem 0.5rem",
                  borderRadius: "6px"
                }}
              >
                {t.tab3.tag}
              </span>
              <h2 style={{ margin: "0.35rem 0 0.15rem", fontSize: "1.15rem", fontWeight: 900, color: styles.textPrimary }}>{t.tab3.title}</h2>
              <p style={{ margin: 0, fontSize: "0.74rem", color: styles.textSecondary, lineHeight: 1.4 }}>{t.tab3.desc}</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {getLocalizedHealthDossiers(appLang).map((hd) => (
                <div
                  key={hd.id}
                  style={{
                    background: isLight ? "#FFFFFF" : styles.cardBg,
                    border: `1.2px solid ${hd.color}40`,
                    borderRadius: "14px",
                    padding: "0.85rem",
                    boxShadow: isLight ? "0 2px 8px rgba(0,0,0,0.03)" : "0 4px 14px rgba(0,0,0,0.3)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                    <h3 style={{ margin: 0, fontSize: "0.98rem", fontWeight: 900, color: hd.color }}>
                      {hd.condition}
                    </h3>
                    <span style={{ fontSize: "0.68rem", fontWeight: 800, color: styles.textSecondary }}>
                      {hd.hindiName}
                    </span>
                  </div>

                  <p style={{ margin: "0 0 0.55rem", fontSize: "0.73rem", color: styles.textSecondary, lineHeight: 1.4 }}>
                    {hd.summary}
                  </p>

                  {/* Kya Khayein */}
                  <div
                    style={{
                      background: isLight ? "rgba(16, 185, 129, 0.08)" : "rgba(16, 185, 129, 0.12)",
                      border: "1px solid rgba(16, 185, 129, 0.25)",
                      borderRadius: "10px",
                      padding: "0.55rem",
                      marginBottom: "0.45rem"
                    }}
                  >
                    <div style={{ fontSize: "0.72rem", fontWeight: 900, color: styles.accentEmerald, marginBottom: "0.25rem" }}>
                      {t.labels.whatToEat}:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: "1.1rem", fontSize: "0.71rem", color: isLight ? "#1E293B" : "#E2E8F0", lineHeight: 1.45 }}>
                      {hd.kyaKhayein.map((k, i) => (
                        <li key={i}>{k}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Kya Bilkul Na Khayein */}
                  <div
                    style={{
                      background: isLight ? "rgba(239, 68, 68, 0.08)" : "rgba(239, 68, 68, 0.12)",
                      border: "1px solid rgba(239, 68, 68, 0.25)",
                      borderRadius: "10px",
                      padding: "0.55rem",
                      marginBottom: "0.45rem"
                    }}
                  >
                    <div style={{ fontSize: "0.72rem", fontWeight: 900, color: "#EF4444", marginBottom: "0.25rem" }}>
                      {t.labels.whatToAvoid}:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: "1.1rem", fontSize: "0.71rem", color: isLight ? "#1E293B" : "#E2E8F0", lineHeight: 1.45 }}>
                      {hd.kyaBilkoolNaKhayein.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Ayurvedic Aushadhi */}
                  <div
                    style={{
                      background: isLight ? "rgba(212, 175, 55, 0.1)" : "rgba(212, 175, 55, 0.12)",
                      border: "1px solid rgba(212, 175, 55, 0.3)",
                      borderRadius: "10px",
                      padding: "0.45rem 0.6rem",
                      fontSize: "0.71rem"
                    }}
                  >
                    <span style={{ fontWeight: 900, color: styles.accentGold }}>{t.labels.clinicalAdvice}: </span>
                    <span style={{ color: isLight ? "#1E293B" : "#FDE68A" }}>{hd.ayurvedicHerb}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: SMART GARUDA AI VOICE NUTRITIONIST & HEALTH COACH */}
        {/* ======================================================== */}
        {activeTab === "chat" && (
          <div
            className="tab-content-active"
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              height: "100%",
              minHeight: 0,
              overflow: "hidden"
            }}
          >
            {/* GARUDA AI Header Toolbar: Live Status & Auto-Voice Toggle */}
            <div
              style={{
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.2rem 0.1rem 0.35rem",
                marginBottom: "0.3rem",
                borderBottom: `1px solid ${styles.cardBorder}`
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <span style={{ fontSize: "0.68rem", fontWeight: 900, color: styles.accentGold }}>🦅</span>
                <span style={{ fontSize: "0.66rem", fontWeight: 800, color: styles.accentEmerald }}>
                  🟢 GARUDA IS LIVE
                </span>
              </div>

              {/* Auto Voice Switch */}
              <button
                onClick={() => {
                  const next = !autoVoice;
                  setAutoVoice(next);
                  localStorage.setItem("garuda_auto_voice", next.toString());
                  if (!next) stopSpeaking();
                  triggerToast(next ? `🔊 ${t.labels.autoVoice} ON` : `🔇 ${t.labels.autoVoice} OFF`);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  padding: "0.2rem 0.5rem",
                  borderRadius: "12px",
                  border: `1px solid ${styles.cardBorder}`,
                  background: autoVoice ? "rgba(16, 185, 129, 0.15)" : "rgba(148, 163, 184, 0.15)",
                  color: autoVoice ? "#10B981" : styles.textSecondary,
                  fontSize: "0.64rem",
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                {autoVoice ? `🔊 ${t.labels.autoVoice} ON` : `🔇 ${t.labels.autoVoice} OFF`}
              </button>
            </div>

            {/* Quick Prompt Chips (Touch Isolated & Horizontally Scrollable) */}
            <div
              data-scroll-isolated="true"
              style={{
                flexShrink: 0,
                display: "flex",
                gap: "0.35rem",
                overflowX: "auto",
                overflowY: "hidden",
                touchAction: "pan-x",
                overscrollBehaviorX: "contain",
                overscrollBehaviorY: "none",
                WebkitOverflowScrolling: "touch",
                scrollBehavior: "smooth",
                transform: "translateZ(0)",
                paddingBottom: "0.35rem",
                marginBottom: "0.35rem",
                scrollbarWidth: "none"
              }}
            >
              {(chatLang === "punjabi" ? [
                "ਸਵੇਰੇ ਖਾਲੀ ਪੇਟ ਕੀ ਪੀਣਾ ਸਭ ਤੋਂ ਵਧੀਆ ਹੈ?",
                "ਨਾਸ਼ਤੇ ਵਿੱਚ ਸਭ ਤੋਂ ਵੱਧ ਪ੍ਰੋਟੀਨ ਕੀ ਹੈ?",
                "ਪੇਸਟਰੀ ਖਾਣੀ ਹੈ ਪਰ ਢਿੱਡ ਦੀ ਚਰਬੀ ਵੀ ਘਟਾਉਣੀ ਹੈ",
                "ਚਾਹ ਦਾ ਸਿਹਤਮੰਦ ਦੇਸੀ ਵਿਕਲਪ ਕੀ ਹੈ?",
                "ਢਿੱਡ ਦੀ ਚਰਬੀ ਤੇ ਭਾਰ ਘਟਾਉਣ ਦਾ ਪਲਾਨ",
                "ਪਨੀਰ ਬਨਾਮ ਟੋਫੂ: ਫੈਟ ਲੌਸ ਲਈ ਕਿਹੜਾ ਬਿਹਤਰ?",
                "ਰੋਟੀ ਬਨਾਮ ਚੌਲ: ਸ਼ੂਗਰ ਦਾ ਅਸਲ ਸੱਚ",
                "ਫੈਟੀ ਲਿਵਰ ਠੀਕ ਕਰਨ ਦਾ ਦੇਸੀ ਤਰੀਕਾ"
              ] : chatLang === "hindi" ? [
                "सुबह खाली पेट क्या पीना सबसे बेस्ट है?",
                "नाश्ते में सबसे हाई-प्रोटीन नाश्ता क्या है?",
                "पेस्ट्री खानी है पर पेट की चर्बी भी कम करनी है",
                "चाय का हेल्दी देसी विकल्प क्या है?",
                "बेली फैट और वजन घटाने का प्लान",
                "पनीर vs टोफू: फैट लॉस के लिए कौन सा?",
                "रोटी vs चावल: ग्लाइसेमिक इंडेक्स का सच",
                "फैटी लिवर रिवर्स करने का देसी प्लान"
              ] : chatLang === "english" ? [
                "Best morning drink on empty stomach?",
                "Highest protein Indian breakfast?",
                "Craving pastry but want to lose belly fat",
                "Healthy alternative to morning tea?",
                "Sustainable belly fat loss protocol",
                "Paneer vs Tofu for fat loss?",
                "Roti vs Rice glycemic truth",
                "Fatty liver reversal protocol"
              ] : [
                "Subah khali pet kya pina sabse best hai?",
                "Breakfast me sabse healthy nashta kya hai?",
                "Pastry khani hai par belly fat kam karna hai",
                "Chai ka healthy Desi option kya hai?",
                "Belly Fat aur vajan kam karne ka plan",
                "Paneer vs Tofu: Weight loss ke liye konsa?",
                "Roti vs Chawal: Glycemic index ka sach",
                "Fatty liver reverse karne ka desi plan"
              ]).map((chip, cIdx) => (
                <button
                  key={cIdx}
                  onClick={() => handleSendMessage(chip)}
                  style={{
                    flexShrink: 0,
                    padding: "0.32rem 0.62rem",
                    borderRadius: "14px",
                    border: `1px solid ${styles.cardBorder}`,
                    background: isLight ? "#FFFFFF" : styles.cardBg,
                    color: styles.textPrimary,
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "transform 0.16s ease, opacity 0.16s ease"
                  }}
                >
                  ⚡ {chip}
                </button>
              ))}
            </div>

            {/* Chat Messages Log (Smoothly Scrollable Middle) */}
            <div
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                overflowX: "hidden",
                WebkitOverflowScrolling: "touch",
                scrollBehavior: "smooth",
                transform: "translateZ(0)",
                display: "flex",
                flexDirection: "column",
                gap: "0.65rem",
                padding: "0.2rem 0.1rem 0.5rem"
              }}
            >
              {messages.map((m) => (
                <div
                  key={m.id}
                  style={{
                    alignSelf: m.sender === "user" ? "flex-end" : "flex-start",
                    maxWidth: "88%",
                    background: m.sender === "user"
                      ? "linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)"
                      : isLight ? "#FFFFFF" : styles.cardBg,
                    color: m.sender === "user" ? "#0A130E" : styles.textPrimary,
                    border: m.sender === "user" ? "none" : `1.2px solid ${styles.cardBorder}`,
                    borderRadius: m.sender === "user" ? "16px 16px 2px 16px" : "16px 16px 16px 2px",
                    padding: "0.65rem 0.85rem",
                    fontSize: "0.76rem",
                    lineHeight: 1.5,
                    whiteSpace: "pre-line",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
                  }}
                >
                  {/* Message Sender Header */}
                  {m.sender === "bot" && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.35rem", paddingBottom: "0.25rem", borderBottom: "1px dashed rgba(212,175,55,0.25)" }}>
                      <span style={{ fontSize: "0.64rem", fontWeight: 800, color: styles.accentGold, display: "flex", alignItems: "center", gap: "0.2rem" }}>
                        🎙️ GARUDA AI Coach
                      </span>
                      <button
                        onClick={() => {
                          if (activeAudioMsgId === m.id && isSpeaking) {
                            stopSpeaking();
                          } else {
                            speakGaruda(m.spokenText || m.text, m.id);
                          }
                        }}
                        style={{
                          background: activeAudioMsgId === m.id && isSpeaking ? "#EF4444" : "rgba(212, 175, 55, 0.2)",
                          color: activeAudioMsgId === m.id && isSpeaking ? "#FFFFFF" : (isLight ? "#B8860B" : "#D4AF37"),
                          border: "none",
                          borderRadius: "10px",
                          padding: "0.2rem 0.5rem",
                          fontSize: "0.64rem",
                          fontWeight: 900,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.22rem"
                        }}
                      >
                        {activeAudioMsgId === m.id && isSpeaking ? `⏹️ ${t.labels.stop}` : `🔊 ${t.labels.listen}`}
                      </button>
                    </div>
                  )}

                  {/* Message Body Content */}
                  <div>{m.text}</div>

                  {/* Interactive Follow-Up Suggestion Pills */}
                  {m.sender === "bot" && m.followUps && m.followUps.length > 0 && (
                    <div style={{ marginTop: "0.45rem", paddingTop: "0.35rem", borderTop: "1px dashed rgba(212,175,55,0.2)", display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                      {m.followUps.map((fu, fIdx) => (
                        <button
                          key={fIdx}
                          onClick={() => handleSendMessage(fu)}
                          style={{
                            background: isLight ? "#F1F5F9" : "#16271E",
                            color: isLight ? "#0F172A" : "#E2E8F0",
                            border: `1px solid ${styles.cardBorder}`,
                            borderRadius: "10px",
                            padding: "0.22rem 0.48rem",
                            fontSize: "0.64rem",
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                        >
                          💡 {fu}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {isTyping && (
                <div
                  style={{
                    alignSelf: "flex-start",
                    background: isLight ? "#FFFFFF" : styles.cardBg,
                    border: `1px solid ${styles.cardBorder}`,
                    borderRadius: "14px",
                    padding: "0.5rem 0.8rem",
                    fontSize: "0.72rem",
                    color: styles.textSecondary
                  }}
                >
                  🎙️ GARUDA Clinical Intelligence analyze kar raha hai... 🌿
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Active Voice Listening Banner */}
            {isListening && (
              <div
                style={{
                  flexShrink: 0,
                  marginBottom: "0.3rem",
                  padding: "0.38rem 0.75rem",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
                  color: "#FFFFFF",
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow: "0 4px 12px rgba(239, 68, 68, 0.35)"
                }}
              >
                <span>🎙️ GARUDA sun raha hai... boliye!</span>
                <button
                  onClick={toggleListening}
                  style={{
                    background: "rgba(255,255,255,0.25)",
                    border: "none",
                    color: "#fff",
                    borderRadius: "8px",
                    padding: "0.2rem 0.5rem",
                    fontSize: "0.65rem",
                    fontWeight: 800,
                    cursor: "pointer"
                  }}
                >
                  ⏹️ Done
                </button>
              </div>
            )}

            {/* Active Voice Speaking Banner */}
            {isSpeaking && (
              <div
                style={{
                  flexShrink: 0,
                  marginBottom: "0.3rem",
                  padding: "0.38rem 0.75rem",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                  color: "#FFFFFF",
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.35)"
                }}
              >
                <span>🔊 GARUDA bol raha hai...</span>
                <button
                  onClick={stopSpeaking}
                  style={{
                    background: "rgba(255,255,255,0.25)",
                    border: "none",
                    color: "#fff",
                    borderRadius: "8px",
                    padding: "0.2rem 0.5rem",
                    fontSize: "0.65rem",
                    fontWeight: 800,
                    cursor: "pointer"
                  }}
                >
                  ⏹️ Rokein
                </button>
              </div>
            )}

            {/* Chat Input Bar (Cleanly Floating Above Bottom Nav with Mic) */}
            <div
              style={{
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                marginBottom: "calc(64px + env(safe-area-inset-bottom, 0px))",
                background: styles.cardBg,
                padding: "0.38rem",
                borderRadius: "14px",
                border: `1.5px solid ${styles.cardBorder}`,
                boxShadow: "0 -2px 10px rgba(0,0,0,0.06)"
              }}
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder={t.chat.placeholder}
                style={{
                  flex: 1,
                  background: styles.inputBg,
                  color: styles.inputText,
                  border: "1px solid #CBD5E1",
                  borderRadius: "10px",
                  padding: "0.55rem 0.75rem",
                  fontSize: "0.76rem",
                  fontWeight: 700,
                  outline: "none"
                }}
              />

              {/* Mic Input Button */}
              <button
                onClick={toggleListening}
                title="Mic se bol kar sawal puchiye"
                style={{
                  background: isListening
                    ? "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)"
                    : "linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "10px",
                  padding: "0.55rem 0.75rem",
                  fontSize: "0.85rem",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: isListening ? "0 0 12px rgba(239,68,68,0.6)" : "none"
                }}
              >
                🎙️
              </button>

              {/* Send Button */}
              <button
                onClick={() => handleSendMessage()}
                style={{
                  background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "10px",
                  padding: "0.55rem 0.85rem",
                  fontSize: "0.76rem",
                  fontWeight: 900,
                  cursor: "pointer"
                }}
              >
                {t.labels.ask}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* 📱 FIXED FROSTED GLASS BOTTOM NAVIGATION BAR            */}
      {/* ======================================================== */}
      <nav
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          maxWidth: "500px",
          margin: "0 auto",
          background: styles.navBg,
          backdropFilter: "blur(20px)",
          borderTop: `1.5px solid ${styles.navBorder}`,
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          paddingTop: "0.45rem",
          paddingLeft: "0.2rem",
          paddingRight: "0.2rem",
          paddingBottom: "calc(0.45rem + env(safe-area-inset-bottom, 0px))",
          zIndex: 50,
          boxShadow: "0 -4px 20px rgba(0,0,0,0.15)"
        }}
      >
        {[
          { id: "calendar", label: t.tabs.calendar, icon: "📅" },
          { id: "recipes", label: t.tabs.recipes, icon: "🍲" },
          { id: "health", label: t.tabs.health, icon: "🩺" },
          { id: "chat", label: t.tabs.chat, icon: "💬" }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: "transparent",
                border: "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.15rem",
                cursor: "pointer",
                padding: "0.2rem 0.5rem",
                position: "relative"
              }}
            >
              <span style={{ fontSize: isActive ? "1.25rem" : "1.1rem", transition: "transform 0.15s ease" }}>
                {tab.icon}
              </span>
              <span
                style={{
                  fontSize: "0.64rem",
                  fontWeight: isActive ? 900 : 700,
                  color: isActive ? styles.accentGold : styles.textSecondary,
                  letterSpacing: "-0.01em"
                }}
              >
                {tab.label}
              </span>
              {isActive && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "-3px",
                    width: "18px",
                    height: "3px",
                    background: "linear-gradient(90deg, #D4AF37 0%, #F3E5AB 100%)",
                    borderRadius: "2px",
                    boxShadow: "0 0 8px rgba(212, 175, 55, 0.8)"
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* ======================================================== */}
      {/* 👤 FIRST-TIME ONBOARDING & PROFILE MODAL                */}
      {/* ======================================================== */}
      {showProfileModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(10px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "1rem",
            zIndex: 100
          }}
        >
          <div
            style={{
              background: styles.cardBg,
              border: `2px solid ${styles.accentGold}`,
              borderRadius: "20px",
              padding: "1.1rem",
              width: "100%",
              maxWidth: "460px",
              maxHeight: "90vh",
              overflowY: "auto",
              touchAction: "pan-y",
              overscrollBehavior: "contain",
              WebkitOverflowScrolling: "touch",
              scrollBehavior: "smooth",
              transform: "translateZ(0)",
              boxShadow: "0 10px 40px rgba(0,0,0,0.6)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ fontSize: "1.2rem" }}>🌿</span>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 900, color: styles.accentGold }}>
                  {appLang === "punjabi" ? "ਸਿਹਤ ਪ੍ਰੋਫਾਈਲ ਤੇ ਬਿਮਾਰੀ ਜਾਣਕਾਰੀ" : appLang === "hindi" ? "स्वास्थ्य प्रोफ़ाइल व बीमारी विवरण" : appLang === "english" ? "Wellness Profile & Health Intake" : "Wellness Profile & Bimari Intake"}
                </h3>
              </div>
              {profile.completed && (
                <button
                  onClick={() => setShowProfileModal(false)}
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    border: "none",
                    borderRadius: "50%",
                    width: "28px",
                    height: "28px",
                    color: styles.textPrimary,
                    cursor: "pointer",
                    fontWeight: 900
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            <p style={{ margin: "0 0 0.85rem", fontSize: "0.74rem", color: styles.textSecondary, lineHeight: 1.4 }}>
              {appLang === "punjabi" ? "ਗਰੁੜ ਤੁਹਾਡੀ ਸਹੀ ਜਾਣਕਾਰੀ, ਖਾਣ-ਪੀਣ ਦੀ ਪਸੰਦ ਅਤੇ ਸਿਹਤ ਟੀਚੇ ਅਨੁਸਾਰ ਤਿਆਰ ਕਰਦਾ ਹੈ ਤੁਹਾਡਾ ਨਿੱਜੀ ਪਲਾਨ:" : appLang === "hindi" ? "गरुड़ आपकी शारीरिक स्थिति, खान-पान की पसंद और बीमारी के अनुसार पर्सनलाइज्ड ब्लूप्रिंट तैयार करता है:" : appLang === "english" ? "GARUDA creates a personalized clinical blueprint based on your exact body data, dietary preference, and health goals:" : "GARUDA AAHAR bina aapka naam aur health goal jaane generic gyan nahi deta. Apni accurate information bhariye taaki system customized blueprint serve kare:"}
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const selectedConditions = formData.getAll("conditions");
                const newProf = {
                  name: formData.get("name")?.trim() || "Guest",
                  goal: formData.get("goal"),
                  conditions: selectedConditions,
                  diet: formData.get("diet"),
                  completed: true
                };
                handleSaveProfile(newProf);
              }}
              style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
            >
              {/* Field 1: Name */}
              <div>
                <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 800, color: styles.textPrimary, marginBottom: "0.25rem" }}>
                  {appLang === "punjabi" ? "1. ਤੁਹਾਡਾ ਸ਼ੁਭ ਨਾਮ:" : appLang === "hindi" ? "1. आपका शुभ नाम:" : appLang === "english" ? "1. Your Full Name:" : "1. Aapka Shubh Naam:"}
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={profile.name}
                  placeholder={appLang === "punjabi" ? "ਜਿਵੇਂ: ਪ੍ਰਵੀਨ ਮਹਾਵਰ, ਅਮਿਤ ਸ਼ਰਮਾ, ਆਦਿ" : appLang === "hindi" ? "जैसे: प्रवीण महावर, अमित शर्मा, आदि" : appLang === "english" ? "e.g. Praveen Mahawar, Amit Sharma, etc." : "Jaise: Praveen Mahawar, Amit Sharma, etc."}
                  required
                  style={{
                    width: "100%",
                    background: styles.inputBg,
                    color: styles.inputText,
                    border: "1.5px solid #CBD5E1",
                    borderRadius: "10px",
                    padding: "0.55rem 0.75rem",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    outline: "none"
                  }}
                />
              </div>

              {/* Field 2: Health Goal */}
              <div>
                <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 800, color: styles.textPrimary, marginBottom: "0.25rem" }}>
                  {appLang === "punjabi" ? "2. ਤੁਹਾਡਾ ਮੁੱਖ ਸਿਹਤ ਟੀਚਾ:" : appLang === "hindi" ? "2. आपका मुख्य स्वास्थ्य लक्ष्य:" : appLang === "english" ? "2. Primary Health Goal:" : "2. Aapka Primary Health Goal:"}
                </label>
                <select
                  name="goal"
                  defaultValue={profile.goal}
                  style={{
                    width: "100%",
                    background: styles.inputBg,
                    color: styles.inputText,
                    border: "1.5px solid #CBD5E1",
                    borderRadius: "10px",
                    padding: "0.55rem 0.75rem",
                    fontSize: "0.76rem",
                    fontWeight: 700
                  }}
                >
                  <option value="weight_loss">{appLang === "punjabi" ? "⚖️ ਭਾਰ ਘਟਾਉਣਾ ਤੇ ਢਿੱਡ ਦੀ ਚਰਬੀ (ਫੈਟ ਲੌਸ)" : appLang === "hindi" ? "⚖️ वजन घटाना व पेट की चर्बी कम करना (फैट बर्न)" : appLang === "english" ? "⚖️ Weight Loss & Belly Fat Reduction" : "⚖️ Weight Loss & Belly Fat Reduction (Fat Burn)"}</option>
                  <option value="muscle_gain">{appLang === "punjabi" ? "💪 ਮਸਲ ਗੇਨ ਤੇ ਹਾਈ-ਪ੍ਰੋਟੀਨ ਤਾਕਤ" : appLang === "hindi" ? "💪 लीन मसल गेन व हाई-प्रोटीन ताकत" : appLang === "english" ? "💪 Lean Muscle Gain & Strength" : "💪 Lean Muscle Gain & High Protein Strength"}</option>
                  <option value="disease_reversal">{appLang === "punjabi" ? "🩺 ਬਿਮਾਰੀ ਪਰਹੇਜ਼ ਤੇ ਇਲਾਜ (ਸ਼ੂਗਰ, ਬੀਪੀ, ਲਿਵਰ)" : appLang === "hindi" ? "🩺 बीमारी रिवर्सल (शुगर, हाई बीपी, यूरिक एसिड, लिवर)" : appLang === "english" ? "🩺 Clinical Reversal (Sugar, BP, Uric Acid, Liver)" : "🩺 Bimari Reversal (Sugar, High BP, Uric Acid, Liver)"}</option>
                  <option value="sattvic_energy">{appLang === "punjabi" ? "🧘 ਸਾਤਵਿਕ ਰੋਜ਼ਾਨਾ ਊਰਜਾ ਤੇ ਪੇਟ ਦੀ ਸਿਹਤ" : appLang === "hindi" ? "🧘 सात्विक दैनिक ऊर्जा, गट हेल्थ व मानसिक शांति" : appLang === "english" ? "🧘 Sattvic Daily Energy, Gut Health & Focus" : "🧘 Sattvic Daily Energy, Gut Health & Mental Focus"}</option>
                </select>
              </div>

              {/* Field 3: Health Conditions / Bimari */}
              <div>
                <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 800, color: styles.textPrimary, marginBottom: "0.25rem" }}>
                  {appLang === "punjabi" ? "3. ਕੋਈ ਬਿਮਾਰੀ ਜਾਂ ਸਮੱਸਿਆ? (ਚੁਣੋ):" : appLang === "hindi" ? "3. कोई बीमारी या स्वास्थ्य समस्या? (चुनें):" : appLang === "english" ? "3. Any Health Condition / Concern? (Select all that apply):" : "3. Koi Bimari ya Health Concern? (Select karein):"}
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.4rem",
                    background: isLight ? "#F8FAFC" : "rgba(255,255,255,0.03)",
                    padding: "0.6rem",
                    borderRadius: "10px",
                    fontSize: "0.72rem"
                  }}
                >
                  {[
                    { id: "Sugar/Diabetes", label: appLang === "punjabi" ? "ਸ਼ੂਗਰ (ਡਾਇਬਟੀਜ਼)" : appLang === "hindi" ? "डायबिटीज (शुगर)" : appLang === "english" ? "Diabetes (Sugar)" : "Diabetes (Sugar)" },
                    { id: "High BP", label: appLang === "punjabi" ? "ਹਾਈ ਬਲੱਡ ਪ੍ਰੈਸ਼ਰ (ਬੀਪੀ)" : appLang === "hindi" ? "हाई ब्लड प्रेशर (बीपी)" : appLang === "english" ? "High Blood Pressure" : "High Blood Pressure" },
                    { id: "Fatty Liver", label: appLang === "punjabi" ? "ਫੈਟੀ ਲਿਵਰ / ਗੈਸ" : appLang === "hindi" ? "फैटी लिवर / गैस" : appLang === "english" ? "Fatty Liver / Gas" : "Fatty Liver / Gas" },
                    { id: "High Uric Acid", label: appLang === "punjabi" ? "ਯੂਰਿਕ ਐਸਿਡ / ਗਠੀਆ" : appLang === "hindi" ? "यूरिक एसिड / गठिया" : appLang === "english" ? "Uric Acid / Gout" : "Uric Acid / Gout" },
                    { id: "Thyroid", label: appLang === "punjabi" ? "ਥਾਇਰਾਇਡ ਸਮੱਸਿਆ" : appLang === "hindi" ? "थायरॉयड समस्या" : appLang === "english" ? "Thyroid Issue" : "Thyroid Issue" },
                    { id: "Acid Reflux", label: appLang === "punjabi" ? "ਤੇਜ਼ ਐਸੀਡਿਟੀ / ਜਲਣ" : appLang === "hindi" ? "गंभीर एसिडिटी / जीईआरडी" : appLang === "english" ? "Severe Acidity / GERD" : "Severe Acidity / GERD" },
                    { id: "PCOD/PCOS", label: appLang === "punjabi" ? "ਪੀਸੀਓਡੀ / ਹਾਰਮੋਨ ਸਮੱਸਿਆ" : appLang === "hindi" ? "पीसीओडी / हार्मोनल असंतुलन" : appLang === "english" ? "PCOD / Hormonal Imbalance" : "PCOD / Hormonal" },
                    { id: "None", label: appLang === "punjabi" ? "ਬਿਲਕੁਲ ਫਿੱਟ (ਕੋਈ ਬਿਮਾਰੀ ਨਹੀਂ)" : appLang === "hindi" ? "बिल्कुल फिट (कोई बीमारी नहीं)" : appLang === "english" ? "Bilkul Fit (No Disease)" : "Bilkul Fit (No Disease)" }
                  ].map((item) => (
                    <label key={item.id} style={{ display: "flex", alignItems: "center", gap: "0.3rem", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        name="conditions"
                        value={item.id}
                        defaultChecked={profile.conditions?.includes(item.id)}
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Field 4: Diet Preference */}
              <div>
                <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 800, color: styles.textPrimary, marginBottom: "0.25rem" }}>
                  {appLang === "punjabi" ? "4. ਖਾਣ-ਪੀਣ ਦੀ ਪਸੰਦ:" : appLang === "hindi" ? "4. खान-पान की प्राथमिकता:" : appLang === "english" ? "4. Dietary Preference:" : "4. Khane Peene Ki Preference:"}
                </label>
                <select
                  name="diet"
                  defaultValue={profile.diet || "veg"}
                  style={{
                    width: "100%",
                    background: styles.inputBg,
                    color: styles.inputText,
                    border: "1.5px solid #CBD5E1",
                    borderRadius: "10px",
                    padding: "0.55rem 0.75rem",
                    fontSize: "0.76rem",
                    fontWeight: 700
                  }}
                >
                  <option value="veg">{appLang === "punjabi" ? "🟢 ਸ਼ੁੱਧ ਸ਼ਾਕਾਹਾਰੀ (ਦੇਸੀ ਖੁਰਾਕ)" : appLang === "hindi" ? "🟢 शुद्ध शाकाहारी (देसी शाकाहार)" : appLang === "english" ? "🟢 Pure Vegetarian (Desi Shakahari)" : "🟢 Pure Vegetarian (Desi Shakahari)"}</option>
                  <option value="sattvic">{appLang === "punjabi" ? "🧘 ਸਾਤਵਿਕ (ਬਿਨਾਂ ਪਿਆਜ਼ / ਲਸਣ)" : appLang === "hindi" ? "🧘 सात्विक (शून्य प्याज / लहसुन)" : appLang === "english" ? "🧘 Sattvic (Zero Onion / Garlic)" : "🧘 Sattvic (Bina Pyaaz / Lehsun)"}</option>
                  <option value="jain">{appLang === "punjabi" ? "🌾 ਜੈਨ ਮਰਯਾਦਾ (ਜ਼ੀਰੋ ਕੰਦਮੂਲ)" : appLang === "hindi" ? "🌾 जैन आहार मर्यादा (कंदमूल-रहित)" : appLang === "english" ? "🌾 Jain Dietary Standard (Zero Root Veggies)" : "🌾 Jain Dietary Standard"}</option>
                  <option value="vegan">{appLang === "punjabi" ? "🥗 100% ਪਲਾਂਟ-ਬੇਸਡ ਵੀਗਨ (ਡੇਅਰੀ-ਮੁਕਤ)" : appLang === "hindi" ? "🥗 100% प्लांट-बेस्ड वीगन (डेयरी-मुक्त)" : appLang === "english" ? "🥗 100% Plant-Based Vegan (Zero Dairy)" : "🥗 100% Plant-Based Vegan"}</option>
                  <option value="egg">{appLang === "punjabi" ? "🥚 ਆਂਡਾ ਸ਼ਾਕਾਹਾਰੀ (ਆਂਡਾ ਅਲਾਓਡ, ਮੀਟ ਨਹੀਂ)" : appLang === "hindi" ? "🥚 एगेटेरियन (शाकाहारी + अंडा)" : appLang === "english" ? "🥚 Eggetarian (Vegetarian + Farm Eggs)" : "🥚 Eggetarian (Shakahari + Anda)"}</option>
                  <option value="non_veg">{appLang === "punjabi" ? "🍗 ਮੀਟ, ਚਿਕਨ, ਫਿਸ਼ ਤੇ ਆਂਡੇ (ਹਾਈ ਪ੍ਰੋਟੀਨ)" : appLang === "hindi" ? "🍗 मांसाहारी (चिकन, मछली व अंडा • हाई प्रोटीन)" : appLang === "english" ? "🍗 Non-Vegetarian (Chicken, Fish & Eggs • High Protein)" : "🍗 Non-Vegetarian (Chicken, Fish & Eggs • High Protein)"}</option>
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                style={{
                  marginTop: "0.4rem",
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)",
                  color: "#0A130E",
                  border: "none",
                  fontWeight: 900,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(212, 175, 55, 0.4)"
                }}
              >
                {appLang === "punjabi" ? "ਮੇਰਾ ਪਰਸਨਲਾਈਜ਼ਡ ਡਾਈਟ ਪਲਾਨ ਖੋਲ੍ਹੋ 🚀" : appLang === "hindi" ? "मेरा पर्सनलाइज्ड डाइट प्लान खोलें 🚀" : appLang === "english" ? "Unlock My Personalized Diet Plan 🚀" : "Mera Personalized Diet Plan Kholiye 🚀"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 🍲 RECIPE DETAIL MODAL                                  */}
      {/* ======================================================== */}
      {selectedRecipe && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(12px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "1rem",
            zIndex: 100
          }}
        >
          <div
            style={{
              background: styles.cardBg,
              border: `2px solid ${styles.accentGold}`,
              borderRadius: "20px",
              padding: "1.1rem",
              width: "100%",
              maxWidth: "460px",
              maxHeight: "90vh",
              overflowY: "auto",
              touchAction: "pan-y",
              overscrollBehavior: "contain",
              WebkitOverflowScrolling: "touch",
              scrollBehavior: "smooth",
              transform: "translateZ(0)",
              boxShadow: "0 10px 40px rgba(0,0,0,0.6)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.6rem" }}>
              <div>
                <span
                  style={{
                    background: "rgba(212, 175, 55, 0.15)",
                    color: styles.accentGold,
                    fontSize: "0.64rem",
                    fontWeight: 900,
                    padding: "0.15rem 0.5rem",
                    borderRadius: "6px"
                  }}
                >
                  {appLang === "punjabi" ? (selectedRecipe.category_pa || selectedRecipe.category) : appLang === "hindi" ? (selectedRecipe.category_hi || selectedRecipe.category) : appLang === "english" ? (selectedRecipe.category_en || selectedRecipe.category) : selectedRecipe.category}
                </span>
                <h3 style={{ margin: "0.35rem 0 0", fontSize: "1.15rem", fontWeight: 900, color: styles.textPrimary }}>
                  {appLang === "punjabi" ? (selectedRecipe.name_pa || selectedRecipe.name) : appLang === "hindi" ? (selectedRecipe.name_hi || selectedRecipe.name) : appLang === "english" ? (selectedRecipe.name_en || selectedRecipe.name) : selectedRecipe.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRecipe(null)}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "none",
                  borderRadius: "50%",
                  width: "30px",
                  height: "30px",
                  color: styles.textPrimary,
                  cursor: "pointer",
                  fontWeight: 900
                }}
              >
                ✕
              </button>
            </div>

            {/* Macros */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "0.45rem",
                background: isLight ? "#F8FAFC" : "rgba(255,255,255,0.04)",
                padding: "0.65rem",
                borderRadius: "12px",
                border: "1px solid rgba(212, 175, 55, 0.2)",
                marginBottom: "0.75rem",
                fontSize: "0.74rem"
              }}
            >
              <div>🔥 Calories: <strong style={{ color: "#F59E0B" }}>{selectedRecipe.calories} kcal</strong></div>
              <div>🥩 Protein: <strong style={{ color: styles.accentEmerald }}>{selectedRecipe.protein}</strong></div>
              <div>🌾 Fiber: <strong style={{ color: "#38BDF8" }}>{selectedRecipe.fiber}</strong></div>
            </div>

            {/* Ingredients */}
            <div style={{ marginBottom: "0.75rem" }}>
              <div style={{ fontSize: "0.76rem", fontWeight: 900, color: styles.accentGold, marginBottom: "0.3rem" }}>
                🛒 Ingredients (Samagri):
              </div>
              <ul style={{ margin: 0, paddingLeft: "1.1rem", fontSize: "0.73rem", color: styles.textSecondary, lineHeight: 1.5 }}>
                {selectedRecipe.ingredients.map((ing, i) => (
                  <li key={i}>{ing}</li>
                ))}
              </ul>
            </div>

            {/* Cooking Timeline */}
            <div style={{ marginBottom: "0.75rem" }}>
              <div style={{ fontSize: "0.76rem", fontWeight: 900, color: styles.accentGold, marginBottom: "0.3rem" }}>
                ⏱ Step-by-Step Cooking:
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                {selectedRecipe.timeline.map((step, sIdx) => (
                  <div
                    key={sIdx}
                    style={{
                      background: isLight ? "#F1F5F9" : "rgba(255,255,255,0.03)",
                      padding: "0.45rem 0.6rem",
                      borderRadius: "8px",
                      fontSize: "0.72rem",
                      color: isLight ? "#1E293B" : "#E2E8F0"
                    }}
                  >
                    {step}
                  </div>
                ))}
              </div>
            </div>

            {/* Chef Secret */}
            <div
              style={{
                background: isLight ? "rgba(245, 158, 11, 0.08)" : "rgba(245, 158, 11, 0.12)",
                border: "1px solid rgba(245, 158, 11, 0.25)",
                borderRadius: "12px",
                padding: "0.65rem",
                marginBottom: "0.85rem",
                fontSize: "0.73rem",
                lineHeight: 1.45
              }}
            >
              <div style={{ fontWeight: 900, color: "#F59E0B", marginBottom: "0.2rem" }}>
                ✨ Swaad & Khushboo Ka Secret:
              </div>
              <div style={{ color: isLight ? "#1E293B" : "#FDE68A" }}>{selectedRecipe.chefSecret}</div>
            </div>

            <button
              onClick={() => setSelectedRecipe(null)}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)",
                color: "#0A130E",
                border: "none",
                fontWeight: 900,
                fontSize: "0.82rem",
                cursor: "pointer"
              }}
            >
              Close Recipe
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
