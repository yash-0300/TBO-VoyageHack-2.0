import React, { useState } from 'react';
import { Star, MapPin, DollarSign, Calendar, Hotel, Bus, Activity, Utensils, Globe, Palette } from 'lucide-react';
import OpenAI from 'openai';
import { MarkdownRenderer } from './components/MarkdownRenderer';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

const systemPrompt = `You are an expert travel planner with extensive knowledge of destinations worldwide.
You have access to websearch, internet search, weather search and all other tools.
Create a detailed travel itinerary based on the user's preferences. The itinerary should include:

1. A personalized welcome message
2. Daily schedule breakdown with:
   - Morning activities
   - Afternoon activities
   - Evening activities
3. Recommended restaurants matching their cuisine preferences
4. Points of interest based on their selected interests
5. Practical transportation tips
6. Estimated costs in their budget range
7. Cultural tips and language considerations
8. High-quality image suggestions for key attractions through internet search

Format the response in markdown for proper display.`;

interface TravelPlan {
  destination: string;
  days: string;
  description: string;
  activities: string[];
  selections: {
    interests: string[];
    cuisineTypes: string[];
    activityTypes: string[];
    accommodation: string;
    travelStyle: string;
    transportation: string;
    language: string;
  };
}

function App() {
  const [formData, setFormData] = useState({
    destination: '',
    budget: '',
    duration: '',
    accommodation: 'hotel',
    transportation: '',
    interests: [] as string[],
    cuisineTypes: [] as string[],
    activityTypes: [] as string[],
    travelStyle: 'cultural',
    language: 'en'
  });

  const [itinerary, setItinerary] = useState<TravelPlan | null>(null);
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Your existing arrays for options
  const interests = [
    { name: 'History', emoji: '🏛️' },
    { name: 'Art', emoji: '🎨' },
    { name: 'Food', emoji: '🍳' },
    { name: 'Music', emoji: '🎵' },
    { name: 'Nature', emoji: '🌿' },
    { name: 'Sports', emoji: '⚽' },
    { name: 'Photography', emoji: '📸' },
    { name: 'Architecture', emoji: '🏰' },
    { name: 'Literature', emoji: '📚' }
  ];

  const cuisineTypes = [
    { name: 'Traditional', emoji: '🍽️' },
    { name: 'Japanese', emoji: '🍱' },
    { name: 'Italian', emoji: '🍝' },
    { name: 'American', emoji: '🍔' },
    { name: 'Korean', emoji: '🍜' },
    { name: 'Mexican', emoji: '🌮' },
    { name: 'Thai', emoji: '🥘' },
    { name: 'Turkish', emoji: '🥙' },
    { name: 'Indian', emoji: '🍛' },
    { name: 'French', emoji: '🥐' },
    { name: 'Spanish', emoji: '🥘' }
  ];

  const activityTypes = [
    { name: 'Outdoor', emoji: '🏃‍♂️' },
    { name: 'Sightseeing', emoji: '🎭' },
    { name: 'Shopping', emoji: '🛍️' },
    { name: 'Nightlife', emoji: '🌙' },
    { name: 'Museums', emoji: '🏛️' },
    { name: 'Beach', emoji: '🏖️' },
    { name: 'Adventure', emoji: '🏔️' },
    { name: 'Relaxation', emoji: '🧘‍♀️' }
  ];

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
    { code: 'gb', name: 'British English', flag: '🇬🇧' }
  ];

  const travelStyles = [
    { name: 'Cultural', emoji: '🏺' },
    { name: 'Adventure', emoji: '🏃‍♂️' },
    { name: 'Luxury', emoji: '✨' },
    { name: 'Budget', emoji: '💰' },
    { name: 'Family', emoji: '👨‍👩‍👧‍👦' },
    { name: 'Solo', emoji: '🚶' }
  ];

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleCuisineToggle = (cuisine: string) => {
    setFormData(prev => ({
      ...prev,
      cuisineTypes: prev.cuisineTypes.includes(cuisine)
        ? prev.cuisineTypes.filter(c => c !== cuisine)
        : [...prev.cuisineTypes, cuisine]
    }));
  };

  const handleActivityToggle = (activity: string) => {
    setFormData(prev => ({
      ...prev,
      activityTypes: prev.activityTypes.includes(activity)
        ? prev.activityTypes.filter(a => a !== activity)
        : [...prev.activityTypes, activity]
    }));
  };

  const generateItinerary = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Create a travel itinerary for ${formData.destination} with the following preferences:
              - Duration: ${formData.duration} days
              - Budget: ${formData.budget}
              - Interests: ${formData.interests.join(', ')}
              - Cuisine Types: ${formData.cuisineTypes.join(', ')}
              - Activity Types: ${formData.activityTypes.join(', ')}
              - Accommodation: ${formData.accommodation}
              - Travel Style: ${formData.travelStyle}
              - Transportation: ${formData.transportation}
              - Language: ${formData.language}

              Please include Hotel Images and Google Maps location through internet or web search.`
          }
        ],
        store: true,
        temperature: 0.7,
        max_tokens: 2000,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('Invalid Open API Key Provided. Please use a valid key');
      }
      
      setMarkdownContent(content);
      console.log(content)

      const selectedLanguage = languages.find(l => l.code === formData.language);
      const basicItinerary: TravelPlan = {
        destination: formData.destination,
        days: formData.duration,
        description: '',
        activities: [],
        selections: {
          interests: formData.interests,
          cuisineTypes: formData.cuisineTypes,
          activityTypes: formData.activityTypes,
          accommodation: formData.accommodation,
          travelStyle: formData.travelStyle,
          transportation: formData.transportation,
          language: selectedLanguage?.name || 'English'
        }
      };
      setItinerary(basicItinerary);
      
    } catch (error: any) {
      setError(error.message || 'Failed to generate itinerary. Please try again.');
      console.error('Error generating itinerary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Title with line partition */}
        <div className="flex items-center justify-center mb-8 gap-4">
          <div className="h-0.5 flex-1 bg-gradient-to-r from-transparent to-gray-400"></div>
          <h1 className="text-4xl font-bold text-white flex items-center gap-2 whitespace-nowrap px-4">
            <Star className="text-yellow-300" />
            TBO AI Travel Planner
            <Star className="text-yellow-300" />
          </h1>
          <div className="h-0.5 flex-1 bg-gradient-to-l from-transparent to-gray-400"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Introduction Panel */}
          <div className="bg-black/90 backdrop-blur-sm p-8 rounded-xl shadow-xl text-white">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Plan Your Dream Journey
            </h2>
            <p className="text-lg mb-6 text-gray-300">
              Welcome to our AI-powered TBO Travel Planner! Let us help you create the perfect itinerary 
              tailored to your interests, preferences, and travel style.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Globe className="text-purple-400" />
                <span>Explore destinations worldwide</span>
              </div>
              <div className="flex items-center gap-3">
                <Palette className="text-pink-400" />
                <span>Personalized recommendations</span>
              </div>
              <div className="flex items-center gap-3">
                <Activity className="text-blue-400" />
                <span>Curated activities and experiences</span>
              </div>
            </div>
            {itinerary && (
              <div className="mt-8 border-t border-gray-700 pt-6">
                <h3 className="text-2xl font-bold mb-4">Your Travel Plan for {itinerary.destination}</h3>
                <p className="text-gray-300 mb-4">{itinerary.description}</p>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xl font-semibold mb-2">Your Selections:</h4>
                    <div className="space-y-2 text-gray-300">
                      <p><strong>Interests:</strong> {itinerary.selections.interests.join(', ')}</p>
                      <p><strong>Cuisine Types:</strong> {itinerary.selections.cuisineTypes.join(', ')}</p>
                      <p><strong>Activity Types:</strong> {itinerary.selections.activityTypes.join(', ')}</p>
                      <p><strong>Accommodation:</strong> {itinerary.selections.accommodation}</p>
                      <p><strong>Travel Style:</strong> {itinerary.selections.travelStyle}</p>
                      <p><strong>Transportation:</strong> {itinerary.selections.transportation}</p>
                      <p><strong>Language:</strong> {itinerary.selections.language}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Form */}
          <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-xl">
            <div className="space-y-4">
              {/* Your existing form elements */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin className="inline-block w-4 h-4 mr-1" />
                  Destination
                </label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md"
                  value={formData.destination}
                  onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
                  placeholder="Enter destination"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <DollarSign className="inline-block w-4 h-4 mr-1" />
                    Budget
                  </label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded-md"
                    value={formData.budget}
                    onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                    placeholder="Enter budget"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="inline-block w-4 h-4 mr-1" />
                    Duration (days)
                  </label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded-md"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                    placeholder="Number of days"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Hotel className="inline-block w-4 h-4 mr-1" />
                    Accommodation
                  </label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={formData.accommodation}
                    onChange={(e) => setFormData(prev => ({ ...prev, accommodation: e.target.value }))}
                  >
                    <option value="hotel">Hotel 🏨</option>
                    <option value="hostel">Hostel 🛏️</option>
                    <option value="apartment">Apartment 🏢</option>
                    <option value="resort">Resort 🌴</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Palette className="inline-block w-4 h-4 mr-1" />
                    Travel Style
                  </label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={formData.travelStyle}
                    onChange={(e) => setFormData(prev => ({ ...prev, travelStyle: e.target.value }))}
                  >
                    {travelStyles.map(style => (
                      <option key={style.name} value={style.name.toLowerCase()}>
                        {style.emoji} {style.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Bus className="inline-block w-4 h-4 mr-1" />
                  Transportation
                </label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md"
                  value={formData.transportation}
                  onChange={(e) => setFormData(prev => ({ ...prev, transportation: e.target.value }))}
                  placeholder="e.g., car, train, bus, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Globe className="inline-block w-4 h-4 mr-1" />
                  Preferred Language
                </label>
                <div className="flex flex-wrap gap-2">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setFormData(prev => ({ ...prev, language: lang.code }))}
                      className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                        formData.language === lang.code
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Activity className="inline-block w-4 h-4 mr-1" />
                  Activity Types
                </label>
                <div className="flex flex-wrap gap-2">
                  {activityTypes.map((activity) => (
                    <button
                      key={activity.name}
                      onClick={() => handleActivityToggle(activity.name)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        formData.activityTypes.includes(activity.name)
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {activity.emoji} {activity.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Activity className="inline-block w-4 h-4 mr-1" />
                  Interests
                </label>
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest) => (
                    <button
                      key={interest.name}
                      onClick={() => handleInterestToggle(interest.name)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        formData.interests.includes(interest.name)
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {interest.emoji} {interest.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Utensils className="inline-block w-4 h-4 mr-1" />
                  Cuisine Types
                </label>
                <div className="flex flex-wrap gap-2">
                  {cuisineTypes.map((cuisine) => (
                    <button
                      key={cuisine.name}
                      onClick={() => handleCuisineToggle(cuisine.name)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        formData.cuisineTypes.includes(cuisine.name)
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {cuisine.emoji} {cuisine.name}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={generateItinerary}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-md hover:opacity-90 transition-opacity font-semibold text-lg"
              >
                {isLoading ? 'Generating...' : 'Generate Itinerary ✨'}
              </button>
            </div>
          </div>
        </div>

        {/* Markdown Content Display */}
        {error && (
          <div className="text-red-500 mt-8 p-4 bg-red-100 rounded-lg">
            {error}
          </div>
        )}
        
        {markdownContent && (
          <div className="mt-8 bg-black/95 backdrop-blur-sm p-6 rounded-xl shadow-xl">
            <MarkdownRenderer content={markdownContent} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;