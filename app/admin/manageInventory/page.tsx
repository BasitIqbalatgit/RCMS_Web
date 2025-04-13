'use client';

import React, { useState, useCallback, useEffect } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Search,
  Plus,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Download,
  AlertCircle,
  Image,
} from 'lucide-react';
import { z } from 'zod';

// Define Zod schema for form validation
const FormDataSchema = z.object({
  name: z.string().min(1, 'Item name is required.'),
  quantity: z.number().min(0, 'Quantity cannot be negative.'),
  available: z.number().min(0, 'Available cannot be negative.'),
  category: z.string().min(1, 'Category is required.'),
  price: z.number().min(0, 'Price cannot be negative.'),
  image: z.string().optional(),
}).refine((data) => data.available <= data.quantity, {
  message: 'Available cannot exceed quantity.',
  path: ['available'],
});

// Define the InventoryItem type
interface InventoryItem {
  id: number;
  name: string;
  quantity: number;
  available: number;
  image: string;
  category: string;
  price: number;
}

// Define form data type for add/edit
type FormData = z.infer<typeof FormDataSchema>;

const AdminInventoryPage: React.FC = () => {
  // Sample inventory data
  const [inventory, setInventory] = useState<InventoryItem[]>([
    { id: 1, name: 'Rim - Sport Alloy 18"', quantity: 24, available: 20, image: '/api/placeholder/100/100', category: 'Rims', price: 249.99 },
    { id: 2, name: 'Spoiler - Carbon Fiber', quantity: 10, available: 7, image: '/api/placeholder/100/100', category: 'Spoilers', price: 399.99 },
    { id: 3, name: 'Paint - Deep Blue Metallic', quantity: 15, available: 12, image: '/api/placeholder/100/100', category: 'Paint', price: 149.99 },
    { id: 4, name: 'Rim - Classic Chrome 17"', quantity: 16, available: 8, image: '/api/placeholder/100/100', category: 'Rims', price: 199.99 },
    { id: 5, name: 'Spoiler - Adjustable Aluminum', quantity: 5, available: 3, image: '/api/placeholder/100/100', category: 'Spoilers', price: 299.99 },
    { id: 6, name: 'Paint - Ruby Red Pearl', quantity: 8, available: 5, image: '/api/placeholder/100/100', category: 'Paint', price: 179.99 },
    { id: 7, name: 'Rim - Off-road 20"', quantity: 12, available: 6, image: '/api/placeholder/100/100', category: 'Rims', price: 349.99 },
    { id: 8, name: 'Hood Scoop - Black Matte', quantity: 7, available: 4, image: '/api/placeholder/100/100', category: 'Body Kits', price: 129.99 },
  ]);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [currentItem, setCurrentItem] = useState<InventoryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [newItemImagePreview, setNewItemImagePreview] = useState<string | null>(null);
  const [editItemImagePreview, setEditItemImagePreview] = useState<string | null>(null);
  const [filterPriceMin, setFilterPriceMin] = useState<number | ''>('');
  const [filterPriceMax, setFilterPriceMax] = useState<number | ''>('');
  const [filterStockStatus, setFilterStockStatus] = useState<string>('all');
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const [editFormData, setEditFormData] = useState<FormData>({
    name: '',
    quantity: 0,
    available: 0,
    category: '',
    price: 0,
    image: '',
  });
  const [newItemData, setNewItemData] = useState<FormData>({
    name: '',
    quantity: 0,
    available: 0,
    category: 'Rims',
    price: 0,
    image: '',
  });

  const itemsPerPage = 5;

  // Ensure dialog states are synchronized
  useEffect(() => {
    if (!isEditDialogOpen) {
      setCurrentItem(null);
      setEditFormData({
        name: '',
        quantity: 0,
        available: 0,
        category: '',
        price: 0,
        image: '',
      });
      setEditItemImagePreview(null);
    }
    if (!isDeleteDialogOpen) {
      setItemToDelete(null);
    }
  }, [isEditDialogOpen, isDeleteDialogOpen]);

  // Filter inventory
  const filteredInventory: InventoryItem[] = inventory.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesPrice =
      (filterPriceMin === '' || item.price >= filterPriceMin) &&
      (filterPriceMax === '' || item.price <= filterPriceMax);
    const matchesStock =
      filterStockStatus === 'all' ||
      (filterStockStatus === 'inStock' && item.available / item.quantity > 0.5) ||
      (filterStockStatus === 'lowStock' &&
        item.available / item.quantity <= 0.5 &&
        item.available / item.quantity > 0.2) ||
      (filterStockStatus === 'critical' && item.available / item.quantity <= 0.2);
    return matchesSearch && matchesCategory && matchesPrice && matchesStock;
  });

  // Paginated inventory
  const paginatedInventory: InventoryItem[] = filteredInventory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate inventory stats
  const totalItems: number = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const availableItems: number = inventory.reduce((sum, item) => sum + item.available, 0);
  const categories: string[] = [...new Set(inventory.map((item) => item.category))];
  const lowStockItems: number = inventory.filter((item) => item.available / item.quantity < 0.3).length;
  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);

  // Show alert
  const showAlert = useCallback((type: 'success' | 'error', message: string): void => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3000);
  }, []);

  // Validate form data
  const validateAddForm = useCallback((): boolean => {
    try {
      FormDataSchema.parse(newItemData);
      setFormErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Partial<Record<keyof FormData, string>> = {};
        error.errors.forEach((err) => {
          const path = err.path[0] as keyof FormData;
          errors[path] = err.message;
        });
        setFormErrors(errors);
      }
      return false;
    }
  }, [newItemData]);

  // Handle adding new item
  const handleAddItem = useCallback((): void => {
    if (!validateAddForm()) {
      showAlert('error', 'Please fix the form errors.');
      return;
    }
    const newItem: InventoryItem = {
      id: inventory.length + 1,
      ...newItemData,
      image: newItemData.image || '/api/placeholder/100/100',
    };
    setInventory((prev) => [...prev, newItem]);
    setNewItemData({
      name: '',
      quantity: 0,
      available: 0,
      category: 'Rims',
      price: 0,
      image: '',
    });
    setNewItemImagePreview(null);
    setIsAddDialogOpen(false);
    showAlert('success', 'Item added successfully!');
  }, [newItemData, inventory, showAlert, validateAddForm]);

  // Handle editing item
  const startEdit = useCallback((item: InventoryItem): void => {
    setCurrentItem(item);
    setEditFormData({
      name: item.name,
      quantity: item.quantity,
      available: item.available,
      category: item.category,
      price: item.price,
      image: item.image,
    });
    setEditItemImagePreview(item.image);
    setIsEditDialogOpen(true);
  }, []);

  const handleUpdateItem = useCallback((): void => {
    if (!currentItem) {
      showAlert('error', 'No item selected for editing.');
      return;
    }
    try {
      const validatedData = FormDataSchema.parse(editFormData);
      setInventory((prev) =>
        prev.map((item) =>
          item.id === currentItem.id ? { ...item, ...validatedData, image: validatedData.image || item.image } : item
        )
      );
      setIsEditDialogOpen(false);
      showAlert('success', 'Item updated successfully!');
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Partial<Record<keyof FormData, string>> = {};
        error.errors.forEach((err) => {
          const path = err.path[0] as keyof FormData;
          errors[path] = err.message;
        });
        setFormErrors(errors);
        showAlert('error', 'Please fix the form errors.');
      }
    }
  }, [currentItem, editFormData, showAlert]);

  // Handle deleting item
  const handleConfirmDelete = useCallback((id: number): void => {
    setItemToDelete(id);
    setIsDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback((): void => {
    if (itemToDelete === null) return;
    setInventory((prev) => prev.filter((item) => item.id !== itemToDelete));
    setIsDeleteDialogOpen(false);
    showAlert('success', 'Item deleted successfully!');
  }, [itemToDelete, showAlert]);

  // Handle image upload
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean): void => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        if (isEdit) {
          setEditFormData((prev) => ({ ...prev, image: base64 }));
          setEditItemImagePreview(base64);
        } else {
          setNewItemData((prev) => ({ ...prev, image: base64 }));
          setNewItemImagePreview(base64);
        }
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // Handle export
  const handleExport = useCallback((): void => {
    const headers = ['ID', 'Name', 'Category', 'Price', 'Quantity', 'Available', 'Status'];
    const rows = inventory.map((item) => [
      item.id,
      `"${item.name.replace(/"/g, '""')}"`,
      item.category,
      item.price.toFixed(2),
      item.quantity,
      item.available,
      item.available / item.quantity > 0.5
        ? 'In Stock'
        : item.available / item.quantity > 0.2
        ? 'Low Stock'
        : 'Critical',
    ]);
    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'inventory_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showAlert('success', 'Inventory exported successfully!');
  }, [inventory, showAlert]);

  // Handle pagination
  const handlePrevious = useCallback((): void => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  }, [currentPage]);

  const handleNext = useCallback((): void => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  }, [currentPage, totalPages]);

  // Handle filters
  const applyFilters = useCallback((): void => {
    setIsFilterDialogOpen(false);
    setCurrentPage(1);
  }, []);

  const resetFilters = useCallback((): void => {
    setFilterPriceMin('');
    setFilterPriceMax('');
    setFilterStockStatus('all');
    setIsFilterDialogOpen(false);
    setCurrentPage(1);
  }, []);

  // Handle dialog close
  const handleCloseAddDialog = useCallback((): void => {
    setNewItemData({
      name: '',
      quantity: 0,
      available: 0,
      category: 'Rims',
      price: 0,
      image: '',
    });
    setNewItemImagePreview(null);
    setFormErrors({});
    setIsAddDialogOpen(false);
  }, []);

  const handleCloseEditDialog = useCallback((): void => {
    setIsEditDialogOpen(false);
    setFormErrors({});
  }, []);

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-gray-500">Manage your car modification parts inventory</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Add New Item
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Available Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableItems}</div>
            <p className="text-xs text-gray-500">
              {totalItems ? Math.round((availableItems / totalItems) * 100) : 0}% of total inventory
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alert</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockItems}</div>
            <p className="text-xs text-gray-500">Items below 30% availability</p>
          </CardContent>
        </Card>
      </div>

      {/* Alert */}
      {alert && (
        <Alert className={alert.type === 'success' ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}>
          <AlertCircle className={`h-4 w-4 ${alert.type === 'success' ? 'text-green-600' : 'text-red-600'}`} />
          <AlertTitle className={alert.type === 'success' ? 'text-green-600' : 'text-red-600'}>
            {alert.type === 'success' ? 'Success' : 'Error'}
          </AlertTitle>
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      {/* Inventory Table with Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
          <CardDescription>Manage all your car modification parts and components.</CardDescription>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search inventory..."
                className="pl-8"
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <Select value={selectedCategory} onValueChange={(value) => {
              setSelectedCategory(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-1" onClick={() => setIsFilterDialogOpen(true)}>
              <Filter className="h-4 w-4" /> More Filters
            </Button>
            <Button variant="outline" className="gap-1" onClick={handleExport}>
              <Download className="h-4 w-4" /> Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead className="text-right">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedInventory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-gray-500">
                    No inventory items found matching your search criteria.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedInventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center overflow-hidden">
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{item.available}</TableCell>
                    <TableCell className="text-right">
                      {item.available / item.quantity > 0.5 ? (
                        <Badge className="bg-green-500">In Stock</Badge>
                      ) : item.available / item.quantity > 0.2 ? (
                        <Badge className="bg-yellow-500">Low Stock</Badge>
                      ) : (
                        <Badge className="bg-red-500">Critical</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => startEdit(item)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleConfirmDelete(item.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-sm text-gray-500">
            Showing {paginatedInventory.length} of {filteredInventory.length} items
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              Next
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Add Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Add New Inventory Item</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="item-name" className="text-right">
                Name
              </Label>
              <div className="col-span-3">
                <Input
                  id="item-name"
                  value={newItemData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewItemData({ ...newItemData, name: e.target.value })
                  }
                  className={formErrors.name ? 'border-red-500' : ''}
                />
                {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="item-category" className="text-right">
                Category
              </Label>
              <div className="col-span-3">
                <Select
                  value={newItemData.category}
                  onValueChange={(value: string) => setNewItemData({ ...newItemData, category: value })}
                >
                  <SelectTrigger className={formErrors.category ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.category && <p className="text-red-500 text-xs mt-1">{formErrors.category}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="item-price" className="text-right">
                Price ($)
              </Label>
              <div className="col-span-3">
                <Input
                  id="item-price"
                  type="number"
                  value={newItemData.price}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewItemData({ ...newItemData, price: parseFloat(e.target.value) || 0 })
                  }
                  className={formErrors.price ? 'border-red-500' : ''}
                />
                {formErrors.price && <p className="text-red-500 text-xs mt-1">{formErrors.price}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="item-quantity" className="text-right">
                Quantity
              </Label>
              <div className="col-span-3">
                <Input
                  id="item-quantity"
                  type="number"
                  value={newItemData.quantity}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const qty = parseInt(e.target.value) || 0;
                    setNewItemData({
                      ...newItemData,
                      quantity: qty,
                      available: Math.min(qty, newItemData.available),
                    });
                  }}
                  className={formErrors.quantity ? 'border-red-500' : ''}
                />
                {formErrors.quantity && <p className="text-red-500 text-xs mt-1">{formErrors.quantity}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="item-available" className="text-right">
                Available
              </Label>
              <div className="col-span-3">
                <Input
                  id="item-available"
                  type="number"
                  value={newItemData.available}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const avail = parseInt(e.target.value) || 0;
                    if (avail <= newItemData.quantity) {
                      setNewItemData({ ...newItemData, available: avail });
                    }
                  }}
                  max={newItemData.quantity}
                  className={formErrors.available ? 'border-red-500' : ''}
                />
                {formErrors.available && <p className="text-red-500 text-xs mt-1">{formErrors.available}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="item-image" className="text-right">
                Image
              </Label>
              <div className="col-span-3 flex items-center gap-4">
                <div className="h-16 w-16 rounded border border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                  {newItemImagePreview ? (
                    <img src={newItemImagePreview} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <Image className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <Button variant="outline" size="sm" asChild>
                  <label htmlFor="upload-image-add" className="cursor-pointer">
                    Upload Image
                    <input
                      id="upload-image-add"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, false)}
                    />
                  </label>
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseAddDialog}>
              Cancel
            </Button>
            <Button onClick={handleAddItem}>Add Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name
              </Label>
              <div className="col-span-3">
                <Input
                  id="edit-name"
                  value={editFormData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData({ ...editFormData, name: e.target.value })
                  }
                  className={formErrors.name ? 'border-red-500' : ''}
                />
                {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-category" className="text-right">
                Category
              </Label>
              <div className="col-span-3">
                <Select
                  value={editFormData.category}
                  onValueChange={(value: string) => setEditFormData({ ...editFormData, category: value })}
                >
                  <SelectTrigger className={formErrors.category ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.category && <p className="text-red-500 text-xs mt-1">{formErrors.category}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-price" className="text-right">
                Price ($)
              </Label>
              <div className="col-span-3">
                <Input
                  id="edit-price"
                  type="number"
                  value={editFormData.price}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData({ ...editFormData, price: parseFloat(e.target.value) || 0 })
                  }
                  className={formErrors.price ? 'border-red-500' : ''}
                />
                {formErrors.price && <p className="text-red-500 text-xs mt-1">{formErrors.price}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-quantity" className="text-right">
                Quantity
              </Label>
              <div className="col-span-3">
                <Input
                  id="edit-quantity"
                  type="number"
                  value={editFormData.quantity}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const qty = parseInt(e.target.value) || 0;
                    setEditFormData({
                      ...editFormData,
                      quantity: qty,
                      available: Math.min(qty, editFormData.available),
                    });
                  }}
                  className={formErrors.quantity ? 'border-red-500' : ''}
                />
                {formErrors.quantity && <p className="text-red-500 text-xs mt-1">{formErrors.quantity}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-available" className="text-right">
                Available
              </Label>
              <div className="col-span-3">
                <Input
                  id="edit-available"
                  type="number"
                  value={editFormData.available}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const avail = parseInt(e.target.value) || 0;
                    if (avail <= editFormData.quantity) {
                      setEditFormData({ ...editFormData, available: avail });
                    }
                  }}
                  max={editFormData.quantity}
                  className={formErrors.available ? 'border-red-500' : ''}
                />
                {formErrors.available && <p className="text-red-500 text-xs mt-1">{formErrors.available}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-image" className="text-right">
                Image
              </Label>
              <div className="col-span-3 flex items-center gap-4">
                <div className="h-16 w-16 rounded overflow-hidden">
                  <img
                    src={editItemImagePreview || currentItem?.image || '/api/placeholder/100/100'}
                    alt={currentItem?.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <Button variant="outline" size="sm" asChild>
                  <label htmlFor="upload-image-edit" className="cursor-pointer">
                    Replace Image
                    <input
                      id="upload-image-edit"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, true)}
                    />
                  </label>
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseEditDialog}>
              Cancel
            </Button>
            <Button onClick={handleUpdateItem}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this item? This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* More Filters Dialog */}
      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Additional Filters</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price-min" className="text-right">
                Min Price ($)
              </Label>
              <Input
                id="price-min"
                type="number"
                value={filterPriceMin}
                onChange={(e) => setFilterPriceMin(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="col-span-3"
                placeholder="0"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price-max" className="text-right">
                Max Price ($)
              </Label>
              <Input
                id="price-max"
                type="number"
                value={filterPriceMax}
                onChange={(e) => setFilterPriceMax(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="col-span-3"
                placeholder="1000"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="stock-status" className="text-right">
                Stock Status
              </Label>
              <Select value={filterStockStatus} onValueChange={setFilterStockStatus}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select stock status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="inStock">In Stock</SelectItem>
                  <SelectItem value="lowStock">Low Stock</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetFilters}>
              Reset
            </Button>
            <Button onClick={applyFilters}>Apply Filters</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminInventoryPage;