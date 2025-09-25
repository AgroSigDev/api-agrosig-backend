/**
 * Sistema de conversión de unidades para insumos agrícolas
 * @module helpers/unitConverter
 */

/**
 * Mapa de conversiones de unidades con factores de conversión a unidades base
 * @constant {Object}
 */
const UNIT_CONVERSIONS = {
  // Peso
  mg: { baseUnit: 'g', factor: 0.001 },
  g: { baseUnit: 'g', factor: 1 },
  kg: { baseUnit: 'g', factor: 1000 },
  ton: { baseUnit: 'g', factor: 1000000 },
  libra: { baseUnit: 'g', factor: 453.592 },
  onza: { baseUnit: 'g', factor: 28.3495 },

  // Volumen
  ml: { baseUnit: 'ml', factor: 1 },
  L: { baseUnit: 'ml', factor: 1000 },
  gal: { baseUnit: 'ml', factor: 3785.41 },

  // Unidades comerciales comunes
  saco: { baseUnit: 'kg', factor: 50 }, // Asumiendo saco de 50kg
  bolsa: { baseUnit: 'kg', factor: 25 }, // Asumiendo bolsa de 25kg
  unidad: { baseUnit: 'unidad', factor: 1 },
  paquete: { baseUnit: 'unidad', factor: 1 }
}

/**
 * Precios de referencia por unidad base para insumos comunes
 * @constant {Object}
 */
const REFERENCE_PRICES = {
  // Fertilizantes
  urea: { baseUnit: 'kg', avgPrice: 22 },
  'fertilizante nitrogenado': { baseUnit: 'kg', avgPrice: 25 },
  fosfato: { baseUnit: 'kg', avgPrice: 18 },

  // Semillas
  'semilla de maíz': { baseUnit: 'g', avgPrice: 0.3 }, // $30 por 100g = $0.3/g
  'semilla de tomate': { baseUnit: 'g', avgPrice: 0.4 },

  // Pesticidas
  'pesticida orgánico': { baseUnit: 'L', avgPrice: 150 },
  herbicida: { baseUnit: 'L', avgPrice: 200 }
}

/**
 * Convierte una cantidad de una unidad a otra
 * @async
 * @param {number} quantity - Cantidad a convertir
 * @param {string} fromUnit - Unidad de origen
 * @param {string} toUnit - Unidad de destino
 * @returns {Promise<number>} Cantidad convertida
 * @throws {Error} Si la conversión no es posible
 */
async function convertUnits (quantity, fromUnit, toUnit) {
  if (fromUnit === toUnit) return quantity

  const fromConversion = UNIT_CONVERSIONS[fromUnit.toLowerCase()]
  const toConversion = UNIT_CONVERSIONS[toUnit.toLowerCase()]

  if (!fromConversion || !toConversion) {
    throw new Error(`No se puede convertir de ${fromUnit} a ${toUnit}`)
  }

  if (fromConversion.baseUnit !== toConversion.baseUnit) {
    throw new Error(`Unidades incompatibles: ${fromUnit} y ${toUnit}`)
  }

  // Convertir a unidad base primero
  const baseQuantity = quantity * fromConversion.factor
  // Convertir de unidad base a destino
  return baseQuantity / toConversion.factor
}

/**
 * Calcula el factor de conversión entre dos unidades
 * @async
 * @param {string} fromUnit - Unidad de origen
 * @param {string} toUnit - Unidad de destino
 * @returns {Promise<number>} Factor de conversión
 */
async function getConversionFactor (fromUnit, toUnit) {
  if (fromUnit === toUnit) return 1

  const fromConversion = UNIT_CONVERSIONS[fromUnit.toLowerCase()]
  const toConversion = UNIT_CONVERSIONS[toUnit.toLowerCase()]

  if (!fromConversion || !toConversion) {
    throw new Error(`No se puede convertir de ${fromUnit} a ${toUnit}`)
  }

  if (fromConversion.baseUnit !== toConversion.baseUnit) {
    throw new Error(`Unidades incompatibles: ${fromUnit} y ${toUnit}`)
  }

  return fromConversion.factor / toConversion.factor
}

/**
 * Obtiene el precio de referencia para un insumo
 * @async
 * @param {string} inputName - Nombre del insumo
 * @returns {Promise<Object|null>} Información del precio de referencia
 */
async function getReferencePrice (inputName) {
  const lowerName = inputName.toLowerCase()
  for (const [key, value] of Object.entries(REFERENCE_PRICES)) {
    if (lowerName.includes(key)) {
      return value
    }
  }
  return null
}

/**
 * Valida y normaliza el costo unitario basado en unidades
 * @async
 * @param {Object} input - Datos del insumo
 * @param {string} input.input_name - Nombre del insumo
 * @param {number} input.quantity - Cantidad
 * @param {string} input.unit - Unidad de la cantidad
 * @param {number} input.unit_cost - Costo unitario
 * @param {string} input.cost_unit - Unidad del costo
 * @returns {Promise<Object>} Datos normalizados del insumo
 */
// helpers/unitConverter.js
async function normalizeInputCost (input) {
  const {
    input_name: inputName,
    quantity,
    unit = 'unidad',
    unit_cost: unitCost = 0,
    cost_unit: costUnit = unit
  } = input

  let normalizedUnitCost = unitCost
  let finalCostUnit = costUnit
  let conversionFactor = 1
  let baseUnit = unit

  try {
    if (unit !== finalCostUnit) {
      conversionFactor = await getConversionFactor(finalCostUnit, unit)
      normalizedUnitCost = unitCost * conversionFactor
      finalCostUnit = unit
    }

    const unitInfo = UNIT_CONVERSIONS[unit.toLowerCase()]
    if (unitInfo) {
      baseUnit = unitInfo.baseUnit
    }

    return {
      input_name: inputName,
      quantity: parseFloat(quantity),
      unit,
      unit_cost: parseFloat(normalizedUnitCost),
      cost_unit: finalCostUnit,
      base_unit: baseUnit,
      conversion_factor: conversionFactor
    }
  } catch (error) {
    console.warn(`Error normalizando costo para ${inputName}:`, error.message)
    return {
      input_name: inputName,
      quantity: parseFloat(quantity),
      unit,
      unit_cost: parseFloat(unitCost),
      cost_unit: costUnit,
      base_unit: unit,
      conversion_factor: 1
    }
  }
}

export {
  convertUnits,
  getConversionFactor,
  getReferencePrice,
  normalizeInputCost,
  UNIT_CONVERSIONS,
  REFERENCE_PRICES
}
