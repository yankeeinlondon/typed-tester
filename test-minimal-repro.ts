import { describe, it, expect } from 'vitest';

describe('Minimal Repro', () => {
  it('should capture console output', () => {
    let captured = '';
    const orig = console.log;
    
    console.log = (...args) => {
      captured += args.join(' ') + '\n';
    };
    
    console.log('TEST OUTPUT');
    
    console.log = orig;
    
    expect(captured.length).toBeGreaterThan(0);
    console.log('Captured:', captured);
  });
});
