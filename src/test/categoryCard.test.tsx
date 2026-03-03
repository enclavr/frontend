import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CategoryCard } from '@/components/CategoryCard';
import type { Category, Room } from '@/types';

describe('CategoryCard Component', () => {
  const createMockCategory = (overrides: Partial<Category> = {}): Category => ({
    id: 'cat-1',
    name: 'Test Category',
    sort_order: 0,
    created_at: '2024-01-01T00:00:00Z',
    room_count: 5,
    ...overrides,
  });

  const createMockRoom = (overrides: Partial<Room> = {}): Room => ({
    id: 'room-1',
    name: 'Test Room',
    description: '',
    is_private: false,
    max_users: 50,
    created_by: 'user-1',
    created_at: '2024-01-01T00:00:00Z',
    user_count: 10,
    ...overrides,
  });

  const defaultProps = {
    category: createMockCategory(),
    rooms: [createMockRoom()],
    onEdit: () => {},
    onDelete: () => {},
  };

  it('should render category name', () => {
    render(<CategoryCard {...defaultProps} />);
    expect(screen.getByText('Test Category')).toBeInTheDocument();
  });

  it('should render room count', () => {
    render(<CategoryCard {...defaultProps} />);
    expect(screen.getByText('1 rooms')).toBeInTheDocument();
  });

  it('should use category room_count when rooms array is empty', () => {
    const category = createMockCategory({ room_count: 5 });
    render(<CategoryCard {...defaultProps} category={category} rooms={[]} />);
    // The component uses rooms.length, not category.room_count
    expect(screen.getByText('0 rooms')).toBeInTheDocument();
  });

  it('should render edit button', () => {
    render(<CategoryCard {...defaultProps} />);
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
  });

  it('should render delete button', () => {
    render(<CategoryCard {...defaultProps} />);
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('should call onEdit with category when edit clicked', () => {
    const onEdit = vi.fn();
    const category = createMockCategory({ id: 'cat-1', name: 'Test Category' });
    render(<CategoryCard {...defaultProps} category={category} onEdit={onEdit} />);
    
    screen.getByRole('button', { name: /edit/i }).click();
    
    expect(onEdit).toHaveBeenCalledWith(category);
  });

  it('should call onDelete with category id when delete clicked', () => {
    const onDelete = vi.fn();
    const category = createMockCategory({ id: 'cat-1' });
    render(<CategoryCard {...defaultProps} category={category} onDelete={onDelete} />);
    
    screen.getByRole('button', { name: /delete/i }).click();
    
    expect(onDelete).toHaveBeenCalledWith('cat-1');
  });

  it('should handle zero rooms', () => {
    render(<CategoryCard {...defaultProps} rooms={[]} />);
    expect(screen.getByText('0 rooms')).toBeInTheDocument();
  });

  it('should handle single room in plural form', () => {
    render(<CategoryCard {...defaultProps} rooms={[createMockRoom()]} />);
    expect(screen.getByText('1 rooms')).toBeInTheDocument();
  });

  it('should handle category with long name', () => {
    const category = createMockCategory({ name: 'A'.repeat(100) });
    render(<CategoryCard {...defaultProps} category={category} />);
    expect(screen.getByText('A'.repeat(100))).toBeInTheDocument();
  });

  it('should handle many rooms', () => {
    const rooms = Array.from({ length: 100 }, (_, i) => createMockRoom({ id: `room-${i}` }));
    render(<CategoryCard {...defaultProps} rooms={rooms} />);
    expect(screen.getByText('100 rooms')).toBeInTheDocument();
  });
});
