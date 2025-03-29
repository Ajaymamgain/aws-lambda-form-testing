"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, Title, Text, Tab, TabGroup, TabList } from "@tremor/react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeftIcon, ArrowPathIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { ScheduleTestRequest, TestResult } from "@/types/api";
import api from "@/lib/api";

// Form validation schema
const scheduleFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  cronExpression: z.string().min(1, "Cron expression is required"),
  testConfig: z.object({
    url: z.string().url("Please enter a valid URL"),
    name: z.string().optional(),
    description: z.string().optional(),
    formConfig: z.object({
      fields: z.array(z.object({
        name: z.string().min(1, "Field name is required"),
        type: z.enum(["text", "email", "password", "number", "select", "checkbox", "radio", "file", "tel"]),
        selector: z.string().min(1, "Selector is required"),
        required: z.boolean().optional(),
        defaultValue: z.union([z.string(), z.boolean()]).optional(),
        options: z.array(z.string()).optional(),
      })),
      submitButtonSelector: z.string().min(1, "Submit button selector is required"),
      successIndicator: z.object({
        selector: z.string().min(1, "Success indicator selector is required"),
        timeout: z.number().optional(),
      }).optional(),
    }),
    userData: z.record(z.union([z.string(), z.boolean()])),
  }),
  active: z.boolean().default(true),
});

type ScheduleFormData = z.infer<typeof scheduleFormSchema>;

// Common cron presets
const cronPresets = [
  { label: "Daily at 8:00 AM", value: "0 8 * * *" },
  { label: "Every Monday at 9:00 AM", value: "0 9 * * 1" },
  { label: "First day of month at 10:00 AM", value: "0 10 1 * *" },
  { label: "Every hour", value: "0 * * * *" },
  { label: "Every 12 hours", value: "0 */12 * * *" },
  { label: "Every week on Sunday at 12:00 AM", value: "0 0 * * 0" },
  { label: "Weekdays at 3:00 PM", value: "0 15 * * 1-5" },
];

export default function NewSchedulePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingTest, setIsLoadingTest] = useState(false);
  const [testResult, setTestResult] = useState<Partial<TestResult> | null>(null);
  const [selectedCronPreset, setSelectedCronPreset] = useState<string | null>(null);
  const [showSuccessIndicator, setShowSuccessIndicator] = useState(false);
  
  // Form initialization
  const { control, handleSubmit, setValue, reset, watch, formState: { errors } } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      name: "",
      description: "",
      cronExpression: "0 8 * * *", // Default to daily at 8 AM
      testConfig: {
        url: "",
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
      active: true,
    },
  });
  
  // Field array for form fields
  const { fields: formFields, append: appendFormField, remove: removeFormField } = useFieldArray({
    control,
    name: "testConfig.formConfig.fields",
  });
  
  // Watch fields to sync userData
  const watchedFields = watch("testConfig.formConfig.fields");
  
  // If fromTest parameter exists, load that test configuration
  useEffect(() => {
    const fromTestId = searchParams.get("fromTest");
    
    if (fromTestId) {
      setIsLoadingTest(true);
      
      // In a real implementation, this would call the API
      // api.tests.getById(fromTestId).then(result => {
      
      // Mock implementation
      setTimeout(() => {
        // Simulate a test result
        const mockTestResult: Partial<TestResult> = {
          id: "test-001",
          name: "Login Form Test",
          description: "Testing the login form functionality",
          url: "https://example.com/login",
          formConfig: {
            fields: [
              { name: "email", type: "email", selector: "#email", required: true },
              { name: "password", type: "password", selector: "#password", required: true }
            ],
            submitButtonSelector: "button[type='submit']",
            successIndicator: {
              selector: ".login-success",
              timeout: 5000
            }
          },
          userData: {
            email: "test@example.com",
            password: "password123"
          }
        };
        
        setTestResult(mockTestResult);
        
        // Populate form with test config
        setValue("name", `${mockTestResult.name} Schedule`);
        setValue("description", `Scheduled run of: ${mockTestResult.description}`);
        setValue("testConfig.url", mockTestResult.url || "");
        setValue("testConfig.name", mockTestResult.name || "");
        setValue("testConfig.description", mockTestResult.description || "");
        setValue("testConfig.formConfig", mockTestResult.formConfig || { fields: [], submitButtonSelector: "" });
        setValue("testConfig.userData", mockTestResult.userData || {});
        
        if (mockTestResult.formConfig?.successIndicator) {
          setShowSuccessIndicator(true);
        }
        
        setIsLoadingTest(false);
      }, 1000);
    }
  }, [searchParams, setValue]);
  
  // Sync userData whenever fields change
  useEffect(() => {
    const userData: Record<string, string | boolean> = {};
    
    watchedFields.forEach((field) => {
      if (field.name) {
        // Initialize with empty/default values based on type
        if (field.type === "checkbox") {
          userData[field.name] = field.defaultValue === true || false;
        } else if (field.type === "select" || field.type === "radio") {
          userData[field.name] = field.options && field.options.length > 0 ? field.options[0] : "";
        } else {
          userData[field.name] = field.defaultValue?.toString() || "";
        }
      }
    });
    
    setValue("testConfig.userData", userData);
  }, [watchedFields, setValue]);
  
  // Handle form submission
  const onSubmit = async (data: ScheduleFormData) => {
    setIsSubmitting(true);
    
    try {
      // In a real implementation, this would call the API
      // const response = await api.schedules.create(data);
      
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success("Schedule created successfully!");
      
      // Redirect to schedules page
      router.push("/schedules");
    } catch (error) {
      console.error("Error creating schedule:", error);
      toast.error("Failed to create schedule. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle cron preset selection
  const handleCronPresetChange = (preset: string) => {
    setSelectedCronPreset(preset);
    setValue("cronExpression", preset);
  };
  
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/schedules"
            className="inline-flex items-center text-sm text-primary-600 hover:text-primary-800 mb-2"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Schedules
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Create New Schedule</h1>
          <p className="mt-1 text-neutral-500">
            Set up a recurring test for your form
          </p>
        </div>
      </div>
      
      {isLoadingTest ? (
        <div className="flex items-center justify-center h-64">
          <ArrowPathIcon className="h-8 w-8 animate-spin text-primary-500" />
          <span className="ml-2 text-neutral-500">Loading test configuration...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Schedule Information */}
          <Card>
            <Title className="mb-4">Schedule Information</Title>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="name" className="label">Schedule Name *</label>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <input
                      id="name"
                      {...field}
                      className="input"
                      placeholder="Daily Login Test"
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
                      placeholder="Describe the purpose of this scheduled test"
                    />
                  )}
                />
              </div>
            </div>
          </Card>
          
          {/* Schedule Timing */}
          <Card>
            <Title className="mb-4">Schedule Timing</Title>
            <div className="space-y-4">
              <div>
                <label htmlFor="cronExpression" className="label">Cron Expression *</label>
                <Controller
                  name="cronExpression"
                  control={control}
                  render={({ field }) => (
                    <input
                      id="cronExpression"
                      {...field}
                      className="input"
                      placeholder="0 8 * * *"
                    />
                  )}
                />
                {errors.cronExpression && (
                  <p className="text-xs text-danger-600">{errors.cronExpression.message}</p>
                )}
                <p className="text-xs text-neutral-500 mt-1">
                  Use cron syntax to define the schedule (e.g., "0 8 * * *" for daily at 8:00 AM)
                </p>
              </div>
              
              <div>
                <label className="label">Common Presets</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  {cronPresets.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => handleCronPresetChange(preset.value)}
                      className={`
                        text-left p-2 rounded-md border text-sm
                        ${selectedCronPreset === preset.value 
                          ? 'border-primary-500 bg-primary-50' 
                          : 'border-neutral-200 hover:bg-neutral-50'
                        }
                      `}
                    >
                      <div className="font-medium">{preset.label}</div>
                      <div className="text-xs text-neutral-500 mt-1">{preset.value}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center">
                <Controller
                  name="active"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="active"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-600"
                      />
                      <label htmlFor="active" className="ml-2 text-sm">
                        Activate schedule immediately
                      </label>
                    </div>
                  )}
                />
              </div>
            </div>
          </Card>
          
          {/* Test Configuration */}
          <Card>
            <Title className="mb-4">Test Configuration</Title>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="testUrl" className="label">Target URL *</label>
                  <Controller
                    name="testConfig.url"
                    control={control}
                    render={({ field }) => (
                      <input
                        id="testUrl"
                        {...field}
                        className="input"
                        placeholder="https://example.com/form"
                      />
                    )}
                  />
                  {errors.testConfig?.url && (
                    <p className="text-xs text-danger-600">{errors.testConfig.url.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="testName" className="label">Test Name</label>
                  <Controller
                    name="testConfig.name"
                    control={control}
                    render={({ field }) => (
                      <input
                        id="testName"
                        {...field}
                        className="input"
                        placeholder="Login Form Test"
                      />
                    )}
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="testDescription" className="label">Test Description</label>
                  <Controller
                    name="testConfig.description"
                    control={control}
                    render={({ field }) => (
                      <textarea
                        id="testDescription"
                        {...field}
                        className="input min-h-[80px]"
                        placeholder="Describe what this test is checking"
                      />
                    )}
                  />
                </div>
              </div>
              
              {/* Submit Button Selector */}
              <div className="space-y-2 mb-4">
                <label htmlFor="submitButtonSelector" className="label">Submit Button Selector *</label>
                <Controller
                  name="testConfig.formConfig.submitButtonSelector"
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
                {errors.testConfig?.formConfig?.submitButtonSelector && (
                  <p className="text-xs text-danger-600">{errors.testConfig.formConfig.submitButtonSelector.message}</p>
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
                        name="testConfig.formConfig.successIndicator.selector"
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
                      {errors.testConfig?.formConfig?.successIndicator?.selector && (
                        <p className="text-xs text-danger-600">{errors.testConfig.formConfig.successIndicator.selector.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="timeout" className="label">Timeout (ms)</label>
                      <Controller
                        name="testConfig.formConfig.successIndicator.timeout"
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
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-medium">Form Fields</h3>
                  <button
                    type="button"
                    onClick={() => {
                      appendFormField({
                        name: "",
                        type: "text",
                        selector: "",
                        required: true,
                      });
                    }}
                    className="btn btn-secondary btn-sm"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" /> Add Field
                  </button>
                </div>
                
                {formFields.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-neutral-300 rounded-md bg-neutral-50">
                    <p className="text-neutral-500">No form fields defined yet.</p>
                    <button
                      type="button"
                      onClick={() => {
                        appendFormField({
                          name: "",
                          type: "text",
                          selector: "",
                          required: true,
                        });
                      }}
                      className="btn btn-primary btn-sm mt-2"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" /> Add First Field
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formFields.map((field, index) => (
                      <div
                        key={field.id}
                        className="p-4 border border-neutral-200 rounded-md bg-neutral-50"
                      >
                        <div className="flex justify-between mb-3">
                          <h4 className="text-sm font-medium">Field #{index + 1}</h4>
                          <button
                            type="button"
                            onClick={() => removeFormField(index)}
                            className="text-danger-600 hover:text-danger-800"
                            disabled={formFields.length === 1}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <label className="label">Field Name *</label>
                            <Controller
                              name={`testConfig.formConfig.fields.${index}.name`}
                              control={control}
                              render={({ field }) => (
                                <input
                                  {...field}
                                  className="input"
                                  placeholder="email, password, firstName"
                                />
                              )}
                            />
                            {errors.testConfig?.formConfig?.fields?.[index]?.name && (
                              <p className="text-xs text-danger-600">
                                {errors.testConfig.formConfig.fields[index]?.name?.message}
                              </p>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <label className="label">Field Type *</label>
                            <Controller
                              name={`testConfig.formConfig.fields.${index}.type`}
                              control={control}
                              render={({ field }) => (
                                <select
                                  {...field}
                                  className="select"
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
                              name={`testConfig.formConfig.fields.${index}.selector`}
                              control={control}
                              render={({ field }) => (
                                <input
                                  {...field}
                                  className="input"
                                  placeholder="#email, input[name='password']"
                                />
                              )}
                            />
                            {errors.testConfig?.formConfig?.fields?.[index]?.selector && (
                              <p className="text-xs text-danger-600">
                                {errors.testConfig.formConfig.fields[index]?.selector?.message}
                              </p>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <label className="label">Default Value</label>
                            <Controller
                              name={`testConfig.formConfig.fields.${index}.defaultValue`}
                              control={control}
                              render={({ field }) => (
                                <input
                                  {...field}
                                  className="input"
                                  placeholder="Default value for this field"
                                />
                              )}
                            />
                          </div>
                          
                          <div className="space-y-2 flex items-center">
                            <Controller
                              name={`testConfig.formConfig.fields.${index}.required`}
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
                          {(watch(`testConfig.formConfig.fields.${index}.type`) === "select" || 
                            watch(`testConfig.formConfig.fields.${index}.type`) === "radio") && (
                            <div className="space-y-2 md:col-span-2">
                              <label className="label">Options (comma separated)</label>
                              <Controller
                                name={`testConfig.formConfig.fields.${index}.options`}
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
                )}
              </div>
            </div>
          </Card>
          
          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <Link
              href="/schedules"
              className="btn btn-secondary btn-md"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="btn btn-primary btn-md"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  Creating Schedule...
                </>
              ) : (
                "Create Schedule"
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
