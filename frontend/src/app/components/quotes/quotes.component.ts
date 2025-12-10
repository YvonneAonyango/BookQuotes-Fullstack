import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Quote, QuoteService } from '../../services/quote.service';
import { Book, BookService } from '../../services/book.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-quotes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule
  ],
  templateUrl: './quotes.component.html',
  styleUrls: ['./quotes.component.css']
})
export class QuotesComponent implements OnInit {
  quotes: Quote[] = [];
  books: Book[] = [];
  quoteForm: FormGroup;
  isLoading = false;
  isEdit = false;
  editingQuoteId?: number;
  errorMessage = '';
  selectedQuote?: Quote;

  private meta = inject(Meta);
  private titleService = inject(Title);
  private translate = inject(TranslateService);
  private auth = inject(AuthService); // ADDED

  constructor(
    private quoteService: QuoteService,
    private bookService: BookService,
    private fb: FormBuilder
  ) {
    this.quoteForm = this.fb.group({
      text: ['', [Validators.required, Validators.minLength(10)]],
      author: ['', Validators.required],
      bookId: [null]
    });
  }

  ngOnInit(): void {
    this.titleService.setTitle('BookWebApp - Quotes');
    this.translate.get('quoteCollectionDesc').subscribe(translated => {
      this.meta.updateTag({
        name: 'description',
        content: translated || 'Save and manage your favorite quotes from books.'
      });
    });

    this.loadQuotes();
    this.loadBooks();
  }

  loadQuotes(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.quoteService.getQuotes().subscribe({
      next: (quotes: Quote[]) => {
        this.quotes = quotes;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error loading quotes:', err);
        this.errorMessage = this.translate.instant('failedLoadQuotes') || 'Failed to load quotes.';
        this.isLoading = false;
      }
    });
  }

  loadBooks(): void {
    this.bookService.getBooks().subscribe({
      next: books => this.books = books,
      error: err => console.error('Error loading books:', err)
    });
  }

  getBookTitle(bookId?: number | null): string {
    if (!bookId) return '';
    const book = this.books.find(b => b.id === bookId);
    return book ? book.title : '';
  }

  selectQuote(quote: Quote): void {
    this.selectedQuote = quote;
  }

  editQuote(id: number): void {
    const quote = this.quotes.find(q => q.id === id);
    if (!quote) return;

    this.isEdit = true;
    this.editingQuoteId = quote.id;

    this.quoteForm.patchValue({
      text: quote.text,
      author: quote.author,
      bookId: quote.bookId || null
    });

    document.querySelector('.quote-form')?.scrollIntoView({ behavior: 'smooth' });
  }

  deleteQuote(id: number | undefined): void {
    if (!id) return;
    if (!this.isLoggedIn()) {
      alert(this.translate.instant('loginRequired'));
      return;
    }

    this.translate.get('confirmDeleteQuote').subscribe(msg => {
      if (!confirm(msg || 'Are you sure you want to delete this quote?')) return;

      this.quoteService.deleteQuote(id).subscribe({
        next: () => {
          this.quotes = this.quotes.filter(q => q.id !== id);
          if (this.selectedQuote?.id === id) this.selectedQuote = undefined;
        },
        error: err => {
          console.error('Error deleting quote:', err);
          alert(this.translate.instant('failedDeleteQuote') || 'Failed to delete quote.');
        }
      });
    });
  }

  onSubmit(): void {
    if (!this.quoteForm.valid) return;

    if (!this.isLoggedIn()) {
      alert(this.translate.instant('loginRequired'));
      return;
    }

    this.isLoading = true;
    const formValue = this.quoteForm.value;

    const quoteData: Quote = {
      text: formValue.text,
      author: formValue.author,
      bookId: formValue.bookId || null,
      userId: this.auth.getCurrentUserId()!
    };

    if (this.isEdit && this.editingQuoteId) {
      this.quoteService.updateQuote(this.editingQuoteId, quoteData).subscribe({
        next: updated => {
          const index = this.quotes.findIndex(q => q.id === this.editingQuoteId);
          if (index !== -1) this.quotes[index] = updated;
          this.resetForm();
          this.isLoading = false;
        },
        error: err => {
          console.error('Error updating quote:', err);
          this.errorMessage = this.translate.instant('failedUpdateQuote') || 'Failed to update quote.';
          this.isLoading = false;
        }
      });
    } else {
      this.quoteService.createQuote(quoteData).subscribe({
        next: newQuote => {
          this.quotes.unshift(newQuote);
          this.resetForm();
          this.isLoading = false;
        },
        error: err => {
          console.error('Error creating quote:', err);
          this.errorMessage = this.translate.instant('failedCreateQuote') || 'Failed to create quote.';
          this.isLoading = false;
        }
      });
    }
  }

  cancelEdit(): void {
    this.resetForm();
  }

  resetForm(): void {
    this.quoteForm.reset({ text: '', author: '', bookId: null });
    this.isEdit = false;
    this.editingQuoteId = undefined;
  }

  private isLoggedIn(): boolean {
    return this.auth.isAuthenticated(); // CHANGED: Use AuthService
  }
}