"use client"

import { useEffect, useState } from "react"
import { Admin, columns } from "./columns"
import { DataTable } from "./data-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from 'sonner';

// Fetch admins from your MongoDB database
async function fetchAdmins(): Promise<Admin[]> {
  try {
    const response = await fetch('/api/admins', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch admins');
    }

    const data = await response.json();
    
    // Transform date strings to Date objects
    return data.map((admin: any) => ({
      ...admin,
      id: admin._id.toString(),
      createdAt: new Date(admin.createdAt),
    }));
  } catch (error) {
    console.error("Error fetching admins:", error);
    throw error;
  }
}

export default function ManageAdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)

  // Function to refresh admin data
  const refreshAdmins = async () => {
    setLoading(true)
    try {
      const data = await fetchAdmins()
      setAdmins(data)
      toast.success("Admin data refreshed successfully")
      
    } catch (error) {
      console.error("Failed to fetch admins:", error)
      toast.error("Failed to fetch admin data")
      
    } finally {
      setLoading(false)
    }
  }

  // Delete handler passed to the columns component
  const handleDeleteAdmin = async (adminId: string) => {
    try {
      await fetch(`/api/admins/${adminId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // Update the local state by removing the deleted admin
      setAdmins(admins.filter(admin => admin.id !== adminId));
      
      
      toast.success("Admin Deleted Successfully")
    } catch (error) {
      console.error("Error deleting admin:", error);
      
      toast.error("Failed to delete Admin")
    }
  }

  // Update handler passed to the columns component
  const handleUpdateAdmin = async (id: string, updatedData: Partial<Admin>) => {
    try {
      const response = await fetch(`/api/admins/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        throw new Error('Failed to update admin');
      }

      // Update the admin in the local state
      setAdmins(
        admins.map(admin => 
          admin.id === id ? { ...admin, ...updatedData } : admin
        )
      );
      
      toast.success("Admin Updated successfully")
    } catch (error) {
      console.error("Error updating admin:", error);
     
      toast.error("Failed to update Admin")
    }
  }

  useEffect(() => {
    refreshAdmins()
  }, [])

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Manage Admins</CardTitle>
          <CardDescription>
            View and manage all administrator accounts in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-muted-foreground">Loading admin data...</p>
            </div>
          ) : (
            <DataTable 
              columns={columns(handleDeleteAdmin, handleUpdateAdmin)} 
              data={admins} 
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}