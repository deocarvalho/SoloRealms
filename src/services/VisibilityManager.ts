import { VisibilityCondition } from '@/types/book';

export class VisibilityManager {
  private state: Map<string, boolean> = new Map();
  private visitedEntries: Set<string> = new Set();

  constructor() {
    this.state = new Map();
  }

  // Initialize visited entries from user progress
  initializeVisitedEntries(visitedEntries: string[]): void {
    this.visitedEntries = new Set(visitedEntries);
  }

  // Add a new visited entry
  addVisitedEntry(entryId: string): void {
    this.visitedEntries.add(entryId);
  }

  // Check if an entry has been visited
  hasVisitedEntry(entryId: string): boolean {
    return this.visitedEntries.has(entryId);
  }

  private evaluateCondition(condition: VisibilityCondition | undefined, chosenTarget: string): boolean {
    // If condition is undefined, return false (no effect)
    if (!condition) return false;

    // If it's a string, check if it matches the chosen target
    if (typeof condition === 'string') {
      return condition === chosenTarget;
    }

    // Handle AND condition
    if ('and' in condition) {
      return condition.and.every(subCondition => 
        this.evaluateCondition(subCondition, chosenTarget)
      );
    }

    // Handle OR condition
    if ('or' in condition) {
      return condition.or.some(subCondition => 
        this.evaluateCondition(subCondition, chosenTarget)
      );
    }

    // Handle NOT condition
    if ('not' in condition) {
      return !this.evaluateCondition(condition.not, chosenTarget);
    }

    return false;
  }

  private evaluateVisibilityState(
    state: { when?: VisibilityCondition; unless?: VisibilityCondition } | undefined,
    chosenTarget: string
  ): boolean {
    // If state is undefined, return false (no effect)
    if (!state) return false;

    const whenResult = this.evaluateCondition(state.when, chosenTarget);
    const unlessResult = this.evaluateCondition(state.unless, chosenTarget);
    return whenResult && !unlessResult;
  }

  async evaluateVisibility(
    choice: { target: string; visibility?: { startVisible?: boolean; states?: { show?: { when?: VisibilityCondition; unless?: VisibilityCondition }; hide?: { when?: VisibilityCondition; unless?: VisibilityCondition } } } },
    lastChosenTarget?: string
  ): Promise<boolean> {
    // If no visibility property, return true (visible by default)
    if (!choice.visibility) return true;

    const { states } = choice.visibility;
    
    // First check if we should hide
    if (states?.hide) {
      const shouldHide = this.evaluateVisibilityState(states.hide, lastChosenTarget || '');
      if (shouldHide) {
        this.state.set(choice.target, false);
        return false;
      }
    }

    // Then check if we should show
    if (states?.show) {
      const shouldShow = this.evaluateVisibilityState(states.show, lastChosenTarget || '');
      if (shouldShow) {
        this.state.set(choice.target, true);
        return true;
      }
    }

    // If no state changes, return current state or default to visible
    return this.state.get(choice.target) ?? (choice.visibility.startVisible === false ? false : true);
  }

  // Method to reset visibility state for testing or when starting a new game
  resetState(): void {
    this.state.clear();
    this.visitedEntries.clear();
  }

  // Method to get current visibility state for a choice
  getVisibilityState(choiceTarget: string): boolean {
    return this.state.get(choiceTarget) ?? true;
  }
} 