// 'use client';

// import React, { useState, useEffect } from 'react';
// import { User, Edit, Save, Lock } from 'lucide-react';
// import { useSession } from 'next-auth/react';
// import { z } from 'zod';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { useForm } from 'react-hook-form';
// import { Button } from '@/components/ui/button';
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from '@/components/ui/form';
// import { Input } from '@/components/ui/input';
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from '@/components/ui/dialog';
// import { toast } from 'sonner';
// import { useId } from 'react';
// import { UserRole } from '@/lib/types/UserTypes';

// interface Operator {
//   name: string;
//   email: string;
//   emailVerified: boolean;
//   createdAt: string;
//   location?: string;
//   centreName?: string;
//   adminId?: string;
// }

// // Profile form schema
// const profileSchema = z.object({
//   name: z.string().min(3, {
//     message: 'Your name must be at least 3 characters.',
//   }),
//   email: z.string().email({
//     message: 'Please enter a valid email!',
//   }),
// });

// // Password change schema
// const passwordValidationRegex = new RegExp(
//   '^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})'
// );

// const passwordSchema = z
//   .object({
//     password: z
//       .string({
//         required_error: 'Password is required!',
//       })
//       .min(8, {
//         message: 'Password should be at least 8 characters long!',
//       })
//       .regex(passwordValidationRegex, {
//         message:
//           'Password must contain at least 8 characters, 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character!',
//       }),
//     confirmPassword: z.string({
//       required_error: 'Confirm Password is required!',
//     }),
//   })
//   .refine((data) => data.password === data.confirmPassword, {
//     message: 'Passwords do not match',
//     path: ['confirmPassword'],
//   });

// type ProfileFormData = z.infer<typeof profileSchema>;
// type PasswordFormData = z.infer<typeof passwordSchema>;

// const OperatorProfilePage = () => {
//   const { data: session, status } = useSession();
//   const userId = session?.user?.id || '';
//   const toastId = useId();
//   const [operatorData, setOperatorData] = useState<Operator | null>(null);
//   const [editMode, setEditMode] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
//   const [adminName, setAdminName] = useState<string | null>(null);

//   const profileForm = useForm<ProfileFormData>({
//     resolver: zodResolver(profileSchema),
//     defaultValues: {
//       name: '',
//       email: '',
//     },
//   });

//   const passwordForm = useForm<PasswordFormData>({
//     resolver: zodResolver(passwordSchema),
//     defaultValues: {
//       password: '',
//       confirmPassword: '',
//     },
//   });

//   useEffect(() => {
//     if (userId && status === 'authenticated') {
//       if (session?.user?.role !== UserRole.OPERATOR) {
//         window.location.href = '/dashboard';
//         return;
//       }

//       const fetchOperatorData = async () => {
//         setIsLoading(true);
//         try {
//           const response = await fetch(`/api/operator/${userId}`);
//           if (!response.ok) {
//             const errorData = await response.json();
//             throw new Error(errorData.error || 'Failed to fetch operator data');
//           }
//           const result: Operator = await response.json();
//           setOperatorData(result);
//           profileForm.reset({
//             name: result.name || '',
//             email: result.email || '',
//           });

//           if (result.adminId) {
//             try {
//               const adminRes = await fetch(`/api/admins/${result.adminId}`);
//               if (adminRes.ok) {
//                 const adminInfo = await adminRes.json();
//                 setAdminName(adminInfo.name);
//               } else {
//                 console.warn('Failed to fetch admin info');
//               }
//             } catch (err) {
//               console.error('Error fetching admin info:', err);
//             }
//           }
//         } catch (err) {
//           toast.error(
//             err instanceof Error ? err.message : 'Failed to load profile data',
//             { id: toastId }
//           );
//         } finally {
//           setIsLoading(false);
//         }
//       };


//       fetchOperatorData();
//     }
//   }, [status, session, profileForm, toastId, userId]);

//   const handleProfileSubmit = async (values: ProfileFormData) => {
//     toast.loading('Updating profile, please wait...', { id: toastId });
//     try {
//       setIsLoading(true);
//       const response = await fetch(`/api/operator/${userId}`, {
//         method: 'PUT',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ ...values, adminId: operatorData?.adminId }),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || 'Failed to update profile');
//       }

//       const result: Operator = await response.json();
//       setOperatorData(result);
//       setEditMode(false);
//       toast.success('Profile updated successfully!', { id: toastId });
//     } catch (err) {
//       toast.error(
//         err instanceof Error ? err.message : 'Failed to update profile',
//         { id: toastId }
//       );
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handlePasswordSubmit = async (values: PasswordFormData) => {
//     toast.loading('Updating password, please wait...', { id: toastId });
//     try {
//       setIsLoading(true);
//       const response = await fetch(`/api/operator/${userId}`, {
//         method: 'PUT',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           password: values.password,
//           adminId: operatorData?.adminId
//         }),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || 'Failed to update password');
//       }

//       setIsPasswordDialogOpen(false);
//       passwordForm.reset();
//       toast.success('Password updated successfully!', { id: toastId });
//     } catch (err) {
//       toast.error(
//         err instanceof Error ? err.message : 'Failed to update password',
//         { id: toastId }
//       );
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const formatDate = (dateString: string) => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric',
//     });
//   };

//   const cardStyle = 'bg-white rounded-lg shadow-md p-6 mb-6';

//   if (status === 'loading' || isLoading) {
//     return (
//       <div className="max-w-6xl mx-auto p-6">
//         <p>Loading profile data...</p>
//       </div>
//     );
//   }

//   if (status === 'unauthenticated') {
//     return (
//       <div className="max-w-6xl mx-auto p-6">
//         <p>Please sign in to view your profile</p>
//       </div>
//     );
//   }

//   if (!operatorData) {
//     return (
//       <div className="max-w-6xl mx-auto p-6">
//         <p className="text-red-600">Failed to load profile data</p>
//       </div>
//     );
//   }

//   return (
//     <section className="w-full max-w-full mx-auto p-6">
//       <h1 className="text-3xl font-bold text-gray-900 mb-8">Operator Profile</h1>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//         <div className="col-span-1">
//           <div className={cardStyle}>
//             <div className="flex flex-col items-center mb-6">
//               <div className="bg-blue-100 p-4 rounded-full mb-4">
//                 <User size={64} className="text-blue-600" />
//               </div>
//               <h2 className="text-xl font-semibold">{operatorData.name}</h2>
//               <p className="text-gray-600">{operatorData.email}</p>
//               <div className="mt-2 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
//                 Operator
//               </div>
//             </div>

//             <div className="border-t border-gray-200 pt-4">
//               <div className="flex justify-between items-center mb-2">
//                 <span className="text-gray-600">Account Status</span>
//                 <span className="text-green-600 font-medium">Active</span>
//               </div>
//               <div className="flex justify-between items-center mb-2">
//                 <span className="text-gray-600">Email Verified</span>
//                 <span
//                   className={`font-medium ${operatorData.emailVerified ? 'text-green-600' : 'text-red-600'
//                     }`}
//                 >
//                   {operatorData.emailVerified ? 'Yes' : 'No'}
//                 </span>
//               </div>
//               <div className="flex justify-between items-center">
//                 <span className="text-gray-600">Member Since</span>
//                 <span className="text-gray-900">{formatDate(operatorData.createdAt)}</span>
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="col-span-1 lg:col-span-2">
//           <div className={cardStyle}>
//             <div className="flex justify-between items-center p-6 border-b border-gray-200">
//               <h2 className="text-xl font-semibold">Profile Information</h2>
//               <Button
//                 onClick={() => setEditMode(!editMode)}
//                 variant="ghost"
//                 className="flex items-center text-blue-600 hover:text-blue-800"
//                 disabled={isLoading}
//               >
//                 {editMode ? (
//                   <Save size={18} className="mr-1" />
//                 ) : (
//                   <Edit size={18} className="mr-1" />
//                 )}
//                 {editMode ? 'Save' : 'Edit'}
//               </Button>
//             </div>

//             <div className="p-6">
//               <Form {...profileForm}>
//                 <form
//                   onSubmit={profileForm.handleSubmit(handleProfileSubmit)}
//                   className="space-y-6"
//                 >
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <FormField
//                       control={profileForm.control}
//                       name="name"
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel className="text-gray-700">Full Name</FormLabel>
//                           <FormControl>
//                             {editMode ? (
//                               <Input
//                                 {...field}
//                                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                                 disabled={isLoading}
//                               />
//                             ) : (
//                               <p className="text-gray-900">{operatorData.name}</p>
//                             )}
//                           </FormControl>
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />
//                     <FormField
//                       control={profileForm.control}
//                       name="email"
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel className="text-gray-700">Email Address</FormLabel>
//                           <FormControl>
//                             {editMode ? (
//                               <Input
//                                 {...field}
//                                 type="email"
//                                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                                 disabled={isLoading}
//                               />
//                             ) : (
//                               <p className="text-gray-900">{operatorData.email}</p>
//                             )}
//                           </FormControl>
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />
//                     <div>
//                       <FormLabel className="text-gray-700">Location</FormLabel>
//                       <p className="text-gray-900">{operatorData.location || 'Not specified'}</p>
//                     </div>
//                     <div>
//                       <FormLabel className="text-gray-700">Centre Name</FormLabel>
//                       <p className="text-gray-900">{operatorData.centreName || 'Not specified'}</p>
//                     </div>
//                     <div>
//                       <FormLabel className="text-gray-700">Registered by</FormLabel>
//                       <p className="text-gray-900">
//                         {adminName ?? operatorData.adminId ?? 'Not specified'}
//                       </p>
//                     </div>

//                   </div>

//                   {editMode && (
//                     <div className="flex justify-end space-x-4">
//                       <Button
//                         type="button"
//                         variant="outline"
//                         onClick={() => {
//                           setEditMode(false);
//                           profileForm.reset({
//                             name: operatorData.name,
//                             email: operatorData.email,
//                           });
//                         }}
//                         disabled={isLoading}
//                       >
//                         Cancel
//                       </Button>
//                       <Button
//                         type="submit"
//                         className="bg-blue-600 hover:bg-blue-700"
//                         disabled={isLoading}
//                       >
//                         {isLoading ? 'Saving...' : 'Save Changes'}
//                       </Button>
//                     </div>
//                   )}
//                 </form>
//               </Form>
//             </div>
//           </div>

//           <div className={cardStyle}>
//             <div className="flex justify-between items-center p-6 border-b border-gray-200">
//               <h2 className="text-xl font-semibold">Security Settings</h2>
//               <Lock size={20} className="text-blue-600" />
//             </div>
//             <div className="p-6">
//               <div>
//                 <h3 className="text-lg font-medium mb-4">Password</h3>
//                 <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
//                   <DialogTrigger asChild>
//                     <Button className="bg-blue-600 hover:bg-blue-700">Change Password</Button>
//                   </DialogTrigger>
//                   <DialogContent>
//                     <DialogHeader>
//                       <DialogTitle>Change Password</DialogTitle>
//                     </DialogHeader>
//                     <Form {...passwordForm}>
//                       <form
//                         onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}
//                         className="space-y-6"
//                       >
//                         <FormField
//                           control={passwordForm.control}
//                           name="password"
//                           render={({ field }) => (
//                             <FormItem>
//                               <FormLabel>New Password</FormLabel>
//                               <FormControl>
//                                 <Input
//                                   {...field}
//                                   type="password"
//                                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                                   disabled={isLoading}
//                                 />
//                               </FormControl>
//                               <FormMessage />
//                             </FormItem>
//                           )}
//                         />
//                         <FormField
//                           control={passwordForm.control}
//                           name="confirmPassword"
//                           render={({ field }) => (
//                             <FormItem>
//                               <FormLabel>Confirm Password</FormLabel>
//                               <FormControl>
//                                 <Input
//                                   {...field}
//                                   type="password"
//                                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                                   disabled={isLoading}
//                                 />
//                               </FormControl>
//                               <FormMessage />
//                             </FormItem>
//                           )}
//                         />
//                         <div className="flex justify-end space-x-4">
//                           <Button
//                             type="button"
//                             variant="outline"
//                             onClick={() => {
//                               setIsPasswordDialogOpen(false);
//                               passwordForm.reset();
//                             }}
//                             disabled={isLoading}
//                           >
//                             Cancel
//                           </Button>
//                           <Button
//                             type="submit"
//                             className="bg-blue-600 hover:bg-blue-700"
//                             disabled={isLoading}
//                           >
//                             {isLoading ? 'Saving...' : 'Save Password'}
//                           </Button>
//                         </div>
//                       </form>
//                     </Form>
//                   </DialogContent>
//                 </Dialog>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// };

// export default OperatorProfilePage;

'use client';

import React, { useState, useEffect } from 'react';
import { User, Edit, Save, Lock } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useId } from 'react';
import { UserRole } from '@/lib/types/UserTypes';

interface Operator {
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
  location?: string;
  centreName?: string;
  adminId?: string;
}

interface AdminData {
  id: string;
  name: string;
  email: string;
  creditBalance: number;
  centreName?: string;
  location?: string;
}

// Profile form schema
const profileSchema = z.object({
  name: z.string().min(3, {
    message: 'Your name must be at least 3 characters.',
  }),
  email: z.string().email({
    message: 'Please enter a valid email!',
  }),
});

// Password change schema
const passwordValidationRegex = new RegExp(
  '^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})'
);

const passwordSchema = z
  .object({
    password: z
      .string({
        required_error: 'Password is required!',
      })
      .min(8, {
        message: 'Password should be at least 8 characters long!',
      })
      .regex(passwordValidationRegex, {
        message:
          'Password must contain at least 8 characters, 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character!',
      }),
    confirmPassword: z.string({
      required_error: 'Confirm Password is required!',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

const OperatorProfilePage = () => {
  const { data: session, status } = useSession();
  const userId = session?.user?.id || '';
  const toastId = useId();
  const [operatorData, setOperatorData] = useState<Operator | null>(null);
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(true);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [adminName, setAdminName] = useState<string | null>(null);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  // Fetch admin data for credit checking
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
          toast.error('Failed to load credit information', { id: toastId });
        } finally {
          setIsLoadingAdmin(false);
        }
      } else {
        setIsLoadingAdmin(false);
      }
    };

    fetchAdminData();
  }, [status, session, toastId]);

  useEffect(() => {
    if (userId && status === 'authenticated') {
      if (session?.user?.role !== UserRole.OPERATOR) {
        window.location.href = '/dashboard';
        return;
      }

      const fetchOperatorData = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/operator/${userId}`);
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch operator data');
          }
          const result: Operator = await response.json();
          setOperatorData(result);
          profileForm.reset({
            name: result.name || '',
            email: result.email || '',
          });

          if (result.adminId) {
            try {
              const adminRes = await fetch(`/api/admins/${result.adminId}`);
              if (adminRes.ok) {
                const adminInfo = await adminRes.json();
                setAdminName(adminInfo.name);
              } else {
                console.warn('Failed to fetch admin info');
              }
            } catch (err) {
              console.error('Error fetching admin info:', err);
            }
          }
        } catch (err) {
          toast.error(
            err instanceof Error ? err.message : 'Failed to load profile data',
            { id: toastId }
          );
        } finally {
          setIsLoading(false);
        }
      };

      fetchOperatorData();
    }
  }, [status, session, profileForm, toastId, userId]);

  const handleProfileSubmit = async (values: ProfileFormData) => {
    toast.loading('Updating profile, please wait...', { id: toastId });
    try {
      setIsLoading(true);
      const response = await fetch(`/api/operator/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...values, adminId: operatorData?.adminId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const result: Operator = await response.json();
      setOperatorData(result);
      setEditMode(false);
      toast.success('Profile updated successfully!', { id: toastId });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to update profile',
        { id: toastId }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (values: PasswordFormData) => {
    toast.loading('Updating password, please wait...', { id: toastId });
    try {
      setIsLoading(true);
      const response = await fetch(`/api/operator/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: values.password,
          adminId: operatorData?.adminId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update password');
      }

      setIsPasswordDialogOpen(false);
      passwordForm.reset();
      toast.success('Password updated successfully!', { id: toastId });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to update password',
        { id: toastId }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const cardStyle = 'bg-white rounded-lg shadow-md p-6 mb-6';

  // Show loading state while fetching data
  if (status === 'loading' || isLoading || isLoadingAdmin) {
    return (
      <div className="max-w-6xl mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile data...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="max-w-6xl mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 text-lg">Please sign in to view your profile</p>
        </div>
      </div>
    );
  }

  // Show insufficient credits message
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
            You have insufficient credits to access account settings. Please contact your admin to purchase more credits.
          </p>
          <div className="bg-gray-100 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <strong>Current Balance:</strong> {adminData.creditBalance} credits
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Contact your admin to add more credits to your account to access profile settings.
            </p>
          </div>
          
        </div>
      </div>
    );
  }

  if (!operatorData) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <p className="text-red-600">Failed to load profile data</p>
      </div>
    );
  }

  return (
    <section className="w-full max-w-full mx-auto p-6">
      {/* Credit Balance Display */}
      {/* {adminData && (
        <div className="mb-6">
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
                ⚠️ Low credit balance. Contact your admin to add more credits.
              </p>
            )}
          </div>
        </div>
      )} */}

      <h1 className="text-3xl font-bold text-gray-900 mb-8">Operator Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="col-span-1">
          <div className={cardStyle}>
            <div className="flex flex-col items-center mb-6">
              <div className="bg-blue-100 p-4 rounded-full mb-4">
                <User size={64} className="text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold">{operatorData.name}</h2>
              <p className="text-gray-600">{operatorData.email}</p>
              <div className="mt-2 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                Operator
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Account Status</span>
                <span className="text-green-600 font-medium">Active</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Email Verified</span>
                <span
                  className={`font-medium ${operatorData.emailVerified ? 'text-green-600' : 'text-red-600'
                    }`}
                >
                  {operatorData.emailVerified ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Member Since</span>
                <span className="text-gray-900">{formatDate(operatorData.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-1 lg:col-span-2">
          <div className={cardStyle}>
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Profile Information</h2>
              <Button
                onClick={() => setEditMode(!editMode)}
                variant="ghost"
                className="flex items-center text-blue-600 hover:text-blue-800"
                disabled={isLoading}
              >
                {editMode ? (
                  <Save size={18} className="mr-1" />
                ) : (
                  <Edit size={18} className="mr-1" />
                )}
                {editMode ? 'Save' : 'Edit'}
              </Button>
            </div>

            <div className="p-6">
              <Form {...profileForm}>
                <form
                  onSubmit={profileForm.handleSubmit(handleProfileSubmit)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={profileForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">Full Name</FormLabel>
                          <FormControl>
                            {editMode ? (
                              <Input
                                {...field}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={isLoading}
                              />
                            ) : (
                              <p className="text-gray-900">{operatorData.name}</p>
                            )}
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">Email Address</FormLabel>
                          <FormControl>
                            {editMode ? (
                              <Input
                                {...field}
                                type="email"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={isLoading}
                              />
                            ) : (
                              <p className="text-gray-900">{operatorData.email}</p>
                            )}
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div>
                      <FormLabel className="text-gray-700">Location</FormLabel>
                      <p className="text-gray-900">{operatorData.location || 'Not specified'}</p>
                    </div>
                    <div>
                      <FormLabel className="text-gray-700">Centre Name</FormLabel>
                      <p className="text-gray-900">{operatorData.centreName || 'Not specified'}</p>
                    </div>
                    <div>
                      <FormLabel className="text-gray-700">Registered by</FormLabel>
                      <p className="text-gray-900">
                        {adminName ?? operatorData.adminId ?? 'Not specified'}
                      </p>
                    </div>

                  </div>

                  {editMode && (
                    <div className="flex justify-end space-x-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditMode(false);
                          profileForm.reset({
                            name: operatorData.name,
                            email: operatorData.email,
                          });
                        }}
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  )}
                </form>
              </Form>
            </div>
          </div>

          <div className={cardStyle}>
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Security Settings</h2>
              <Lock size={20} className="text-blue-600" />
            </div>
            <div className="p-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Password</h3>
                <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">Change Password</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Password</DialogTitle>
                    </DialogHeader>
                    <Form {...passwordForm}>
                      <form
                        onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}
                        className="space-y-6"
                      >
                        <FormField
                          control={passwordForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>New Password</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="password"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  disabled={isLoading}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={passwordForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm Password</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="password"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  disabled={isLoading}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end space-x-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsPasswordDialogOpen(false);
                              passwordForm.reset();
                            }}
                            disabled={isLoading}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={isLoading}
                          >
                            {isLoading ? 'Saving...' : 'Save Password'}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OperatorProfilePage;