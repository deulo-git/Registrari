import { createContext, useContext, useState, type ReactNode } from 'react'

export type Lang = 'ca' | 'es'

const ca = {
  appName: 'REGISTRARI',
  today: 'Avui',
  yesterday: 'Ahir',
  calendar: 'Calendari',
  documents: 'Documents',
  settings: 'Configuració',
  add: 'Afegir',
  save: 'Desar',
  cancel: 'Cancel·lar',
  delete: 'Eliminar',
  close: 'Tancar',
  edit: 'Editar',
  notes: 'Notes',
  notesPlaceholder: 'Observacions (opcional)',
  dateTime: 'Data i hora',
  minutes: 'min',
  duration: 'Durada',
  optional: 'opcional',
  nothingToday: 'Encara no hi ha cap registre aquest dia.',
  tapToAdd: 'Toca el botó per afegir un registre',
  confirmDelete: 'Segur que vols eliminar aquest registre?',
  saved: 'Desat',
  deleted: 'Eliminat',
  errorGeneric: "No s'ha pogut desar. Revisa la connexió.",
  loading: 'Carregant…',

  type_water: 'Líquids',
  type_meal: 'Àpat',
  type_symptom: 'Símptoma',
  type_bowel: 'Evacuació',
  type_gas: 'Ventilacions',
  type_medication: 'Medicació',
  type_document: 'Document',

  // Water
  glasses: 'gots',
  glass: 'got',
  waterGoal: 'Objectiu diari',
  addGlass: '+1 got',
  amount: 'Quantitat',
  unitGlasses: 'Gots',
  waterToday: "Aigua d'avui",
  liquidKind: 'Què has begut?',
  liquid_water: 'Aigua',
  liquid_infusion: 'Infusió',
  liquid_coffee: 'Cafè',
  liquid_milk: 'Llet',
  liquid_juice: 'Suc',
  liquid_broth: 'Brou',
  liquid_isotonic: 'Isotònica',
  liquid_soda: 'Refresc',
  otherLiquid: 'Una altra beguda',
  suggestions: 'Suggeriments',
  aiCalc: 'Calcular nutrients amb IA',
  aiCalculating: 'Calculant…',
  aiDone: 'Nutrients calculats',
  aiError: "La IA no ha pogut calcular-ho. Torna-ho a provar o escriu-ho a mà.",
  aiNoKey: "La IA encara no està configurada.",
  aiHint: "Si no hi poses els valors, la IA els calcularà en desar.",
  swipeHint: 'Llisca per canviar de dia',

  // Meal
  mealKind: 'Àpat',
  meal_breakfast: 'Esmorzar',
  meal_midmorning: 'Mig matí',
  meal_lunch: 'Dinar',
  meal_snack: 'Berenar',
  meal_dinner: 'Sopar',
  meal_other: 'Altre',
  foods: 'Aliments',
  foodName: 'Aliment',
  addFood: 'Afegir aliment',
  qty: 'Quantitat',
  kcal: 'kcal',
  protein: 'Proteïna',
  carbs: 'Hidrats',
  fat: 'Greixos',
  fiber: 'Fibra',
  mealSummary: "Resum de l'àpat",
  nutritionHint: 'Valors nutricionals opcionals (g)',

  // Symptom
  category: 'Categoria',
  intensity: 'Intensitat',
  sym_abdominal_pain: 'Dolor abdominal',
  sym_bloating: 'Inflor / distensió',
  sym_nausea: 'Nàusees / vòmits',
  sym_reflux: 'Ardor / reflux',
  sym_cramps: 'Rampes / còlics',
  sym_fatigue: 'Cansament',
  sym_other: 'Altres',

  // Bowel
  bristol: 'Escala de Bristol',
  bristol1: 'Boles dures separades',
  bristol2: 'Forma allargada amb grumolls',
  bristol3: 'Allargada amb esquerdes',
  bristol4: 'Llisa i tova',
  bristol5: 'Trossos tous',
  bristol6: 'Pastosa, vores irregulars',
  bristol7: 'Líquida',
  blood: 'Sang',
  blood_none: 'No',
  blood_little: 'Poca',
  blood_lot: 'Molta',
  effort: 'Esforç',
  effort0: 'Cap',
  effort1: 'Lleu',
  effort2: 'Moderat',
  effort3: 'Intens',
  urgency: 'Urgència',
  pain: 'Dolor',

  // Gas
  gasLevel: 'Nivell',
  gasHint: 'Nombre de ventilacions',

  // Medication
  medication: 'Medicament',
  dose: 'Dosi',
  unit: 'Unitat',
  usualMeds: 'Habituals',
  otherMed: 'Un altre medicament',

  // Document
  docKind: 'Tipus',
  doc_prescription: 'Recepta',
  doc_result: 'Resultat',
  doc_analysis: 'Analítica',
  doc_report: 'Informe',
  doc_other: 'Altre',
  title: 'Títol',
  files: 'Fitxers',
  addFiles: 'Afegir imatge o PDF',
  takePhoto: 'Fer foto',
  uploading: 'Pujant…',
  noDocuments: 'Encara no hi ha documents.',
  open: 'Obrir',

  // Calendar / export
  filter: 'Filtre',
  all: 'Tots',
  exportPdf: 'Exportar PDF',
  from: 'Des de',
  to: 'Fins a',
  includeNotes: 'Incloure notes',
  generate: 'Generar PDF',
  reportTitle: 'Informe de registre digestiu',
  patient: 'Pacient',
  period: 'Període',
  generatedOn: 'Generat el',
  dailySummary: 'Resum diari',
  chronology: 'Cronologia',
  date: 'Data',
  time: 'Hora',
  type: 'Tipus',
  detail: 'Detall',
  water: 'Líquids',
  waterOnly: 'aigua',
  meals: 'Àpats',
  symptoms: 'Símptomes',
  bowels: 'Evacuacions',
  gas: 'Ventil.',
  meds: 'Medicació',
  maxShort: 'màx',
  noEntriesRange: 'No hi ha registres en aquest període.',
  weekdaysShort: 'Dl,Dt,Dc,Dj,Dv,Ds,Dg',

  // Settings
  language: 'Idioma',
  patientName: 'Nom del pacient',
  patientNameHint: 'Surt a la capçalera del PDF',
  glassSize: 'Mida del got (ml)',
  waterGoalMl: 'Objectiu diari (ml)',
  symptomCategories: 'Categories de símptomes',
  addCategory: 'Afegir categoria',
  usualMedications: 'Medicaments habituals',
  addMedication: 'Afegir medicament',
  security: 'Seguretat',
  changePin: 'Canviar PIN',
  forgetPin: 'Oblidar PIN en aquest dispositiu',
  pinRemembered: 'PIN recordat en aquest dispositiu',
  pinNotRemembered: 'Cal el PIN per fer canvis',
  installHint: "A l'iPhone: Safari → Compartir → «Afegeix a la pantalla d'inici».",
  version: 'Versió',

  // PIN
  pinEnter: 'Introdueix el PIN',
  pinEnterHint: 'Cal el PIN de 4 xifres per fer canvis',
  pinCreate: 'Crea un PIN',
  pinCreateHint: 'Aquest PIN protegirà tots els canvis',
  pinRepeat: 'Repeteix el PIN',
  pinCurrent: 'PIN actual',
  pinNew: 'PIN nou',
  pinMismatch: 'Els PIN no coincideixen',
  pinWrong: 'PIN incorrecte',
  pinLocked: 'Massa intents. Torna-ho a provar d’aquí 15 minuts.',
  pinChanged: 'PIN canviat',
}

type Dict = typeof ca

const es: Dict = {
  appName: 'REGISTRARI',
  today: 'Hoy',
  yesterday: 'Ayer',
  calendar: 'Calendario',
  documents: 'Documentos',
  settings: 'Configuración',
  add: 'Añadir',
  save: 'Guardar',
  cancel: 'Cancelar',
  delete: 'Eliminar',
  close: 'Cerrar',
  edit: 'Editar',
  notes: 'Notas',
  notesPlaceholder: 'Observaciones (opcional)',
  dateTime: 'Fecha y hora',
  minutes: 'min',
  duration: 'Duración',
  optional: 'opcional',
  nothingToday: 'Todavía no hay registros este día.',
  tapToAdd: 'Toca el botón para añadir un registro',
  confirmDelete: '¿Seguro que quieres eliminar este registro?',
  saved: 'Guardado',
  deleted: 'Eliminado',
  errorGeneric: 'No se ha podido guardar. Revisa la conexión.',
  loading: 'Cargando…',

  type_water: 'Líquidos',
  type_meal: 'Comida',
  type_symptom: 'Síntoma',
  type_bowel: 'Deposición',
  type_gas: 'Gases',
  type_medication: 'Medicación',
  type_document: 'Documento',

  glasses: 'vasos',
  glass: 'vaso',
  waterGoal: 'Objetivo diario',
  addGlass: '+1 vaso',
  amount: 'Cantidad',
  unitGlasses: 'Vasos',
  waterToday: 'Agua de hoy',
  liquidKind: '¿Qué has bebido?',
  liquid_water: 'Agua',
  liquid_infusion: 'Infusión',
  liquid_coffee: 'Café',
  liquid_milk: 'Leche',
  liquid_juice: 'Zumo',
  liquid_broth: 'Caldo',
  liquid_isotonic: 'Isotónica',
  liquid_soda: 'Refresco',
  otherLiquid: 'Otra bebida',
  suggestions: 'Sugerencias',
  aiCalc: 'Calcular nutrientes con IA',
  aiCalculating: 'Calculando…',
  aiDone: 'Nutrientes calculados',
  aiError: 'La IA no ha podido calcularlo. Vuelve a probar o escríbelo a mano.',
  aiNoKey: 'La IA todavía no está configurada.',
  aiHint: 'Si no pones los valores, la IA los calculará al guardar.',
  swipeHint: 'Desliza para cambiar de día',

  mealKind: 'Comida',
  meal_breakfast: 'Desayuno',
  meal_midmorning: 'Media mañana',
  meal_lunch: 'Comida',
  meal_snack: 'Merienda',
  meal_dinner: 'Cena',
  meal_other: 'Otra',
  foods: 'Alimentos',
  foodName: 'Alimento',
  addFood: 'Añadir alimento',
  qty: 'Cantidad',
  kcal: 'kcal',
  protein: 'Proteína',
  carbs: 'Hidratos',
  fat: 'Grasas',
  fiber: 'Fibra',
  mealSummary: 'Resumen de la comida',
  nutritionHint: 'Valores nutricionales opcionales (g)',

  category: 'Categoría',
  intensity: 'Intensidad',
  sym_abdominal_pain: 'Dolor abdominal',
  sym_bloating: 'Hinchazón / distensión',
  sym_nausea: 'Náuseas / vómitos',
  sym_reflux: 'Ardor / reflujo',
  sym_cramps: 'Retortijones / cólicos',
  sym_fatigue: 'Cansancio',
  sym_other: 'Otros',

  bristol: 'Escala de Bristol',
  bristol1: 'Bolas duras separadas',
  bristol2: 'Forma alargada con grumos',
  bristol3: 'Alargada con grietas',
  bristol4: 'Lisa y blanda',
  bristol5: 'Trozos blandos',
  bristol6: 'Pastosa, bordes irregulares',
  bristol7: 'Líquida',
  blood: 'Sangre',
  blood_none: 'No',
  blood_little: 'Poca',
  blood_lot: 'Mucha',
  effort: 'Esfuerzo',
  effort0: 'Ninguno',
  effort1: 'Leve',
  effort2: 'Moderado',
  effort3: 'Intenso',
  urgency: 'Urgencia',
  pain: 'Dolor',

  gasLevel: 'Nivel',
  gasHint: 'Número de gases',

  medication: 'Medicamento',
  dose: 'Dosis',
  unit: 'Unidad',
  usualMeds: 'Habituales',
  otherMed: 'Otro medicamento',

  docKind: 'Tipo',
  doc_prescription: 'Receta',
  doc_result: 'Resultado',
  doc_analysis: 'Analítica',
  doc_report: 'Informe',
  doc_other: 'Otro',
  title: 'Título',
  files: 'Archivos',
  addFiles: 'Añadir imagen o PDF',
  takePhoto: 'Hacer foto',
  uploading: 'Subiendo…',
  noDocuments: 'Todavía no hay documentos.',
  open: 'Abrir',

  filter: 'Filtro',
  all: 'Todos',
  exportPdf: 'Exportar PDF',
  from: 'Desde',
  to: 'Hasta',
  includeNotes: 'Incluir notas',
  generate: 'Generar PDF',
  reportTitle: 'Informe de registro digestivo',
  patient: 'Paciente',
  period: 'Periodo',
  generatedOn: 'Generado el',
  dailySummary: 'Resumen diario',
  chronology: 'Cronología',
  date: 'Fecha',
  time: 'Hora',
  type: 'Tipo',
  detail: 'Detalle',
  water: 'Líquidos',
  waterOnly: 'agua',
  meals: 'Comidas',
  symptoms: 'Síntomas',
  bowels: 'Depos.',
  gas: 'Gases',
  meds: 'Medicación',
  maxShort: 'máx',
  noEntriesRange: 'No hay registros en este periodo.',
  weekdaysShort: 'Lu,Ma,Mi,Ju,Vi,Sá,Do',

  language: 'Idioma',
  patientName: 'Nombre del paciente',
  patientNameHint: 'Aparece en la cabecera del PDF',
  glassSize: 'Tamaño del vaso (ml)',
  waterGoalMl: 'Objetivo diario (ml)',
  symptomCategories: 'Categorías de síntomas',
  addCategory: 'Añadir categoría',
  usualMedications: 'Medicamentos habituales',
  addMedication: 'Añadir medicamento',
  security: 'Seguridad',
  changePin: 'Cambiar PIN',
  forgetPin: 'Olvidar PIN en este dispositivo',
  pinRemembered: 'PIN recordado en este dispositivo',
  pinNotRemembered: 'Se necesita el PIN para hacer cambios',
  installHint: 'En el iPhone: Safari → Compartir → «Añadir a pantalla de inicio».',
  version: 'Versión',

  pinEnter: 'Introduce el PIN',
  pinEnterHint: 'Se necesita el PIN de 4 cifras para hacer cambios',
  pinCreate: 'Crea un PIN',
  pinCreateHint: 'Este PIN protegerá todos los cambios',
  pinRepeat: 'Repite el PIN',
  pinCurrent: 'PIN actual',
  pinNew: 'PIN nuevo',
  pinMismatch: 'Los PIN no coinciden',
  pinWrong: 'PIN incorrecto',
  pinLocked: 'Demasiados intentos. Vuelve a probar dentro de 15 minutos.',
  pinChanged: 'PIN cambiado',
}

export type TKey = keyof Dict
const DICTS: Record<Lang, Dict> = { ca, es }
const LANG_KEY = 'registrari.lang'

function readLang(): Lang {
  try {
    const v = localStorage.getItem(LANG_KEY)
    if (v === 'ca' || v === 'es') return v
  } catch { /* private mode */ }
  return 'ca'
}

interface I18n {
  lang: Lang
  setLang: (l: Lang) => void
  t: (k: TKey) => string
  /** Symptom category label: built-in key → translated, custom → as typed. */
  symptomLabel: (c: string) => string
  /** Liquid kind label: built-in key → translated, custom → as typed. */
  liquidLabel: (k?: string) => string
  locale: string
}

const Ctx = createContext<I18n | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readLang)
  const setLang = (l: Lang) => {
    setLangState(l)
    try { localStorage.setItem(LANG_KEY, l) } catch { /* ignore */ }
    document.documentElement.lang = l
  }
  const d = DICTS[lang]
  const t = (k: TKey) => d[k]
  const symptomLabel = (c: string) => (d as Record<string, string>)['sym_' + c] ?? c
  const liquidLabel = (k?: string) => (d as Record<string, string>)['liquid_' + (k || 'water')] ?? k ?? ''
  return (
    <Ctx.Provider value={{ lang, setLang, t, symptomLabel, liquidLabel, locale: lang === 'ca' ? 'ca-ES' : 'es-ES' }}>
      {children}
    </Ctx.Provider>
  )
}

export function useI18n() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useI18n outside provider')
  return v
}
