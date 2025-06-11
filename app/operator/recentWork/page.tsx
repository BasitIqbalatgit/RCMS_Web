// 'use client';

// import React, { useState, useEffect } from 'react';
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from '@/components/ui/tooltip';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
// import { Input } from '@/components/ui/input'; // Add Input from ShadCN
// import { Skeleton } from '@/components/ui/skeleton';
// import { Download, RefreshCw, Search } from 'lucide-react'; // Add Search icon
// import jsPDF from 'jspdf';
// import ModificationDetailsModal from '@/components/operatorComponents/ModificationDetailsModal';
// import img1 from '@/public/landing-page/1.jpg';

// // Define interfaces
// interface ModificationDetails {
//   [key: string]: string;
// }

// interface Modification {
//   _id: string;
//   operator_id: string;
//   original_image_url: string;
//   modified_image_url: string;
//   modification_type: string;
//   modification_details: ModificationDetails;
//   status: 'Saved';
//   timestamp: string;
//   vehicle_part: string;
//   description: string;
// }

// // Fake data (all items are "Saved")
// const fakeRecentWork: Modification[] = [
//   {
//     _id: '1',
//     operator_id: 'operator123',
//     original_image_url: '/landing-page/1.jpg',
//     modified_image_url: '/landing-page/2.jpg',
//     modification_type: 'Rims',
//     modification_details: { rim_style: 'Alloy', color: 'Black' },
//     status: 'Saved',
//     timestamp: '2025-04-11T10:15:00Z',
//     vehicle_part: 'Rims',
//     description: 'Customer preferred matte finish for a sleek look.',
//   },
//   {
//     _id: '2',
//     operator_id: 'operator123',
//     original_image_url: '/landing-page/3.jpg',
//     modified_image_url: '/landing-page/4.jpg',
//     modification_type: 'Paint',
//     modification_details: { color: 'Red' },
//     status: 'Saved',
//     timestamp: '2025-04-11T09:50:00Z',
//     vehicle_part: 'Body',
//     description: 'Glossy finish applied as per customer request.',
//   },
//   {
//     _id: '3',
//     operator_id: 'operator123',
//     original_image_url: '/landing-page/5.jpg',
//     modified_image_url: '/landing-page/6.jpg',
//     modification_type: 'Spoiler',
//     modification_details: { material: 'Carbon Fiber' },
//     status: 'Saved',
//     timestamp: '2025-04-11T09:30:00Z',
//     vehicle_part: 'Rear',
//     description: 'Customer approved the final design.',
//   },
//   {
//     _id: '4',
//     operator_id: 'operator123',
//     original_image_url: '/landing-page/7.jpg',
//     modified_image_url: '/landing-page/8.jpg',
//     modification_type: 'Headlights',
//     modification_details: { type: 'LED', brightness: 'High' },
//     status: 'Saved',
//     timestamp: '2025-04-10T14:20:00Z',
//     vehicle_part: 'Front',
//     description: 'Upgraded to LED for better visibility.',
//   },
// ];

// const RecentWorkPage: React.FC = () => {
//   const [recentWork, setRecentWork] = useState<Modification[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [sortBy, setSortBy] = useState<'timestamp-desc' | 'timestamp-asc'>('timestamp-desc');
//   const [searchQuery, setSearchQuery] = useState<string>(''); // New state for search
//   const [page, setPage] = useState<number>(1);
//   const [selectedModification, setSelectedModification] = useState<Modification | null>(null);
//   const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
//   const itemsPerPage = 3;

//   // Simulate fetching and filtering data
//   useEffect(() => {
//     setLoading(true);
//     setTimeout(() => {
//       let filteredData = [...fakeRecentWork];

//       // Apply search filter
//       if (searchQuery.trim()) {
//         const query = searchQuery.toLowerCase();
//         filteredData = filteredData.filter((item) =>
//           item.modification_type.toLowerCase().includes(query) ||
//           item.vehicle_part.toLowerCase().includes(query) ||
//           Object.values(item.modification_details).some((value) =>
//             value.toLowerCase().includes(query)
//           ) ||
//           item.description.toLowerCase().includes(query)
//         );
//       }

//       // Apply sorting
//       if (sortBy === 'timestamp-asc') {
//         filteredData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
//       } else {
//         filteredData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
//       }

//       setRecentWork(filteredData);
//       setLoading(false);
//     }, 1000);
//   }, [sortBy, searchQuery]);

//   // Pagination logic
//   const totalPages = Math.ceil(recentWork.length / itemsPerPage);
//   const paginatedData = recentWork.slice(
//     (page - 1) * itemsPerPage,
//     page * itemsPerPage
//   );

//   // Handlers
//   const handleView = (id: string) => {
//     const modification = recentWork.find((item) => item._id === id);
//     if (modification) {
//       setSelectedModification(modification);
//       setIsModalOpen(true);
//     }
//   };

//   const handleRefresh = () => {
//     setLoading(true);
//     setTimeout(() => setLoading(false), 500);
//   };

//   const handleDownloadReport = () => {
//     const doc = new jsPDF();
//     const pageWidth = doc.internal.pageSize.getWidth();
//     const margin = 10;
//     let y = margin;

//     doc.setFontSize(22);
//     doc.setFont('helvetica', 'bold');
//     doc.text('RCMS', pageWidth / 2, y, { align: 'center' });
//     y += 10;

//     doc.setFontSize(12);
//     doc.setFont('helvetica', 'normal');
//     doc.text('Generated By: John Doe', pageWidth / 2, y, { align: 'center' });
//     y += 10;

//     doc.setLineWidth(0.5);
//     doc.line(margin, y, pageWidth - margin, y);
//     y += 10;

//     doc.setFontSize(10);
//     recentWork.forEach((item, index) => {
//       const detailsText = Object.values(item.modification_details).join(', ');
//       const descriptionText = item.description || 'No description provided.';
//       const textLines = [
//         `ID: ${item._id}`,
//         `Type: ${item.modification_type}`,
//         `Part: ${item.vehicle_part}`,
//         `Details: ${detailsText}`,
//         `Status: ${item.status}`,
//         `Timestamp: ${new Date(item.timestamp).toLocaleString()}`,
//         `Description: ${descriptionText}`,
//       ];

//       const lineHeight = 7;
//       const spaceNeeded = textLines.length * lineHeight + 10;
//       if (y + spaceNeeded > doc.internal.pageSize.getHeight() - margin) {
//         doc.addPage();
//         y = margin;
//       }

//       doc.setFont('helvetica', 'bold');
//       doc.text(`Item ${index + 1}`, margin, y);
//       y += lineHeight;

//       doc.setFont('helvetica', 'normal');
//       textLines.forEach((line) => {
//         doc.text(line, margin + 5, y);
//         y += lineHeight;
//       });

//       y += 5;
//       doc.setLineWidth(0.2);
//       doc.line(margin, y, pageWidth - margin, y);
//       y += 5;
//     });

//     doc.save('recent_work_report.pdf');
//   };

//   const handleSortChange = (value: 'timestamp-desc' | 'timestamp-asc') => {
//     setSortBy(value);
//   };

//   const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setSearchQuery(e.target.value);
//     setPage(1); // Reset to first page on search
//   };

//   return (
//     <section className="p-6 max-w-full w-full mx-auto min-h-screen">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-6">
//         <h1 className="text-3xl font-bold text-gray-800">Recent Work</h1>
//         <div className="flex gap-2">
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={handleRefresh}
//             disabled={loading}
//           >
//             <RefreshCw className="w-4 h-4 mr-2" />
//             Refresh
//           </Button>
//           <Button
//             size="sm"
//             onClick={handleDownloadReport}
//             className="bg-green-600 hover:bg-green-700"
//           >
//             <Download className="w-4 h-4 mr-2" />
//             Download Report
//           </Button>
//         </div>
//       </div>

//       {/* Search and Sorting */}
//       <div className="flex flex-col sm:flex-row gap-4 mb-6">
//         <div className="relative w-full sm:w-64">
//           <Input
//             type="text"
//             placeholder="Search modifications..."
//             value={searchQuery}
//             onChange={handleSearchChange}
//             className="pl-10"
//           />
//           <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
//         </div>
//         <Select value={sortBy} onValueChange={handleSortChange}>
//           <SelectTrigger className="w-full sm:w-48">
//             <SelectValue placeholder="Sort by" />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value="timestamp-desc">Newest First</SelectItem>
//             <SelectItem value="timestamp-asc">Oldest First</SelectItem>
//           </SelectContent>
//         </Select>
//       </div>

//       {/* Recent Work List */}
//       {loading ? (
//         <div className="space-y-4">
//           {Array(3)
//             .fill(0)
//             .map((_, i) => (
//               <Skeleton key={i} className="h-32 w-full" />
//             ))}
//         </div>
//       ) : paginatedData.length === 0 ? (
//         <p className="text-center text-gray-500">No recent work found.</p>
//       ) : (
//         <div className="space-y-4">
//           {paginatedData.map((work) => (
//             <Card
//               key={work._id}
//               className="hover:shadow-xl transition-shadow border-gray-200"
//             >
//               <CardHeader className="flex flex-row items-center justify-between">
//                 <CardTitle className="text-lg font-semibold text-gray-700">
//                   {work.modification_type} - {work.vehicle_part}
//                 </CardTitle>
//                 <Badge className="bg-green-500 text-white">Saved</Badge>
//               </CardHeader>
//               <CardContent className="flex flex-col md:flex-row gap-6">
//                 <img
//                   src={work.modified_image_url}
//                   alt={`${work.modification_type} Preview`}
//                   className="w-32 h-32 object-cover rounded-md border"
//                 />
//                 <div className="flex-1 space-y-2">
//                   <p className="text-sm text-gray-600">
//                     <strong>Details:</strong>{' '}
//                     {Object.values(work.modification_details).join(', ')}
//                   </p>
//                   <p className="text-sm text-gray-600">
//                     <strong>Timestamp:</strong>{' '}
//                     {new Date(work.timestamp).toLocaleString()}
//                   </p>
//                   {work.description && (
//                     <TooltipProvider>
//                       <Tooltip>
//                         <TooltipTrigger asChild>
//                           <p className="text-sm text-gray-600 truncate max-w-xs">
//                             <strong>Note:</strong> {work.description}
//                           </p>
//                         </TooltipTrigger>
//                         <TooltipContent>
//                           <p>{work.description}</p>
//                         </TooltipContent>
//                       </Tooltip>
//                     </TooltipProvider>
//                   )}
//                 </div>
//                 <div className="flex gap-2 items-center">
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() => handleView(work._id)}
//                   >
//                     View
//                   </Button>
//                 </div>
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//       )}

//       {/* Pagination */}
//       {!loading && paginatedData.length > 0 && (
//         <div className="flex justify-between items-center mt-6">
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={() => setPage((p) => Math.max(1, p - 1))}
//             disabled={page === 1}
//           >
//             Previous
//           </Button>
//           <span className="text-sm text-gray-600">
//             Page {page} of {totalPages}
//           </span>
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
//             disabled={page === totalPages}
//           >
//             Next
//           </Button>
//         </div>
//       )}

//       {/* Modal */}
//       <ModificationDetailsModal
//         modification={selectedModification}
//         open={isModalOpen}
//         onOpenChange={setIsModalOpen}
//       />
//     </section>
//   );
// };

// export default RecentWorkPage;



'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { UserRole } from '@/lib/types/UserTypes';
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
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, RefreshCw, Search } from 'lucide-react';
import jsPDF from 'jspdf';
import ModificationDetailsModal from '@/components/operatorComponents/ModificationDetailsModal';

// Define interfaces
interface AdminData {
  id: string;
  name: string;
  email: string;
  creditBalance: number;
  centreName?: string;
  location?: string;
}

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
  const { data: session, status } = useSession();
  const [recentWork, setRecentWork] = useState<Modification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sortBy, setSortBy] = useState<'timestamp-desc' | 'timestamp-asc'>('timestamp-desc');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [selectedModification, setSelectedModification] = useState<Modification | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const itemsPerPage = 3;

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

  // Simulate fetching and filtering data
  useEffect(() => {
    if (adminData && adminData.creditBalance > 0) {
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
    }
  }, [sortBy, searchQuery, adminData]);

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
    if (!adminData || adminData.creditBalance <= 0) {
      setError('Insufficient credits. Please contact your admin to purchase more credits.');
      return;
    }
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  };

  const handleDownloadReport = async () => {
    if (!adminData || adminData.creditBalance <= 0) {
      setError('Insufficient credits. Please contact your admin to purchase more credits.');
      return;
    }

    setIsDownloading(true);
    setError(null);

    try {
      // Deduct credit before generating report
      const creditDeducted = await deductCredit();
      if (!creditDeducted) {
        throw new Error('Failed to process credit deduction');
      }

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
      doc.text(`Generated By: ${session?.user?.name || 'User'}`, pageWidth / 2, y, { align: 'center' });
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
    } catch (err) {
      console.error('Download error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSortChange = (value: 'timestamp-desc' | 'timestamp-asc') => {
    setSortBy(value);
    setPage(1); // Reset to first page on sort change
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1); // Reset to first page on search
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
    <section className="p-6 max-w-full w-full mx-auto min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Recent Work</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading || !adminData || adminData.creditBalance <= 0}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleDownloadReport}
            disabled={isDownloading || !adminData || adminData.creditBalance <= 0}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isDownloading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download Report (1 credit)
              </>
            )}
          </Button>
        </div>
      </div>

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
                ⚠️ Low credit balance. Report download costs 1 credit.
              </p>
            )}
          </div>
        </div>
      )} */}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Search and Sorting */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative w-full sm:w-64">
          <Input
            type="text"
            placeholder="Search modifications..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10"
            disabled={!adminData || adminData.creditBalance <= 0}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
        </div>
        <Select 
          value={sortBy} 
          onValueChange={handleSortChange}
          disabled={!adminData || adminData.creditBalance <= 0}
        >
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