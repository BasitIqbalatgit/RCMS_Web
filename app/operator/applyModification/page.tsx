


// 'use client';

// import React, { useState, useRef, ChangeEvent, DragEvent, MouseEvent } from 'react';

// const ApplyModification: React.FC = () => {
//   const [selectedImage, setSelectedImage] = useState<File | null>(null);
//   const [previewUrl, setPreviewUrl] = useState<string | null>(null);
//   const [classificationResult, setClassificationResult] = useState<string>('');
//   const [segmentedImageUrl, setSegmentedImageUrl] = useState<string | null>(null);
//   const [isLoading, setIsLoading] = useState<boolean>(false);
//   const [error, setError] = useState<string | null>(null);
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const revokePreviewUrl = (): void => {
//     if (previewUrl) {
//       URL.revokeObjectURL(previewUrl);
//     }
//   };

//   const handleImageUpload = (event: ChangeEvent<HTMLInputElement>): void => {
//     const file = event.target.files?.[0];
//     if (!file || !file.type.startsWith('image/')) {
//       setError('Please upload a valid image file');
//       return;
//     }

//     revokePreviewUrl();
//     setSelectedImage(file);
//     setClassificationResult('');
//     setSegmentedImageUrl(null);
//     setError(null);
//     const fileUrl = URL.createObjectURL(file);
//     setPreviewUrl(fileUrl);
//     classifyImage(file);
//   };

//   const classifyImage = async (imageFile: File): Promise<void> => {
//     setIsLoading(true);
//     try {
//       const formData = new FormData();
//       formData.append('image', imageFile);

//       const response = await fetch('/api/operator/classify-car', {
//         method: 'POST',
//         body: formData,
//         headers: {
//           Accept: 'application/json',
//         },
//       });

//       const data: { result: string; error?: string } = await response.json();
//       if (!response.ok) {
//         throw new Error(data.error || 'Failed to classify image');
//       }

//       if (data.result.toLowerCase().includes('car')) {
//         setClassificationResult('This is a car');
//         segmentImage(imageFile); // Call segmentation if it's a car
//       } else {
//         setClassificationResult('This is not a car');
//       }
//     } catch (err) {
//       console.error('Classification error:', err);
//       setError(err instanceof Error ? err.message : 'An unexpected error occurred');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const segmentImage = async (imageFile: File): Promise<void> => {
//     try {
//       const formData = new FormData();
//       formData.append('image', imageFile);

//       const response = await fetch('/api/operator/segment', {
//         method: 'POST',
//         body: formData,
//         headers: {
//           Accept: 'application/json',
//         },
//       });

//       const data: { segmentedImageUrl: string; error?: string } = await response.json();
//       if (!response.ok) {
//         throw new Error(data.error || 'Failed to segment image');
//       }

//       setSegmentedImageUrl(`${data.segmentedImageUrl}?t=${Date.now()}`); // Add timestamp to force refresh
//     } catch (err) {
//       console.error('Segmentation error:', err);
//       setError(err instanceof Error ? err.message : 'Failed to segment image');
//     }
//   };

//   const handleDragOver = (e: DragEvent<HTMLDivElement>): void => {
//     e.preventDefault();
//     e.dataTransfer.dropEffect = 'copy';
//   };

//   const handleDrop = (e: DragEvent<HTMLDivElement>): void => {
//     e.preventDefault();
//     const file = e.dataTransfer.files?.[0];
//     if (!file || !file.type.startsWith('image/')) {
//       setError('Please drop a valid image file');
//       return;
//     }

//     revokePreviewUrl();
//     setSelectedImage(file);
//     const fileUrl = URL.createObjectURL(file);
//     setPreviewUrl(fileUrl);
//     classifyImage(file);
//   };

//   const triggerFileInput = (): void => {
//     fileInputRef.current?.click();
//   };

//   const resetState = (e: MouseEvent<HTMLButtonElement>): void => {
//     e.stopPropagation();
//     revokePreviewUrl();
//     setPreviewUrl(null);
//     setSelectedImage(null);
//     setClassificationResult('');
//     setSegmentedImageUrl(null);
//     setError(null);
//     if (fileInputRef.current) {
//       fileInputRef.current.value = '';
//     }
//   };

//   return (
//     <div className="max-w-6xl mx-auto p-6 flex flex-col lg:flex-row gap-6">
//       {/* Left Section: Image Upload and Classification */}
//       <div className="w-full lg:w-1/2">
//         <h1 className="text-3xl font-bold text-center mb-8">Car Classification</h1>

//         <div
//           className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
//           onClick={triggerFileInput}
//           onDragOver={handleDragOver}
//           onDrop={handleDrop}
//         >
//           <input
//             type="file"
//             ref={fileInputRef}
//             className="hidden"
//             accept="image/jpeg,image/png,image/gif"
//             onChange={handleImageUpload}
//           />

//           {!previewUrl ? (
//             <div className="py-12">
//               <svg
//                 xmlns="http://www.w3.org/2000/svg"
//                 className="h-16 w-16 mx-auto text-gray-400 mb-4"
//                 fill="none"
//                 viewBox="0 0 24 24"
//                 stroke="currentColor"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
//                 />
//               </svg>
//               <p className="text-lg text-gray-600">Click to upload or drag and drop</p>
//               <p className="text-sm text-gray-500 mt-1">Supported formats: JPG, PNG, GIF</p>
//             </div>
//           ) : (
//             <div className="relative">
//               <img
//                 src={previewUrl}
//                 alt="Preview"
//                 className="max-h-64 mx-auto rounded-lg shadow-md object-contain"
//               />
//               <button
//                 className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
//                 onClick={resetState}
//                 aria-label="Remove image"
//               >
//                 <svg
//                   xmlns="http://www.w3.org/2000/svg"
//                   className="h-5 w-5"
//                   viewBox="0 0 20 20"
//                   fill="currentColor"
//                 >
//                   <path
//                     fillRule="evenodd"
//                     d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
//                     clipRule="evenodd"
//                   />
//                 </svg>
//               </button>
//             </div>
//           )}
//         </div>

//         <div className="bg-gray-100 rounded-lg p-6 text-center">
//           <h2 className="text-xl font-semibold mb-4">Classification Result</h2>

//           {isLoading ? (
//             <div className="flex justify-center items-center py-6">
//               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
//               <span className="ml-2 text-gray-600">Analyzing image...</span>
//             </div>
//           ) : error ? (
//             <div className="text-red-500 py-4">{error}</div>
//           ) : classificationResult ? (
//             <div className="text-2xl font-bold py-4 text-gray-800">{classificationResult}</div>
//           ) : (
//             <p className="text-gray-500 py-4">Upload an image to see classification results</p>
//           )}
//         </div>

//         <div className="mt-6 text-center text-sm text-gray-500">
//           <p>This component uses a CNN model to classify car images</p>
//         </div>
//       </div>

//       {/* Right Section: Segmented Parts */}
//       <div className="w-full lg:w-1/2">
//         <h1 className="text-3xl font-bold text-center mb-8">Car Part Detection</h1>
//         <div className="border-2 border-gray-300 rounded-lg p-6  shadow-md h-fit">
//           <h2 className="text-2xl font-bold mb-4 text-center">Detected Parts</h2>
//           {segmentedImageUrl ? (
//             <img
//               src={segmentedImageUrl}
//               alt="Segmented Image"
//               className="max-h-64 mx-auto rounded-lg shadow-md object-contain"
//             />

//           ) : (
//             <p className="text-gray-600">Upload a car image to see Detected parts.</p>
//           )}
//         </div>
//         <div className="mt-6 text-center text-sm text-gray-500">
//           <p>This component uses a YOLO model to Detect car parts </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ApplyModification;



'use client';

import React, { useState, useRef, useEffect, ChangeEvent, DragEvent, MouseEvent } from 'react';
import { useSession } from 'next-auth/react';
import { UserRole } from '@/lib/types/UserTypes';

interface AdminData {
  id: string;
  name: string;
  email: string;
  creditBalance: number;
  centreName?: string;
  location?: string;
}

const ApplyModification: React.FC = () => {
  const { data: session, status } = useSession();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [classificationResult, setClassificationResult] = useState<string>('');
  const [segmentedImageUrl, setSegmentedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setSegmentedImageUrl(null);
    setError(null);
    const fileUrl = URL.createObjectURL(file);
    setPreviewUrl(fileUrl);
    classifyImage(file);
  };

  const classifyImage = async (imageFile: File): Promise<void> => {
    setIsLoading(true);
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

      if (data.result.toLowerCase().includes('car')) {
        setClassificationResult('This is a car');
        segmentImage(imageFile); // Call segmentation if it's a car
      } else {
        setClassificationResult('This is not a car');
      }
    } catch (err) {
      console.error('Classification error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const segmentImage = async (imageFile: File): Promise<void> => {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await fetch('/api/operator/segment', {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
        },
      });

      const data: { segmentedImageUrl: string; error?: string } = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to segment image');
      }

      setSegmentedImageUrl(`${data.segmentedImageUrl}?t=${Date.now()}`); // Add timestamp to force refresh
    } catch (err) {
      console.error('Segmentation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to segment image');
    }
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

  const resetState = (e: MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation();
    revokePreviewUrl();
    setPreviewUrl(null);
    setSelectedImage(null);
    setClassificationResult('');
    setSegmentedImageUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Show loading state while fetching admin data
  if (status === 'loading' || isLoadingAdmin) {
    return (
      <div className="max-w-6xl mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show authentication error
  if (status === 'unauthenticated') {
    return (
      <div className="max-w-6xl mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 text-lg">Please sign in to access this service</p>
        </div>
      </div>
    );
  }

  // Show low credits message
  if (adminData && adminData.creditBalance <= 0) {
    return (
      <div className="max-w-6xl mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center bg-yellow-50 border border-yellow-200 rounded-lg p-8 max-w-md">
          <div className="text-yellow-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Low Credits</h2>
          <p className="text-gray-600 mb-6">
            You have insufficient credits to use this service. Please contact your admin to purchase more credits.
          </p>
          <div className="bg-gray-100 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <strong>Current Balance:</strong> {adminData.creditBalance} credits
            </p>
            {session?.user?.role === UserRole.OPERATOR && (
              <p className="text-sm text-gray-600 mt-2">
                Contact your admin to add more credits to your account.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 flex flex-col lg:flex-row gap-6">
      {/* Credit Balance Display */}
      {/* {adminData && (
        <div className="w-full mb-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
                <span className="text-blue-800 font-medium">Available Credits:</span>
              </div>
              <span className={`font-bold text-lg ${adminData.creditBalance <= 5 ? 'text-red-600' : 'text-blue-600'}`}>
                {adminData.creditBalance}
              </span>
            </div>
            {adminData.creditBalance <= 5 && adminData.creditBalance > 0 && (
              <p className="text-sm text-orange-600 mt-2">
                ⚠️ Low credit balance. Each image analysis costs 1 credit.
              </p>
            )}
          </div>
        </div>
      )} */}

      {/* Left Section: Image Upload and Classification */}
      <div className="w-full lg:w-1/2">
        <h1 className="text-3xl font-bold text-center mb-8">Car Classification</h1>

        <div
          className={`border-2 border-dashed rounded-lg p-8 mb-6 text-center transition-colors ${
            adminData && adminData.creditBalance > 0 
              ? 'border-gray-300 cursor-pointer hover:bg-gray-50' 
              : 'border-gray-200 cursor-not-allowed bg-gray-50'
          }`}
          onClick={triggerFileInput}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/jpeg,image/png,image/gif"
            onChange={handleImageUpload}
            disabled={!adminData || adminData.creditBalance <= 0}
          />

          {!previewUrl ? (
            <div className="py-12">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-16 w-16 mx-auto mb-4 ${
                  adminData && adminData.creditBalance > 0 ? 'text-gray-400' : 'text-gray-300'
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className={`text-lg ${adminData && adminData.creditBalance > 0 ? 'text-gray-600' : 'text-gray-400'}`}>
                {adminData && adminData.creditBalance > 0 
                  ? 'Click to upload or drag and drop' 
                  : 'Insufficient credits - Cannot upload'
                }
              </p>
              <p className={`text-sm mt-1 ${adminData && adminData.creditBalance > 0 ? 'text-gray-500' : 'text-gray-400'}`}>
                Supported formats: JPG, PNG, GIF
              </p>
              {adminData && adminData.creditBalance > 0 && (
                <p className="text-xs text-blue-600 mt-2">
                  Cost: 1 credit per analysis
                </p>
              )}
            </div>
          ) : (
            <div className="relative">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-64 mx-auto rounded-lg shadow-md object-contain"
              />
              <button
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                onClick={resetState}
                aria-label="Remove image"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>

        <div className="bg-gray-100 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">Classification Result</h2>

          {isLoading ? (
            <div className="flex justify-center items-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-600">Analyzing image...</span>
            </div>
          ) : error ? (
            <div className="text-red-500 py-4">{error}</div>
          ) : classificationResult ? (
            <div className="text-2xl font-bold py-4 text-gray-800">{classificationResult}</div>
          ) : (
            <p className="text-gray-500 py-4">Upload an image to see classification results</p>
          )}
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>This component uses a CNN model to classify car images</p>
        </div>
      </div>

      {/* Right Section: Segmented Parts */}
      <div className="w-full lg:w-1/2">
        <h1 className="text-3xl font-bold text-center mb-8">Car Part Detection</h1>
        <div className="border-2 border-gray-300 rounded-lg p-6 shadow-md h-fit">
          <h2 className="text-2xl font-bold mb-4 text-center">Detected Parts</h2>
          {segmentedImageUrl ? (
            <img
              src={segmentedImageUrl}
              alt="Segmented Image"
              className="max-h-64 mx-auto rounded-lg shadow-md object-contain"
            />
          ) : (
            <p className="text-gray-600">Upload a car image to see detected parts.</p>
          )}
        </div>
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>This component uses a YOLO model to detect car parts</p>
        </div>
      </div>
    </div>
  );
};

export default ApplyModification;