import { GoogleGenerativeAI } from '@google/generative-ai';

const storyShape = {
  type: 'OBJECT',
  properties: {
    title: { type: 'STRING' },
    role: { type: 'STRING' },
    description: { type: 'STRING' },
    category: { type: 'STRING' },
    priority: { type: 'STRING', enum: ['High', 'Medium', 'Low'] },
    storyPoints: { type: 'INTEGER', enum: [1, 2, 3, 5, 8, 13] },
    acceptanceCriteria: { type: 'ARRAY', items: { type: 'STRING' } },
    dependencies: { type: 'ARRAY', items: { type: 'STRING' } },
    tags: { type: 'ARRAY', items: { type: 'STRING' } }
  },
  required: ['title', 'role', 'description', 'category', 'priority', 'storyPoints', 'acceptanceCriteria', 'dependencies', 'tags']
};

function getModel() {
  if (!process.env.GEMINI_API_KEY) {
    const error = new Error('AI generation is not configured. Add GEMINI_API_KEY to the backend environment.');
    error.status = 503;
    throw error;
  }
  const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return client.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    systemInstruction: `You are a senior product owner and business analyst. Analyze the provided project context before writing stories: infer the domain, distinct user roles, business goals, user needs, feature relationships, and important omissions. Generate specific, non-duplicative, testable user stories based only on the context. A story description must follow exactly: "As a [role], I want [capability], so that [benefit]." Do not invent integrations, policies, or workflows absent from the prompt. When useful, make assumptions explicit in acceptance criteria. Each acceptance criterion must be a clear, testable Given / When / Then condition. Return only the requested structured JSON.`,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'ARRAY',
        items: storyShape
      },
      temperature: 0.65
    }
  });
}

export async function generateStories(context, options) {
  const model = getModel();
  const prompt = `Create exactly ${options.count} distinct user stories for this project.

Project name: ${context.projectName}
Project description: ${context.description}
Target users: ${context.targetUsers || 'Infer relevant roles from the project description'}
Industry: ${context.industry || 'Not specified'}
Additional requirements and main features: ${(context.requirements || []).join('; ') || 'Use the project description'}

Story settings:
- Priority focus: ${options.priority || 'Balanced'}
- Complexity: ${options.complexity || 'Mixed'}
- Include acceptance criteria: ${options.includeAcceptanceCriteria !== false}
- Include edge cases in criteria: ${options.includeEdgeCases === true}
- Format: ${options.format || 'Standard user story'}

Stories must be relevant to this project, cover distinct capabilities, express the user benefit, and reflect logical dependencies where applicable. Use empty arrays when there are no dependencies or tags.`;
  let result;
  try {
    result = await model.generateContent(prompt);
  } catch (cause) {
    const error = new Error('Gemini could not generate stories. Check the API key, model availability, and quota, then try again.');
    error.status = 502;
    error.cause = cause;
    throw error;
  }
  let stories;
  try {
    stories = JSON.parse(result.response.text());
  } catch (cause) {
    const error = new Error('The AI returned a response that could not be read as structured stories. Please try again.');
    error.status = 502;
    error.cause = cause;
    throw error;
  }
  validateStories(stories, options.count, options.includeAcceptanceCriteria !== false);
  return stories;
}

export function validateStories(stories, expectedCount, requireCriteria) {
  const allowedPriorities = new Set(['High', 'Medium', 'Low']);
  const allowedPoints = new Set([1, 2, 3, 5, 8, 13]);
  const validString = (value, limit) => typeof value === 'string' && value.trim().length > 0 && value.length <= limit;
  const seenTitles = new Set();
  if (!Array.isArray(stories) || stories.length !== expectedCount) {
    throw invalidAIResponse();
  }
  for (const story of stories) {
    const title = typeof story?.title === 'string' ? story.title.trim().toLowerCase() : '';
    const criteriaAreTestable = Array.isArray(story?.acceptanceCriteria) && story.acceptanceCriteria.every((criterion) => {
      if (typeof criterion !== 'string') return false;
      const text = criterion.toLowerCase();
      return text.includes('given') && text.includes('when') && text.includes('then');
    });
    if (!story || !validString(story.title, 180) || !validString(story.role, 100) ||
      !validString(story.description, 2000) || !validString(story.category, 100) ||
      !/^as (a|an) .+, i want .+, so that .+\.$/i.test(story.description.trim()) ||
      seenTitles.has(title) ||
      !allowedPriorities.has(story.priority) || !allowedPoints.has(story.storyPoints) ||
      !Array.isArray(story.acceptanceCriteria) || !Array.isArray(story.dependencies) ||
      !Array.isArray(story.tags) ||
      story.acceptanceCriteria.length > 30 || story.dependencies.length > 30 || story.tags.length > 30 ||
      !story.acceptanceCriteria.every((item) => validString(item, 1000)) ||
      (requireCriteria && (story.acceptanceCriteria.length === 0 || !criteriaAreTestable)) ||
      !story.dependencies.every((item) => validString(item, 180)) ||
      !story.tags.every((item) => validString(item, 60))) {
      throw invalidAIResponse();
    }
    seenTitles.add(title);
  }
}

function invalidAIResponse() {
  const error = new Error('The AI response did not meet the user story requirements. Nothing was saved. Please try again.');
  error.status = 502;
  return error;
}
