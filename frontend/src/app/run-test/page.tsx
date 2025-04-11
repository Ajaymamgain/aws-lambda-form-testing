"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { Card, Title, Button, TextInput } from "@tremor/react";
import { runTest } from "@/lib/api";

export default function RunTest() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formConfig, setFormConfig] = useState({
    formSelector: "form",
    submitSelector: "button[type='submit']",
    successSelector: ".success-message",
    errorSelector: ".error-message",
    fields: [
      { selector: "", type: "text", value: "" }
    ]
  });

  const handleAddField = () => {
    setFormConfig(prev => ({
      ...prev,
      fields: [...prev.fields, { selector: "", type: "text", value: "" }]
    }));
  };

  const handleRemoveField = (index: number) => {
    setFormConfig(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index)
    }));
  };

  const handleFieldChange = (index: number, field: string, value: string) => {
    setFormConfig(prev => ({
      ...prev,
      fields: prev.fields.map((item, i) => {
        if (i === index) {
          return { ...item, [field]: value };
        }
        return item;
      })
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) {
      toast.error("Please enter a URL");
      return;
    }

    try {
      setIsLoading(true);
      const result = await runTest(url, formConfig);
      
      toast.success("Test started successfully!");
      // Redirect to test results page
      window.location.href = `/test-results/${result.testId}`;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start test");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <Title>Run Form Test</Title>
        
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Form URL
            </label>
            <TextInput
              placeholder="https://example.com/form"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Form Selector
            </label>
            <TextInput
              placeholder="form"
              value={formConfig.formSelector}
              onChange={(e) => setFormConfig(prev => ({ ...prev, formSelector: e.target.value }))}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Submit Button Selector
            </label>
            <TextInput
              placeholder="button[type='submit']"
              value={formConfig.submitSelector}
              onChange={(e) => setFormConfig(prev => ({ ...prev, submitSelector: e.target.value }))}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Form Fields
            </label>
            {formConfig.fields.map((field, index) => (
              <div key={index} className="flex gap-4 mb-4">
                <div className="flex-1">
                  <TextInput
                    placeholder="Field selector (e.g., #email)"
                    value={field.selector}
                    onChange={(e) => handleFieldChange(index, "selector", e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="w-32">
                  <select
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                    value={field.type}
                    onChange={(e) => handleFieldChange(index, "type", e.target.value)}
                    disabled={isLoading}
                  >
                    <option value="text">Text</option>
                    <option value="email">Email</option>
                    <option value="password">Password</option>
                    <option value="checkbox">Checkbox</option>
                    <option value="radio">Radio</option>
                    <option value="select">Select</option>
                  </select>
                </div>
                <div className="flex-1">
                  <TextInput
                    placeholder="Field value"
                    value={field.value}
                    onChange={(e) => handleFieldChange(index, "value", e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveField(index)}
                  disabled={isLoading}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              onClick={handleAddField}
              disabled={isLoading}
              className="mt-2"
            >
              Add Field
            </Button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Success Message Selector
            </label>
            <TextInput
              placeholder=".success-message"
              value={formConfig.successSelector}
              onChange={(e) => setFormConfig(prev => ({ ...prev, successSelector: e.target.value }))}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Error Message Selector
            </label>
            <TextInput
              placeholder=".error-message"
              value={formConfig.errorSelector}
              onChange={(e) => setFormConfig(prev => ({ ...prev, errorSelector: e.target.value }))}
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              loading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? "Starting Test..." : "Start Test"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}