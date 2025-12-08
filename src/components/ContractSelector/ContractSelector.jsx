export default function ContractSelector({ multiSelect }) {
  return (
    <div className="mb-4">
      <label className="block mb-2 font-semibold text-gray-700">
        {multiSelect ? 'Select Documents' : 'Select Document'}
      </label>
      <select
        multiple={multiSelect}
        className="w-full border rounded px-3 py-2"
      >
        <option>Contract_A.pdf</option>
        <option>Contract_B.pdf</option>
      </select>
    </div>
  );
}
