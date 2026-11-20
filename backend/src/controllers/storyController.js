import mongoose from 'mongoose';
import { validationResult } from 'express-validator';
import Project from '../models/Project.js';
import UserStory from '../models/UserStory.js';
import { generateStories } from '../services/gemini.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const priorities = new Set(['High', 'Medium', 'Low']);
const statuses = new Set(['Backlog', 'To Do', 'In Progress', 'Review', 'Done']);
const points = new Set([1, 2, 3, 5, 8, 13]);

function validate(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(errors.array()[0].msg);
    error.status = 400;
    throw error;
  }
}

function text(value) {
  return typeof value === 'string' ? value.replace(/<[^>]*>/g, '').trim() : value;
}

function storyInput(body) {
  const updates = {};
  for (const key of ['title', 'role', 'description', 'category']) {
    if (body[key] !== undefined) updates[key] = text(body[key]);
  }
  if (body.priority !== undefined && priorities.has(body.priority)) updates.priority = body.priority;
  if (body.status !== undefined && statuses.has(body.status)) updates.status = body.status;
  if (body.storyPoints !== undefined && points.has(Number(body.storyPoints))) updates.storyPoints = Number(body.storyPoints);
  for (const key of ['acceptanceCriteria', 'dependencies', 'tags']) {
    if (body[key] !== undefined && Array.isArray(body[key])) {
      updates[key] = body[key].map(text).filter(Boolean);
    }
  }
  return updates;
}

function storyOptions(body = {}) {
  return {
    count: Number(body.count || 8),
    priority: body.priority || 'Balanced',
    complexity: body.complexity || 'Mixed',
    format: body.format || 'Standard user story',
    includeAcceptanceCriteria: body.includeAcceptanceCriteria !== false,
    includeEdgeCases: body.includeEdgeCases === true
  };
}

export const generateForProject = asyncHandler(async (req, res) => {
  validate(req);
  const options = storyOptions(req.body);
  let project;
  if (req.body.projectId) {
    if (!mongoose.isValidObjectId(req.body.projectId)) return res.status(400).json({ success: false, error: 'Invalid project ID.' });
    project = await Project.findOne({ _id: req.body.projectId, owner: req.user._id });
    if (!project) return res.status(404).json({ success: false, error: 'Project not found.' });
    if (req.body.projectName || req.body.description || req.body.targetUsers !== undefined ||
      req.body.industry !== undefined || req.body.requirements !== undefined) {
      const cleanList = (value) => Array.isArray(value) ? value.map(text).filter(Boolean) :
        typeof value === 'string' ? value.split(/\r?\n|,/).map(text).filter(Boolean) : undefined;
      project.projectName = text(req.body.projectName || project.projectName);
      project.description = text(req.body.description || project.description);
      if (req.body.targetUsers !== undefined) project.targetUsers = text(req.body.targetUsers);
      if (req.body.industry !== undefined) project.industry = text(req.body.industry);
      if (req.body.requirements !== undefined) project.requirements = cleanList(req.body.requirements) || [];
      await project.save();
    }
  } else {
    const cleanList = (value) => Array.isArray(value) ? value.map(text).filter(Boolean) :
      typeof value === 'string' ? value.split(/\r?\n|,/).map(text).filter(Boolean) : [];
    project = await Project.create({
      owner: req.user._id,
      projectName: text(req.body.projectName),
      description: text(req.body.description),
      targetUsers: text(req.body.targetUsers || ''),
      industry: text(req.body.industry || ''),
      requirements: cleanList(req.body.requirements)
    });
  }

  const generated = await generateStories(project.toObject(), options);
  const replaceExisting = req.body.replaceExisting === true;
  if (replaceExisting) await UserStory.deleteMany({ owner: req.user._id, projectId: project._id });
  const stories = await UserStory.insertMany(generated.map((story) => ({
    ...story,
    owner: req.user._id,
    projectId: project._id,
    acceptanceCriteria: options.includeAcceptanceCriteria ? story.acceptanceCriteria : []
  })));
  project.generationHistory.push({ generatedAt: new Date(), storyCount: stories.length });
  await project.save();
  res.status(201).json({ success: true, data: { project, stories } });
});

export const listProjectStories = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.projectId)) return res.status(400).json({ success: false, error: 'Invalid project ID.' });
  const project = await Project.exists({ _id: req.params.projectId, owner: req.user._id });
  if (!project) return res.status(404).json({ success: false, error: 'Project not found.' });
  const stories = await UserStory.find({ projectId: req.params.projectId, owner: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: { stories } });
});

export const getStory = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid story ID.' });
  const story = await UserStory.findOne({ _id: req.params.id, owner: req.user._id });
  if (!story) return res.status(404).json({ success: false, error: 'Story not found.' });
  res.json({ success: true, data: { story } });
});

export const updateStory = asyncHandler(async (req, res) => {
  validate(req);
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid story ID.' });
  const updates = storyInput(req.body);
  if (Object.keys(updates).length === 0) return res.status(400).json({ success: false, error: 'No valid story fields were provided.' });
  const story = await UserStory.findOneAndUpdate(
    { _id: req.params.id, owner: req.user._id },
    { $set: updates },
    { new: true, runValidators: true }
  );
  if (!story) return res.status(404).json({ success: false, error: 'Story not found.' });
  res.json({ success: true, data: { story } });
});

export const deleteStory = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid story ID.' });
  const story = await UserStory.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
  if (!story) return res.status(404).json({ success: false, error: 'Story not found.' });
  res.json({ success: true, data: { deleted: true } });
});

export const regenerateStory = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid story ID.' });
  const story = await UserStory.findOne({ _id: req.params.id, owner: req.user._id });
  if (!story) return res.status(404).json({ success: false, error: 'Story not found.' });
  const project = await Project.findOne({ _id: story.projectId, owner: req.user._id });
  if (!project) return res.status(404).json({ success: false, error: 'Project not found.' });
  const generated = await generateStories({
    ...project.toObject(),
    requirements: [...project.requirements, `Regenerate the current story with a meaningfully distinct but contextually relevant approach. Current title: ${story.title}. Current description: ${story.description}`]
  }, { ...storyOptions({ count: 1 }), includeEdgeCases: true });
  Object.assign(story, generated[0], { status: story.status, projectId: project._id, owner: req.user._id });
  await story.save();
  res.json({ success: true, data: { story } });
});
