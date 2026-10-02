// Lightweight, zero-dependency Test Framework for 'The Thirteenth Chime' E2E Suite
// Supports TypeScript & JavaScript execution in Node and tsx environments.

import Module from 'node:module';

// Intercept optional dev-dependency phaser3spectorjs when loading Phaser in headless Node
if (typeof (Module as any)._load === 'function') {
  const originalLoad = (Module as any)._load;
  (Module as any)._load = function (request: string, parent: any, isMain: boolean) {
    if (request === 'phaser3spectorjs') {
      return {};
    }
    return originalLoad.apply(this, arguments);
  };
}

export interface TestResult {
  name: string;
  suite: string;
  tier: 1 | 2 | 3 | 4;
  feature: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

export interface SuiteSummary {
  total: number;
  passed: number;
  failed: number;
  results: TestResult[];
  tierSummary: Record<number, { total: number; passed: number; failed: number }>;
  featureSummary: Record<string, { total: number; passed: number; failed: number }>;
}

// Shim browser globals if running in headless Node.js
export function setupBrowserShim() {
  if (typeof (globalThis as any).window === 'undefined') {
    (globalThis as any).window = globalThis;
    (globalThis as any).document = {
      documentElement: {},
      compatMode: 'CSS1Compat',
      createElement: (tag: string) => ({
        tagName: tag.toUpperCase(),
        getContext: () => ({
          fillStyle: '',
          fillRect: () => {},
          getImageData: () => ({ data: [0, 0, 0, 0] }),
          putImageData: () => {},
          createImageData: () => ({ data: [0, 0, 0, 0] }),
          setTransform: () => {},
          drawImage: () => {},
          globalCompositeOperation: '',
        }),
        appendChild: () => {},
        setAttribute: () => {},
        style: {},
        width: 32,
        height: 32,
      }),
      getElementsByTagName: () => [],
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
      head: { appendChild: () => {} },
      body: { appendChild: () => {} },
    };
    try {
      if (typeof (globalThis as any).navigator === 'undefined') {
        (globalThis as any).navigator = {
          userAgent: 'Mozilla/5.0 (Node.js Test Runner) AppleWebKit/537.36',
        };
      }
    } catch {
      // In newer Node versions, navigator is already present and read-only
    }
    if (typeof (globalThis as any).Image === 'undefined') {
      (globalThis as any).Image = class Image {};
    }
    if (typeof (globalThis as any).HTMLCanvasElement === 'undefined') {
      (globalThis as any).HTMLCanvasElement = class HTMLCanvasElement {};
    }
  }
}

// Setup shims immediately
setupBrowserShim();

class TestRegistry {
  private currentSuite = 'Default Suite';
  private currentTier: 1 | 2 | 3 | 4 = 1;
  private currentFeature = 'F1';
  private tests: Array<{
    name: string;
    suite: string;
    tier: 1 | 2 | 3 | 4;
    feature: string;
    fn: () => void | Promise<void>;
  }> = [];

  setContext(suite: string, tier: 1 | 2 | 3 | 4, feature: string) {
    this.currentSuite = suite;
    this.currentTier = tier;
    this.currentFeature = feature;
  }

  register(
    name: string,
    fn: () => void | Promise<void>,
    options?: { tier?: 1 | 2 | 3 | 4; feature?: string }
  ) {
    this.tests.push({
      name,
      suite: this.currentSuite,
      tier: options?.tier ?? this.currentTier,
      feature: options?.feature ?? this.currentFeature,
      fn,
    });
  }

  getTests() {
    return this.tests;
  }

  clear() {
    this.tests = [];
  }
}

export const registry = new TestRegistry();

export function describe(
  name: string,
  tier: 1 | 2 | 3 | 4,
  feature: string,
  fn: () => void
) {
  registry.setContext(name, tier, feature);
  fn();
}

export function test(
  name: string,
  fn: () => void | Promise<void>,
  options?: { tier?: 1 | 2 | 3 | 4; feature?: string }
) {
  registry.register(name, fn, options);
}

export const it = test;

class Assertion<T> {
  private isNot: boolean;

  constructor(private actual: T, isNot = false) {
    this.isNot = isNot;
  }

  get not() {
    return new Assertion(this.actual, !this.isNot);
  }

  toBe(expected: any) {
    const pass = this.actual === expected;
    if (this.isNot ? pass : !pass) {
      throw new Error(
        `Expected ${JSON.stringify(this.actual)} ${this.isNot ? 'NOT to be' : 'to be'} ${JSON.stringify(expected)}`
      );
    }
  }

  toEqual(expected: any) {
    const actStr = JSON.stringify(this.actual);
    const expStr = JSON.stringify(expected);
    const pass = actStr === expStr;
    if (this.isNot ? pass : !pass) {
      throw new Error(
        `Expected ${actStr} ${this.isNot ? 'NOT to equal' : 'to equal'} ${expStr}`
      );
    }
  }

  toBeTruthy() {
    const pass = Boolean(this.actual);
    if (this.isNot ? pass : !pass) {
      throw new Error(
        `Expected ${JSON.stringify(this.actual)} ${this.isNot ? 'NOT to be truthy' : 'to be truthy'}`
      );
    }
  }

  toBeFalsy() {
    const pass = !this.actual;
    if (this.isNot ? pass : !pass) {
      throw new Error(
        `Expected ${JSON.stringify(this.actual)} ${this.isNot ? 'NOT to be falsy' : 'to be falsy'}`
      );
    }
  }

  toBeDefined() {
    const pass = typeof this.actual !== 'undefined';
    if (this.isNot ? pass : !pass) {
      throw new Error(
        `Expected value ${this.isNot ? 'to be undefined' : 'to be defined'}`
      );
    }
  }

  toBeNull() {
    const pass = this.actual === null;
    if (this.isNot ? pass : !pass) {
      throw new Error(
        `Expected ${JSON.stringify(this.actual)} ${this.isNot ? 'NOT to be null' : 'to be null'}`
      );
    }
  }

  toBeGreaterThan(expected: number) {
    const pass = (this.actual as unknown as number) > expected;
    if (this.isNot ? pass : !pass) {
      throw new Error(
        `Expected ${this.actual} ${this.isNot ? 'NOT to be greater than' : 'to be greater than'} ${expected}`
      );
    }
  }

  toBeGreaterThanOrEqual(expected: number) {
    const pass = (this.actual as unknown as number) >= expected;
    if (this.isNot ? pass : !pass) {
      throw new Error(
        `Expected ${this.actual} ${this.isNot ? 'NOT to be >= ' : 'to be >= '} ${expected}`
      );
    }
  }

  toBeLessThan(expected: number) {
    const pass = (this.actual as unknown as number) < expected;
    if (this.isNot ? pass : !pass) {
      throw new Error(
        `Expected ${this.actual} ${this.isNot ? 'NOT to be less than' : 'to be less than'} ${expected}`
      );
    }
  }

  toBeLessThanOrEqual(expected: number) {
    const pass = (this.actual as unknown as number) <= expected;
    if (this.isNot ? pass : !pass) {
      throw new Error(
        `Expected ${this.actual} ${this.isNot ? 'NOT to be <= ' : 'to be <= '} ${expected}`
      );
    }
  }

  toContain(expected: any) {
    let pass = false;
    if (typeof this.actual === 'string') {
      pass = this.actual.includes(expected);
    } else if (Array.isArray(this.actual)) {
      pass = this.actual.includes(expected);
    } else if (this.actual instanceof Set) {
      pass = this.actual.has(expected);
    }
    if (this.isNot ? pass : !pass) {
      throw new Error(
        `Expected ${JSON.stringify(this.actual)} ${this.isNot ? 'NOT to contain' : 'to contain'} ${JSON.stringify(expected)}`
      );
    }
  }

  toThrow(expectedMsg?: string | RegExp) {
    if (typeof this.actual !== 'function') {
      throw new Error('Expected a function for toThrow assertion');
    }
    let threw = false;
    let thrownError: any = null;
    try {
      (this.actual as any)();
    } catch (err: any) {
      threw = true;
      thrownError = err;
    }

    if (this.isNot) {
      if (threw) {
        throw new Error(`Expected function NOT to throw, but it threw: ${thrownError?.message || thrownError}`);
      }
      return;
    }

    if (!threw) {
      throw new Error('Expected function to throw an error, but it did not throw');
    }

    if (expectedMsg) {
      const msg = thrownError?.message || String(thrownError);
      if (typeof expectedMsg === 'string' && !msg.includes(expectedMsg)) {
        throw new Error(`Expected error message to contain "${expectedMsg}", got "${msg}"`);
      } else if (expectedMsg instanceof RegExp && !expectedMsg.test(msg)) {
        throw new Error(`Expected error message to match ${expectedMsg}, got "${msg}"`);
      }
    }
  }
}

export function expect<T>(actual: T): Assertion<T> {
  return new Assertion(actual);
}

export async function runSuite(options: { verbose?: boolean; bail?: boolean } = {}): Promise<SuiteSummary> {
  const tests = registry.getTests();
  const results: TestResult[] = [];
  const tierSummary: Record<number, { total: number; passed: number; failed: number }> = {
    1: { total: 0, passed: 0, failed: 0 },
    2: { total: 0, passed: 0, failed: 0 },
    3: { total: 0, passed: 0, failed: 0 },
    4: { total: 0, passed: 0, failed: 0 },
  };
  const featureSummary: Record<string, { total: number; passed: number; failed: number }> = {};

  for (let i = 1; i <= 15; i++) {
    featureSummary[`F${i}`] = { total: 0, passed: 0, failed: 0 };
  }

  let passed = 0;
  let failed = 0;

  for (const t of tests) {
    const startTime = Date.now();
    let testPassed = true;
    let testError: string | undefined;

    try {
      await t.fn();
    } catch (err: any) {
      testPassed = false;
      testError = err.message || String(err);
    }

    const duration = Date.now() - startTime;
    if (testPassed) {
      passed++;
    } else {
      failed++;
    }

    tierSummary[t.tier].total++;
    if (testPassed) tierSummary[t.tier].passed++;
    else tierSummary[t.tier].failed++;

    if (!featureSummary[t.feature]) {
      featureSummary[t.feature] = { total: 0, passed: 0, failed: 0 };
    }
    featureSummary[t.feature].total++;
    if (testPassed) featureSummary[t.feature].passed++;
    else featureSummary[t.feature].failed++;

    results.push({
      name: t.name,
      suite: t.suite,
      tier: t.tier,
      feature: t.feature,
      passed: testPassed,
      error: testError,
      durationMs: duration,
    });

    if (options.verbose) {
      const statusSymbol = testPassed ? '✓' : '✗';
      const label = `[Tier ${t.tier} | ${t.feature}] ${t.suite} > ${t.name}`;
      console.log(`  ${statusSymbol} ${label} (${duration}ms)`);
      if (!testPassed && testError) {
        console.log(`      Error: ${testError}`);
      }
    }

    if (options.bail && !testPassed) {
      break;
    }
  }

  return {
    total: tests.length,
    passed,
    failed,
    results,
    tierSummary,
    featureSummary,
  };
}
