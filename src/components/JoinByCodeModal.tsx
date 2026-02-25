interface JoinByCodeModalProps {
  onClose: () => void;
  onSubmit: (code: string) => void;
  value: string;
  onChange: (value: string) => void;
}

export function JoinByCodeModal({ onClose, onSubmit, value, onChange }: JoinByCodeModalProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(value);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-gray-800 p-6 rounded-lg w-96">
        <h3 className="text-xl font-bold text-white mb-4">Join via Invite Code</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter invite code"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded mb-4"
          />
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded">
              Cancel
            </button>
            <button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded">
              Join
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
