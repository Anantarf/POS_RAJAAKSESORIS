import { useState, useCallback, useRef, useEffect } from "react";

export function useFormValidation(initialValues, onSubmit, validate) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const initialValuesRef = useRef(initialValues);

  useEffect(() => {
    initialValuesRef.current = initialValues;
  }, [initialValues]);

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
  }, [touched, values, getFieldError]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === "checkbox" ? checked : value;

    setValues((prev) => ({
      ...prev,
      [name]: fieldValue,
    }));

    setErrors((prev) => {
      if (!prev[name]) return prev;
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  }, []);

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
        setSubmitError(null);
        await onSubmit(values);
      } catch (err) {
        setSubmitError(err.message || "Form submission failed");
        console.error("Form submission error:", err);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validate, onSubmit]
  );

  const resetForm = useCallback(() => {
    setValues(initialValuesRef.current);
    setErrors({});
    setTouched({});
    setSubmitError(null);
  }, []);

  return {
    values,
    setValues,
    errors,
    touched,
    isSubmitting,
    submitError,
    getFieldError,
    getFieldState,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
  };
}
