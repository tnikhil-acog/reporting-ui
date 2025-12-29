"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import * as Icons from "lucide-react";

interface FieldSchema {
  type: string;
  title: string;
  description?: string;
  widget?: string;
  placeholder?: string;
  helpText?: string;
  rows?: number;
  order?: number;
  icon?: string;
  default?: any;
  minimum?: number;
  maximum?: number;
  min?: number;
  max?: number;
  format?: string;
  options?: Array<{ value: any; label: string }>;
}

interface Schema {
  type: string;
  properties: Record<string, FieldSchema>;
  required?: string[];
}

interface DynamicPluginFormProps {
  pluginId: string;
  pluginName: string;
  onSubmit: (data: Record<string, any>) => void;
  submitting?: boolean;
  error?: string | null;
}

export function DynamicPluginForm({
  pluginId,
  pluginName,
  onSubmit,
  submitting = false,
  error = null,
}: DynamicPluginFormProps) {
  const [schema, setSchema] = useState<Schema | null>(null);
  const [loading, setLoading] = useState(true);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchSchema();
  }, [pluginId]);

  const fetchSchema = async () => {
    try {
      setLoading(true);
      setSchemaError(null);

      console.log(`[DynamicForm] Fetching schema for plugin: ${pluginId}`);

      const response = await fetch(`/api/plugins/${pluginId}/schema`);
      const data = await response.json();

      console.log(`[DynamicForm] Schema response:`, data);

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch schema");
      }

      setSchema(data.schema);

      // Initialize form data with default values
      const initialData: Record<string, any> = {};
      Object.entries(data.schema.properties).forEach(([key, field]) => {
        const fieldSchema = field as FieldSchema;
        if (fieldSchema.default !== undefined) {
          initialData[key] = fieldSchema.default;
        }
      });
      setFormData(initialData);

      console.log(`[DynamicForm] Form initialized with:`, initialData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load form";
      setSchemaError(errorMessage);
      console.error("[DynamicForm] Error fetching schema:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log("[DynamicForm] Submitting form data:", formData);
    onSubmit(formData);
  };

  const getIcon = (iconName?: string) => {
    if (!iconName) return null;
    try {
      const Icon = (Icons as any)[iconName];
      return Icon ? <Icon className="h-4 w-4 text-primary" /> : null;
    } catch (err) {
      console.warn(`[DynamicForm] Icon not found: ${iconName}`);
      return null;
    }
  };

  const renderField = (fieldName: string, field: FieldSchema) => {
    const widget = field.widget || inferWidget(field);
    const isRequired = schema?.required?.includes(fieldName) || false;
    const value = formData[fieldName] ?? "";

    console.log(
      `[DynamicForm] Rendering field ${fieldName} with widget ${widget}, value:`,
      value
    );

    switch (widget) {
      case "textarea":
        return (
          <textarea
            id={fieldName}
            name={fieldName}
            value={value}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
              handleInputChange(fieldName, e.target.value)
            }
            placeholder={field.placeholder}
            required={isRequired}
            disabled={submitting}
            rows={field.rows || 3}
            className="w-full rounded-lg border bg-background px-4 py-3 text-foreground placeholder-muted-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 resize-none"
          />
        );

      case "number":
        return (
          <input
            id={fieldName}
            name={fieldName}
            type="number"
            value={value}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              handleInputChange(
                fieldName,
                e.target.value ? Number(e.target.value) : ""
              )
            }
            placeholder={field.placeholder}
            required={isRequired}
            disabled={submitting}
            min={field.minimum || field.min}
            max={field.maximum || field.max}
            className="w-full rounded-lg border bg-background px-4 py-3 text-foreground placeholder-muted-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
          />
        );

      case "date":
        return (
          <input
            id={fieldName}
            name={fieldName}
            type="date"
            value={value}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              handleInputChange(fieldName, e.target.value)
            }
            required={isRequired}
            disabled={submitting}
            className="w-full rounded-lg border bg-background px-4 py-3 text-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
          />
        );

      case "email":
        return (
          <input
            id={fieldName}
            name={fieldName}
            type="email"
            value={value}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              handleInputChange(fieldName, e.target.value)
            }
            placeholder={field.placeholder}
            required={isRequired}
            disabled={submitting}
            className="w-full rounded-lg border bg-background px-4 py-3 text-foreground placeholder-muted-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
          />
        );

      case "checkbox":
        return (
          <div className="flex items-center gap-3">
            <input
              id={fieldName}
              name={fieldName}
              type="checkbox"
              checked={!!value}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleInputChange(fieldName, e.target.checked)
              }
              disabled={submitting}
              className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            />
            <label
              htmlFor={fieldName}
              className="text-sm text-muted-foreground cursor-pointer"
            >
              {field.description || field.helpText}
            </label>
          </div>
        );

      case "select":
        return (
          <select
            id={fieldName}
            name={fieldName}
            value={value}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              handleInputChange(fieldName, e.target.value)
            }
            required={isRequired}
            disabled={submitting}
            className="w-full rounded-lg border bg-background px-4 py-3 text-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
          >
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case "text":
      default:
        return (
          <input
            id={fieldName}
            name={fieldName}
            type="text"
            value={value}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              handleInputChange(fieldName, e.target.value)
            }
            placeholder={field.placeholder}
            required={isRequired}
            disabled={submitting}
            className="w-full rounded-lg border bg-background px-4 py-3 text-foreground placeholder-muted-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
          />
        );
    }
  };

  const inferWidget = (field: FieldSchema): string => {
    if (field.type === "boolean") return "checkbox";
    if (field.type === "number") return "number";
    if (field.format === "date") return "date";
    if (field.format === "email") return "email";
    if (field.options && field.options.length > 0) return "select";
    if (field.type === "string") return "text";
    return "text";
  };

  const getSortedFields = (): Array<[string, FieldSchema]> => {
    if (!schema) return [];

    const entries = Object.entries(schema.properties);

    return entries.sort((a, b) => {
      const orderA = a[1].order ?? 999;
      const orderB = b[1].order ?? 999;
      return orderA - orderB;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary mx-auto mb-3"></div>
          <p className="text-sm text-muted-foreground">
            Loading form schema...
          </p>
        </div>
      </div>
    );
  }

  if (schemaError || !schema) {
    return (
      <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-6">
        <div className="flex items-start gap-3">
          <Icons.AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-destructive mb-1">
              Failed to Load Form
            </h3>
            <p className="text-sm text-destructive/90 mb-3">
              {schemaError || "Could not load form schema"}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSchema}
              className="hover:bg-destructive/20"
            >
              <Icons.RefreshCw className="h-4 w-4" />
              <span>Retry</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const sortedFields = getSortedFields();

  console.log(`[DynamicForm] Rendering ${sortedFields.length} fields`);

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {sortedFields.map(([fieldName, field]) => {
          const isRequired = schema.required?.includes(fieldName) || false;
          const widget = field.widget || inferWidget(field);

          return (
            <div key={fieldName} className="space-y-3">
              {widget !== "checkbox" && (
                <label
                  htmlFor={fieldName}
                  className="flex items-center gap-2 text-sm font-semibold text-foreground"
                >
                  {getIcon(field.icon)}
                  {field.title}
                  {isRequired && <span className="text-primary">*</span>}
                </label>
              )}

              {renderField(fieldName, field)}

              {field.helpText && widget !== "checkbox" && (
                <p className="text-xs text-muted-foreground">
                  {field.helpText}
                </p>
              )}
            </div>
          );
        })}

        {/* Error Alert */}
        {error && (
          <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-3 pt-6 border-t">
          <Button
            type="submit"
            disabled={submitting}
            size="lg"
            className="group flex-1 bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                <span>Creating Job...</span>
              </>
            ) : (
              <>
                <Icons.Sparkles className="h-5 w-5" />
                <span>Generate Report</span>
                <Icons.ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
