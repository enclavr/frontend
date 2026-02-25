import { useState } from 'react';
import { Category } from '@/types';

interface CategoryModalProps {
  categories: Category[];
  editingCategory: Category | null;
  onClose: () => void;
  onCreateCategory: (name: string) => void;
  onUpdateCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
  onEditChange: (category: Category | null) => void;
}

export function CategoryModal({
  categories,
  editingCategory,
  onClose,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  onEditChange,
}: CategoryModalProps) {
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategoryName.trim()) {
      onCreateCategory(newCategoryName);
      setNewCategoryName('');
    }
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      onUpdateCategory(editingCategory);
      onEditChange(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-gray-800 p-6 rounded-lg w-[500px] max-h-[80vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-white mb-4">Manage Categories</h3>

        <form onSubmit={handleCreate} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="New category name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-700 text-white rounded"
            />
            <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded">
              Add
            </button>
          </div>
        </form>

        {editingCategory && (
          <form onSubmit={handleUpdate} className="mb-4 p-3 bg-gray-700 rounded">
            <p className="text-gray-300 text-sm mb-2">Editing: {editingCategory.name}</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={editingCategory.name}
                onChange={(e) => onEditChange({ ...editingCategory, name: e.target.value })}
                className="flex-1 px-3 py-2 bg-gray-600 text-white rounded"
              />
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                Save
              </button>
              <button
                type="button"
                onClick={() => onEditChange(null)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-700 rounded">
              <span className="text-white">{cat.name}</span>
              <div className="flex gap-2">
                <button onClick={() => onEditChange(cat)} className="text-blue-400 hover:text-blue-300 text-sm">
                  Edit
                </button>
                <button onClick={() => onDeleteCategory(cat.id)} className="text-red-400 hover:text-red-300 text-sm">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        <button onClick={onClose} className="mt-6 w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded">
          Close
        </button>
      </div>
    </div>
  );
}
