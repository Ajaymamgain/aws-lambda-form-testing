import React, { useState } from 'react';

const NewTest = () => {
  const [url, setUrl] = useState('');
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFetchFields = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/fetch-fields', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch fields');
      }

      const data = await response.json();
      setFields(data.fields);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldUpdate = (index, field) => {
    const newFields = [...fields];
    newFields[index] = field;
    setFields(newFields);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/create-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          fields,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create test');
      }

      // Handle successful test creation
      // You might want to redirect to the test details page
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Create New Test</h2>
      
      <div className="mb-6">
        <div className="flex gap-4">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter form URL"
            className="flex-1 p-2 border rounded"
          />
          <button
            onClick={handleFetchFields}
            disabled={loading || !url}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
          >
            {loading ? 'Fetching...' : 'Fetch Fields'}
          </button>
        </div>
        
        {error && (
          <div className="mt-2 text-red-500">
            {error}
          </div>
        )}
      </div>

      {fields.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Detected Form Fields</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left">Field Name</th>
                  <th className="p-2 text-left">Type</th>
                  <th className="p-2 text-left">Required</th>
                  <th className="p-2 text-left">Test Value</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field, index) => (
                  <tr key={index} className="border-t">
                    <td className="p-2">{field.name}</td>
                    <td className="p-2">{field.type}</td>
                    <td className="p-2">
                      {field.required ? 'Yes' : 'No'}
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={field.testValue || ''}
                        onChange={(e) => handleFieldUpdate(index, {
                          ...field,
                          testValue: e.target.value,
                        })}
                        className="w-full p-1 border rounded"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-green-500 text-white rounded disabled:bg-gray-300"
            >
              {loading ? 'Creating...' : 'Create Test'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewTest;