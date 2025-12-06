import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Quote, QuoteService } from '../../services/quote.service';
import { TranslationService } from '../../services/translation.service'; 
import { TranslationPipe } from '../../pipes/translation.pipe'; 
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-quotes',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    TranslationPipe 
  ],
  templateUrl: './quotes.component.html',
  styleUrls: ['./quotes.component.css']
})
export class QuotesComponent implements OnInit {
  quotes: Quote[] = [];
  addedQuotes: Quote[] = []; // Badge list of added quotes
  quoteForm: FormGroup;
  showForm = false;
  isEdit = false;
  editingQuoteId?: number;
  isLoading = false;

  private meta = inject(Meta);
  private titleService = inject(Title);
  private translationService = inject(TranslationService);

  constructor(
    private quoteService: QuoteService,
    private fb: FormBuilder
  ) {
    this.quoteForm = this.fb.group({
      text: ['', [Validators.required, Validators.minLength(10)]],
      author: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Set page title
    this.titleService.setTitle('BookWebApp - Quotes');

    // SEO description only
    this.meta.updateTag({
      name: 'description',
      content: 'Browse, add, and manage quotes in your personal library with BookWebApp.'
    });

    this.loadQuotes();
  }

  loadQuotes(): void {
    this.isLoading = true;
    this.quoteService.getQuotes().subscribe({
      next: (quotes) => {
        this.quotes = quotes;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading quotes:', error);
        this.isLoading = false;
      }
    });
  }

  showAddForm(): void {
    this.showForm = true;
    this.isEdit = false;
    this.quoteForm.reset();
  }

  cancelForm(): void {
    this.showForm = false;
    this.isEdit = false;
    this.quoteForm.reset();
  }

  onSubmit(): void {
    if (this.quoteForm.valid) {
      this.isLoading = true;
      const quoteData: Quote = this.quoteForm.value;

      const operation = this.isEdit && this.editingQuoteId
        ? this.quoteService.updateQuote(this.editingQuoteId, quoteData)
        : this.quoteService.createQuote(quoteData);

      operation.subscribe({
        next: (savedQuote) => {
          this.isLoading = false;

          if (this.isEdit && this.editingQuoteId) {
            // Update badge list
            const index = this.addedQuotes.findIndex(q => q.id === this.editingQuoteId);
            if (index !== -1) this.addedQuotes[index] = savedQuote;
          } else {
            // Add new quote to badge list
            this.addedQuotes.push(savedQuote);
          }

          this.cancelForm();
        },
        error: (error) => {
          console.error('Error saving quote:', error);
          this.isLoading = false;
        }
      });
    }
  }

  editQuote(quote: Quote): void {
    this.showForm = true;
    this.isEdit = true;
    this.editingQuoteId = quote.id;
    this.quoteForm.patchValue({
      text: quote.text,
      author: quote.author
    });
  }

  deleteQuote(id: number): void {
    const confirmMessage = this.translationService.translate('confirmDeleteQuote') || 
                          'Are you sure you want to delete this quote?';
    
    if (confirm(confirmMessage)) {
      this.quoteService.deleteQuote(id).subscribe({
        next: () => {
          this.quotes = this.quotes.filter(q => q.id !== id);
          this.addedQuotes = this.addedQuotes.filter(q => q.id !== id); // Remove from badge list too
        },
        error: (error) => {
          console.error('Error deleting quote:', error);
        }
      });
    }
  }

  addToBadge(quote: Quote): void {
    if (!this.addedQuotes.find(q => q.id === quote.id)) {
      this.addedQuotes.push(quote);
    }
  }

  removeFromBadge(quote: Quote): void {
    this.addedQuotes = this.addedQuotes.filter(q => q.id !== quote.id);
  }
}
