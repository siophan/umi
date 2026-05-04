'use client';

import { useMemo } from 'react';
import type { ProductSku, SpecDefinition } from '@umi/shared';

import styles from './sku-selector.module.css';

export type SkuSelection = Record<string, string>;

type SkuSelectorProps = {
  specDefinitions: SpecDefinition[];
  skus: ProductSku[];
  selection: SkuSelection;
  onChange: (next: SkuSelection) => void;
  showSummary?: boolean;
};

/**
 * 把当前选规格映射到具体 sku（spec 完整 deep equal）。
 * 没选满或匹配不到时返回 null。
 */
export function findSkuBySelection(
  skus: ProductSku[],
  specDefinitions: SpecDefinition[],
  selection: SkuSelection,
): ProductSku | null {
  if (specDefinitions.some((def) => !selection[def.name])) {
    return null;
  }
  return (
    skus.find((sku) => {
      if (!sku.spec) return false;
      const keys = Object.keys(sku.spec);
      if (keys.length !== specDefinitions.length) return false;
      return specDefinitions.every((def) => sku.spec[def.name] === selection[def.name]);
    }) ?? null
  );
}

/**
 * 单规格商品（specDefinitions==null 或空）拿默认 sku：取第一条 active 的，缺省再取第一条。
 */
export function pickDefaultSku(skus: ProductSku[]): ProductSku | null {
  if (!skus.length) return null;
  const active = skus.find((item) => item.status === 'active');
  return active ?? skus[0]!;
}

export function SkuSelector({
  specDefinitions,
  skus,
  selection,
  onChange,
  showSummary = false,
}: SkuSelectorProps) {
  const matchedSku = useMemo(
    () => findSkuBySelection(skus, specDefinitions, selection),
    [skus, specDefinitions, selection],
  );

  const isValueAvailable = (defName: string, value: string): boolean => {
    // 该值是否还能匹配到至少一条 active 且有库存的 sku（结合当前已选其它规格）。
    const partial: SkuSelection = { ...selection, [defName]: value };
    return skus.some((sku) => {
      if (sku.status !== 'active') return false;
      return Object.entries(partial).every(([k, v]) => sku.spec?.[k] === v);
    });
  };

  return (
    <div className={styles.wrapper}>
      {specDefinitions.map((def) => (
        <div className={styles.row} key={def.name}>
          <div className={styles.label}>{def.name}</div>
          <div className={styles.chips}>
            {def.values.map((value) => {
              const active = selection[def.name] === value;
              const enabled = isValueAvailable(def.name, value);
              return (
                <button
                  key={value}
                  type="button"
                  className={`${styles.chip} ${active ? styles.chipActive : ''} ${
                    !enabled && !active ? styles.chipDisabled : ''
                  }`}
                  onClick={() => {
                    const next: SkuSelection = { ...selection };
                    if (active) {
                      delete next[def.name];
                    } else {
                      next[def.name] = value;
                    }
                    onChange(next);
                  }}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {showSummary ? (
        <div className={styles.summary}>
          {matchedSku ? (
            <>
              <span>
                已选：<span className={styles.summaryStrong}>{matchedSku.specSummary || '默认规格'}</span>
              </span>
              <span>
                <span className={styles.summaryStrong}>¥{matchedSku.guidePrice}</span>
                <span>　库存 {matchedSku.available}</span>
              </span>
            </>
          ) : (
            <span>请选择完整规格</span>
          )}
        </div>
      ) : null}
    </div>
  );
}
