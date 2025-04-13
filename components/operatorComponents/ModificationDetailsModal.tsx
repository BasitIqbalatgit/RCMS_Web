import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ModificationDetails {
  [key: string]: string;
}

interface Modification {
  _id: string;
  operator_id: string;
  original_image_url: string;
  modified_image_url: string;
  modification_type: string;
  modification_details: ModificationDetails;
  status: 'Saved';
  timestamp: string;
  vehicle_part: string;
  description: string;
}

interface ModificationDetailsModalProps {
  modification: Modification | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ModificationDetailsModal: React.FC<ModificationDetailsModalProps> = ({
  modification,
  open,
  onOpenChange,
}) => {
  if (!modification) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {modification.modification_type} - {modification.vehicle_part}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Images */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-700">Original Image</p>
              <img
                src={modification.original_image_url}
                alt="Original"
                className="w-full h-40 object-cover rounded-md border mt-2"
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">Modified Image</p>
              <img
                src={modification.modified_image_url}
                alt="Modified"
                className="w-full h-40 object-cover rounded-md border mt-2"
              />
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              <strong>Status:</strong>{' '}
              <Badge className="bg-green-500 text-white">Saved</Badge>
            </p>
            <p className="text-sm text-gray-600">
              <strong>Timestamp:</strong>{' '}
              {new Date(modification.timestamp).toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Details:</strong>{' '}
              {Object.entries(modification.modification_details)
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ')}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Operator ID:</strong> {modification.operator_id}
            </p>
            {modification.description && (
              <p className="text-sm text-gray-600">
                <strong>Note:</strong> {modification.description}
              </p>
            )}
          </div>

          {/* Close Button */}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModificationDetailsModal;