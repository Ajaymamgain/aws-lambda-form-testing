"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { PlusIcon, TrashIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { Card, Title, Text } from "@tremor/react";
import { FieldType, FormConfig, RunTestRequest } from "@/types/api";
import api from "@/lib/api";

// Form validation schema
const formSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  name: z.string().min(3, "Name must be at least 3 characters").optional(),
  description: z.string().optional(),
  formConfig: z.object({
    fields: z.array(z.object({
      name: z.string().min(1, "Field name is required"),
      type: z.enum(["text", "email", "password", "number", "select", "checkbox", "radio", "file", "tel"]),
      selector: z.string().min(1, "Selector is required"),
      required: z.boolean().optional(),
      defaultValue: z.union([z.string(), z.boolean()]).optional(),
      options: z.array(z.string()).optional(),
      label: z.string().optional(),
    })),
    submitButtonSelector: z.string().min(1, "Submit button selector is required"),
    successIndicator: z.object({
      selector: z.string().min(1, "Success indicator selector is required"),
      timeout: z.number().optional(),
    }).optional(),
  }),
  userData: z.record(z.union([z.string(), z.boolean()])),
});

type TestFormData = z.infer<typeof formSchema>;

export default function RunTestPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessIndicator, setShowSuccessIndicator] = useState(false);
  
  // Form initialization
  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<TestFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
      name: "",
      description: "",
      formConfig: {
        fields: [
          {
            name: "",
            type: "text",
            selector: "",
            required: true,
          },
        ],
        submitButtonSelector: "",
      },
      userData: {},
    },
  });
  
  // Field array for form fields
  const { fields, append, remove } = useFieldArray({
    control,
    name: "formConfig.fields",
  });
  
  // Watch fields to sync userData
  const watchedFields = watch("formConfig.fields");
  
  // Handler for form submission
  const onSubmit = async (data: TestFormData) => {
    setIsSubmitting(true);
    
    try {
      // Prepare the request payload
      const payload: RunTestRequest = {
        url: data.url,
        name: data.name,
        description: data.description,
        formConfig: data.formConfig,
        userData: data.userData,
      };
      
      // Submit the test
      const response = await api.tests.run(payload);
      
      toast.success("Test started successfully!");
      
      // Redirect to the test result page
      router.push(`/test-results/${response.testId}`);
    } catch (error) {
      console.error("Error running test:", error);
      toast.error("Failed to start test. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Sync userData whenever fields change
  const syncUserData = () => {
    const userData: Record<string, string | boolean> = {};
    
    watchedFields.forEach((field) => {
      if (field.name) {
        // Initialize with empty/default values based on type
        if (field.type === "checkbox") {
          userData[field.name] = false;
        } else if (field.type === "select" || field.type === "radio") {
          userData[field.name] = field.options && field.options.length > 0 ? field.options[0] : "";
        } else {
          userData[field.name] = field.defaultValue?.toString() || "";
        }
      }
    });
    
    setValue("userData", userData);
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <Card className="mb-6">
        <Title>Run Form Test</Title>
        <Text className="mt-2">Configure your form test parameters and user data</Text>
      </Card>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Test Information */}
        <Card>
          <Title className="mb-4">Basic Information</Title>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="url" className="label">Target URL *</label>
              <Controller
                name="url"
                control={control}
                render={({ field }) => (
                  <input
                    id="url"
                    {...field}
                    className="input"
                    placeholder="https://example.com/form"
                  />
                )}
              />
              {errors.url && (
                <p className="text-xs text-danger-600">{errors.url.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="name" className="label">Test Name</label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <input
                    id="name"
                    {...field}
                    className="input"
                    placeholder="Login Form Test"
                  />
                )}
              />
              {errors.name && (
                <p className="text-xs text-danger-600">{errors.name.message}</p>
              )}
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="description" className="label">Description</label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <textarea
                    id="description"
                    {...field}
                    className="input min-h-[80px]"
                    placeholder="Describe the purpose of this test"
                  />
                )}
              />
            </div>
          </div>
        </Card>
        
        {/* Form Configuration */}
        <Card>
          <Title className="mb-4">Form Configuration</Title>
          
          {/* Submit Button Selector */}
          <div className="space-y-2 mb-6">
            <label htmlFor="submitButtonSelector" className="label">Submit Button Selector *</label>
            <Controller
              name="formConfig.submitButtonSelector"
              control={control}
              render={({ field }) => (
                <input
                  id="submitButtonSelector"
                  {...field}
                  className="input"
                  placeholder="button[type='submit'], #submitBtn, .submit-button"
                />
              )}
            />
            {errors.formConfig?.submitButtonSelector && (
              <p className="text-xs text-danger-600">{errors.formConfig.submitButtonSelector.message}</p>
            )}
          </div>
          
          {/* Success Indicator */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="checkbox"
                id="enableSuccessIndicator"
                checked={showSuccessIndicator}
                onChange={(e) => setShowSuccessIndicator(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-600"
              />
              <label htmlFor="enableSuccessIndicator" className="label">
                Define Success Indicator
              </label>
            </div>
            
            {showSuccessIndicator && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-6 border-l-2 border-neutral-200">
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="successSelector" className="label">Success Indicator Selector *</label>
                  <Controller
                    name="formConfig.successIndicator.selector"
                    control={control}
                    render={({ field }) => (
                      <input
                        id="successSelector"
                        {...field}
                        className="input"
                        placeholder=".success-message, #confirmationPage"
                      />
                    )}
                  />
                  {errors.formConfig?.successIndicator?.selector && (
                    <p className="text-xs text-danger-600">{errors.formConfig.successIndicator.selector.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="timeout" className="label">Timeout (ms)</label>
                  <Controller
                    name="formConfig.successIndicator.timeout"
                    control={control}
                    render={({ field }) => (
                      <input
                        id="timeout"
                        type="number"
                        {...field}
                        className="input"
                        placeholder="10000"
                      />
                    )}
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Form Fields */}
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-medium">Form Fields</h3>
              <button
                type="button"
                onClick={() => {
                  append({
                    name: "",
                    type: "text",
                    selector: "",
                    required: true,
                  });
                  setTimeout(syncUserData, 0);
                }}
                className="btn btn-secondary btn-sm"
              >
                <PlusIcon className="h-4 w-4 mr-1" /> Add Field
              </button>
            </div>
            
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="p-4 border border-neutral-200 rounded-md bg-neutral-50"
                >
                  <div className="flex justify-between mb-3">
                    <h4 className="text-sm font-medium">Field #{index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => {
                        remove(index);
                        setTimeout(syncUserData, 0);
                      }}
                      className="text-danger-600 hover:text-danger-800"
                      disabled={fields.length === 1}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="label">Field Name *</label>
                      <Controller
                        name={`formConfig.fields.${index}.name`}
                        control={control}
                        render={({ field }) => (
                          <input
                            {...field}
                            className="input"
                            placeholder="email, password, firstName"
                            onChange={(e) => {
                              field.onChange(e);
                              setTimeout(syncUserData, 0);
                            }}
                          />
                        )}
                      />
                      {errors.formConfig?.fields?.[index]?.name && (
                        <p className="text-xs text-danger-600">{errors.formConfig.fields[index]?.name?.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <label className="label">Field Type *</label>
                      <Controller
                        name={`formConfig.fields.${index}.type`}
                        control={control}
                        render={({ field }) => (
                          <select
                            {...field}
                            className="select"
                            onChange={(e) => {
                              field.onChange(e);
                              setTimeout(syncUserData, 0);
                            }}
                          >
                            <option value="text">Text</option>
                            <option value="email">Email</option>
                            <option value="password">Password</option>
                            <option value="number">Number</option>
                            <option value="tel">Telephone</option>
                            <option value="select">Select</option>
                            <option value="checkbox">Checkbox</option>
                            <option value="radio">Radio</option>
                            <option value="file">File</option>
                          </select>
                        )}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="label">Selector *</label>
                      <Controller
                        name={`formConfig.fields.${index}.selector`}
                        control={control}
                        render={({ field }) => (
                          <input
                            {...field}
                            className="input"
                            placeholder="#email, input[name='password']"
                          />
                        )}
                      />
                      {errors.formConfig?.fields?.[index]?.selector && (
                        <p className="text-xs text-danger-600">{errors.formConfig.fields[index]?.selector?.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <label className="label">Default Value</label>
                      <Controller
                        name={`formConfig.fields.${index}.defaultValue`}
                        control={control}
                        render={({ field }) => (
                          <input
                            {...field}
                            className="input"
                            placeholder="Default value for this field"
                            onChange={(e) => {
                              field.onChange(e);
                              setTimeout(syncUserData, 0);
                            }}
                          />
                        )}
                      />
                    </div>
                    
                    <div className="space-y-2 flex items-center">
                      <Controller
                        name={`formConfig.fields.${index}.required`}
                        control={control}
                        render={({ field }) => (
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id={`required-${index}`}
                              checked={field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                              className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-600"
                            />
                            <label htmlFor={`required-${index}`} className="ml-2 text-sm">
                              Required Field
                            </label>
                          </div>
                        )}
                      />
                    </div>
                    
                    {/* Options for select/radio fields */}
                    {(watch(`formConfig.fields.${index}.type`) === "select" || 
                      watch(`formConfig.fields.${index}.type`) === "radio") && (
                      <div className="space-y-2 md:col-span-2">
                        <label className="label">Options (comma separated)</label>
                        <Controller
                          name={`formConfig.fields.${index}.options`}
                          control={control}
                          defaultValue={[]}
                          render={({ field }) => (
                            <input
                              {...field}
                              className="input"
                              placeholder="option1, option2, option3"
                              onChange={(e) => {
                                const options = e.target.value.split(",").map(opt => opt.trim()).filter(Boolean);
                                field.onChange(options);
                                setTimeout(syncUserData, 0);
                              }}
                              value={(field.value || []).join(", ")}
                            />
                          )}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
        
        {/* User Data Preview */}
        <Card>
          <Title className="mb-4">Test Data Preview</Title>
          <Text className="mb-4">
            This is the data that will be submitted to the form. You can edit these values to customize the test.
          </Text>
          
          <div className="space-y-4">
            {Object.keys(watch("userData") || {}).map((fieldName) => {
              const fieldConfig = watchedFields.find(f => f.name === fieldName);
              if (!fieldConfig) return null;
              
              return (
                <div key={fieldName} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <label className="label">{fieldName}</label>
                    <div className="text-xs text-neutral-500">{fieldConfig.type}</div>
                  </div>
                  
                  <div className="md:col-span-2">
                    {fieldConfig.type === "checkbox" ? (
                      <Controller
                        name={`userData.${fieldName}`}
                        control={control}
                        render={({ field }) => (
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id={`userData-${fieldName}`}
                              checked={!!field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                              className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-600"
                            />
                            <label htmlFor={`userData-${fieldName}`} className="ml-2 text-sm">
                              {field.value ? "Checked" : "Unchecked"}
                            </label>
                          </div>
                        )}
                      />
                    ) : fieldConfig.type === "select" || fieldConfig.type === "radio" ? (
                      <Controller
                        name={`userData.${fieldName}`}
                        control={control}
                        render={({ field }) => (
                          <select {...field} className="select">
                            {(fieldConfig.options || []).map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        )}
                      />
                    ) : (
                      <Controller
                        name={`userData.${fieldName}`}
                        control={control}
                        render={({ field }) => (
                          <input
                            {...field}
                            className="input"
                            placeholder={`Value for ${fieldName}`}
                          />
                        )}
                      />
                    )}
                  </div>
                </div>
              );
            })}
            
            {Object.keys(watch("userData") || {}).length === 0 && (
              <div className="text-neutral-500 text-sm italic">
                Add form fields to see the test data preview.
              </div>
            )}
          </div>
        </Card>
        
        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="btn btn-secondary btn-md"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary btn-md"
          >
            {isSubmitting ? (
              <>
                <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                Running Test...
              </>
            ) : (
              "Run Test"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
