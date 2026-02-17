export default function MemoryItem({ memory, onDelete, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(memory.text);

  const handleSave = () => {
    if (!editText.trim() || editText.trim() === memory.text) {
      setEditText(memory.text);
      setIsEditing(false);
      return;
    }
    onUpdate(memory.id, editText.trim());
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(memory.text);
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && e.shiftKey === false) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <div className="flex items-start justify-between gap-3 p-3 rounded-lg border border-neutral-800 bg-neutral-900/50 group">
      {isEditing ? (
        <textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          rows={Math.max(2, editText.split("\n").length)}
          className="flex-1 bg-transparent text-sm text-neutral-300 leading-relaxed outline-none resize-none"
        />
      ) : (
        <p className="flex-1 text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">
          {memory.text}
        </p>
      )}

      <div
        className={`flex items-center gap-2 shrink-0 mt-0.5 transition-opacity ${isEditing ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
      >
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              className="text-neutral-400 hover:text-green-400 transition-colors"
            >
              <Check size={14} />
            </button>
            <button
              onClick={handleCancel}
              className="text-neutral-400 hover:text-red-400 transition-colors"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setIsEditing(true)}
              className="text-neutral-600 hover:text-neutral-300 transition-colors"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => onDelete(memory.id)}
              className="text-neutral-600 hover:text-red-400 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
