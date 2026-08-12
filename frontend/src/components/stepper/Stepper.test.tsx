import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Stepper } from './Stepper';
import { StepState } from '@/lib/api-client';

describe('Stepper Component', () => {
  const mockStepStates: StepState[] = [
    { stepNumber: 1, stepName: 'style', status: 'done' },
    { stepNumber: 2, stepName: 'characters', status: 'running' },
    { stepNumber: 3, stepName: 'portraits', status: 'pending' },
    { stepNumber: 4, stepName: 'chapters', status: 'pending' },
    { stepNumber: 5, stepName: 'illustrations', status: 'pending' },
  ];

  it('renders all 5 pipeline step labels', () => {
    render(<Stepper stepStates={mockStepStates} currentStepNumber={2} />);
    expect(screen.getByText('STYLE')).toBeInTheDocument();
    expect(screen.getByText('CHARACTERS')).toBeInTheDocument();
    expect(screen.getByText('PORTRAITS')).toBeInTheDocument();
    expect(screen.getByText('CHAPTERS')).toBeInTheDocument();
    expect(screen.getByText('ILLUSTRATIONS')).toBeInTheDocument();
  });
});
