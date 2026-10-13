// Database of Guatemala Construction Market Reference Costs & Regional Department Indices
// Calibrated according to Cámara Guatemalteca de la Construcción (CGC), INE & Precios de Plaza 2025/2026

export interface GuatemalaDepartmentIndex {
  code: string;
  name: string;
  region: 'Metropolitana' | 'Central' | 'Sur / Costa' | 'Occidente' | 'Norte' | 'Oriente';
  freightFactor: number; // Factor de flete sobre materiales centrales (1.00 = Base Ciudad de Guatemala)
  laborFactor: number;   // Factor de mano de obra según circunscripción económica y oferta local
  overallFactor: number; // Factor compuesto ponderado (60% materiales, 35% mano de obra, 5% equipo)
  distanceKmFromCapital: number;
  logisticsNotes: string;
  majorSuppliersNearby: string[];
}

export interface MarketMaterialItem {
  id: string;
  name: string;
  category: 'Cementos & Aglomerantes' | 'Aceros & Metales' | 'Agregados Pétreos' | 'Mampostería' | 'Formaleta & Madera' | 'Concretos Premezclados' | 'Mano de Obra (Jornal)' | 'Maquinaria & Equipo';
  unit: string;
  basePriceGTQ: number; // Precio base en Ciudad de Guatemala (Zona Metropolitana)
  supplierReference: string;
  specifications: string;
}

// 22 Departments of Guatemala with accurate construction freight and labor adjustments
export const GUATEMALA_DEPARTMENTS_INDEX: Record<string, GuatemalaDepartmentIndex> = {
  Guatemala: {
    code: 'GUA',
    name: 'Guatemala',
    region: 'Metropolitana',
    freightFactor: 1.00,
    laborFactor: 1.00,
    overallFactor: 1.00,
    distanceKmFromCapital: 0,
    logisticsNotes: 'Centro de distribución nacional. Cercanía directa a plantas cementeras San Miguel / San Gabriel y centros de acopio de acero.',
    majorSuppliersNearby: ['Planta San Gabriel Progreso', 'Aceros de Guatemala', 'Mixto Listo Calzada La Paz', 'Canteras Río Las Vacas'],
  },
  Sacatepéquez: {
    code: 'SAC',
    name: 'Sacatepéquez',
    region: 'Central',
    freightFactor: 1.04,
    laborFactor: 1.03,
    overallFactor: 1.036,
    distanceKmFromCapital: 45,
    logisticsNotes: 'Regulaciones estrictas CNPAG en Antigua Guatemala (restricción de camiones pesados en casco histórico, carga nocturna).',
    majorSuppliersNearby: ['Distribuidora El Tejar', 'Ferreterías San Lucas', 'Planta Mixto Listo Carretera Interamericana'],
  },
  Chimaltenango: {
    code: 'CHIM',
    name: 'Chimaltenango',
    region: 'Central',
    freightFactor: 1.03,
    laborFactor: 0.98,
    overallFactor: 1.01,
    distanceKmFromCapital: 55,
    logisticsNotes: 'Excelente disponibilidad de mano de obra de albañilería calificada. Canteras de arena de mina cercanas.',
    majorSuppliersNearby: ['Ferretería La Económica Chimaltenango', 'Canteras Zaragoza', 'Discosa Occidente'],
  },
  'El Progreso': {
    code: 'PROG',
    name: 'El Progreso',
    region: 'Central',
    freightFactor: 0.96,
    laborFactor: 0.97,
    overallFactor: 0.964,
    distanceKmFromCapital: 85,
    logisticsNotes: 'Cercanía a la Megaplanta San Gabriel de Cementos Progreso en Sanarate. Costo de cemento más bajo del país.',
    majorSuppliersNearby: ['Cementos Progreso San Gabriel', 'Canteras Guastatoya', 'Ferreterías Sanarate'],
  },
  Escuintla: {
    code: 'ESC',
    name: 'Escuintla',
    region: 'Sur / Costa',
    freightFactor: 1.04,
    laborFactor: 1.02,
    overallFactor: 1.032,
    distanceKmFromCapital: 60,
    logisticsNotes: 'Clima cálido tropical requiere aditivos retardantes de fraguado y curado acelerado. Cercanía a Puerto Quetzal.',
    majorSuppliersNearby: ['Aceros de Guatemala Planta Tiquisate/Masagua', 'Mixto Listo Costa Sur', 'Agregados Río María Linda'],
  },
  'Santa Rosa': {
    code: 'SROS',
    name: 'Santa Rosa',
    region: 'Sur / Costa',
    freightFactor: 1.07,
    laborFactor: 0.98,
    overallFactor: 1.034,
    distanceKmFromCapital: 95,
    logisticsNotes: 'Acarreos sobre Carretera a El Salvador. Acceso a canteras de piedra volcánica.',
    majorSuppliersNearby: ['Ferreterías Barberena', 'Agregados Cuilapa', 'Distribuidora del Sur'],
  },
  Suchitepéquez: {
    code: 'SUCH',
    name: 'Suchitepéquez',
    region: 'Sur / Costa',
    freightFactor: 1.09,
    laborFactor: 1.00,
    overallFactor: 1.054,
    distanceKmFromCapital: 160,
    logisticsNotes: 'Alto régimen pluviométrico en invierno. Canteras fluviales de arena de río de alta calidad.',
    majorSuppliersNearby: ['Ferretería El Cóndor Mazatenango', 'Discosa Mazatenango', 'Mixto Listo Cuyotenango'],
  },
  Retalhuleu: {
    code: 'REU',
    name: 'Retalhuleu',
    region: 'Sur / Costa',
    freightFactor: 1.10,
    laborFactor: 0.99,
    overallFactor: 1.056,
    distanceKmFromCapital: 185,
    logisticsNotes: 'Zona sísmica costera. Flete directo desde plantas centrales y portuarias.',
    majorSuppliersNearby: ['Ferreterías Champerico', 'Discosa Reu', 'Canteras Río Samalá'],
  },
  Quetzaltenango: {
    code: 'XELA',
    name: 'Quetzaltenango',
    region: 'Occidente',
    freightFactor: 1.08,
    laborFactor: 1.04,
    overallFactor: 1.064,
    distanceKmFromCapital: 200,
    logisticsNotes: 'Segundo polo de desarrollo. Bajas temperaturas nocturnas exigen tiempos extendidos de desencofrado. Flete de acero desde la capital.',
    majorSuppliersNearby: ['Mixto Listo Xela', 'Aceros del Altiplano', 'Ferreterías La Paz Quetzaltenango', 'Canteras Cantel'],
  },
  'San Marcos': {
    code: 'SMAR',
    name: 'San Marcos',
    region: 'Occidente',
    freightFactor: 1.14,
    laborFactor: 1.02,
    overallFactor: 1.092,
    distanceKmFromCapital: 250,
    logisticsNotes: 'Alta sismicidad (zona de subducción e intraplaca). Fletes de montaña escarpada con pendientes de más del 12%.',
    majorSuppliersNearby: ['Ferreterías San Pedro Sacatepéquez', 'Distribuidora Malacatán', 'Canteras Tacaná'],
  },
  Huehuetenango: {
    code: 'HUE',
    name: 'Huehuetenango',
    region: 'Occidente',
    freightFactor: 1.15,
    laborFactor: 1.01,
    overallFactor: 1.094,
    distanceKmFromCapital: 270,
    logisticsNotes: 'Carretera Interamericana de montaña. Alta demanda en vivienda unifamiliar y remesas.',
    majorSuppliersNearby: ['Ferretería El Triunfo Huehue', 'Discosa Huehuetenango', 'Canteras Chiantla'],
  },
  Totonicapán: {
    code: 'TOTO',
    name: 'Totonicapán',
    region: 'Occidente',
    freightFactor: 1.09,
    laborFactor: 0.97,
    overallFactor: 1.042,
    distanceKmFromCapital: 210,
    logisticsNotes: 'Abundante madera de pino local para formaleta y encofrados temporales.',
    majorSuppliersNearby: ['Aserraderos San Cristóbal Toto', 'Ferretería Central Totonicapán'],
  },
  Sololá: {
    code: 'SOL',
    name: 'Sololá',
    region: 'Occidente',
    freightFactor: 1.07,
    laborFactor: 0.99,
    overallFactor: 1.038,
    distanceKmFromCapital: 140,
    logisticsNotes: 'Topografía de cuenca del Lago de Atitlán. Dificultad de maniobra para camiones trompo de más de 8 m³.',
    majorSuppliersNearby: ['Ferretería Panajachel', 'Agregados Los Encuentros', 'Distribuidora Sololá'],
  },
  Quiché: {
    code: 'QUIC',
    name: 'Quiché',
    region: 'Occidente',
    freightFactor: 1.13,
    laborFactor: 0.96,
    overallFactor: 1.062,
    distanceKmFromCapital: 165,
    logisticsNotes: 'Caminos secundarios no pavimentados en el norte del departamento elevan fletes de acarreo en volteo.',
    majorSuppliersNearby: ['Ferreterías Santa Cruz del Quiché', 'Distribuidora Nebaj', 'Canteras Chichicastenango'],
  },
  'Alta Verapaz': {
    code: 'AVEP',
    name: 'Alta Verapaz',
    region: 'Norte',
    freightFactor: 1.15,
    laborFactor: 0.98,
    overallFactor: 1.082,
    distanceKmFromCapital: 215,
    logisticsNotes: 'Constante humedad (chipi-chipi) requiere techado provisional de obras y almacén de cemento estanco.',
    majorSuppliersNearby: ['Ferretería Cobán Imperial', 'Discosa Alta Verapaz', 'Canteras San Pedro Carchá'],
  },
  'Baja Verapaz': {
    code: 'BVEP',
    name: 'Baja Verapaz',
    region: 'Norte',
    freightFactor: 1.07,
    laborFactor: 0.96,
    overallFactor: 1.026,
    distanceKmFromCapital: 150,
    logisticsNotes: 'Corredor seco en Salamá / San Jerónimo. Facilidad de acceso por Carretera al Atlántico CA-9.',
    majorSuppliersNearby: ['Ferreterías Salamá', 'Canteras San Jerónimo', 'Distribuidora El Norte'],
  },
  Petén: {
    code: 'PET',
    name: 'Petén',
    region: 'Norte',
    freightFactor: 1.24,
    laborFactor: 1.06,
    overallFactor: 1.168,
    distanceKmFromCapital: 490,
    logisticsNotes: 'Flete largo (>480 km). Acero y cemento con sobrecosto por tonelada/km. Agregados calizos locales requieren dosificación especial.',
    majorSuppliersNearby: ['Ferretería El Encanto Flores', 'Distribuidora Santa Elena', 'Mixto Listo San Benito', 'Canteras Poptún'],
  },
  Izabal: {
    code: 'IZAB',
    name: 'Izabal',
    region: 'Oriente',
    freightFactor: 1.16,
    laborFactor: 1.02,
    overallFactor: 1.104,
    distanceKmFromCapital: 295,
    logisticsNotes: 'Ambiente marino corrosivo en Puerto Barrios requiere recubrimientos epóxicos y mayor espesor en columnas.',
    majorSuppliersNearby: ['Ferreterías Puerto Barrios', 'Discosa Morales', 'Aceros del Atlántico'],
  },
  Zacapa: {
    code: 'ZAC',
    name: 'Zacapa',
    region: 'Oriente',
    freightFactor: 1.05,
    laborFactor: 0.98,
    overallFactor: 1.022,
    distanceKmFromCapital: 145,
    logisticsNotes: 'Clima muy seco y cálido. Extracción directa de arena del Río Motagua.',
    majorSuppliersNearby: ['Areneras Río Motagua', 'Ferreterías Estanzuela', 'Distribuidora Teculután'],
  },
  Chiquimula: {
    code: 'CHIQ',
    name: 'Chiquimula',
    region: 'Oriente',
    freightFactor: 1.07,
    laborFactor: 0.97,
    overallFactor: 1.03,
    distanceKmFromCapital: 170,
    logisticsNotes: 'Polo comercial oriental. Buena disponibilidad de blocks y ladrilleras artesanales.',
    majorSuppliersNearby: ['Ferretería El Obrero Chiquimula', 'Ladrilleras San José La Arada', 'Discosa Chiquimula'],
  },
  Jalapa: {
    code: 'JAL',
    name: 'Jalapa',
    region: 'Oriente',
    freightFactor: 1.06,
    laborFactor: 0.97,
    overallFactor: 1.024,
    distanceKmFromCapital: 105,
    logisticsNotes: 'Topografía quebrada pero distancias moderadas desde la capital.',
    majorSuppliersNearby: ['Ferreterías Jalapa Centro', 'Canteras Monjas', 'Distribuidora El Progreso Jalapa'],
  },
  Jutiapa: {
    code: 'JUT',
    name: 'Jutiapa',
    region: 'Oriente',
    freightFactor: 1.08,
    laborFactor: 0.98,
    overallFactor: 1.04,
    distanceKmFromCapital: 125,
    logisticsNotes: 'Zona fronteriza con El Salvador. Disponibilidad de piedra pómez y arenas locales.',
    majorSuppliersNearby: ['Ferretería Jutiapaneca', 'Agregados Asunción Mita', 'Distribuidora El Oriente'],
  },
};

// Base market catalogue of construction materials and labor in Guatemala
export const GUATEMALA_BASE_MARKET_CATALOGUE: MarketMaterialItem[] = [
  // CEMENTOS
  {
    id: 'mat-cem-ugc',
    name: 'Cemento Progreso Uso General (UGC) 4060 PSI',
    category: 'Cementos & Aglomerantes',
    unit: 'Saco 42.5 kg',
    basePriceGTQ: 89.50,
    supplierReference: 'Cementos Progreso / Discosa',
    specifications: 'Norma COGUANOR NTG 41001. Ideal para losas, columnas, zapatas y soleras.',
  },
  {
    id: 'mat-cem-blanco',
    name: 'Cemento Blanco Progreso Tipo I',
    category: 'Cementos & Aglomerantes',
    unit: 'Saco 40 kg',
    basePriceGTQ: 118.00,
    supplierReference: 'Cementos Progreso',
    specifications: 'Para acabados arquitectónicos vistos, terrazos y granitos.',
  },
  {
    id: 'mat-cem-mortero',
    name: 'Mortero Seco Predosificado Pegablock',
    category: 'Cementos & Aglomerantes',
    unit: 'Saco 40 kg',
    basePriceGTQ: 42.00,
    supplierReference: 'Mezclas Listas Progreso',
    specifications: 'Rendimiento ~35 blocks por saco de 40 kg.',
  },

  // ACEROS
  {
    id: 'mat-acero-g60',
    name: 'Hierro Corrugado Grado 60 (3/8", 1/2", 3/4")',
    category: 'Aceros & Metales',
    unit: 'Quintal (100 lbs)',
    basePriceGTQ: 395.00,
    supplierReference: 'Aceros de Guatemala (AG)',
    specifications: 'Norma ASTM A615 / AGIES NSE 2. Límite de fluencia fy = 4,200 kg/cm².',
  },
  {
    id: 'mat-alambre-amarre',
    name: 'Alambre de Amarre Calibre 16',
    category: 'Aceros & Metales',
    unit: 'Libra',
    basePriceGTQ: 12.50,
    supplierReference: 'Aceros de Guatemala',
    specifications: 'Alambre negro recocido para amarre de armaduras y estribos.',
  },
  {
    id: 'mat-clavos',
    name: 'Clavos con Cabeza 2.5" y 3" para Madera',
    category: 'Aceros & Metales',
    unit: 'Libra',
    basePriceGTQ: 9.75,
    supplierReference: 'Ferreterías Centrales',
    specifications: 'Acero galvanizado o negro para armado de formaleta.',
  },
  {
    id: 'mat-electromalla',
    name: 'Electromalla 6x6 - 9/9 para losas y banquetas',
    category: 'Aceros & Metales',
    unit: 'm²',
    basePriceGTQ: 24.50,
    supplierReference: 'Aceros de Guatemala',
    specifications: 'Refuerzo por retracción y temperatura en contrapisos.',
  },

  // AGREGADOS
  {
    id: 'mat-arena-rio',
    name: 'Arena de Río Lavada de Mina',
    category: 'Agregados Pétreos',
    unit: 'm³',
    basePriceGTQ: 185.00,
    supplierReference: 'Canteras Río Pixcayá / Motagua',
    specifications: 'Módulo de finura 2.6 - 2.9, libre de materia orgánica y limos arcillosos.',
  },
  {
    id: 'mat-piedrin',
    name: 'Piedrín Triturado 3/4" y 1/2"',
    category: 'Agregados Pétreos',
    unit: 'm³',
    basePriceGTQ: 235.00,
    supplierReference: 'Agregados San Jerónimo / San Miguel',
    specifications: 'Trituración basáltica o caliza de alta densidad para concretos estructurales.',
  },
  {
    id: 'mat-selecto',
    name: 'Material Selecto Compactable para Relleno',
    category: 'Agregados Pétreos',
    unit: 'm³',
    basePriceGTQ: 95.00,
    supplierReference: 'Canteras Locales',
    specifications: 'CBR > 20%, compactable a 95% Proctor Modificado.',
  },

  // MAMPOSTERÍA
  {
    id: 'mat-block-35',
    name: 'Block de Pórfido 14x19x39 cm - 35 kg/cm²',
    category: 'Mampostería',
    unit: 'Unidad',
    basePriceGTQ: 5.25,
    supplierReference: 'Prefabricados La Paz / Santa Fe',
    specifications: 'Uso en muros divisorios y cerramientos no estructurales.',
  },
  {
    id: 'mat-block-50',
    name: 'Block Estructural 14x19x39 cm - 50 kg/cm²',
    category: 'Mampostería',
    unit: 'Unidad',
    basePriceGTQ: 6.50,
    supplierReference: 'Prefabricados Estructurales',
    specifications: 'Mampostería confinada según norma AGIES NSE 3 / COGUANOR 41007.',
  },
  {
    id: 'mat-block-70',
    name: 'Block Estructural 14x19x39 cm - 70 kg/cm²',
    category: 'Mampostería',
    unit: 'Unidad',
    basePriceGTQ: 7.80,
    supplierReference: 'Bloqueras Certificadas FHA',
    specifications: 'Para edificaciones de más de 3 niveles y muros de contención.',
  },

  // FORMALETA Y MADERA
  {
    id: 'mat-tabla-pino',
    name: 'Tabla de Pino de 1" x 12" x 10 pies (Formaleta)',
    category: 'Formaleta & Madera',
    unit: 'Unidad',
    basePriceGTQ: 58.00,
    supplierReference: 'Aserraderos del Altiplano',
    specifications: 'Madera de pino blanco rústica, reutilización estimada en obra: 4 a 5 usos.',
  },
  {
    id: 'mat-costanera',
    name: 'Costanera de Pino 2" x 3" x 10 pies',
    category: 'Formaleta & Madera',
    unit: 'Unidad',
    basePriceGTQ: 38.00,
    supplierReference: 'Aserraderos',
    specifications: 'Refuerzo longitudinal y cerchas temporales.',
  },
  {
    id: 'mat-playwood-fenolico',
    name: 'Playwood Fenólico Marino 18mm para Losa',
    category: 'Formaleta & Madera',
    unit: 'Hoja 4x8 pies',
    basePriceGTQ: 265.00,
    supplierReference: 'Maderas Especializadas',
    specifications: 'Para acabados de concreto visto liso con 10 a 12 reusos.',
  },

  // CONCRETOS PREMEZCLADOS
  {
    id: 'mat-concreto-3000',
    name: 'Concreto Premezclado Bombeado 3000 PSI (f\'c=210 kg/cm²)',
    category: 'Concretos Premezclados',
    unit: 'm³',
    basePriceGTQ: 1120.00,
    supplierReference: 'Mixto Listo / Precon',
    specifications: 'Revenimiento 4" a 6", tamaño máximo agregado 3/4". Descuento por volumen >50m³.',
  },
  {
    id: 'mat-concreto-4000',
    name: 'Concreto Premezclado Estructural 4000 PSI (f\'c=280 kg/cm²)',
    category: 'Concretos Premezclados',
    unit: 'm³',
    basePriceGTQ: 1280.00,
    supplierReference: 'Mixto Listo',
    specifications: 'Especial para vigas primarias, marcos de momento y columnas esbeltas.',
  },

  // MANO DE OBRA
  {
    id: 'mo-capataz',
    name: 'Jornal Maestro de Obras / Capataz General',
    category: 'Mano de Obra (Jornal)',
    unit: 'Jornal (8 hrs)',
    basePriceGTQ: 290.00,
    supplierReference: 'Convenio de Obra / Mercado Local',
    specifications: 'Dirección de cuadrillas, lectura de planos estructurales, replanteo y control de calidad.',
  },
  {
    id: 'mo-albanil',
    name: 'Jornal Albañil Oficial Calificado',
    category: 'Mano de Obra (Jornal)',
    unit: 'Jornal (8 hrs)',
    basePriceGTQ: 185.00,
    supplierReference: 'Convenio Laboral Construcción',
    specifications: 'Armado de acero, fundiciones, levantado de mampostería plomada y repello.',
  },
  {
    id: 'mo-ayudante',
    name: 'Jornal Ayudante de Albañilería',
    category: 'Mano de Obra (Jornal)',
    unit: 'Jornal (8 hrs)',
    basePriceGTQ: 135.00,
    supplierReference: 'Convenio Laboral Construcción',
    specifications: 'Acarreo de materiales, mezclado en trompo, zarandeo de arena y limpieza de obra.',
  },

  // MAQUINARIA Y EQUIPO
  {
    id: 'eq-concretera',
    name: 'Alquiler Concretera 1 Bolsa a Gasolina (Trompo)',
    category: 'Maquinaria & Equipo',
    unit: 'Día',
    basePriceGTQ: 320.00,
    supplierReference: 'Alquiler de Maquinaria Ligera',
    specifications: 'Motor Honda 9 HP con capacidad de 1 bolsa completa + agregados.',
  },
  {
    id: 'eq-vibrador',
    name: 'Alquiler Vibrador de Concreto 2" a Gasolina',
    category: 'Maquinaria & Equipo',
    unit: 'Día',
    basePriceGTQ: 160.00,
    supplierReference: 'Alquiler de Maquinaria',
    specifications: 'Manguera flexible de 6 metros para consolidación y vaciado.',
  },
  {
    id: 'eq-retro',
    name: 'Hora Máquina Retroexcavadora CAT 416 (Con operador y diésel)',
    category: 'Maquinaria & Equipo',
    unit: 'Hora',
    basePriceGTQ: 380.00,
    supplierReference: 'Maquinaria Pesada Guatemala',
    specifications: 'Cucharon frontal 1 m³ y retro posterior para zanjas y excavaciones.',
  },
];

// Helper: Calculate adjusted price for a material or resource in any Guatemala department
export function calculateRegionalPrice(
  basePrice: number,
  department: string,
  category: MarketMaterialItem['category']
): { adjustedPrice: number; diffPercent: number; factorUsed: number } {
  const deptData = GUATEMALA_DEPARTMENTS_INDEX[department] || GUATEMALA_DEPARTMENTS_INDEX['Guatemala'];
  
  let factor = deptData.overallFactor;
  // If it's heavy freight like aggregates, cement or steel, freight dominates
  if (
    category === 'Cementos & Aglomerantes' ||
    category === 'Aceros & Metales' ||
    category === 'Agregados Pétreos' ||
    category === 'Concretos Premezclados'
  ) {
    factor = deptData.freightFactor;
  } else if (category === 'Mano de Obra (Jornal)') {
    factor = deptData.laborFactor;
  }

  const adjustedPrice = Math.round(basePrice * factor * 100) / 100;
  const diffPercent = Math.round((factor - 1.0) * 1000) / 10;

  return { adjustedPrice, diffPercent, factorUsed: factor };
}

// Adjust any APU Item direct costs when shifting between departments
export function adjustApuDirectCostsForDepartment(
  matCost: number,
  labCost: number,
  eqCost: number,
  targetDept: string,
  sourceDept: string = 'Guatemala'
): {
  materialUnitCostGTQ: number;
  laborUnitCostGTQ: number;
  equipmentUnitCostGTQ: number;
  totalUnitCostGTQ: number;
  factorDiffPercent: number;
} {
  const target = GUATEMALA_DEPARTMENTS_INDEX[targetDept] || GUATEMALA_DEPARTMENTS_INDEX['Guatemala'];
  const source = GUATEMALA_DEPARTMENTS_INDEX[sourceDept] || GUATEMALA_DEPARTMENTS_INDEX['Guatemala'];

  const matRatio = target.freightFactor / source.freightFactor;
  const labRatio = target.laborFactor / source.laborFactor;
  const eqRatio = target.overallFactor / source.overallFactor;

  const newMat = Math.round(matCost * matRatio * 100) / 100;
  const newLab = Math.round(labCost * labRatio * 100) / 100;
  const newEq = Math.round(eqCost * eqRatio * 100) / 100;
  const total = Math.round((newMat + newLab + newEq) * 100) / 100;

  const originalTotal = matCost + labCost + eqCost;
  const factorDiffPercent = originalTotal > 0
    ? Math.round(((total - originalTotal) / originalTotal) * 1000) / 10
    : 0;

  return {
    materialUnitCostGTQ: newMat,
    laborUnitCostGTQ: newLab,
    equipmentUnitCostGTQ: newEq,
    totalUnitCostGTQ: total,
    factorDiffPercent,
  };
}
