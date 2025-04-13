"use client"

import { useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Admin } from "./columns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

// Form schema for admin editing
const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  location: z.string().nullable(),
  centreName: z.string().nullable(),
  creditBalance: z.number().min(0, { message: "Credit balance cannot be negative." }),
  emailVerified: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditAdminDialogProps {
  admin: Admin | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (adminId: string, data: Partial<Admin>) => Promise<void>;
}

export function EditAdminDialog({ 
  admin, 
  open, 
  onOpenChange, 
  onSave 
}: EditAdminDialogProps) {
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form with admin data
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: admin?.name || "",
      email: admin?.email || "",
      location: admin?.location || "",
      centreName: admin?.centreName || "",
      creditBalance: admin?.creditBalance || 0,
      emailVerified: admin?.emailVerified || false,
    },
  });

  // Update form values when admin changes
  useState(() => {
    if (admin) {
      form.reset({
        name: admin.name,
        email: admin.email,
        location: admin.location || "",
        centreName: admin.centreName || "",
        creditBalance: admin.creditBalance,
        emailVerified: admin.emailVerified,
      });
    }
  });

  // Handle form submission
  async function onSubmit(data: FormValues) {
    if (!admin) return;
    
    setIsSaving(true);
    try {
      await onSave(admin.id, data);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save admin:", error);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Admin</DialogTitle>
          <DialogDescription>
            Update the admin account information. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Admin name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Email address" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Location" 
                        {...field} 
                        value={field.value || ""} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="centreName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Centre Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Centre name" 
                        {...field} 
                        value={field.value || ""} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="creditBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Credit Balance</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="0" 
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="emailVerified"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Email Verified</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Mark this account as having a verified email address
                    </p>
                  </div>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}