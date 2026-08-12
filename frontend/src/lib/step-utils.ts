export interface StepStateLike {
  stepNumber: number;
  status: 'pending' | 'running' | 'done' | 'failed';
}

export function isStepUnlocked(stepNum: number, stepStates: StepStateLike[] = []): boolean {
  const step1Done = stepStates.find(s => s.stepNumber === 1)?.status === 'done';
  const step2Done = stepStates.find(s => s.stepNumber === 2)?.status === 'done';
  const step3Done = stepStates.find(s => s.stepNumber === 3)?.status === 'done';
  const step4Done = stepStates.find(s => s.stepNumber === 4)?.status === 'done';

  switch (stepNum) {
    case 1:
      return true;
    case 2:
      return step1Done;
    case 3:
      return step2Done;
    case 4:
      return step1Done && step2Done;
    case 5:
      return step3Done && step4Done;
    default:
      return false;
  }
}
