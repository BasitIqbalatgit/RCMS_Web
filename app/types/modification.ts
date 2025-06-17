// Types for modification-related data
export type ModificationStatus = 'Saved' | 'Pending' | 'Approved';

export interface ModificationDetails {
  [key: string]: string;
}

export interface Modification {
  _id: string;
  operator_id: string;
  original_image_url: string;
  modified_image_url: string;
  modification_type: string;
  vehicle_part: string;
  description: string;
  modification_details: string; // Stored as JSON string
  status: ModificationStatus;
  timestamp: string;
  created_at?: string;
}

export interface ModificationWithDetails extends Omit<Modification, 'modification_details'> {
  modification_details: ModificationDetails;
} 