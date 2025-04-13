"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email"
  })
});

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: ""
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: values.email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process request');
      }

      toast.success(data.message || 'Password reset link sent to your email');
      setSubmitted(true);
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold mb-4">Check Your Email</h2>
        <p className="mb-6">
          If an account exists with the email you provided, we've sent password reset instructions.
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Don't see it? Check your spam folder or try again.
        </p>
        <Button
          onClick={() => setSubmitted(false)}
          variant="outline"
          className="mr-4"
        >
          Try Again
        </Button>
        <Link href="/login">
          <Button>Back to Login</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative p-0.5 rounded-lg w-75 md:w-96 md:max-w-md mx-auto">
      {/* Gradient border wrapper */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 animate-pulse"></div>

      {/* White content area */}
      <motion.div
        className="relative p-4 sm:p-8 bg-white rounded-lg shadow-xl"
        style={{
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-800 text-center">Forgot Password</h2>
        <p className="mb-6 text-gray-600 text-center">
          Enter your email address and we'll send you a link to reset your password.
        </p>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="you@example.com"
                      {...field}
                      className="bg-gray-50 border-gray-200"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Button
                type="submit"
                className="w-full bg-black hover:bg-gray-800 text-white"
                disabled={loading}
              >
                {loading &&
                  <Loader2 className="mr-2 animate-spin" />
                }
                Send Reset Link
              </Button>
            </motion.div>

            <div className="text-center mt-4">
              <Link
                href="/login"
                className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                Remember your password? <span className="font-medium">Login</span>
              </Link>
            </div>
          </form>
        </Form>
      </motion.div>
    </div>
  );
}