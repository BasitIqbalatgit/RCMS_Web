// /lib/db/models/Inventory.ts
import mongoose from 'mongoose';
import { Schema } from 'mongoose';

export type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  available: number;
  image: string;
  category: string;
  price: number;
  adminId: mongoose.Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
};

const inventorySchema = new Schema<InventoryItem>({
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  available: { 
    type: Number, 
    required: true, 
    min: 0,
    validate: {
      validator: function(this: InventoryItem, available: number) {
        return available <= this.quantity;
      },
      message: 'Available amount cannot exceed total quantity'
    }
  },
  image: { type: String, default: '/api/placeholder/100/100' },
  category: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  adminId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Creating indexes for faster querying
inventorySchema.index({ name: 'text' });
inventorySchema.index({ category: 1 });
inventorySchema.index({ adminId: 1, category: 1 });

// Check if model already exists to prevent OverwriteModelError during hot reloads
const Inventory = mongoose.models.Inventory || mongoose.model<InventoryItem>('Inventory', inventorySchema);

export default Inventory;