import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  projectName: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, required: true, trim: true, maxlength: 10000 },
  targetUsers: { type: String, trim: true, maxlength: 2000, default: '' },
  industry: { type: String, trim: true, maxlength: 120, default: '' },
  requirements: { type: [String], default: [] },
  generationHistory: [{
    generatedAt: { type: Date, default: Date.now },
    storyCount: { type: Number, min: 0 }
  }]
}, { timestamps: true });

export default mongoose.model('Project', projectSchema);
