// lib/db/models/Modification.ts
import { Schema, model, models, Model } from 'mongoose';

export interface IModification {
  operator_id: string;
  original_image_url: string;
  modified_image_url: string;
  modification_type: string;
  vehicle_part: string;
  description: string;
  modification_details: string;
  status: 'Saved' | 'Pending' | 'Approved';
  timestamp: Date;
  created_at?: Date;
}

const modificationSchema = new Schema<IModification>(
  {
    operator_id: { type: String, required: true },
    original_image_url: { type: String, required: true },
    modified_image_url: { type: String, required: true },
    modification_type: { type: String, required: true },
    vehicle_part: { type: String, required: true },
    description: { type: String, required: true },
    modification_details: { type: String, required: true },
    status: { type: String, default: 'Saved', enum: ['Saved', 'Pending', 'Approved'] },
    timestamp: { type: Date, required: true },
    created_at: { type: Date, default: Date.now }
  }
);

const Modification: Model<IModification> = models.Modification || model('Modification', modificationSchema);
export default Modification;