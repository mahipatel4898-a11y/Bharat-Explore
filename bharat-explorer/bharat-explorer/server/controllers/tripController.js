const repo = require('../repositories/travelRepository');

const parseTripMessage = (message = '') => {
  const dayMatch = message.match(/(\d+)[\s-]*day/i);
  const budgetMatch = message.match(/(?:rs\.?|inr|under|budget(?:\s*of)?)\s*(\d[\d,]*)/i);
  const cities = repo.getCities();
  const city = cities.find((item) => message.toLowerCase().includes(item.name.toLowerCase()));
  return {
    city,
    days: dayMatch ? Number(dayMatch[1]) : undefined,
    budget: budgetMatch ? Number(budgetMatch[1].replace(/,/g, '')) : undefined,
  };
};

const buildItinerary = ({ places, hotels, foods, days, budget }) => {
  const perDayBudget = budget / days;
  const hotelBudgetPerNight = perDayBudget * 0.45;
  const fallbackHotel = hotels[0] || null;
  const budgetHotel = hotels.find((hotel) => hotel.pricePerNight <= hotelBudgetPerNight) || fallbackHotel;

  const balancedPlaces = [...places].sort((a, b) => {
    const order = { historical: 1, cultural: 2, nature: 3, beach: 3, religious: 4, adventure: 5 };
    return (order[a.type] || 9) - (order[b.type] || 9) || b.rating - a.rating;
  });

  const placesPerDay = Math.max(1, Math.ceil(balancedPlaces.length / days));
  return Array.from({ length: days }, (_, index) => {
    const dayPlaces = balancedPlaces.slice(index * placesPerDay, (index + 1) * placesPerDay);
    return {
      day: index + 1,
      title: index === 0 ? 'Arrival and Icons' : index === days - 1 ? 'Slow Travel and Local Picks' : `Curated Day ${index + 1}`,
      places: dayPlaces,
      hotel: budgetHotel,
      food: foods.slice(index % Math.max(foods.length, 1), (index % Math.max(foods.length, 1)) + 2).length
        ? foods.slice(index % Math.max(foods.length, 1), (index % Math.max(foods.length, 1)) + 2)
        : foods.slice(0, 2),
      flow: dayPlaces.map((place) => place.name).join(' -> '),
    };
  });
};

// POST /api/trip/plan
const planTrip = async (req, res) => {
  try {
    const { message = '', cityId, days, budget } = req.body;
    const parsed = parseTripMessage(message);

    const selectedCityId = cityId || parsed.city?._id;
    const selectedCity = selectedCityId ? repo.getCityById(selectedCityId) : null;
    const parsedDays = Math.min(Math.max(Number(days || parsed.days || 2), 1), 7);
    const parsedBudget = Number(budget || parsed.budget || selectedCity?.avgBudget * parsedDays || 5000);

    if (!selectedCityId) {
      return res.status(400).json({ success: false, message: 'Please provide a city to plan for.' });
    }

    const places = repo.getPlaces({ city: selectedCityId });
    const hotels = repo.getHotels({ city: selectedCityId }).sort((a, b) => b.rating - a.rating);
    const foods = repo.getFoods({ city: selectedCityId, mustTry: true });
    const itinerary = buildItinerary({ places, hotels, foods, days: parsedDays, budget: parsedBudget });

    const selectedPlaces = itinerary.flatMap((day) => day.places);
    const hotel = itinerary[0]?.hotel;
    const estimatedCost = {
      hotels: (hotel?.pricePerNight || 0) * parsedDays,
      food: Math.round(parsedBudget * 0.28),
      entry: selectedPlaces.reduce((sum, place) => sum + (place.entryFee || 0), 0),
      localTransport: Math.round(parsedBudget * 0.12),
    };
    estimatedCost.total = estimatedCost.hotels + estimatedCost.food + estimatedCost.entry + estimatedCost.localTransport;

    const withinBudget = estimatedCost.total <= parsedBudget;

    res.json({
      success: true,
      plan: {
        city: selectedCity,
        days: parsedDays,
        budget: parsedBudget,
        itinerary,
        estimatedCost,
        withinBudget,
        tips: withinBudget
          ? `This ${selectedCity.name} plan fits your budget with room for local shopping and cafe stops.`
          : `Estimated cost Rs ${Math.round(estimatedCost.total).toLocaleString('en-IN')} is above your budget. Pick a budget hotel or reduce one activity day.`,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/trip/chat
const chatbot = async (req, res) => {
  try {
    const { message = '' } = req.body;
    const msg = message.toLowerCase();
    const parsed = parseTripMessage(message);

    if (!message.trim()) {
      return res.json({ success: true, reply: 'Ask me about destinations, hotels, food, budgets, or a day-wise trip plan.' });
    }

    if (msg.includes('hello') || msg.includes('hi') || msg.includes('namaste')) {
      return res.json({
        success: true,
        reply: 'Namaste. I can help you choose a city, compare hotels, find food spots, and build day-wise India itineraries.',
      });
    }

    if (msg.includes('recommend') || msg.includes('where should') || msg.includes('best city')) {
      const cities = repo.getCities();
      return res.json({
        success: true,
        reply: `For heritage choose ${cities.find((c) => c.name === 'Jaipur')?.name}, for lakes choose Udaipur, for beaches choose Goa, for mountains choose Manali, and for food heritage choose Ahmedabad.`,
      });
    }

    if (parsed.city) {
      const places = repo.getPlaces({ city: parsed.city._id }).slice(0, 3);
      const hotels = repo.getHotels({ city: parsed.city._id }).slice(0, 2);
      const foods = repo.getFoods({ city: parsed.city._id, mustTry: true }).slice(0, 3);
      const days = parsed.days || 2;
      const budget = parsed.budget || parsed.city.avgBudget * days;

      if (msg.includes('hotel') || msg.includes('stay')) {
        return res.json({
          success: true,
          reply: `Best stays in ${parsed.city.name}: ${hotels.map((hotel) => `${hotel.name} around Rs ${hotel.pricePerNight}/night`).join('; ')}. For a balanced demo trip, keep 40-45% of budget for stay.`,
        });
      }

      if (msg.includes('food') || msg.includes('eat') || msg.includes('dish')) {
        return res.json({
          success: true,
          reply: `Must-try food in ${parsed.city.name}: ${foods.map((food) => `${food.dishName} at ${food.restaurantName}`).join('; ')}.`,
        });
      }

      return res.json({
        success: true,
        reply: `${parsed.city.name} is a strong choice. For ${days} day${days > 1 ? 's' : ''} under Rs ${budget.toLocaleString('en-IN')}, start with ${places.map((place) => place.name).join(', ')}, pick a hotel near the main sightseeing zone, and reserve one evening for local food like ${foods[0]?.dishName || 'regional dishes'}.`,
        suggestPlanner: true,
        city: parsed.city.name,
        cityId: parsed.city._id,
      });
    }

    return res.json({
      success: true,
      reply: 'Try asking: "Plan 3 day Goa trip under Rs 12000", "Best hotels in Udaipur", or "Food to try in Ahmedabad".',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { planTrip, chatbot };
