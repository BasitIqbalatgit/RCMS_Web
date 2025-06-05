import { InventoryItem } from '@/lib/db/models/Inventory';

const parseErrorMessage = async (response: Response, defaultMsg: string) => {
  try {
    const text = await response.text();
    const json = JSON.parse(text);
    return json.message || defaultMsg;
  } catch (err) {
    console.warn('Failed to parse error message:', err);
    return defaultMsg;
  }
};

export const fetchInventory = async (adminId?: string): Promise<InventoryItem[]> => {
  try {
    const queryString = adminId ? `?adminId=${adminId}` : '';
    const response = await fetch(`/api/inventory${queryString}`);

    if (!response.ok) {
      const message = await parseErrorMessage(response, 'Failed to fetch inventory');
      throw new Error(message);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching inventory:', error.message);
      throw error;
    } else {
      console.error('Unknown error fetching inventory:', error);
      throw new Error('An unknown error occurred while fetching inventory');
    }
  }
};

export const addInventoryItem = async (
  itemData: Omit<InventoryItem, 'id' | 'adminId' | 'createdAt' | 'updatedAt'>
): Promise<InventoryItem> => {
  try {
    const response = await fetch('/api/inventory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(itemData),
    });

    if (!response.ok) {
      const message = await parseErrorMessage(response, 'Failed to add inventory item');
      throw new Error(message);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error adding inventory item:', error.message);
      throw error;
    } else {
      console.error('Unknown error adding inventory item:', error);
      throw new Error('An unknown error occurred while adding inventory item');
    }
  }
};

export const updateInventoryItem = async (
  id: string,
  itemData: Partial<InventoryItem>
): Promise<InventoryItem> => {
  try {
    const response = await fetch(`/api/inventory/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(itemData),
    });

    if (!response.ok) {
      const message = await parseErrorMessage(response, 'Failed to update inventory item');
      throw new Error(message);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error updating inventory item:', error.message);
      throw error;
    } else {
      console.error('Unknown error updating inventory item:', error);
      throw new Error('An unknown error occurred while updating inventory item');
    }
  }
};

export const deleteInventoryItem = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`/api/inventory/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const message = await parseErrorMessage(response, 'Failed to delete inventory item');
      throw new Error(message);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error deleting inventory item:', error.message);
      throw error;
    } else {
      console.error('Unknown error deleting inventory item:', error);
      throw new Error('An unknown error occurred while deleting inventory item');
    }
  }
};

export const getInventoryItem = async (id: string): Promise<InventoryItem> => {
  try {
    const response = await fetch(`/api/inventory/${id}`);

    if (!response.ok) {
      const message = await parseErrorMessage(response, 'Failed to fetch inventory item');
      throw new Error(message);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching inventory item:', error.message);
      throw error;
    } else {
      console.error('Unknown error fetching inventory item:', error);
      throw new Error('An unknown error occurred while fetching inventory item');
    }
  }
};
