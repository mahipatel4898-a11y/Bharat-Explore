const { GoogleGenerativeAI } = require("@google/generative-ai");
const repo = require('../repositories/travelRepository');
require('dotenv').config();

const ASSISTANT_NAME = 'Bharat AI Guide';
const MODEL_NAME = process.env.AI_MODEL || 'gemini-2.5-flash';
const API_KEY = process.env.GEMINI_API_KEY;
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

const getModel = (options = {}) => {
  if (!genAI) {
    throw new Error('AI service is not configured');
  }

  return genAI.getGenerativeModel({
    model: MODEL_NAME,
    ...options,
  });
};

const sanitizeAssistantText = (value) => {
  let text = String(value || '').trim();
  if (!text) {
    return `${ASSISTANT_NAME} is ready to help. Please share your question, destination, budget, or goal, and I will give you a practical next step.`;
  }

  text = text.replace(/\bas an? (?:ai|language) model\b/gi, `as ${ASSISTANT_NAME}`);
  text = text.replace(/\b(?:Gemini|Google(?: AI)?|OpenAI|ChatGPT|Claude|Anthropic|Mistral|Meta AI|Perplexity)\b/gi, ASSISTANT_NAME);
  text = text.replace(/\bexternal ai provider\b/gi, ASSISTANT_NAME);
  return text;
};

const safeList = (items, mapper, limit = 5) =>
  items.slice(0, limit).map(mapper).filter(Boolean).join('; ');

const findMentionedCity = (message, memory = {}) => {
  const lowerMessage = String(message || '').toLowerCase();
  const cities = repo.getCities();
  const memoryDestination = String(memory.destination || memory.preferredDestination || '').toLowerCase();

  return cities.find((city) =>
    lowerMessage.includes(city.name.toLowerCase()) ||
    (memoryDestination && city.name.toLowerCase() === memoryDestination)
  );
};

const formatMemory = (memory = {}) => {
  const entries = [];
  if (memory.location) entries.push(`home/base location: ${memory.location}`);
  if (memory.destination) entries.push(`preferred destination: ${memory.destination}`);
  if (memory.budget) entries.push(`budget preference: ${memory.budget}`);
  if (memory.duration) entries.push(`trip duration preference: ${memory.duration}`);
  if (memory.travelStyle) entries.push(`travel style: ${memory.travelStyle}`);
  if (Array.isArray(memory.interests) && memory.interests.length) {
    entries.push(`interests: ${memory.interests.join(', ')}`);
  }

  return entries.length ? entries.join('; ') : 'No saved user preferences yet.';
};

const buildTravelContext = (message, memory = {}) => {
  try {
    const cities = repo.getCities();
    const counts = repo.counts();
    const mentionedCity = findMentionedCity(message, memory);
    const citySummary = safeList(
      cities,
      (city) => `${city.name}, ${city.state} (best season: ${city.bestSeason || 'varies'}, avg budget/day: Rs ${Number(city.avgBudget || 0).toLocaleString('en-IN')})`,
      18
    );

    const sections = [
      `Bharat Explorer catalog currently has ${counts.cities} cities, ${counts.places} places, ${counts.hotels} hotels, and ${counts.foods} food items.`,
      `Available city context: ${citySummary}.`,
    ];

    if (mentionedCity) {
      const cityId = mentionedCity.id;
      const places = repo.getPlaces({ city: cityId });
      const hotels = repo.getHotels({ city: cityId });
      const foods = repo.getFoods({ city: cityId });

      sections.push(
        `Focused destination: ${mentionedCity.name}, ${mentionedCity.state}. ${mentionedCity.description || ''}`,
        `Top places: ${safeList(places, (place) => `${place.name} (${place.type}, rating ${place.rating}, entry Rs ${place.entryFee || 0}, time ${place.visitingTime || 'check locally'})`, 6) || 'No listed places yet.'}`,
        `Recommended hotels: ${safeList(hotels, (hotel) => `${hotel.name} (${hotel.category}, Rs ${Number(hotel.pricePerNight || 0).toLocaleString('en-IN')}/night, rating ${hotel.rating})`, 5) || 'No listed hotels yet.'}`,
        `Food suggestions: ${safeList(foods, (food) => `${food.dishName} at ${food.restaurantName || 'a local restaurant'} (${food.priceRange || 'price varies'}, rating ${food.rating})`, 5) || 'No listed food items yet.'}`
      );
    }

    return sections.join('\n');
  } catch (error) {
    return 'Bharat Explorer catalog context is temporarily unavailable. Use general travel expertise and ask for details when useful.';
  }
};

const buildSystemInstruction = ({ message, memory }) => `
You are ${ASSISTANT_NAME}, the intelligent assistant inside Bharat Explorer.

Identity rules:
- Your name is always ${ASSISTANT_NAME}.
- Never mention Gemini, Google, or any external AI provider in any response.
- If asked what powers you, say you are ${ASSISTANT_NAME}, built into Bharat Explorer to help with travel, bookings, knowledge, and planning.
- Do not say "as an AI model"; speak directly as ${ASSISTANT_NAME}.

Response behavior:
- Answer any safe user question: travel, hotels, bookings, coding, technology, planning, education, and general knowledge.
- Give complete, detailed, helpful answers. Avoid one-line or incomplete replies.
- Make answers complete within the available space. Hard limit: keep normal answers under 900 words unless the user explicitly asks for a long report.
- For itinerary and travel-planning answers, use a compact concierge format: overview, budget, day-wise plan, food/stay suggestions, booking checklist, and next step.
- Use short paragraphs and tight bullets. Do not over-explain obvious background if it risks cutting off the practical answer.
- Always finish the thought cleanly with a short next-step, checklist, or summary instead of trailing off.
- When the user asks for travel help, act like a smart AI concierge: suggest destinations, hotels, food, timing, budgets, routes, booking checks, and practical next steps.
- When the user asks a non-travel question, answer it clearly and fully, then add practical examples or next steps when useful.
- If details are missing, make reasonable assumptions, state them briefly, and continue with useful guidance.
- If information may vary by date, location, availability, or price, say it should be verified before booking or acting.
- Use a friendly, smart, slightly premium tone. Structure complex answers with short headings and bullets.

Safety rules:
- Do not provide instructions for harm, illegal activity, weapons, malware, credential theft, fraud, evading law enforcement, or dangerous self-harm.
- For unsafe requests, politely decline the harmful part and offer a safe alternative, prevention guidance, or emergency/support direction.
- For medical, legal, or financial topics, provide general guidance and recommend checking with a qualified professional for decisions.

User memory:
${formatMemory(memory)}

Site travel context:
${buildTravelContext(message, memory)}
`;

const normalizeHistory = (history = []) => {
  if (!Array.isArray(history)) return [];

  const clean = history
    .filter((item) => item && ['user', 'model'].includes(item.role) && Array.isArray(item.parts))
    .map((item) => ({
      role: item.role,
      parts: [{
        text: String(item.parts.map((part) => part?.text || '').join('\n')).slice(0, 2500),
      }],
    }))
    .filter((item) => item.parts[0].text.trim());

  while (clean.length && clean[0].role !== 'user') clean.shift();
  while (clean.length && clean[clean.length - 1].role !== 'model') clean.pop();

  const normalized = [];
  clean.forEach((item) => {
    const last = normalized[normalized.length - 1];
    if (last?.role === item.role) {
      last.parts[0].text = `${last.parts[0].text}\n${item.parts[0].text}`.slice(0, 2500);
    } else {
      normalized.push(item);
    }
  });

  return normalized.slice(-10);
};

const getSafetyReply = (message) => {
  const text = String(message || '').toLowerCase();
  const unsafePatterns = [
    /\b(build|make|create|assemble|manufacture).{0,40}\b(bomb|explosive|weapon|gun|silencer)\b/,
    /\b(hack into|steal password|bypass login|phishing|keylogger|malware|ransomware|ddos)\b/,
    /\b(credit card fraud|fake id|forge|money laundering|evade police|hide evidence)\b/,
    /\b(how to kill|poison someone|hurt someone|dispose of a body)\b/,
  ];

  if (!unsafePatterns.some((pattern) => pattern.test(text))) return null;

  return `${ASSISTANT_NAME} cannot help with instructions that could harm people, break the law, or compromise someone else's privacy or security.

What I can do instead:
- Explain the safety risks in plain language.
- Help with legal, defensive, or educational alternatives.
- For cybersecurity, I can help you secure accounts, write safer code, understand common attacks at a high level, or build a responsible testing checklist.
- For travel safety, I can help plan safer routes, emergency preparation, local etiquette, and risk-aware booking choices.`;
};

const buildFallbackReply = (message, memory = {}) => {
  const lowerMsg = String(message || '').toLowerCase();
  const cities = repo.getCities();
  const mentionedCity = findMentionedCity(message, memory);

  if (/\b(who are you|your name|what can you do|help me with|capabilities|what powers you)\b/.test(lowerMsg)) {
    return `${ASSISTANT_NAME}

I am ${ASSISTANT_NAME}, the smart assistant built into Bharat Explorer. I help like a travel concierge and a general knowledge assistant in one place.

What I can help with:
- Travel planning: destinations, day-wise itineraries, budgets, routes, best seasons, local tips, and packing guidance.
- Hotels and bookings: hotel shortlists, stay-area advice, budget checks, cancellation-policy reminders, and booking preparation.
- Food and experiences: must-try dishes, restaurant ideas, cultural spots, family-friendly options, luxury experiences, and hidden gems.
- General knowledge: clear explanations, study help, comparisons, summaries, and practical decision-making.
- Technology and coding: debugging direction, API planning, frontend/backend guidance, and step-by-step implementation advice.

How to get the best answer:
Tell me your destination, dates, budget, number of travelers, interests, or the exact problem you want solved. I will give you a structured, practical answer with next steps.`;
  }

  if (mentionedCity) {
    const places = repo.getPlaces({ city: mentionedCity.id }).slice(0, 4);
    const hotels = repo.getHotels({ city: mentionedCity.id }).slice(0, 3);
    const foods = repo.getFoods({ city: mentionedCity.id }).slice(0, 3);

    const placeText = places.length
      ? places.map((place) => `- ${place.name}: ${place.description || `${place.type} attraction`} Rating ${place.rating}, entry Rs ${place.entryFee || 0}.`).join('\n')
      : '- Start with the central sightseeing zone, then add one cultural stop and one relaxed food stop.';
    const hotelText = hotels.length
      ? hotels.map((hotel) => `- ${hotel.name}: ${hotel.category} stay, around Rs ${Number(hotel.pricePerNight || 0).toLocaleString('en-IN')}/night, rating ${hotel.rating}.`).join('\n')
      : '- Pick a well-reviewed hotel near the main sightseeing area to reduce local commute time.';
    const foodText = foods.length
      ? foods.map((food) => `- ${food.dishName} at ${food.restaurantName || 'a local restaurant'}: ${food.priceRange || 'price varies'}, rating ${food.rating}.`).join('\n')
      : '- Reserve one meal for a trusted local restaurant and one for a popular street-food area.';

    return `${ASSISTANT_NAME} recommendation for ${mentionedCity.name}

${mentionedCity.name} in ${mentionedCity.state} is a strong choice. ${mentionedCity.description || ''} Best season: ${mentionedCity.bestSeason || 'check local weather before booking'}. A practical daily budget is around Rs ${Number(mentionedCity.avgBudget || 3000).toLocaleString('en-IN')} per person, before premium upgrades.

Top places to consider:
${placeText}

Stay guidance:
${hotelText}

Food ideas:
${foodText}

Suggested next step:
Share your dates, number of travelers, budget, and preferred pace. I can turn this into a day-wise route with hotel category, food stops, estimated cost, and booking checkpoints.`;
  }

  if (/\b(code|coding|program|javascript|react|node|api|bug|error|database|sql|python|css|html)\b/.test(lowerMsg)) {
    return `${ASSISTANT_NAME} technical guidance

Here is a practical way to approach it:

1. Define the exact goal or error first: what should happen, what happens now, and where it fails.
2. Check the smallest reproducible path: one component, one API call, or one function at a time.
3. Inspect inputs and outputs before changing logic. Most bugs come from a mismatch in data shape, async timing, environment variables, or route names.
4. Make the smallest safe fix, then verify it with a build, a targeted test, or a manual flow.
5. If you are working on this Bharat Explorer project, share the file, error message, or desired behavior and I can guide the exact implementation.`;
  }

  if (/\b(trip|travel|hotel|booking|destination|budget|itinerary|food|visit|tour)\b/.test(lowerMsg)) {
    return `${ASSISTANT_NAME} travel planning guidance

For a polished trip plan, use this structure:

1. Pick the destination and season: match weather, crowd level, and local events.
2. Set the budget: separate stay, food, transport, activities, and emergency buffer.
3. Choose the stay area: stay close to the main experiences to save time and cab cost.
4. Build each day around zones: morning landmark, afternoon food/culture, evening relaxed experience.
5. Verify bookings: check cancellation policy, taxes, distance from key places, recent reviews, and payment confirmation.

For Bharat Explorer, you can ask things like "Plan 3 days in Goa under Rs 15000", "Best hotels in Udaipur for couples", or "Food trail in Ahmedabad". I will turn it into a detailed concierge-style answer.`;
  }

  return `${ASSISTANT_NAME} best guidance

Here is the clearest way to think about your question:

1. Start with the goal: decide what outcome you want, not just the topic.
2. Break it into parts: facts, options, tradeoffs, and next action.
3. Use reliable context: dates, location, budget, constraints, or examples make the answer sharper.
4. Choose the simplest useful next step, then improve from there.

Share one more detail about what you want to achieve, and I will give you a more tailored, step-by-step answer.`;
};

const generateItinerary = async (planData) => {
  try {
    const model = getModel();

    const prompt = `
      You are ${ASSISTANT_NAME}, an expert travel planner. Create a detailed, day-wise travel itinerary for:
      - Destination: ${planData.destination}
      - Budget: ${planData.budget}
      - Duration: ${planData.duration} days
      - Travel Type: ${planData.travelType} (solo, couple, family, etc.)
      - Interests: ${planData.interests}

      Provide the response in a structured JSON format with the following keys:
      {
        "tripTitle": "Name of the trip",
        "budgetBreakdown": { "stay": "Rs", "food": "Rs", "transport": "Rs", "activities": "Rs" },
        "totalEstimatedCost": "Rs",
        "itinerary": [
          {
            "day": 1,
            "theme": "Introduction to city",
            "activities": [
              { "time": "Morning", "place": "Name", "description": "Short details" },
              { "time": "Afternoon", "place": "Name", "description": "Short details" },
              { "time": "Evening", "place": "Name", "description": "Short details" }
            ],
            "mealSuggestions": ["Breakfast at X", "Lunch at Y", "Dinner at Z"]
          }
        ],
        "travelTips": ["Tip 1", "Tip 2"],
        "smartRecommendations": "Alternative destination or timing advice"
      }

      Ensure the itinerary is realistic, accounts for travel time, respects the ${planData.budget} budget, and never mentions any external AI provider.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = sanitizeAssistantText(response.text());

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { error: "Failed to parse assistant response", raw: text };
  } catch (error) {
    console.error("Itinerary assistant error: request failed");

    const city = repo.getCityByName(planData.destination);
    const cityId = city ? city.id : null;

    const places = repo.getPlaces({ city: cityId }).slice(0, 9);
    const foods = repo.getFoods({ city: cityId }).slice(0, 6);

    return {
      "tripTitle": `A Hand-Picked Journey to ${planData.destination}`,
      "budgetBreakdown": {
        "stay": "Rs " + Math.round(planData.budget * 0.4).toLocaleString('en-IN'),
        "food": "Rs " + Math.round(planData.budget * 0.2).toLocaleString('en-IN'),
        "transport": "Rs " + Math.round(planData.budget * 0.15).toLocaleString('en-IN'),
        "activities": "Rs " + Math.round(planData.budget * 0.25).toLocaleString('en-IN')
      },
      "totalEstimatedCost": "Rs " + Number(planData.budget).toLocaleString('en-IN'),
      "itinerary": Array.from({ length: Math.min(planData.duration || 2, 3) }, (_, i) => ({
        "day": i + 1,
        "theme": i === 0 ? "Signature Landmarks" : i === 1 ? "Cultural Immersion" : "Hidden Treasures",
        "activities": places.slice(i * 3, (i + 1) * 3).map((p, idx) => ({
          "time": idx === 0 ? "Morning" : idx === 1 ? "Afternoon" : "Evening",
          "place": p.name,
          "description": p.description
        })),
        "mealSuggestions": foods.slice(i * 2, (i + 1) * 2).map(f => `${f.dishName} at ${f.restaurantName}`)
      })),
      "travelTips": [
        city?.bestSeason ? `Best time to visit: ${city.bestSeason}` : "Check local weather before traveling",
        "Pre-book hotels for the best rates",
        "Keep local currency handy for street food and short local transfers"
      ],
      "smartRecommendations": `Since you selected ${planData.interests || 'travel'}, ${ASSISTANT_NAME} has selected a practical route using Bharat Explorer destination data.`
    };
  }
};

const chatWithAI = async (message, history = [], memory = {}) => {
  const safetyReply = getSafetyReply(message);
  if (safetyReply) return safetyReply;

  try {
    const model = getModel({
      systemInstruction: buildSystemInstruction({ message, memory }),
    });

    const chat = model.startChat({
      history: normalizeHistory(history),
      generationConfig: {
        maxOutputTokens: 3600,
        temperature: 0.65,
        topP: 0.9,
      },
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    return sanitizeAssistantText(response.text());
  } catch (error) {
    console.error("Chat assistant error: request failed");
    return sanitizeAssistantText(buildFallbackReply(message, memory));
  }
};

module.exports = {
  ASSISTANT_NAME,
  generateItinerary,
  chatWithAI
};
