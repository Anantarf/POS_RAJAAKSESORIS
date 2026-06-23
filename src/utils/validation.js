export const validators = {
  required: (value, fieldName = "Kolom") => {
    const isEmpty =
      value === "" ||
      value === null ||
      value === undefined ||
      (typeof value === "string" && value.trim() === "");

    return isEmpty ? `${fieldName} harus diisi` : null;
  },

  email: (value) => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return !emailRegex.test(value) ? "Email tidak valid" : null;
  },

  minLength: (length) => (value, fieldName = "Kolom") => {
    if (!value) return null;
    return value.length < length
      ? `${fieldName} minimal ${length} karakter`
      : null;
  },

  maxLength: (length) => (value, fieldName = "Kolom") => {
    if (!value) return null;
    return value.length > length
      ? `${fieldName} maksimal ${length} karakter`
      : null;
  },

  phone: (value) => {
    if (!value) return null;
    const phoneRegex = /^(\+62|0)[0-9]{9,12}$/;
    return !phoneRegex.test(value.replace(/\s/g, ""))
      ? "Nomor telepon tidak valid"
      : null;
  },

  number: (value) => {
    if (value === "" || value === null) return null;
    return isNaN(value) ? "Harus berupa angka" : null;
  },

  positive: (value) => {
    if (value === "" || value === null) return null;
    return Number(value) <= 0 ? "Nilai harus lebih dari 0" : null;
  },

  match: (other, fieldName = "Kolom") => (value) => {
    return value !== other ? `${fieldName} tidak cocok` : null;
  },
};

export function createValidator(rules) {
  return (fieldName, value) => {
    if (!rules[fieldName]) return null;

    for (const rule of rules[fieldName]) {
      const error = rule(value, fieldName);
      if (error) return error;
    }

    return null;
  };
}

export const commonValidators = {
  username: [
    validators.required,
    validators.minLength(3),
  ],
  password: [
    validators.required,
    validators.minLength(6),
  ],
  email: [validators.required, validators.email],
  phone: [validators.required, validators.phone],
  requiredNumber: [validators.required, validators.number],
  positiveNumber: [validators.required, validators.number, validators.positive],
};
