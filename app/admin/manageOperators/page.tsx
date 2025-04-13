'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Download,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { z } from 'zod';
import axios from 'axios';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { UserRole } from '@/lib/types/UserTypes';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';
import { useId } from 'react';
import { cn } from '@/lib/utils';

// Define types
interface Operator {
  _id: string;
  name: string;
  email: string;
  centreName: string;
  location: string;
  adminId: string;
  createdAt: string;
  emailVerified: boolean;
}

interface AdminProfile {
  centreName: string;
  location: string;
}

// Validation schema matching SignUpForm
const passwordValidationRegex = new RegExp(
  '^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})'
);

const operatorFormSchema = z
  .object({
    name: z.string().min(3, {
      message: 'Name must be at least 3 characters.',
    }),
    email: z.string().email({
      message: 'Please enter a valid email!',
    }),
    password: z
      .string()
      .min(8, {
        message: 'Password should be at least 8 characters long!',
      })
      .regex(passwordValidationRegex, {
        message:
          'Password must contain at least 8 characters, 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character!',
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// Define Zod schema for edit form (password optional)
const editOperatorFormSchema = z.object({
  name: z.string().min(3, {
    message: 'Name must be at least 3 characters.',
  }),
  email: z.string().email({
    message: 'Please enter a valid email!',
  }),
});

type OperatorFormData = z.infer<typeof operatorFormSchema>;
type EditFormData = z.infer<typeof editOperatorFormSchema>;

const ManageOperatorsPage: React.FC = () => {
  const { data: session, status } = useSession();
  const currentAdminId = session?.user?.id || '';
  const toastId = useId();

  const [operators, setOperators] = useState<Operator[]>([]);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [currentOperator, setCurrentOperator] = useState<Operator | null>(null);
  const [operatorToDelete, setOperatorToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const itemsPerPage = 5;

  const isAdminProfileComplete =
    adminProfile?.centreName?.trim() && adminProfile?.location?.trim();

  // Form for adding new operator
  const addOperatorForm = useForm<OperatorFormData>({
    resolver: zodResolver(operatorFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Form for editing operator
  const editOperatorForm = useForm<EditFormData>({
    resolver: zodResolver(editOperatorFormSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  });

  // Debug session data
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      console.log('Session user data:', {
        id: session.user.id,
        role: session.user.role,
        idType: typeof session.user.id,
      });
    }
  }, [session, status]);

  useEffect(() => {
    if (status === 'loading') {
      console.log('Session loading...');
      return;
    }

    if (status === 'unauthenticated') {
      console.log('User not authenticated');
      setDataError('Please log in to access this page.');
      return;
    }

    if (!currentAdminId) {
      console.log('No admin ID found in session:', session);
      setDataError('Admin ID is missing. Please log out and log in again.');
      return;
    }

    console.log('Fetching admin profile for ID:', currentAdminId);

    const fetchData = async () => {
      setLoading(true);
      try {
        console.log(`Making API request to: /api/admins/${currentAdminId}`);
        const adminResponse = await axios.get(`/api/admins/${currentAdminId}`);
        console.log('Admin API response:', adminResponse.data);
        setAdminProfile({
          centreName: adminResponse.data.centreName || '',
          location: adminResponse.data.location || '',
        });

        console.log(`Fetching operators for admin ID: ${currentAdminId}`);
        const operatorsResponse = await axios.get('/api/operator', {
          params: { adminId: currentAdminId },
        });
        console.log('Operators response:', operatorsResponse.data);
        setOperators(operatorsResponse.data);
      } catch (error: any) {
        console.error('Fetch error details:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          stack: error.stack,
        });
        if (error.response) {
          if (error.response.status === 404) {
            setDataError(`Admin profile not found (ID: ${currentAdminId}). Please log out and log in again.`);
          } else if (error.response.status === 403) {
            setDataError('Your account does not have admin privileges. Please log in with an admin account.');
          } else if (error.response.status === 400) {
            setDataError(`Invalid admin ID (${currentAdminId}). Please log out and log in again.`);
          } else {
            setDataError(`Error (${error.response.status}): ${error.response.data?.error || 'Unknown error'}`);
          }
        } else if (error.request) {
          setDataError('No response received from server. Check your network connection.');
        } else {
          setDataError(`Request failed: ${error.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [ status, session]);

  const filteredOperators = operators.filter(
    (operator) =>
      operator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      operator.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paginatedOperators = filteredOperators.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalOperators = operators.length;
  const totalPages = Math.ceil(filteredOperators.length / itemsPerPage);

  const showAlert = useCallback((type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3000);
  }, []);

  const handleAddOperator = useCallback(
    async (values: OperatorFormData) => {
      if (!isAdminProfileComplete) {
        showAlert('error', 'Please set shop name and location in Settings.');
        toast.error('Please set shop name and location in Settings.', { id: toastId });
        return;
      }

      toast.loading('Adding operator, please wait...', { id: toastId });
      setLoading(true);
      try {
        const response = await axios.post('/api/auth/register', {
          name: values.name,
          email: values.email,
          password: values.password,
          role: UserRole.OPERATOR,
          centreName: adminProfile?.centreName || '',
          location: adminProfile?.location || '',
          adminId: currentAdminId,
        });

        const newOperator: Operator = {
          _id: response.data._id || `temp-${Date.now()}`, // Fallback ID
          name: values.name,
          email: values.email,
          centreName: adminProfile?.centreName || '',
          location: adminProfile?.location || '',
          adminId: currentAdminId,
          createdAt: new Date().toISOString(),
          emailVerified: false,
        };

        setOperators((prev) => [...prev, newOperator]);
        addOperatorForm.reset();
        setIsAddDialogOpen(false);
        showAlert('success', 'Operator added successfully!');
        toast.success(
          response.data.message || 'Operator registered. Please check their email for verification.',
          { id: toastId }
        );
      } catch (error: any) {
        const errorMsg = error.response?.data?.error || 'Failed to add operator.';
        showAlert('error', errorMsg);
        toast.error(errorMsg, { id: toastId });
      } finally {
        setLoading(false);
      }
    },
    [isAdminProfileComplete, adminProfile, currentAdminId, showAlert, toastId]
  );

  const startEdit = useCallback((operator: Operator) => {
    setCurrentOperator(operator);
    editOperatorForm.reset({
      name: operator.name,
      email: operator.email,
    });
    setIsEditDialogOpen(true);
  }, [editOperatorForm]);

  const handleUpdateOperator = useCallback(
    async (values: EditFormData) => {
      if (!currentOperator) {
        showAlert('error', 'No operator selected.');
        toast.error('No operator selected.', { id: toastId });
        return;
      }
      if (!isAdminProfileComplete) {
        showAlert('error', 'Please set shop name and location in Settings.');
        toast.error('Please set shop name and location in Settings.', { id: toastId });
        return;
      }
      setLoading(true);
      toast.loading('Updating operator, please wait...', { id: toastId });
      try {
        const response = await axios.put(`/api/operators/${currentOperator._id}`, {
          name: values.name,
          email: values.email,
          centreName: adminProfile?.centreName || '',
          location: adminProfile?.location || '',
          adminId: currentAdminId,
        });
        setOperators((prev) =>
          prev.map((op) => (op._id === currentOperator._id ? response.data : op))
        );
        setIsEditDialogOpen(false);
        showAlert('success', 'Operator updated successfully!');
        toast.success('Operator updated successfully!', { id: toastId });
      } catch (error: any) {
        const errorMsg = error.response?.data?.message || 'Failed to update operator.';
        showAlert('error', errorMsg);
        toast.error(errorMsg, { id: toastId });
      } finally {
        setLoading(false);
      }
    },
    [currentOperator, adminProfile, currentAdminId, showAlert, toastId]
  );

  const handleConfirmDelete = useCallback((id: string) => {
    setOperatorToDelete(id);
    setIsDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!operatorToDelete) return;
    setLoading(true);
    toast.loading('Deleting operator, please wait...', { id: toastId });
    try {
      await axios.delete(`/api/operators/${operatorToDelete}`);
      setOperators((prev) => prev.filter((op) => op._id !== operatorToDelete));
      setIsDeleteDialogOpen(false);
      showAlert('success', 'Operator deleted successfully!');
      toast.success('Operator deleted successfully!', { id: toastId });
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to delete operator.';
      showAlert('error', errorMsg);
      toast.error(errorMsg, { id: toastId });
    } finally {
      setLoading(false);
    }
  }, [operatorToDelete, showAlert, toastId]);

  const handleExport = useCallback(() => {
    const headers = ['Name', 'Email', 'Centre Name', 'Location', 'Email Verified', 'Created At'];
    const rows = operators.map((op) => [
      `"${op.name.replace(/"/g, '""')}"`,
      op.email,
      `"${op.centreName.replace(/"/g, '""')}"`,
      `"${op.location.replace(/"/g, '""')}"`,
      op.emailVerified ? 'Yes' : 'No',
      new Date(op.createdAt).toISOString(),
    ]);
    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'operators_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showAlert('success', 'Operators exported successfully!');
    toast.success('Operators exported successfully!', { id: toastId });
  }, [operators, showAlert, toastId]);

  const handlePrevious = useCallback(() => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  }, [currentPage]);

  const handleNext = useCallback(() => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  }, [currentPage, totalPages]);

  const handleCloseAddDialog = useCallback(() => {
    addOperatorForm.reset();
    setIsAddDialogOpen(false);
  }, [addOperatorForm]);

  const handleCloseEditDialog = useCallback(() => {
    setIsEditDialogOpen(false);
    setCurrentOperator(null);
    editOperatorForm.reset();
  }, [editOperatorForm]);

  return (
    <TooltipProvider>
      <div className="container mx-auto py-6 space-y-8">
        {status === 'unauthenticated' ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Not Logged In</AlertTitle>
            <AlertDescription>Please log in to manage operators.</AlertDescription>
          </Alert>
        ) : dataError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{dataError}</AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">Operator Management</h1>
                <p className="text-gray-500">Manage operators for your shop</p>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      onClick={() => setIsAddDialogOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={loading || !adminProfile || !isAdminProfileComplete}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add New Operator
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {!adminProfile
                    ? 'Loading admin profile...'
                    : !isAdminProfileComplete
                      ? 'Please fill in shop name and location in Settings.'
                      : 'Add a new operator'}
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Operators</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalOperators}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Shop Details</CardTitle>
                </CardHeader>
                <CardContent>
                  {adminProfile ? (
                    <div className="text-sm">
                      <p><strong>Name:</strong> {adminProfile.centreName || 'Not set'}</p>
                      <p><strong>Location:</strong> {adminProfile.location || 'Not set'}</p>
                      {!isAdminProfileComplete && (
                        <p className="text-yellow-600 mt-2">
                          Please update your shop details in Settings to enable operator management.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500">Loading shop details...</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {alert && (
              <Alert className={alert.type === 'success' ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}>
                <AlertCircle className={`h-4 w-4 ${alert.type === 'success' ? 'text-green-600' : 'text-red-600'}`} />
                <AlertTitle className={alert.type === 'success' ? 'text-green-600' : 'text-red-600'}>
                  {alert.type === 'success' ? 'Success' : 'Error'}
                </AlertTitle>
                <AlertDescription>{alert.message}</AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Operators</CardTitle>
                <CardDescription>Manage all operators for your shop.</CardDescription>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search operators..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      disabled={loading}
                    />
                  </div>
                  <Button variant="outline" className="gap-1" onClick={handleExport} disabled={loading}>
                    <Download className="h-4 w-4" /> Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Centre Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Email Verified</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      if (loading) {
                        return (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                              Loading operators...
                            </TableCell>
                          </TableRow>
                        );
                      }
                      if (paginatedOperators.length === 0) {
                        return (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                              No operators found. Add a new operator to get started.
                            </TableCell>
                          </TableRow>
                        );
                      }
                      return paginatedOperators.map((operator) => (
                        <TableRow key={operator._id}>
                          <TableCell className="font-medium">{operator.name}</TableCell>
                          <TableCell>{operator.email}</TableCell>
                          <TableCell>{operator.centreName}</TableCell>
                          <TableCell>{operator.location}</TableCell>
                          <TableCell>
                            <p
                              className={cn(
                                'px-4 py-1 rounded-md w-fit',
                                operator.emailVerified
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              )}
                            >
                              {operator.emailVerified ? 'Yes' : 'No'}
                            </p>

                          </TableCell>
                          <TableCell>{new Date(operator.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0" disabled={loading}>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => startEdit(operator)}>
                                  <Edit className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleConfirmDelete(operator._id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ));
                    })()}
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter className="flex justify-between">
                <p className="text-sm text-gray-500">
                  Showing {paginatedOperators.length} of {filteredOperators.length} operators
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevious}
                    disabled={currentPage === 1 || loading}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNext}
                    disabled={currentPage === totalPages || totalPages === 0 || loading}
                  >
                    Next
                  </Button>
                </div>
              </CardFooter>
            </Card>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>Add New Operator</DialogTitle>
                </DialogHeader>
                <Form {...addOperatorForm}>
                  <form
                    onSubmit={addOperatorForm.handleSubmit(handleAddOperator)}
                    className="grid gap-4 py-4"
                  >
                    <FormField
                      control={addOperatorForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4">
                          <FormLabel className="text-right">Name</FormLabel>
                          <div className="col-span-3">
                            <FormControl>
                              <Input
                                {...field}
                                id="operator-name"
                                disabled={loading}
                                placeholder="Operator name"
                              />
                            </FormControl>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={addOperatorForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4">
                          <FormLabel className="text-right">Email</FormLabel>
                          <div className="col-span-3">
                            <FormControl>
                              <Input
                                {...field}
                                id="operator-email"
                                type="email"
                                disabled={loading}
                                placeholder="operator@example.com"
                              />
                            </FormControl>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={addOperatorForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4">
                          <FormLabel className="text-right">Password</FormLabel>
                          <div className="col-span-3">
                            <FormControl>
                              <Input
                                {...field}
                                id="operator-password"
                                type="password"
                                disabled={loading}
                                placeholder="Password"
                              />
                            </FormControl>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={addOperatorForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4">
                          <FormLabel className="text-right">Confirm Password</FormLabel>
                          <div className="col-span-3">
                            <FormControl>
                              <Input
                                {...field}
                                id="operator-confirm-password"
                                type="password"
                                disabled={loading}
                                placeholder="Confirm Password"
                              />
                            </FormControl>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="operator-centre" className="text-right">Centre Name</Label>
                      <div className="col-span-3">
                        <Input
                          id="operator-centre"
                          value={adminProfile?.centreName || 'Not set'}
                          disabled
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="operator-location" className="text-right">Location</Label>
                      <div className="col-span-3">
                        <Input
                          id="operator-location"
                          value={adminProfile?.location || 'Not set'}
                          disabled
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCloseAddDialog}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Add Operator
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>Edit Operator</DialogTitle>
                </DialogHeader>
                <Form {...editOperatorForm}>
                  <form
                    onSubmit={editOperatorForm.handleSubmit(handleUpdateOperator)}
                    className="grid gap-4 py-4"
                  >
                    <FormField
                      control={editOperatorForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4">
                          <FormLabel className="text-right">Name</FormLabel>
                          <div className="col-span-3">
                            <FormControl>
                              <Input
                                {...field}
                                id="edit-name"
                                disabled={loading}
                              />
                            </FormControl>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editOperatorForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4">
                          <FormLabel className="text-right">Email</FormLabel>
                          <div className="col-span-3">
                            <FormControl>
                              <Input
                                {...field}
                                id="edit-email"
                                type="email"
                                disabled={loading}
                              />
                            </FormControl>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit-centre" className="text-right">Centre Name</Label>
                      <div className="col-span-3">
                        <Input
                          id="edit-centre"
                          value={adminProfile?.centreName || 'Not set'}
                          disabled
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit-location" className="text-right">Location</Label>
                      <div className="col-span-3">
                        <Input
                          id="edit-location"
                          value={adminProfile?.location || 'Not set'}
                          disabled
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCloseEditDialog}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Deletion</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <p>Are you sure you want to delete this operator? This action cannot be undone.</p>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsDeleteDialogOpen(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={confirmDelete}
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </TooltipProvider>
  );
};

export default ManageOperatorsPage;