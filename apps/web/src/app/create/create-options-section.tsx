'use client';

import styles from './page.module.css';

type Props = {
  stepDone: boolean;
  selectedCount: number;
  options: string[];
  updateOption: (index: number, value: string) => void;
  removeOption: (index: number) => void;
  addOption: () => void;
};

export function CreateOptionsSection({
  stepDone,
  selectedCount,
  options,
  updateOption,
  removeOption,
  addOption,
}: Props) {
  return (
    <section className={styles.formSection}>
      <h3>
        <span className={styles.stepNum}>2</span> 竞猜选项<span className={styles.requiredMark}>*</span>
        <span className={`${styles.stepStatus} ${stepDone ? styles.done : styles.pending}`}>{stepDone ? `✓ ${selectedCount}个选项` : '待完善'}</span>
      </h3>
      <div className={styles.optionsList}>
        {options.map((item, index) => (
          <div className={styles.optionRow} key={`${index}-${item}`}>
            <input
              className={styles.input}
              value={item}
              placeholder={`选项 ${String.fromCharCode(65 + index)}`}
              onChange={(event) => updateOption(index, event.target.value)}
            />
            <button className={styles.removeBtn} type="button" onClick={() => removeOption(index)}>
              <i className="fa-solid fa-circle-minus" />
            </button>
          </div>
        ))}
      </div>
      <button className={styles.addOptionBtn} type="button" onClick={addOption}>
        <i className="fa-solid fa-plus" /> 添加选项
      </button>
    </section>
  );
}
