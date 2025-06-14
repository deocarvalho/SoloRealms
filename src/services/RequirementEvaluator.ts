import { Requirement } from '@/types/book';
import { ProgressTracker } from './ProgressTracker';

export interface RequirementResult {
  isMet: boolean;
  hiddenEntries: string[];
  visibleEntries: string[];
}

export class RequirementEvaluator {
  constructor(
    private readonly progressTracker: ProgressTracker,
    private readonly bookId: number
  ) {}

  async evaluateRequirement(requirement: Requirement): Promise<RequirementResult> {
    const isMet = await this.evaluateRequirementType(requirement);
    
    return {
      isMet,
      hiddenEntries: isMet ? requirement.hides || [] : [],
      visibleEntries: isMet ? requirement.shows || [] : []
    };
  }

  private async evaluateRequirementType(requirement: Requirement): Promise<boolean> {
    switch (requirement.type) {
      case 'once':
        return this.evaluateOnceRequirement(requirement);
      case 'spell':
      case 'item':
      case 'feature':
      case 'movementType':
      case 'class':
      case 'species':
        // For now, these requirements are not implemented
        // They will be implemented when we add character sheets and inventory
        return true;
      default:
        return true;
    }
  }

  private async evaluateOnceRequirement(requirement: Requirement): Promise<boolean> {
    const progress = await this.progressTracker.getProgress(this.bookId);
    if (!progress) return true; // If no progress, option hasn't been chosen

    // Check if this option has been chosen before
    return !progress.choices.some(choice => 
      choice.entryId === requirement.entryId && choice.targetId === requirement.value
    );
  }
} 