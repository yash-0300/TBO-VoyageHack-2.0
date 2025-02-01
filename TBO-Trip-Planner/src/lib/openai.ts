import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, API calls should be made from a backend
});

const systemPrompt = `You are an expert travel planner with extensive knowledge of destinations worldwide.
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
8. High-quality image suggestions for key attractions (use Unsplash URLs)

Format the response in markdown for proper display.

Important: When suggesting images, use real Unsplash URLs in markdown format, for example:
![Temple of Heaven](https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop)`;

export async function generateItinerary(preferences: any) {
  if (!import.meta.env.VITE_OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured. Please add it to your .env file.');
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Create a travel itinerary for ${preferences.destination} with the following preferences:
            - Duration: ${preferences.days} days
            - Budget: ${preferences.budget}
            - Interests: ${preferences.interests.join(', ')}
            - Cuisine Types: ${preferences.cuisineTypes.join(', ')}
            - Activity Types: ${preferences.activityTypes.join(', ')}
            - Accommodation: ${preferences.accommodation}
            - Travel Style: ${preferences.travelStyle}
            - Transportation: ${preferences.transportation}
            - Language: ${preferences.language}

            Please include real Unsplash image URLs for key attractions and locations.
          `
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = response.choices[0].message.content;

    if (!content) {
      throw new Error('No content received from OpenAI');
    }
    return content;

  } catch (error: any) {
    console.error('Error generating itinerary:', error);
    throw new Error(error.message || 'Failed to generate itinerary. Please try again.');
  }
}