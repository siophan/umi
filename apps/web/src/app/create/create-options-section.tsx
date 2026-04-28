'use client';

import type { TemplateId } from './create-helpers';
import styles from './page.module.css';

type Props = {
  template: TemplateId;
  allowsManyOptions: boolean;
  stepDone: boolean;
  selectedCount: number;
  options: string[];
  updateOption: (index: number, value: string) => void;
  removeOption: (index: number) => void;
  addOption: () => void;
};

export function CreateOptionsSection({
  template,
  allowsManyOptions,
  stepDone,
  selectedCount,
  options,
  updateOption,
  removeOption,
  addOption,
}: Props) {
  const isNumberTemplate = template === 'number';
  const canAddOption = allowsManyOptions;
  const canRemoveOption = allowsManyOptions && options.length > 2;

  function getPlaceholder(index: number) {
    if (isNumberTemplate) {
      return index === 0 ? '最小值' : '最大值';
    }
    return `选项 ${String.fromCharCode(65 + index)}`;
  }

  return (
    <section className={styles.formSection}>
      <h3>
        <span className={styles.stepNum}>2</span> 竞猜选项<span className={styles.requiredMark}>*</span>
        <span className={`${styles.stepStatus} ${stepDone ? styles.done : styles.pending}`}>{stepDone ? `✓ ${selectedCount}个选项` : '待完善'}</span>
      </h3>
      <div className={styles.optionsList}>
        {options.map((item, index) => (
          <div className={styles.optionRow} key={`option-${index}`}>
            <input
              className={styles.input}
              type={isNumberTemplate ? 'number' : 'text'}
              value={item}
              placeholder={getPlaceholder(index)}
              onChange={(event) => updateOption(index, event.target.value)}
            />
            {canRemoveOption ? (
              <button className={styles.removeBtn} type="button" onClick={() => removeOption(index)}>
                <i className="fa-solid fa-circle-minus" />
              </button>
            ) : null}
          </div>
        ))}
      </div>
      {canAddOption ? (
        <button className={styles.addOptionBtn} type="button" onClick={addOption}>
          <i className="fa-solid fa-plus" /> 添加选项
        </button>
      ) : null}
    </section>
  );
}
