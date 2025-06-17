'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSession } from 'next-auth/react';

interface StitchingViewProps {
  segmentedImage: string;
  selectedReferences: {
    className: string;
    imagePath: string;
  }[];
  segmentedParts: {
    class_name: string;
    confidence: number;
    segmented_image_path: string;
    mask_path: string;
    x: number;
    y: number;
    w: number;
    h: number;
  }[];
  onBack: () => void;
}

interface SaveModificationData {
  modification_type: string;
  vehicle_part: string;
  description: string;
  modification_details: Record<string, string>;
}

interface SaveModificationResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export default function StitchingView({ 
  segmentedImage, 
  selectedReferences, 
  segmentedParts,
  onBack 
}: StitchingViewProps) {
  const { data: session } = useSession();
  const [stitchedImage, setStitchedImage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [saveData, setSaveData] = useState<SaveModificationData>({
    modification_type: '',
    vehicle_part: '',
    description: '',
    modification_details: {}
  });

  useEffect(() => {
    const performStitching = async () => {
      try {
        const formData = new FormData();
        formData.append('segmentedImage', segmentedImage);
        
        // Log segmented parts before sending
        console.log('Segmented parts being sent:', segmentedParts);
        
        // Validate segmented parts data
        if (!segmentedParts || !Array.isArray(segmentedParts)) {
          throw new Error('Invalid segmented parts data');
        }
        
        // Validate each part has required properties
        segmentedParts.forEach((part, index) => {
          if (!part.class_name || typeof part.x !== 'number' || 
              typeof part.y !== 'number' || typeof part.w !== 'number' || 
              typeof part.h !== 'number') {
            console.error('Invalid part data at index', index, part);
            throw new Error(`Invalid part data for ${part.class_name || 'unknown part'}`);
          }
        });
        
        formData.append('segmentedParts', JSON.stringify(segmentedParts));
        
        selectedReferences.forEach((ref, index) => {
          formData.append(`reference_${index}`, ref.imagePath);
          formData.append(`class_${index}`, ref.className);
        });

        console.log('Sending stitching request with:', {
          segmentedImage,
          segmentedPartsCount: segmentedParts.length,
          referencesCount: selectedReferences.length
        });

        const response = await fetch('/api/operator/stitch', {
          method: 'POST',
          body: formData,
        });

        // Log the raw response for debugging
        const responseText = await response.text();
        console.log('Raw response:', responseText);

        if (!response.ok) {
          let errorMessage = 'Stitching failed';
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            console.error('Error parsing error response:', e);
          }
          throw new Error(errorMessage);
        }

        // Parse the successful response
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          console.error('Error parsing success response:', e);
          throw new Error('Invalid response from server');
        }
        
        if (data.success) {
          setStitchedImage(data.stitchedImageUrl);
        } else {
          throw new Error(data.error || 'Stitching failed');
        }
      } catch (error) {
        console.error('Stitching error:', error);
        setError(error instanceof Error ? error.message : 'Stitching failed');
      } finally {
        setIsLoading(false);
      }
    };

    performStitching();
  }, [segmentedImage, selectedReferences, segmentedParts]);

  const handleSave = async () => {
    if (!session?.user?.id) {
      setError('You must be logged in to save modifications');
      return;
    }

    try {
      const response = await fetch('/api/operator/modification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operator_id: session.user.id,
          original_image_url: segmentedImage,
          modified_image_url: stitchedImage,
          modification_type: saveData.modification_type,
          vehicle_part: saveData.vehicle_part,
          description: saveData.description,
          modification_details: JSON.stringify({
            ...saveData.modification_details,
            ...Object.fromEntries(
              selectedReferences.map(ref => [`${ref.className}_reference`, ref.imagePath])
            )
          }),
          status: 'Saved',
          timestamp: new Date().toISOString(),
        }),
      });

      const data: SaveModificationResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save modification');
      }

      // Show success message and redirect
      alert('Modification saved successfully!');
      onBack();
    } catch (err) {
      console.error('Save error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save modification. Please try again.');
    }
  };

  const handleSaveModalSubmit = () => {
    // Validate required fields
    if (!saveData.modification_type || !saveData.vehicle_part || !saveData.description) {
      alert('Please fill in all required fields');
      return;
    }

    handleSave();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-center space-x-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <h2 className="text-xl font-semibold text-gray-900">Processing Stitching...</h2>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-red-600 mb-4">Stitching Failed</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={onBack}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Stitching Results</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  console.log('Opening save modal...');
                  setShowSaveModal(true);
                }}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                Save Modification
              </Button>
              <Button
                variant="outline"
                onClick={onBack}
              >
                Start New Analysis
              </Button>
            </div>
          </div>

          {/* Original and Stitched Result in a grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Segmented Image */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Segmented Image</h3>
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                <Image
                  src={segmentedImage}
                  alt="Segmented image"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            {/* Stitched Result */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Stitched Result</h3>
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                <Image
                  src={stitchedImage}
                  alt="Stitched result"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </div>

          {/* Parts and References */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Parts and Reference Images</h3>
            
            <div className="space-y-6">
              {segmentedParts.map((part, partIndex) => {
                const partReferences = selectedReferences.filter(ref => ref.className === part.class_name);
                
                return (
                  <div key={partIndex} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
                      {/* Part Class Name */}
                      <div className="w-full md:w-48 flex-shrink-0">
                        <h4 className="text-lg font-medium text-gray-900 capitalize">
                          {part.class_name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Confidence: {(part.confidence * 100).toFixed(1)}%
                        </p>
                      </div>

                      {/* Segmented Part Image */}
                      <div className="w-full md:w-48 flex-shrink-0">
                        <div className="relative aspect-square w-full overflow-hidden rounded-lg border">
                          <Image
                            src={part.segmented_image_path}
                            alt={`Segmented ${part.class_name}`}
                            fill
                            className="object-contain"
                          />
                        </div>
                      </div>

                      {/* Reference Images */}
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-4">
                          {partReferences.map((ref, refIndex) => (
                            <div key={refIndex} className="w-48 flex-shrink-0">
                              <div className="relative aspect-square w-full overflow-hidden rounded-lg border">
                                <Image
                                  src={ref.imagePath}
                                  alt={`Reference ${refIndex + 1} for ${ref.className}`}
                                  fill
                                  className="object-contain"
                                />
                              </div>
                              <p className="text-xs text-gray-600 text-center mt-1">
                                Reference {refIndex + 1}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <Dialog open={showSaveModal} onOpenChange={(open) => {
          console.log('Dialog onOpenChange:', open);
          setShowSaveModal(open);
        }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Save Modification</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="modification_type">Modification Type</Label>
                <Select
                  value={saveData.modification_type}
                  onValueChange={(value) => {
                    console.log('Setting modification type:', value);
                    setSaveData(prev => ({ ...prev, modification_type: value }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Paint">Paint</SelectItem>
                    <SelectItem value="Rims">Rims</SelectItem>
                    <SelectItem value="Spoiler">Spoiler</SelectItem>
                    <SelectItem value="Headlights">Headlights</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="vehicle_part">Vehicle Part</Label>
                <Select
                  value={saveData.vehicle_part}
                  onValueChange={(value) => {
                    console.log('Setting vehicle part:', value);
                    setSaveData(prev => ({ ...prev, vehicle_part: value }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select part" />
                  </SelectTrigger>
                  <SelectContent>
                    {segmentedParts.map((part) => (
                      <SelectItem key={part.class_name} value={part.class_name}>
                        {part.class_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={saveData.description}
                  onChange={(e) => {
                    console.log('Setting description:', e.target.value);
                    setSaveData(prev => ({ ...prev, description: e.target.value }));
                  }}
                  placeholder="Enter modification description..."
                  className="h-24"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  console.log('Closing modal...');
                  setShowSaveModal(false);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  console.log('Submitting save modal...');
                  handleSaveModalSubmit();
                }}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
} 