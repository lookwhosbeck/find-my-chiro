import type { ReactNode } from 'react';
import { MovynLogo } from '@/app/components/MovynLogo';
import styles from './SignupSplitShell.module.css';

export type SignupSplitStep = { number: number; label: string };

type SignupSplitShellProps = {
  currentStep: number;
  steps: SignupSplitStep[];
  headline: ReactNode;
  subtext: ReactNode;
  /** Shown in the “Why this detail?” block when `asideFooter` is omitted */
  whyDetail: string;
  /** When set, replaces the default “Why this detail?” block (e.g. membership step rail) */
  asideFooter?: ReactNode;
  children: ReactNode;
};

export function SignupSplitShell({
  currentStep,
  steps,
  headline,
  subtext,
  whyDetail,
  asideFooter,
  children,
}: SignupSplitShellProps) {
  return (
    <div className={styles.signupPage}>
      <div className={styles.signupSplit}>
        <div className={styles.signupAsideWrap}>
          <div className={styles.signupAside}>
            <div className={styles.signupAsideInner}>
              <MovynLogo variant="onDark" className={styles.signupLogo} />
              <div className={styles.signupAsideStack}>
                <h2 className={styles.signupAsideHeadline}>{headline}</h2>
                <p className={styles.signupAsideSubtext}>{subtext}</p>
                <ol className={styles.signupStepList} aria-label="Sign-up progress">
                  {steps.map((s) => {
                    const done = currentStep >= s.number;
                    return (
                      <li key={s.number} className={styles.signupStepRow}>
                        <span
                          className={`${styles.signupStepBadge} ${done ? styles.signupStepBadgeDone : styles.signupStepBadgeUpcoming}`}
                          aria-current={currentStep === s.number ? 'step' : undefined}
                        >
                          {s.number}
                        </span>
                        <span className={styles.signupStepLabel}>{s.label}</span>
                      </li>
                    );
                  })}
                </ol>
                <div className={styles.signupAsideRule} aria-hidden />
                {asideFooter ?? (
                  <div className={styles.signupWhy}>
                    <p className={styles.signupWhyLead}>
                      <strong>Why this detail?</strong>
                    </p>
                    <p className={styles.signupWhyBody}>{whyDetail}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className={styles.signupMain}>{children}</div>
      </div>
    </div>
  );
}
