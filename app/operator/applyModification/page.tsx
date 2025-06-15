'use client';

import React, { useState, useRef, useEffect, ChangeEvent, DragEvent, MouseEvent } from 'react';
import { useSession } from 'next-auth/react';
import { UserRole } from '@/lib/types/UserTypes';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface AdminData {
  id: string;
  name: string;
  email: string;
  creditBalance: number;
  centreName?: string;
  location?: string;
}

interface DetectionResult {
  class: string;
  confidence: number;
  bbox?: number[];
  message?: string;
}

interface PartDetection {
  class_name: string;
  confidence: number;
  bbox: number[];
  center_point: [number, number];
  color?: string;
}

interface SegmentedResult {
  segmentedImageUrl: string;
  segmentedParts: {
    class_name: string;
    confidence: number;
    segmented_image_path: string;
    mask_path: string;
  }[];
}

const ApplyModification: React.FC = () => {
  const { data: session, status } = useSession();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [classificationResult, setClassificationResult] = useState<string>('');
  const [detectedParts, setDetectedParts] = useState<PartDetection[]>([]);
  const [segmentedImageUrl, setSegmentedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSegmenting, setIsSegmenting] = useState<boolean>(false);
  const [isDetectingParts, setIsDetectingParts] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState<boolean>(true);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [selectedParts, setSelectedParts] = useState<string[]>([]);
  const [showPartSelection, setShowPartSelection] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [showResults, setShowResults] = useState<boolean>(false);
  const [segmentedResult, setSegmentedResult] = useState<SegmentedResult | null>(null);

  // Fetch admin data when component mounts
  useEffect(() => {
    const fetchAdminData = async () => {
      if (status === 'authenticated' && session?.user?.id) {
        try {
          setIsLoadingAdmin(true);

          // If user is operator, get adminId first
          if (session.user.role === UserRole.OPERATOR) {
            const operatorResponse = await fetch(`/api/operator/${session.user.id}`);
            if (!operatorResponse.ok) {
              throw new Error('Failed to fetch operator data');
            }
            const operatorData = await operatorResponse.json();

            if (operatorData.adminId) {
              const adminResponse = await fetch(`/api/admins/${operatorData.adminId}`);
              if (!adminResponse.ok) {
                throw new Error('Failed to fetch admin data');
              }
              const adminInfo = await adminResponse.json();
              setAdminData(adminInfo);
            }
          } else if (session.user.role === UserRole.ADMIN) {
            // If user is admin, fetch their own data
            const adminResponse = await fetch(`/api/admins/${session.user.id}`);
            if (!adminResponse.ok) {
              throw new Error('Failed to fetch admin data');
            }
            const adminInfo = await adminResponse.json();
            setAdminData(adminInfo);
          }
        } catch (err) {
          console.error('Error fetching admin data:', err);
          setError('Failed to load credit information');
        } finally {
          setIsLoadingAdmin(false);
        }
      } else {
        setIsLoadingAdmin(false);
      }
    };

    fetchAdminData();
  }, [status, session]);

  const revokePreviewUrl = (): void => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const deductCredit = async (): Promise<boolean> => {
    if (!adminData || !adminData.id) {
      setError('Admin information not available');
      return false;
    }

    try {
      const response = await fetch(`/api/admins/${adminData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creditBalance: Math.max(0, adminData.creditBalance - 1)
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to deduct credit');
      }

      const updatedAdmin = await response.json();
      setAdminData(updatedAdmin);
      return true;
    } catch (err) {
      console.error('Error deducting credit:', err);
      setError('Failed to process credit deduction');
      return false;
    }
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      setError('Please upload a valid image file');
      return;
    }

    // Check credit balance before processing
    if (!adminData || adminData.creditBalance <= 0) {
      setError('Insufficient credits. Please contact your admin to purchase more credits.');
      return;
    }

    revokePreviewUrl();
    setSelectedImage(file);
    setClassificationResult('');
    setDetectedParts([]);
    setSegmentedImageUrl(null);
    setError(null);
    setProcessingStep('');
    setShowPartSelection(false);
    setSelectedParts([]);
    const fileUrl = URL.createObjectURL(file);
    setPreviewUrl(fileUrl);
    classifyImage(file);
  };

  const classifyImage = async (imageFile: File): Promise<void> => {
    setIsLoading(true);
    setProcessingStep('Step 1/3: Classifying image...');

    try {
      // Deduct credit before processing
      const creditDeducted = await deductCredit();
      if (!creditDeducted) {
        throw new Error('Failed to process credit deduction');
      }

      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await fetch('/api/operator/classify-car', {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
        },
      });

      const data: { result: string; error?: string } = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to classify image');
      }

      setClassificationResult(data.result);

      // Check if it's a car - need to be more specific to avoid false positives
      const resultLower = data.result.toLowerCase();
      const isCarDetected = resultLower.includes('car') && !resultLower.includes('not a car') && !resultLower.includes('no car');

      if (isCarDetected) {
        setProcessingStep('Step 1/3: Car detected! Moving to step 2...');
        // Small delay to show the classification result
        setTimeout(() => {
          detectCarParts(imageFile);
        }, 1000);
      } else {
        // Pipeline stops here - not a car, show specific message
        setProcessingStep('');
        setIsLoading(false);
        setError('Upload the car image please');
        return;
      }
    } catch (err) {
      console.error('Classification error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setProcessingStep('Pipeline stopped: Classification failed');
      setIsLoading(false);
    }
  };
  const detectCarParts = async (imageFile: File): Promise<void> => {
    setIsDetectingParts(true);
    setProcessingStep('Step 2/3: Detecting car parts with YOLO...');

    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await fetch('/api/operator/detect-parts', {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
        },
      });

      const data: { parts: PartDetection[]; error?: string } = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to detect car parts');
      }

      // Check if any parts were detected - if not, stop the pipeline
      if (data.parts && data.parts.length > 0) {
        setDetectedParts(data.parts);
        setShowPartSelection(true);
        setProcessingStep(`Step 2/3: Detected ${data.parts.length} car parts! Select parts for step 3.`);
      } else {
        // Pipeline stops here - no parts detected
        setDetectedParts([]);
        setShowPartSelection(false);
        setProcessingStep('Pipeline stopped: No car parts detected in the image');
        // You might want to show this as an error or info message
        setError('No car parts were detected in this image. Please try with a clearer car image.');
      }

    } catch (err) {
      console.error('Part detection error:', err);
      setError(err instanceof Error ? err.message : 'Failed to detect car parts');
      setProcessingStep('Pipeline stopped: Part detection failed');
    } finally {
      setIsDetectingParts(false);
      setIsLoading(false);
    }
  };

  const segmentSelectedParts = async () => {
    if (!selectedParts.length || !detectedParts.length || !selectedImage) {
      setError('Please select parts to segment and ensure an image is uploaded');
      return;
    }

    setIsSegmenting(true);
    setProcessingStep('Segmenting selected parts...');
    setError(null);
    setShowResults(true);
    setSegmentedResult(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('selectedParts', JSON.stringify(selectedParts));
      formData.append('detectedParts', JSON.stringify(detectedParts));

      const response = await fetch('/api/operator/segment', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log('Received segmentation data:', {
        success: data.success,
        timestamp: data.timestamp,
        hasSegmentedImageUrl: !!data.segmentedImageUrl,
        segmentedPartsCount: data.segmentedParts?.length,
        segmentedParts: data.segmentedParts?.map(part => ({
          class_name: part.class_name,
          confidence: part.confidence,
          hasImagePath: !!part.segmented_image_path,
          imagePath: part.segmented_image_path
        }))
      });
      
      if (!response.ok) {
        throw new Error(data.error || 'Segmentation failed');
      }

      if (!data.success || !data.timestamp) {
        throw new Error('Invalid response: missing timestamp');
      }

      // Update the segmented result state
      const result = {
        segmentedImageUrl: data.segmentedImageUrl,
        segmentedParts: data.segmentedParts
      };
      console.log('Setting segmented result:', {
        hasImageUrl: !!result.segmentedImageUrl,
        partsCount: result.segmentedParts?.length,
        parts: result.segmentedParts?.map(part => ({
          class_name: part.class_name,
          confidence: part.confidence,
          hasImagePath: !!part.segmented_image_path,
          imagePath: part.segmented_image_path
        }))
      });
      setSegmentedResult(result);
      setProcessingStep('Segmentation complete!');

    } catch (err) {
      console.error('Segmentation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to segment parts');
      setProcessingStep('');
      setIsSegmenting(false);
      setShowResults(false);
    } finally {
      setIsSegmenting(false);
    }
  };

  const handlePartSelection = (partName: string): void => {
    setSelectedParts(prev =>
      prev.includes(partName)
        ? prev.filter(p => p !== partName)
        : [...prev, partName]
    );
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      setError('Please drop a valid image file');
      return;
    }

    // Check credit balance before processing
    if (!adminData || adminData.creditBalance <= 0) {
      setError('Insufficient credits. Please contact your admin to purchase more credits.');
      return;
    }

    revokePreviewUrl();
    setSelectedImage(file);
    setClassificationResult('');
    setDetectedParts([]);
    setSegmentedImageUrl(null);
    setError(null);
    setProcessingStep('');
    setShowPartSelection(false);
    setSelectedParts([]);
    const fileUrl = URL.createObjectURL(file);
    setPreviewUrl(fileUrl);
    classifyImage(file);
  };

  const triggerFileInput = (): void => {
    // Check credit balance before allowing file selection
    if (!adminData || adminData.creditBalance <= 0) {
      setError('Insufficient credits. Please contact your admin to purchase more credits.');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleReset = () => {
    setShowResults(false);
    setIsSegmenting(false);
    setProcessingStep('');
    setError(null);
    setSelectedParts([]);
    setDetectedParts([]);
    setClassificationResult('');
    setPreviewUrl(null);
    setSelectedImage(null);
    setSegmentedResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      revokePreviewUrl();
      setIsSegmenting(false);
      setProcessingStep('');
    };
  }, []);

  if (status === 'loading' || isLoadingAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Please log in to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Car Analysis & Modification</h1>
              <p className="text-gray-600 mt-2">Upload a car image to analyze, detect parts, and apply modifications</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Available Credits</p>
              <p className="text-2xl font-bold text-blue-600">
                {adminData?.creditBalance || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {!showResults ? (
            // Upload and Detection Section
            <>
        {/* Upload Section */}
              <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Car Image</h2>

            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={triggerFileInput}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-64 mx-auto rounded-lg shadow-md"
                  />
                  <button
                        onClick={handleReset}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div>
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-gray-600 mb-2">Click to upload or drag and drop</p>
                  <p className="text-sm text-gray-500">PNG, JPG, GIF up to 10MB</p>
                </div>
              )}
                </div>
              </div>

              {/* Analysis Results */}
              {(classificationResult || detectedParts.length > 0) && (
                <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Analysis Results</h2>

            {/* Classification Result */}
            {classificationResult && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">Classification Result</h3>
                <p className="text-green-700">{classificationResult}</p>
              </div>
            )}

            {/* Detected Parts */}
            {showPartSelection && detectedParts.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Detected Car Parts</h3>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {detectedParts.map((part, index) => (
                    <label
                            key={`${part.class_name}-${index}`}
                      className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                              checked={selectedParts.includes(part.class_name)}
                              onChange={() => handlePartSelection(part.class_name)}
                              className="mr-3 h-4 w-4"
                            />
                            <div className="flex items-center flex-1">
                        <div
                          className="w-4 h-4 rounded-full mr-2"
                                style={{ backgroundColor: part.color || `hsl(${(index * 137.5) % 360}, 70%, 50%)` }}
                        ></div>
                              <span className="text-sm font-medium flex-1">{part.class_name}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({(part.confidence * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </label>
                  ))}
                </div>

                <button
                  onClick={segmentSelectedParts}
                  disabled={selectedParts.length === 0 || isSegmenting}
                        className={`w-full py-2 px-4 rounded-lg transition-colors ${
                          isSegmenting || selectedParts.length === 0
                            ? 'bg-gray-400 cursor-not-allowed opacity-75' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                        style={{ pointerEvents: isSegmenting ? 'none' : 'auto' }}
                      >
                        {isSegmenting ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Segmenting...
                          </div>
                        ) : (
                          `Segment Selected Parts (${selectedParts.length})`
                        )}
                </button>
              </div>
            )}
                </div>
              )}
            </>
          ) : (
            // Results Section
            <div className="space-y-6">
              {/* Processing Status */}
              {processingStep && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center">
                    {isSegmenting && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                    )}
                    <p className="text-blue-700">{processingStep}</p>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700">{error}</p>
                  <button
                    onClick={handleReset}
                    className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* Segmented Results */}
              {segmentedResult && !isSegmenting && !error && (
                <div className="space-y-8">
                  {/* Modified Image */}
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Modified Image</h2>
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                      <Image
                        src={segmentedResult.segmentedImageUrl}
                        alt="Modified car image"
                        fill
                        className="object-contain"
                        onError={(e) => {
                          console.error('Failed to load modified image:', e);
                        }}
                      />
                    </div>
                  </div>

                  {/* Segmented Parts */}
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      Segmented Parts ({segmentedResult.segmentedParts.length})
                    </h2>
                    {segmentedResult.segmentedParts.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {segmentedResult.segmentedParts.map((part, index) => (
                          <div key={`${part.class_name}-${index}`} className="space-y-2">
                            <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-gray-50">
                              <Image
                                src={part.segmented_image_path}
                                alt={`Segmented ${part.class_name}`}
                                fill
                                className="object-contain"
                                onError={(e) => {
                                  console.error(`Failed to load image for ${part.class_name}:`, e);
                                }}
                              />
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                              <h3 className="font-semibold capitalize">{part.class_name}</h3>
                              <p className="text-sm text-gray-600">
                                Confidence: {(part.confidence * 100).toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-600">No parts were successfully segmented</p>
                      </div>
                    )}
                  </div>

                  {/* Reset Button */}
                  <div className="flex justify-center">
                    <button
                      onClick={handleReset}
                      className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Start New Analysis
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold text-lg">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Upload Image</h3>
              <p className="text-gray-600 text-sm">Upload a clear image of a car for analysis</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold text-lg">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Detect Parts</h3>
              <p className="text-gray-600 text-sm">AI analyzes and identifies different car parts</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold text-lg">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Segment & Modify</h3>
              <p className="text-gray-600 text-sm">Select parts to segment and apply modifications</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyModification;