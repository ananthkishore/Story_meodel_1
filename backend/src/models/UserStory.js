import mongoose from 'mongoose';

const userStorySchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 180 },
  role: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, required: true, trim: true, maxlength: 2000 },
  category: { type: String, required: true, trim: true, maxlength: 100 },
  priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
  storyPoints: { type: Number, enum: [1, 2, 3, 5, 8, 13], default: 3 },
  acceptanceCriteria: { type: [String], default: [] },
  dependencies: { type: [String], default: [] },
  tags: { type: [String], default: [] },
  status: { type: String, enum: ['Backlog', 'To Do', 'In Progress', 'Review', 'Done'], default: 'Backlog' }
}, { timestamps: true });

userStorySchema.index({ owner: 1, projectId: 1, updatedAt: -1 });

export default mongoose.model('UserStory', userStorySchema);
