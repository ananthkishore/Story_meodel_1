import test from 'node:test';
import assert from 'node:assert/strict';
import { validateStories } from '../src/services/gemini.js';

function makeStory(overrides = {}) {
  return {
    title: 'Find events by location',
    role: 'event attendee',
    description: 'As an event attendee, I want to filter events by location, so that I can find nearby activities.',
    category: 'Discovery',
    priority: 'Medium',
    storyPoints: 3,
    acceptanceCriteria: ['Given I am browsing events, When I choose a location, Then only matching events are shown.'],
    dependencies: [],
    tags: ['search'],
    ...overrides
  };
}

test('accepts a user story with the required format and testable acceptance criteria', () => {
  assert.doesNotThrow(() => validateStories([makeStory()], 1, true));
});

test('rejects descriptions that do not follow the user story format', () => {
  assert.throws(() => validateStories([makeStory({ description: 'Users can browse events nearby.' })], 1, true), (error) => error.status === 502);
});

test('rejects duplicate story titles', () => {
  assert.throws(() => validateStories([makeStory(), makeStory({ description: 'As a customer, I want to browse nearby events, so that I can plan an evening.' })], 2, true), (error) => error.status === 502);
});

test('rejects acceptance criteria without Given / When / Then conditions', () => {
  assert.throws(() => validateStories([makeStory({ acceptanceCriteria: ['The attendee can filter the event list.'] })], 1, true), (error) => error.status === 502);
});
