// SmartQue API - OpenAI Integration for Dynamic Quiz Generation

// API Configuration
// IMPORTANT: Replace 'YOUR_API_KEY_HERE' with your actual OpenAI API key
// For local development: Add your key below
// For Vercel deployment: The key is exposed in browser, use with caution
const API_KEY = 'YOUR_API_KEY_HERE';
const API_URL = 'https://api.openai.com/v1/chat/completions';

// Quiz state
let selectedTopic = null;
let selectedLevel = null;

// Generate quiz questions using OpenAI
async function generateQuizQuestions(topic, level, language = 'en') {
    const langName = language === 'bn' ? 'Bengali (Bangla)' : 'English';
    const topicName = topic.toUpperCase();

    const levelDescriptions = {
        beginner: 'basic concepts suitable for beginners who are just starting to learn',
        intermediate: 'moderately challenging concepts for learners with some experience',
        advanced: 'complex and in-depth concepts for experts and professionals'
    };

    const prompt = `Generate exactly 20 multiple choice questions about ${topicName} web development at ${level} difficulty level (${levelDescriptions[level]}).

Language: All questions, options, answers, and descriptions must be in ${langName}.

Return ONLY a valid JSON array with this exact structure (no markdown, no code blocks, just pure JSON):
[
  {
    "id": 1,
    "question": "Question text here",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "The correct option text (must match exactly one of the options)",
    "description": "Brief explanation of why this answer is correct"
  }
]

Requirements:
- Exactly 20 questions
- Each question has exactly 4 unique options
- The answer field must exactly match one of the 4 options
- Questions should progressively cover different aspects of ${topicName}
- Descriptions should be educational and helpful
- All text in ${langName} language`;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: `You are a quiz generator expert. You generate high-quality multiple choice questions for web development topics. Always respond with valid JSON only, no markdown formatting.`
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 8000
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('API Error:', errorData);
            throw new Error(errorData.error?.message || 'Failed to generate questions');
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        // Parse the JSON response
        let questions;
        try {
            // Try to extract JSON from the response (in case it has markdown)
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                questions = JSON.parse(jsonMatch[0]);
            } else {
                questions = JSON.parse(content);
            }
        } catch (parseError) {
            console.error('Parse error:', parseError);
            console.log('Raw content:', content);
            throw new Error('Failed to parse quiz questions');
        }

        // Validate and fix question structure
        questions = questions.map((q, index) => ({
            id: index + 1,
            question: q.question,
            options: Array.isArray(q.options) ? q.options : [],
            answer: q.answer,
            description: q.description || ''
        }));

        return questions;

    } catch (error) {
        console.error('Error generating questions:', error);
        throw error;
    }
}

// Set selected topic
function setTopic(topic) {
    selectedTopic = topic;
}

// Set selected level
function setLevel(level) {
    selectedLevel = level;
}

// Get current selections
function getSelections() {
    return {
        topic: selectedTopic,
        level: selectedLevel
    };
}

// Reset selections
function resetSelections() {
    selectedTopic = null;
    selectedLevel = null;
}
