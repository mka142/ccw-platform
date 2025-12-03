/**
 * Decimal utility wrapper for high-precision arithmetic
 * Provides a clean API around decimal.js for use throughout the codebase
 */
import Decimal from 'decimal.js';

/**
 * Convert a number or string to a Decimal instance
 */
export function toDecimal(value: number | string | Decimal): Decimal {
  if (value instanceof Decimal) {
    return value;
  }
  return new Decimal(value);
}

/**
 * Convert a Decimal instance back to a number
 */
export function fromDecimal(decimal: Decimal): number {
  return decimal.toNumber();
}

/**
 * Compare two decimals with optional epsilon tolerance
 * Returns true if values are equal (within tolerance)
 */
export function decimalEquals(
  a: Decimal | number,
  b: Decimal | number,
  epsilon: number = 1e-10
): boolean {
  const decA = toDecimal(a);
  const decB = toDecimal(b);
  return decA.minus(decB).abs().lessThanOrEqualTo(epsilon);
}

/**
 * Calculate sum of an array of numbers using Decimal precision
 */
export function decimalSum(values: number[]): Decimal {
  return values.reduce((sum, val) => sum.plus(toDecimal(val)), new Decimal(0));
}

/**
 * Calculate mean of an array of numbers using Decimal precision
 */
export function decimalMean(values: number[]): Decimal {
  if (values.length === 0) {
    return new Decimal(0);
  }
  const sum = decimalSum(values);
  return sum.dividedBy(values.length);
}

/**
 * Calculate minimum value using Decimal precision
 */
export function decimalMin(values: number[]): Decimal {
  if (values.length === 0) {
    return new Decimal(0);
  }
  return values.reduce((min, val) => {
    const decVal = toDecimal(val);
    return decVal.lessThan(min) ? decVal : min;
  }, toDecimal(values[0]));
}

/**
 * Calculate maximum value using Decimal precision
 */
export function decimalMax(values: number[]): Decimal {
  if (values.length === 0) {
    return new Decimal(0);
  }
  return values.reduce((max, val) => {
    const decVal = toDecimal(val);
    return decVal.greaterThan(max) ? decVal : max;
  }, toDecimal(values[0]));
}

/**
 * Calculate variance using Decimal precision
 * Variance = sum((x - mean)^2) / n
 */
export function decimalVariance(values: number[]): Decimal {
  if (values.length === 0) {
    return new Decimal(0);
  }
  const mean = decimalMean(values);
  const sumSquaredDiffs = values.reduce((sum, val) => {
    const diff = toDecimal(val).minus(mean);
    return sum.plus(diff.pow(2));
  }, new Decimal(0));
  return sumSquaredDiffs.dividedBy(values.length);
}

/**
 * Calculate standard deviation using Decimal precision
 */
export function decimalStdDev(values: number[]): Decimal {
  const variance = decimalVariance(values);
  return variance.sqrt();
}

/**
 * Safe division that handles division by zero
 * Returns 0 if denominator is zero
 */
export function safeDivide(
  numerator: Decimal | number,
  denominator: Decimal | number
): Decimal {
  const num = toDecimal(numerator);
  const den = toDecimal(denominator);
  
  if (den.equals(0)) {
    return new Decimal(0);
  }
  
  return num.dividedBy(den);
}

/**
 * Round to nearest multiple of step using Decimal precision
 */
export function roundToStep(value: Decimal | number, step: Decimal | number): Decimal {
  const decValue = toDecimal(value);
  const decStep = toDecimal(step);
  
  if (decStep.equals(0)) {
    return decValue;
  }
  
  return decValue.dividedBy(decStep).round().times(decStep);
}

