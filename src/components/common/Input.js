function Input({
  label,
  type = 'text',
  error,
  ...props
}) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-gray-700 text-sm font-bold mb-2">
          {label}
        </label>
      )}
      <input
        type={type}
        className={`shadow appearance-none border rounded w-full py-2 px-3 text-[#1e3d58] leading-tight focus:outline-none focus:ring-2 focus:ring-[#43b0f1] ${
          error ? 'border-red-500' : 'border-[#e8eef1]'
        }`}
        {...props}
      />
      {error && <p className="text-red-500 text-xs italic">{error}</p>}
    </div>
  );
}

export default Input; 