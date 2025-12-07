import { Pipe, PipeTransform, ChangeDetectorRef, OnDestroy, inject } from '@angular/core';
import { TranslationService, Language } from '../services/translation.service';
import { Subscription } from 'rxjs';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false // important for automatic updates when language changes
})
export class TranslationPipe implements PipeTransform, OnDestroy {
  private translationService = inject(TranslationService);
  private cdr = inject(ChangeDetectorRef);
  
  private subscription: Subscription;

  constructor() {
    // Subscribe to language changes and trigger change detection
    this.subscription = this.translationService.languageChange$.subscribe(() => {
      this.cdr.markForCheck();
    });
  }

  transform(key: string, params?: Record<string, any>): string {
    // This will be called automatically when language changes due to markForCheck()
    return this.translationService.translate(key, params);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}