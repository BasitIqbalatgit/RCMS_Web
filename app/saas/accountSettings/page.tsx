'use client';

import React, { useState, useEffect } from 'react';
import { User, Edit, Save, Lock, DollarSign } from 'lucide-react';
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
import { toast } from 'sonner';
import { useId } from 'react';
import { redirect } from 'next/navigation';

interface UserData {
  name: string;
  email: string;
  revenue: number;
  emailVerified: boolean;
  createdAt: string;
}

const passwordValidationRegex = new RegExp(
  "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})"
);

const profileSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters' }),
  email: z.string().email({ message: 'Please enter a valid email' }),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, { message: 'Current password is required' }),
    newPassword: z
      .string()
      .min(8, { message: 'Password should be at least 8 characters long' })
      .regex(passwordValidationRegex, {
        message:
          'Password must contain at least 8 characters, 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character',
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const SaasProviderProfilePage = () => {
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const toastId = useId(); // Unique ID for toast notifications

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (status === 'loading' || !session) return;

      try {
        setIsLoading(true);
        const response = await fetch('/api/saas', {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const result = await response.json();
        if (result.success) {
          setUserData(result.data);
          profileForm.reset({
            name: result.data.name,
            email: result.data.email,
          });
        } else {
          throw new Error(result.error || 'Failed to fetch user data');
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to load profile data', { id: toastId });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [session, status, profileForm, toastId]);

  const handleProfileSubmit = async (values: z.infer<typeof profileSchema>) => {
    toast.loading('Updating profile, please wait...', { id: toastId });
    try {
      setIsLoading(true);
      const response = await fetch('/api/saas', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user data');
      }

      const result = await response.json();
      if (result.success) {
        setUserData(result.data);
        setEditMode(false);
        toast.success('Profile updated successfully!', { id: toastId });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (values: z.infer<typeof passwordSchema>) => {
    toast.loading('Updating password, please wait...', { id: toastId });
    try {
      setIsLoading(true);
      const response = await fetch('/api/saas', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update password');
      }

      const result = await response.json();
      if (result.success) {
        passwordForm.reset();
        setShowPasswordForm(false);
        toast.success('Password updated successfully!', { id: toastId });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update password', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const cardStyle = "bg-white rounded-lg shadow-md p-6 mb-6";
  const revenueCardStyle = "bg-white rounded-lg shadow-md p-6";

  if (status === 'loading' || isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <p>Loading profile data...</p>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <p>Please sign in to view your profile</p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <p className="text-red-600">Failed to load profile data</p>
      </div>
    );
  }

  return (
    <section className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">SaaS Provider Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="col-span-1">
          <div className={cardStyle}>
            <div className="flex flex-col items-center mb-6">
              <div className="bg-blue-100 p-4 rounded-full mb-4">
                <User size={64} className="text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold">{userData.name}</h2>
              <p className="text-gray-600">{userData.email}</p>
              <div className="mt-2 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                SaaS Provider
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Account Status</span>
                <span className="text-green-600 font-medium">Active</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Email Verified</span>
                <span className={`font-medium ${userData.emailVerified ? 'text-green-600' : 'text-red-600'}`}>
                  {userData.emailVerified ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Member Since</span>
                <span className="text-gray-900">{formatDate(userData.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className={revenueCardStyle}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Revenue Summary</h3>
              <DollarSign className="text-green-600" size={20} />
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Total Revenue</span>
              <span className="text-2xl font-bold text-green-600">${userData.revenue.toLocaleString()}</span>
            </div>
            <button className="mt-4 w-full py-2 bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors"
              onClick={()=> redirect('/saas/dashboard')}
            >
              View Revenue Dashboard
            </button>
          </div>
        </div>

        <div className="col-span-1 lg:col-span-2">
          <div className={cardStyle}>
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Profile Information</h2>
              <button
                onClick={() => setEditMode(!editMode)}
                className="flex items-center text-blue-600 hover:text-blue-800"
                disabled={isLoading}
              >
                {editMode ? <Save size={18} className="mr-1" /> : <Edit size={18} className="mr-1" />}
                {editMode ? 'Save' : 'Edit'}
              </button>
            </div>

            <div className="p-6">
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-6">
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
                              <p className="text-gray-900">{userData.name}</p>
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
                              <p className="text-gray-900">{userData.email}</p>
                            )}
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {editMode && (
                    <div className="flex justify-end space-x-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditMode(false);
                          profileForm.reset({ name: userData.name, email: userData.email });
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
                {!showPasswordForm ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600">Last updated: 30 days ago</p>
                      <p className="text-sm text-gray-500">We recommend changing your password every 90 days.</p>
                    </div>
                    <Button
                      onClick={() => setShowPasswordForm(true)}
                      variant="outline"
                      disabled={isLoading}
                    >
                      <Lock size={16} className="mr-2" />
                      Change Password
                    </Button>
                  </div>
                ) : (
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-6">
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">Current Password</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                {...field}
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
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">New Password</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                {...field}
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
                            <FormLabel className="text-gray-700">Confirm New Password</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                {...field}
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
                            setShowPasswordForm(false);
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
                          {isLoading ? 'Saving...' : 'Update Password'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SaasProviderProfilePage;