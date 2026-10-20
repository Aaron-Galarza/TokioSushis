import { iConfigurator, iConfigStep, iConfigOption } from '../modules/productos/products.model';

export interface ConfigSelection {
  stepId: string;
  optionId: string;
}

export interface ResolvedSelection {
  stepId: string;
  stepLabel: string;
  optionId: string;
  label: string;
  price: number;
  kind: 'selection' | 'exclusion';
}

export interface PricedConfig {
  basePrice: number;
  finalPrice: number;
  selections: ResolvedSelection[];
  summary: string;
}

export class ConfiguratorError extends Error {}

const findStep = (config: iConfigurator, stepId: string): iConfigStep | undefined =>
  config.steps.find((s) => s.id === stepId);

const findOption = (step: iConfigStep, optionId: string): iConfigOption | undefined =>
  step.options.find((o) => o.id === optionId);

/**
 * Valida las selecciones contra el configurator del producto.
 * Devuelve las selecciones resueltas (con label/precio) o lanza ConfiguratorError.
 */
export const resolveSelections = (
  config: iConfigurator,
  selections: ConfigSelection[] | undefined,
): ResolvedSelection[] => {
  const input = selections ?? [];

  // Agrupar por step
  const byStep = new Map<string, string[]>();
  for (const sel of input) {
    if (!byStep.has(sel.stepId)) byStep.set(sel.stepId, []);
    byStep.get(sel.stepId)!.push(sel.optionId);
  }

  const resolved: ResolvedSelection[] = [];

  for (const step of config.steps) {
    const chosen = byStep.get(step.id) ?? [];

    if (chosen.length === 0) {
      if (step.required && step.min > 0) {
        throw new ConfiguratorError(`El paso "${step.title || step.label}" es obligatorio`);
      }
      continue;
    }

    if (step.type === 'single' && chosen.length > 1) {
      throw new ConfiguratorError(`El paso "${step.title || step.label}" admite una sola opción`);
    }
    if (step.min > 0 && chosen.length < step.min) {
      throw new ConfiguratorError(`El paso "${step.title || step.label}" requiere al menos ${step.min} opción(es)`);
    }
    if (step.max > 0 && chosen.length > step.max) {
      throw new ConfiguratorError(`El paso "${step.title || step.label}" admite como máximo ${step.max} opción(es)`);
    }

    for (const optionId of chosen) {
      const option = findOption(step, optionId);
      if (!option || option.active === false) {
        throw new ConfiguratorError(`Opción inválida "${optionId}" en "${step.title || step.label}"`);
      }
      resolved.push({
        stepId: step.id,
        stepLabel: step.label,
        optionId: option.id,
        label: option.label,
        price: option.price,
        kind: option.kind,
      });
    }
  }

  // Rechazar selecciones que apunten a steps inexistentes
  for (const sel of input) {
    if (!findStep(config, sel.stepId)) {
      throw new ConfiguratorError(`Paso inválido "${sel.stepId}"`);
    }
  }

  return resolved;
};

/**
 * Precio: base = productPrice; los steps "absolute" con selección la reemplazan;
 * los steps "delta" suman. Nunca negativo.
 */
export const calculateConfigPrice = (
  productPrice: number,
  config: iConfigurator,
  selections: ResolvedSelection[],
): number => {
  let base = productPrice;
  let extras = 0;

  for (const step of config.steps) {
    const selected = selections.filter((s) => s.stepId === step.id);
    for (const sel of selected) {
      if (step.mode === 'absolute') base = sel.price;
      else extras += sel.price;
    }
  }

  return Math.max(0, base + extras);
};

const buildSummary = (resolved: ResolvedSelection[]): string => {
  const positives = resolved.filter((s) => s.kind !== 'exclusion');
  const exclusions = resolved.filter((s) => s.kind === 'exclusion');

  let desc = positives.map((s) => s.label).join(' · ');
  if (exclusions.length > 0) {
    const ex = exclusions.map((s) => s.label.replace(/^sin\s+/i, '')).join(', ');
    desc += `${desc ? ' | ' : ''}Sin: ${ex}`;
  }
  return desc || '';
};

/** Valida, pricea y resume una selección de un producto configurable. */
export const priceConfigurableItem = (
  productPrice: number,
  config: iConfigurator,
  selections: ConfigSelection[] | undefined,
): PricedConfig => {
  const resolved = resolveSelections(config, selections);
  const finalPrice = calculateConfigPrice(productPrice, config, resolved);
  return {
    basePrice: productPrice,
    finalPrice,
    selections: resolved,
    summary: buildSummary(resolved),
  };
};
