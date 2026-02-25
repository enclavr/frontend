import { Category, Room } from '@/types';

interface CategoryCardProps {
  category: Category;
  rooms: Room[];
  onEdit: (category: Category) => void;
  onDelete: (categoryId: string) => void;
}

export function CategoryCard({ category, rooms, onEdit, onDelete }: CategoryCardProps) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-white">{category.name}</h3>
          <p className="text-gray-400 text-sm">{rooms.length} rooms</p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(category)}
            className="text-gray-400 hover:text-blue-300 text-sm"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(category.id)}
            className="text-gray-400 hover:text-red-300 text-sm"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
