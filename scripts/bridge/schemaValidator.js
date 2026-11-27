/**
 * 🦅 GARUDA BRIDGE SCHEMA VALIDATOR
 * Zero-dependency, deterministic JSON schema validator matching bridge schemas.
 * 
 * Founder: Praveen Mahawar
 * Operating Doctrine: 100% Anti-Fabrication Law ("Show > Tell")
 */

const fs = require('fs');
const path = require('path');

function validateValue(value, propSchema, propName) {
  const errors = [];

  // Type check
  if (propSchema.type) {
    const allowedTypes = Array.isArray(propSchema.type) ? propSchema.type : [propSchema.type];
    let matched = false;

    for (const t of allowedTypes) {
      if (t === 'null' && value === null) matched = true;
      else if (t === 'string' && typeof value === 'string') matched = true;
      else if (t === 'integer' && Number.isInteger(value)) matched = true;
      else if (t === 'number' && typeof value === 'number' && !isNaN(value)) matched = true;
      else if (t === 'boolean' && typeof value === 'boolean') matched = true;
      else if (t === 'array' && Array.isArray(value)) matched = true;
      else if (t === 'object' && typeof value === 'object' && value !== null && !Array.isArray(value)) matched = true;
    }

    if (!matched) {
      errors.push(`Field '${propName}' expected type [${allowedTypes.join(', ')}] but got ${value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value}.`);
      return errors;
    }
  }

  // Null check passed, skip further checks if null
  if (value === null) return errors;

  // String checks
  if (typeof value === 'string') {
    if (propSchema.minLength !== undefined && value.length < propSchema.minLength) {
      errors.push(`Field '${propName}' length (${value.length}) less than minLength ${propSchema.minLength}.`);
    }
    if (propSchema.pattern) {
      const reg = new RegExp(propSchema.pattern);
      if (!reg.test(value)) {
        errors.push(`Field '${propName}' does not match required pattern: ${propSchema.pattern}. Value: "${value}"`);
      }
    }
  }

  // Number checks
  if (typeof value === 'number') {
    if (propSchema.minimum !== undefined && value < propSchema.minimum) {
      errors.push(`Field '${propName}' (${value}) is less than minimum ${propSchema.minimum}.`);
    }
    if (propSchema.maximum !== undefined && value > propSchema.maximum) {
      errors.push(`Field '${propName}' (${value}) is greater than maximum ${propSchema.maximum}.`);
    }
  }

  // Enum checks
  if (propSchema.enum && !propSchema.enum.includes(value)) {
    errors.push(`Field '${propName}' has invalid enum value '${value}'. Allowed: [${propSchema.enum.join(', ')}].`);
  }

  // Array checks
  if (Array.isArray(value) && propSchema.items) {
    value.forEach((item, idx) => {
      const itemErrors = validateValue(item, propSchema.items, `${propName}[${idx}]`);
      errors.push(...itemErrors);
    });
  }

  // Nested Object checks
  if (typeof value === 'object' && value !== null && !Array.isArray(value) && propSchema.properties) {
    // Required fields
    if (propSchema.required && Array.isArray(propSchema.required)) {
      for (const req of propSchema.required) {
        if (value[req] === undefined) {
          errors.push(`Field '${propName}.${req}' is required.`);
        }
      }
    }
    // Additional properties check
    if (propSchema.additionalProperties === false) {
      const allowedProps = new Set(Object.keys(propSchema.properties));
      for (const k of Object.keys(value)) {
        if (!allowedProps.has(k)) {
          errors.push(`Field '${propName}' contains disallowed property '${k}'.`);
        }
      }
    }
    // Validate each child property
    for (const [k, childSchema] of Object.entries(propSchema.properties)) {
      if (value[k] !== undefined) {
        const childErrors = validateValue(value[k], childSchema, `${propName}.${k}`);
        errors.push(...childErrors);
      }
    }
  }

  return errors;
}

function validateSchema(data, schema) {
  const errors = [];

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { valid: false, errors: ['Root data must be a non-null object.'] };
  }

  // Check root required
  if (schema.required && Array.isArray(schema.required)) {
    for (const req of schema.required) {
      if (data[req] === undefined) {
        errors.push(`Missing required field '${req}'.`);
      }
    }
  }

  // Check additionalProperties
  if (schema.additionalProperties === false && schema.properties) {
    const allowed = new Set(Object.keys(schema.properties));
    for (const k of Object.keys(data)) {
      if (!allowed.has(k)) {
        errors.push(`Disallowed property '${k}' in root object.`);
      }
    }
  }

  // Check properties
  if (schema.properties) {
    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      if (data[propName] !== undefined) {
        const propErrors = validateValue(data[propName], propSchema, propName);
        errors.push(...propErrors);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

const SCHEMAS_DIR = path.resolve(__dirname, '..', '..', 'data', 'bridge', 'schemas');
let taskSchemaCache = null;
let reportSchemaCache = null;
let reviewSchemaCache = null;

function validateTask(taskData) {
  if (!taskSchemaCache) {
    taskSchemaCache = JSON.parse(fs.readFileSync(path.join(SCHEMAS_DIR, 'task.schema.json'), 'utf8'));
  }
  return validateSchema(taskData, taskSchemaCache);
}

function validateReport(reportData) {
  if (!reportSchemaCache) {
    reportSchemaCache = JSON.parse(fs.readFileSync(path.join(SCHEMAS_DIR, 'report.schema.json'), 'utf8'));
  }
  return validateSchema(reportData, reportSchemaCache);
}

function validateReview(reviewData) {
  if (!reviewSchemaCache) {
    reviewSchemaCache = JSON.parse(fs.readFileSync(path.join(SCHEMAS_DIR, 'review.schema.json'), 'utf8'));
  }
  return validateSchema(reviewData, reviewSchemaCache);
}

module.exports = {
  validateSchema,
  validateTask,
  validateReport,
  validateReview
};
