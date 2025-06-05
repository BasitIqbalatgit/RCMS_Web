// 'use client';

// import React, { useState, useRef, ChangeEvent } from 'react';

// const ApplyModification: React.FC = () => {
//   const [selectedImage, setSelectedImage] = useState<File | null>(null);
//   const [previewUrl, setPreviewUrl] = useState<string | null>(null);
//   const [classificationResult, setClassificationResult] = useState<string>('');
//   const [isLoading, setIsLoading] = useState<boolean>(false);
//   const [error, setError] = useState<string | null>(null);
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const revokePreviewUrl = () => {
//     if (previewUrl) {
//       URL.revokeObjectURL(previewUrl);
//     }
//   };

//   const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (!file || !file.type.startsWith('image/')) {
//       setError('Please upload a valid image file');
//       return;
//     }

//     revokePreviewUrl();
//     setSelectedImage(file);
//     setClassificationResult('');
//     setError(null);
//     const fileUrl = URL.createObjectURL(file);
//     setPreviewUrl(fileUrl);
//     classifyImage(file);
//   };

//   const classifyImage = async (imageFile: File) => {
//     setIsLoading(true);
//     try {
//       const formData = new FormData();
//       formData.append('image', imageFile);

//       const response = await fetch('/api/operator/classify-car', {
//         method: 'POST',
//         body: formData,
//         headers: {
//           'Accept': 'application/json',
//         },
//       });

//       const data: { result: string; error?: string } = await response.json();
//       if (!response.ok) {
//         throw new Error(data.error || 'Failed to classify image');
//       }

//       if (data.result.toLowerCase().includes("car")) {
//         setClassificationResult("This is a car");
//       } else {
//         setClassificationResult("This is not a car");
//       }
//     } catch (err) {
//       console.error('Classification error:', err);
//       setError(err instanceof Error ? err.message : 'An unexpected error occurred');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.dataTransfer.dropEffect = 'copy';
//   };

//   const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
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

//   const triggerFileInput = () => {
//     fileInputRef.current?.click();
//   };

//   const resetState = (e: React.MouseEvent) => {
//     e.stopPropagation();
//     revokePreviewUrl();
//     setPreviewUrl(null);
//     setSelectedImage(null);
//     setClassificationResult('');
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
//                     d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 0 010-1.414z"
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
//           <p>This component uses a TensorFlow model to classify car images</p>
//         </div>
//       </div>

//       {/* Right Section: Segmented Parts */}
//       <div className="w-full lg:w-1/2">
      
//       <h1 className="text-3xl font-bold text-center mb-8">Car Segmentation</h1>
//         <div className="border-2 border-gray-300 rounded-lg p-6 h-fit shadow-md">
//           <h2 className="text-2xl font-bold mb-4 text-center">Segmented Parts</h2>
//           {/* You can add more content or logic here for segmented parts */}
//           <p className="text-gray-600">Details about segmented parts will appear here once an image is processed.</p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ApplyModification;



'use client';

import React, { useState, useRef, ChangeEvent, DragEvent, MouseEvent } from 'react';

const ApplyModification: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [classificationResult, setClassificationResult] = useState<string>('');
  const [segmentedImageUrl, setSegmentedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const revokePreviewUrl = (): void => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      setError('Please upload a valid image file');
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

    revokePreviewUrl();
    setSelectedImage(file);
    const fileUrl = URL.createObjectURL(file);
    setPreviewUrl(fileUrl);
    classifyImage(file);
  };

  const triggerFileInput = (): void => {
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

  return (
    <div className="max-w-6xl mx-auto p-6 flex flex-col lg:flex-row gap-6">
      {/* Left Section: Image Upload and Classification */}
      <div className="w-full lg:w-1/2">
        <h1 className="text-3xl font-bold text-center mb-8">Car Classification</h1>

        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
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
          />

          {!previewUrl ? (
            <div className="py-12">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 mx-auto text-gray-400 mb-4"
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
              <p className="text-lg text-gray-600">Click to upload or drag and drop</p>
              <p className="text-sm text-gray-500 mt-1">Supported formats: JPG, PNG, GIF</p>
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
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 0 010-1.414z"
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
        <div className="border-2 border-gray-300 rounded-lg p-6  shadow-md h-fit">
          <h2 className="text-2xl font-bold mb-4 text-center">Detected Parts</h2>
          {segmentedImageUrl ? (
            <img
              src={segmentedImageUrl}
              alt="Segmented Image"
              className="max-h-64 mx-auto rounded-lg shadow-md object-contain"
            />

          ) : (
            <p className="text-gray-600">Upload a car image to see Detected parts.</p>
          )}
        </div>
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>This component uses a YOLO model to Detect car parts </p>
        </div>
      </div>
    </div>
  );
};

export default ApplyModification;