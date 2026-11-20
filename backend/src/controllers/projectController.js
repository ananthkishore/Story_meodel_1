import mongoose from 'mongoose';
import { validationResult } from 'express-validator';
import Project from '../models/Project.js';
import UserStory from '../models/UserStory.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function validate(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(errors.array()[0].msg);
    error.status = 400;
    throw error;
  }
}

function projectFields(body) {
  const clean = (value) => typeof value === 'string' ? value.replace(/<[^>]*>/g, '').trim() : value;
  const fields = {};
  if (body.projectName !== undefined) fields.projectName = clean(body.projectName);
  if (body.description !== undefined) fields.description = clean(body.description);
  if (body.targetUsers !== undefined) fields.targetUsers = clean(body.targetUsers);
  if (body.industry !== undefined) fields.industry = clean(body.industry);
  if (body.requirements !== undefined) fields.requirements = Array.isArray(body.requirements)
      ? body.requirements.map(clean).filter(Boolean).slice(0, 40)
      : (typeof body.requirements === 'string' && body.requirements.trim()
        ? body.requirements.split(/\r?\n/).map(clean).filter(Boolean).slice(0, 40)
        : []);
  return fields;
}

export const createProject = asyncHandler(async (req, res) => {
  validate(req);
  const project = await Project.create({ owner: req.user._id, ...projectFields(req.body) });
  res.status(201).json({ success: true, data: { project } });
});

export const listProjects = asyncHandler(async (req, res) => {
  const projects = await Project.aggregate([
    { $match: { owner: req.user._id } },
    { $lookup: { from: 'userstories', localField: '_id', foreignField: 'projectId', as: 'stories' } },
    { $addFields: { storyCount: { $size: '$stories' } } },
    { $project: { stories: 0 } },
    { $sort: { updatedAt: -1 } }
  ]);
  res.json({ success: true, data: { projects } });
});

export const getProject = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid project ID.' });
  const project = await Project.findOne({ _id: req.params.id, owner: req.user._id });
  if (!project) return res.status(404).json({ success: false, error: 'Project not found.' });
  const stories = await UserStory.find({ projectId: project._id, owner: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: { project, stories } });
});

export const updateProject = asyncHandler(async (req, res) => {
  validate(req);
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid project ID.' });
  const updates = projectFields(req.body);
  if (Object.keys(updates).length === 0) return res.status(400).json({ success: false, error: 'No valid project fields were provided.' });
  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, owner: req.user._id },
    { $set: updates },
    { new: true, runValidators: true }
  );
  if (!project) return res.status(404).json({ success: false, error: 'Project not found.' });
  res.json({ success: true, data: { project } });
});

export const deleteProject = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid project ID.' });
  const project = await Project.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
  if (!project) return res.status(404).json({ success: false, error: 'Project not found.' });
  await UserStory.deleteMany({ projectId: project._id, owner: req.user._id });
  res.json({ success: true, data: { deleted: true } });
});
