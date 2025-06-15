'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';

interface SegmentedPart {
    class_name: string;
    confidence: number;
    segmented_image_path: string;
    mask_path: string;
    mask_area: number;
}

interface SegmentationData {
    originalImageUrl: string;
    modifiedImageUrl: string;
    segmentedParts: SegmentedPart[];
    timestamp: string;
}

export default function SegmentedPartsView() {
    const params = useParams();
    const [data, setData] = useState<SegmentationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSegmentationData = async () => {
            try {
                const response = await fetch(`/api/operator/segmentation-data/${params.id}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch segmentation data');
                }
                const data = await response.json();
                setData(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load segmentation data');
            } finally {
                setLoading(false);
            }
        };

        fetchSegmentationData();
    }, [params.id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-lg">Loading segmentation data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center text-red-600">
                    <h2 className="text-2xl font-bold mb-2">Error</h2>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p>No segmentation data found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Segmented Car Parts</h1>
            
            {/* Original and Modified Images */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Original Image</h2>
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                        <Image
                            src={data.originalImageUrl}
                            alt="Original car image"
                            fill
                            className="object-contain"
                        />
                    </div>
                </div>
                
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Modified Image</h2>
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                        <Image
                            src={data.modifiedImageUrl}
                            alt="Modified car image"
                            fill
                            className="object-contain"
                        />
                    </div>
                </div>
            </div>

            {/* Segmented Parts */}
            <div className="space-y-8">
                <h2 className="text-2xl font-semibold">Segmented Parts</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data.segmentedParts.map((part, index) => (
                        <div key={index} className="space-y-2">
                            <div className="relative aspect-square w-full overflow-hidden rounded-lg border">
                                <Image
                                    src={part.segmented_image_path}
                                    alt={`Segmented ${part.class_name}`}
                                    fill
                                    className="object-contain"
                                />
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <h3 className="font-semibold capitalize">{part.class_name}</h3>
                                <p className="text-sm text-gray-600">
                                    Confidence: {(part.confidence * 100).toFixed(1)}%
                                </p>
                                <p className="text-sm text-gray-600">
                                    Area: {part.mask_area} pixels
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
} 