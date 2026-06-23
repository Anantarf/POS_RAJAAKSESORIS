import { useState, useCallback } from "react";

export function useFormValidation(initialValues, onSubmit, validate) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getFieldError = useCallback((fieldName) => {
    return touched[fieldName] ? errors[fieldName] : null;
  }, [errors, touched]);

  const getFieldState = useCallback((fieldName) => {
    const error = getFieldError(fieldName);
    const isTouched = touched[fieldName];
    const hasValue = values[fieldName];

    return {
      error,
      success: !error && isTouched && hasValue ? "Valid" : null,
      isTouched,
    };
  }, [errors, touched, values, getFieldError]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === "checkbox" ? checked : value;

    setValues((prev) => ({
      ...prev,
      [name]: fieldValue,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [errors]);

  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;

    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    // Validate on blur
    if (validate) {
      const fieldError = validate(name, value);
      if (fieldError) {
        setErrors((prev) => ({
          ...prev,
          [name]: fieldError,
        }));
      }
    }
  }, [validate]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setIsSubmitting(true);

      // Validate all fields
      const newErrors = {};
      if (validate) {
        Object.keys(values).forEach((fieldName) => {
          const error = validate(fieldName, values[fieldName]);
          if (error) {
            newErrors[fieldName] = error;
          }
        });
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setTouched(
          Object.keys(values).reduce((acc, key) => {
            acc[key] = true;
            return acc;
          }, {})
        );
        setIsSubmitting(false);
        return;
      }

      try {
        await onSubmit(values);
      } catch (err) {
        console.error("Form submission error:", err);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validate, onSubmit]
  );

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    setValues,
    errors,
    touched,
    isSubmitting,
    getFieldError,
    getFieldState,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
  };
}
