import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from '../services/translation.service';

@Pipe({
  name: 'translate',
  standalone: true
})
export class TranslationPipe implements PipeTransform {
  private translationService = inject(TranslationService);

  transform(key: string, params?: Record<string, any>): string {
    return this.translationService.translate(key, params);
  }
}