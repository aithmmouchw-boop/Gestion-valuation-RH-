import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';
import { AxeType, EvaluationCompetence } from '../types';

type TemplateCriterion = Omit<EvaluationCompetence, 'evaluation_id' | 'score'>;

const normalize = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const stableId = (value: string) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) || 1;
};

const workbookPath = process.env.EVALUATION_XLSX_PATH
  || path.resolve(process.cwd(), '..', 'Fiches Evaluation.xlsx');

let templatesBySheet = new Map<string, TemplateCriterion[]>();
let sheetNames: string[] = [];

const axisFromLabel = (value: string): AxeType | null => {
  const label = normalize(value).replace(/ /g, '');
  if (label === 'savoir') return 'savoir';
  if (label === 'savoirfaire') return 'savoir_faire';
  if (label === 'savoiretre') return 'savoir_etre';
  return null;
};

export const initializeExcelEvaluationTemplates = () => {
  if (!fs.existsSync(workbookPath)) {
    console.warn(`[Evaluation Excel] Fichier introuvable : ${workbookPath}`);
    return;
  }
  const workbook = XLSX.readFile(workbookPath, { cellFormula: false, cellHTML: false });
  sheetNames = workbook.SheetNames.filter(name => !['Référentiel de poste', 'Liste des fonctions'].includes(name));
  templatesBySheet = new Map();

  for (const sheetName of sheetNames) {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], { header: 1, defval: '', raw: false });
    let currentAxis: AxeType | null = null;
    const criteria: TemplateCriterion[] = [];
    for (const row of rows) {
      const firstCell = String(row[0] || '').trim();
      const detectedAxis = axisFromLabel(firstCell);
      if (detectedAxis) {
        currentAxis = detectedAxis;
        continue;
      }
      if (!currentAxis || !firstCell) continue;
      const resultCell = String(row[9] || '').trim();
      if (resultCell !== '-') continue;
      const key = `${sheetName}|${currentAxis}|${firstCell}`;
      criteria.push({
        id: stableId(key),
        competence_id: stableId(key),
        axe: currentAxis,
        name: firstCell,
        description: currentAxis === 'savoir'
          ? 'Connaissance ou qualification nécessaire à la tenue du poste.'
          : currentAxis === 'savoir_faire'
            ? 'Responsabilité ou activité opérationnelle du poste.'
            : 'Comportement professionnel attendu dans la fonction.',
        coefficient: currentAxis === 'savoir' ? 0.2 : currentAxis === 'savoir_faire' ? 0.5 : 0.3,
      });
    }
    templatesBySheet.set(normalize(sheetName), criteria);
  }
  console.log(`[Evaluation Excel] ${templatesBySheet.size} fiches de poste chargées depuis ${path.basename(workbookPath)}.`);
};

const findSheetForPoste = (posteName: string) => {
  const poste = normalize(posteName);
  const exact = sheetNames.find(name => normalize(name) === poste);
  if (exact) return exact;
  const contained = sheetNames.find(name => poste.includes(normalize(name)) || normalize(name).includes(poste));
  if (contained) return contained;

  const aliases: Array<[RegExp, string]> = [
    [/chef de projet|ingenieur btp|btp/, 'Directeur Technique'],
    [/maintenance|automatisme|technicien/, 'Technicien'],
    [/flotte|transport|exploitation/, 'Resp.Expl'],
    [/technico commercial|commercial/, 'Commercial Itinirant'],
    [/logistique|magasin/, 'Chef magasinier'],
    [/finance|comptab/, 'Comptable'],
    [/rh|ressources humaines/, 'Resp. Administrative RH'],
  ];
  return aliases.find(([pattern]) => pattern.test(poste))?.[1] || 'Technicien';
};

export const getExcelCompetencesForPoste = (posteName: string, evaluationId: number): EvaluationCompetence[] => {
  const sheetName = findSheetForPoste(posteName);
  const criteria = templatesBySheet.get(normalize(sheetName)) || [];
  return criteria.map(criterion => ({ ...criterion, evaluation_id: evaluationId, score: 0 }));
};
