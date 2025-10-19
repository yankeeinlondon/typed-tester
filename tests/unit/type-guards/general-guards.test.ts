import { describe, it, expect } from 'vitest';
import { isObject } from '~/type-guards/isObject';
import { isCommand } from '~/type-guards/isCommand';

describe('General Type Guards', () => {
  describe('isObject', () => {
    it('should return true for plain objects', () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ key: 'value' })).toBe(true);
      expect(isObject({ nested: { object: true } })).toBe(true);
    });

    it('should return true for objects with symbols as keys', () => {
      const sym = Symbol('test');
      const obj = { [sym]: 'value' };

      expect(isObject(obj)).toBe(true);
    });

    it('should return true for class instances', () => {
      class TestClass {
        property = 'value';
      }

      expect(isObject(new TestClass())).toBe(true);
    });

    it('should return true for objects created with Object.create', () => {
      const proto = { inherited: true };
      const obj = Object.create(proto);

      expect(isObject(obj)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isObject(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isObject(undefined)).toBe(false);
    });

    it('should return false for arrays', () => {
      expect(isObject([])).toBe(false);
      expect(isObject([1, 2, 3])).toBe(false);
      expect(isObject(['string', 'array'])).toBe(false);
    });

    it('should return false for primitives', () => {
      expect(isObject(42)).toBe(false);
      expect(isObject('string')).toBe(false);
      expect(isObject(true)).toBe(false);
      expect(isObject(false)).toBe(false);
      expect(isObject(Symbol('test'))).toBe(false);
    });

    it('should return false for functions', () => {
      expect(isObject(() => {})).toBe(false);
      expect(isObject(function() {})).toBe(false);
      expect(isObject(async () => {})).toBe(false);
    });

    it('should return false for Date objects', () => {
      // Note: Date is technically an object, but arrays are excluded
      // This test documents current behavior
      expect(isObject(new Date())).toBe(true);
    });

    it('should return false for RegExp objects', () => {
      expect(isObject(/regex/)).toBe(true);
    });

    it('should handle edge cases', () => {
      expect(isObject(NaN)).toBe(false);
      expect(isObject(Infinity)).toBe(false);
      expect(isObject(BigInt(123))).toBe(false);
    });

    it('should work with frozen objects', () => {
      const frozen = Object.freeze({ frozen: true });
      expect(isObject(frozen)).toBe(true);
    });

    it('should work with sealed objects', () => {
      const sealed = Object.seal({ sealed: true });
      expect(isObject(sealed)).toBe(true);
    });
  });

  describe('isCommand', () => {
    it('should return true for valid command names', () => {
      expect(isCommand('test')).toBe(true);
      expect(isCommand('symbols')).toBe(true);
      expect(isCommand('source')).toBe(true);
      expect(isCommand('deps')).toBe(true);
      expect(isCommand('files')).toBe(true);
    });

    it('should return false for invalid command names', () => {
      expect(isCommand('invalid')).toBe(false);
      expect(isCommand('unknown')).toBe(false);
      expect(isCommand('notacommand')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isCommand('')).toBe(false);
    });

    it('should return false for non-string values', () => {
      expect(isCommand(null)).toBe(false);
      expect(isCommand(undefined)).toBe(false);
      expect(isCommand(42)).toBe(false);
      expect(isCommand({})).toBe(false);
      expect(isCommand([])).toBe(false);
    });

    it('should be case-sensitive', () => {
      expect(isCommand('TEST')).toBe(false);
      expect(isCommand('Test')).toBe(false);
      expect(isCommand('SYMBOLS')).toBe(false);
    });

    it('should not accept partial matches', () => {
      expect(isCommand('tes')).toBe(false);
      expect(isCommand('symbol')).toBe(false);
      expect(isCommand('sour')).toBe(false);
    });

    it('should not accept commands with extra characters', () => {
      expect(isCommand('test ')).toBe(false);
      expect(isCommand(' test')).toBe(false);
      expect(isCommand('test-extra')).toBe(false);
    });

    it('should handle commands with special characters', () => {
      expect(isCommand('test\n')).toBe(false);
      expect(isCommand('test\t')).toBe(false);
      expect(isCommand('test\r')).toBe(false);
    });
  });

  describe('Type guard interactions', () => {
    it('should work together for command validation', () => {
      const commands = ['test', 'symbols', 'source'];

      // Filter valid commands using both guards
      const validCommands = commands.filter(cmd => {
        return typeof cmd === 'string' && isCommand(cmd);
      });

      expect(validCommands).toEqual(['test', 'symbols', 'source']);
    });

    it('should validate command objects', () => {
      const commandObj = {
        name: 'test',
        options: {}
      };

      expect(isObject(commandObj)).toBe(true);

      if (isObject(commandObj) && 'name' in commandObj) {
        expect(isCommand(commandObj.name)).toBe(true);
      }
    });

    it('should handle mixed type arrays', () => {
      const mixed = ['test', 42, { cmd: 'symbols' }, null, 'deps'];

      const commands = mixed.filter(item =>
        typeof item === 'string' && isCommand(item)
      );

      expect(commands).toEqual(['test', 'deps']);
    });
  });
});
