import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Quote, QuoteService } from '../../services/quote.service';
import { Book, BookService } from '../../services/book.service';
import { TranslationService } from '../../services/translation.service'; 
import { TranslationPipe } from '../../pipes/translation.pipe'; 
import { Meta, Title } from '@angular/platform-browser';
import { TruncatePipe } from '../../pipes/truncate.pipe';

@Component({
  selector: 'app-quotes',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    TranslationPipe,
    TruncatePipe
  ],
  templateUrl: './quotes.component.html',
  styleUrls: ['./quotes.component.css']
})
export class QuotesComponent implements OnInit {
  quotes: Quote[] = [];
  addedQuotes: Quote[] = []; // Badge list of added quotes
  books: Book[] = [];
  quoteForm: FormGroup;
  isLoading = false;
  isEdit = false;
  editingQuoteId?: number;
  selectedQuoteId?: number;

  private meta = inject(Meta);
  private titleService = inject(Title);
  private translationService = inject(TranslationService);

  constructor(
    private quoteService: QuoteService,
    private bookService: BookService,
    private fb: FormBuilder
  ) {
    this.quoteForm = this.fb.group({
      text: ['', [Validators.required, Validators.minLength(10)]],
      author: ['', Validators.required],
      bookId: ['']
    });
  }

  ngOnInit(): void {
    this.titleService.setTitle(this.translationService.translate('quotes') + ' - BookWebApp');
    
    this.meta.updateTag({
      name: 'description',
      content: this.translationService.translate('quoteCollectionDesc') || 
               'Save and manage your favorite quotes from books.'
    });

    this.loadQuotes();
    this.loadBooks();
    this.loadBasketFromStorage();
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

  loadBooks(): void {
    this.bookService.getBooks().subscribe({
      next: (books) => {
        this.books = books;
      },
      error: (error) => {
        console.error('Error loading books:', error);
      }
    });
  }

  getBookTitle(bookId?: number): string {
    if (!bookId) return '';
    const book = this.books.find(b => b.id === bookId);
    return book ? book.title : '';
  }

  addToBasket(quote: Quote): void {
    if (!this.isInBasket(quote.id!)) {
      this.addedQuotes.push(quote);
      this.saveBasketToStorage();
    }
  }

  removeFromBasket(quoteId: number): void {
    this.addedQuotes = this.addedQuotes.filter(q => q.id !== quoteId);
    this.saveBasketToStorage();
    if (this.selectedQuoteId === quoteId) {
      this.selectedQuoteId = undefined;
    }
  }

  isInBasket(quoteId: number): boolean {
    return this.addedQuotes.some(q => q.id === quoteId);
  }

  editQuoteFromBadge(quote: Quote): void {
    this.selectedQuoteId = quote.id;
    this.isEdit = true;
    this.editingQuoteId = quote.id;
    this.quoteForm.patchValue({
      text: quote.text,
      author: quote.author,
      bookId: quote.bookId || ''
    });
    document.querySelector('.quote-form-section')?.scrollIntoView({ behavior: 'smooth' });
  }

  saveBasketToStorage(): void {
    localStorage.setItem('quoteBasket', JSON.stringify(this.addedQuotes));
  }

  loadBasketFromStorage(): void {
    const saved = localStorage.getItem('quoteBasket');
    if (saved) {
      try {
        this.addedQuotes = JSON.parse(saved);
      } catch (e) {
        console.error('Error loading quote basket from storage:', e);
      }
    }
  }

  onSubmit(): void {
    if (this.quoteForm.valid) {
      this.isLoading = true;
      const quoteData: Quote = this.quoteForm.value;

      if (this.isEdit && this.editingQuoteId) {
        this.quoteService.updateQuote(this.editingQuoteId, quoteData).subscribe({
          next: (updatedQuote) => {
            const index = this.quotes.findIndex(q => q.id === this.editingQuoteId);
            if (index !== -1) this.quotes[index] = updatedQuote;
            const basketIndex = this.addedQuotes.findIndex(q => q.id === this.editingQuoteId);
            if (basketIndex !== -1) this.addedQuotes[basketIndex] = updatedQuote;
            this.resetForm();
            this.saveBasketToStorage();
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error updating quote:', error);
            this.isLoading = false;
          }
        });
      } else {
        this.quoteService.createQuote(quoteData).subscribe({
          next: (newQuote) => {
            this.quotes.push(newQuote);
            this.addedQuotes.push(newQuote);
            this.resetForm();
            this.saveBasketToStorage();
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error adding quote:', error);
            this.isLoading = false;
          }
        });
      }
    }
  }

  resetForm(): void {
    this.quoteForm.reset();
    this.isEdit = false;
    this.editingQuoteId = undefined;
    this.selectedQuoteId = undefined;
  }

  cancelForm(): void {
    this.resetForm();
  }

  editQuote(quote: Quote): void {
    this.editQuoteFromBadge(quote);
  }

  deleteQuote(id: number): void {
    const confirmMessage = this.translationService.translate('confirmDeleteQuote') || 
                          'Are you sure you want to delete this quote?';
    if (confirm(confirmMessage)) {
      this.quoteService.deleteQuote(id).subscribe({
        next: () => {
          this.quotes = this.quotes.filter(q => q.id !== id);
          this.addedQuotes = this.addedQuotes.filter(q => q.id !== id);
          this.saveBasketToStorage();
          if (this.selectedQuoteId === id) this.resetForm();
        },
        error: (error) => {
          console.error('Error deleting quote:', error);
        }
      });
    }
  }

  changeLanguage(lang: 'en' | 'sv'): void {
    this.translationService.setLanguage(lang);
  }
}