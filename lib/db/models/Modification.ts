// lib/db/models/Modification.ts
import { Schema, model, models, Model } from 'mongoose';

export interface IModification {
  operator_id: string;
  original_image_url: string;
  modified_image_url: string;
  description: string;
  modification_details: string;
  status: 'Saved' | 'Pending' | 'Approved';
  timestamp: Date;
  created_at?: Date;
  // Optional fields that may exist but are not required
  modification_type?: string;
  vehicle_part?: string;
}

const modificationSchema = new Schema<IModification>(
  {
    operator_id: { type: String, required: true },
    original_image_url: { type: String, required: true },
    modified_image_url: { type: String, required: true },
    description: { type: String, required: true },
    modification_details: { type: String, required: true },
    status: { type: String, default: 'Saved', enum: ['Saved', 'Pending', 'Approved'] },
    timestamp: { type: Date, required: true },
    created_at: { type: Date, default: Date.now }
  },
  {
    strict: false, // Allow fields not defined in schema
    collection: 'modifications' // Explicitly set collection name
  }
);

// Delete the existing model if it exists to force recreation
if (models.Modification) {
  delete models.Modification;
}

const Modification: Model<IModification> = model('Modification', modificationSchema);
export default Modification;