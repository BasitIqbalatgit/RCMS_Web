'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input'; // Add Input from ShadCN
import { Skeleton } from '@/components/ui/skeleton';
import { Download, RefreshCw, Search } from 'lucide-react'; // Add Search icon
import jsPDF from 'jspdf';
import ModificationDetailsModal from '@/components/operatorComponents/ModificationDetailsModal';
import img1 from '@/public/landing-page/1.jpg';

// Define interfaces
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

// Fake data (all items are "Saved")
const fakeRecentWork: Modification[] = [
  {
    _id: '1',
    operator_id: 'operator123',
    original_image_url: '/landing-page/1.jpg',
    modified_image_url: '/landing-page/2.jpg',
    modification_type: 'Rims',
    modification_details: { rim_style: 'Alloy', color: 'Black' },
    status: 'Saved',
    timestamp: '2025-04-11T10:15:00Z',
    vehicle_part: 'Rims',
    description: 'Customer preferred matte finish for a sleek look.',
  },
  {
    _id: '2',
    operator_id: 'operator123',
    original_image_url: '/landing-page/3.jpg',
    modified_image_url: '/landing-page/4.jpg',
    modification_type: 'Paint',
    modification_details: { color: 'Red' },
    status: 'Saved',
    timestamp: '2025-04-11T09:50:00Z',
    vehicle_part: 'Body',
    description: 'Glossy finish applied as per customer request.',
  },
  {
    _id: '3',
    operator_id: 'operator123',
    original_image_url: '/landing-page/5.jpg',
    modified_image_url: '/landing-page/6.jpg',
    modification_type: 'Spoiler',
    modification_details: { material: 'Carbon Fiber' },
    status: 'Saved',
    timestamp: '2025-04-11T09:30:00Z',
    vehicle_part: 'Rear',
    description: 'Customer approved the final design.',
  },
  {
    _id: '4',
    operator_id: 'operator123',
    original_image_url: '/landing-page/7.jpg',
    modified_image_url: '/landing-page/8.jpg',
    modification_type: 'Headlights',
    modification_details: { type: 'LED', brightness: 'High' },
    status: 'Saved',
    timestamp: '2025-04-10T14:20:00Z',
    vehicle_part: 'Front',
    description: 'Upgraded to LED for better visibility.',
  },
];

const RecentWorkPage: React.FC = () => {
  const [recentWork, setRecentWork] = useState<Modification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sortBy, setSortBy] = useState<'timestamp-desc' | 'timestamp-asc'>('timestamp-desc');
  const [searchQuery, setSearchQuery] = useState<string>(''); // New state for search
  const [page, setPage] = useState<number>(1);
  const [selectedModification, setSelectedModification] = useState<Modification | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const itemsPerPage = 3;

  // Simulate fetching and filtering data
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      let filteredData = [...fakeRecentWork];

      // Apply search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filteredData = filteredData.filter((item) =>
          item.modification_type.toLowerCase().includes(query) ||
          item.vehicle_part.toLowerCase().includes(query) ||
          Object.values(item.modification_details).some((value) =>
            value.toLowerCase().includes(query)
          ) ||
          item.description.toLowerCase().includes(query)
        );
      }

      // Apply sorting
      if (sortBy === 'timestamp-asc') {
        filteredData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      } else {
        filteredData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      }

      setRecentWork(filteredData);
      setLoading(false);
    }, 1000);
  }, [sortBy, searchQuery]);

  // Pagination logic
  const totalPages = Math.ceil(recentWork.length / itemsPerPage);
  const paginatedData = recentWork.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // Handlers
  const handleView = (id: string) => {
    const modification = recentWork.find((item) => item._id === id);
    if (modification) {
      setSelectedModification(modification);
      setIsModalOpen(true);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  };

  const handleDownloadReport = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    let y = margin;

    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('RCMS', pageWidth / 2, y, { align: 'center' });
    y += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Generated By: John Doe', pageWidth / 2, y, { align: 'center' });
    y += 10;

    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    doc.setFontSize(10);
    recentWork.forEach((item, index) => {
      const detailsText = Object.values(item.modification_details).join(', ');
      const descriptionText = item.description || 'No description provided.';
      const textLines = [
        `ID: ${item._id}`,
        `Type: ${item.modification_type}`,
        `Part: ${item.vehicle_part}`,
        `Details: ${detailsText}`,
        `Status: ${item.status}`,
        `Timestamp: ${new Date(item.timestamp).toLocaleString()}`,
        `Description: ${descriptionText}`,
      ];

      const lineHeight = 7;
      const spaceNeeded = textLines.length * lineHeight + 10;
      if (y + spaceNeeded > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        y = margin;
      }

      doc.setFont('helvetica', 'bold');
      doc.text(`Item ${index + 1}`, margin, y);
      y += lineHeight;

      doc.setFont('helvetica', 'normal');
      textLines.forEach((line) => {
        doc.text(line, margin + 5, y);
        y += lineHeight;
      });

      y += 5;
      doc.setLineWidth(0.2);
      doc.line(margin, y, pageWidth - margin, y);
      y += 5;
    });

    doc.save('recent_work_report.pdf');
  };

  const handleSortChange = (value: 'timestamp-desc' | 'timestamp-asc') => {
    setSortBy(value);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1); // Reset to first page on search
  };

  return (
    <section className="p-6 max-w-full w-full mx-auto min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Recent Work</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleDownloadReport}
            className="bg-green-600 hover:bg-green-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Report
          </Button>
        </div>
      </div>

      {/* Search and Sorting */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative w-full sm:w-64">
          <Input
            type="text"
            placeholder="Search modifications..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
        </div>
        <Select value={sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="timestamp-desc">Newest First</SelectItem>
            <SelectItem value="timestamp-asc">Oldest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Recent Work List */}
      {loading ? (
        <div className="space-y-4">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
        </div>
      ) : paginatedData.length === 0 ? (
        <p className="text-center text-gray-500">No recent work found.</p>
      ) : (
        <div className="space-y-4">
          {paginatedData.map((work) => (
            <Card
              key={work._id}
              className="hover:shadow-xl transition-shadow border-gray-200"
            >
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-700">
                  {work.modification_type} - {work.vehicle_part}
                </CardTitle>
                <Badge className="bg-green-500 text-white">Saved</Badge>
              </CardHeader>
              <CardContent className="flex flex-col md:flex-row gap-6">
                <img
                  src={work.modified_image_url}
                  alt={`${work.modification_type} Preview`}
                  className="w-32 h-32 object-cover rounded-md border"
                />
                <div className="flex-1 space-y-2">
                  <p className="text-sm text-gray-600">
                    <strong>Details:</strong>{' '}
                    {Object.values(work.modification_details).join(', ')}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Timestamp:</strong>{' '}
                    {new Date(work.timestamp).toLocaleString()}
                  </p>
                  {work.description && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-sm text-gray-600 truncate max-w-xs">
                            <strong>Note:</strong> {work.description}
                          </p>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{work.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                <div className="flex gap-2 items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(work._id)}
                  >
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && paginatedData.length > 0 && (
        <div className="flex justify-between items-center mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Modal */}
      <ModificationDetailsModal
        modification={selectedModification}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </section>
  );
};

export default RecentWorkPage;