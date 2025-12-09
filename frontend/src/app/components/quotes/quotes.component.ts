import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { Quote, QuoteService } from '../../services/quote.service';
import { Book, BookService } from '../../services/book.service';

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

  private meta = inject(Meta);
  private titleService = inject(Title);
  private translate = inject(TranslateService);

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

    this.translate.get('quoteCollectionDesc').subscribe((translated: string) => {
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
      error: (error: any) => {
        console.error('Error loading quotes:', error);
        this.errorMessage = this.translate.instant('failedLoadQuotes') || 'Failed to load quotes.';
        this.isLoading = false;
      }
    });
  }

  loadBooks(): void {
    this.bookService.getBooks().subscribe({
      next: (books: Book[]) => this.books = books,
      error: (error: any) => {
        console.error('Error loading books:', error);
        // Don't show error for books as it's secondary data
      }
    });
  }

  getBookTitle(bookId?: number | null): string {
    if (!bookId) return '';
    const book = this.books.find(b => b.id === bookId);
    return book ? book.title : '';
  }

  // EDIT QUOTE
  editQuote(quote: Quote): void {
    // Check if user is logged in
    if (!this.isLoggedIn()) {
      alert(this.translate.instant('loginRequired'));
      // You might want to redirect to login page
      return;
    }

    this.isEdit = true;
    this.editingQuoteId = quote.id;

    this.quoteForm.patchValue({
      text: quote.text,
      author: quote.author,
      bookId: quote.bookId || null
    });

    // Scroll to form
    document.querySelector('.quote-form-column')?.scrollIntoView({ behavior: 'smooth' });
  }

  cancelEdit(): void {
    this.resetForm();
  }

  resetForm(): void {
    this.quoteForm.reset({ text: '', author: '', bookId: null });
    this.isEdit = false;
    this.editingQuoteId = undefined;
  }

  // CREATE or UPDATE QUOTE
  onSubmit(): void {
    if (!this.quoteForm.valid) return;

    // Check if user is logged in
    if (!this.isLoggedIn()) {
      alert(this.translate.instant('loginRequired'));
      // You might want to redirect to login page
      return;
    }

    this.isLoading = true;
    const formValue = this.quoteForm.value;

    if (this.isEdit && this.editingQuoteId) {
      // UPDATE existing quote
      const quoteData: Quote = {
        text: formValue.text,
        author: formValue.author,
        bookId: formValue.bookId || null
      };

      this.quoteService.updateQuote(this.editingQuoteId, quoteData).subscribe({
        next: (updated: Quote) => {
          const index = this.quotes.findIndex(q => q.id === this.editingQuoteId);
          if (index !== -1) this.quotes[index] = updated;
          this.resetForm();
          this.isLoading = false;
        },
        error: (err: any) => {
          console.error('Error updating quote:', err);
          this.errorMessage = this.translate.instant('failedUpdateQuote') || 'Failed to update quote.';
          this.isLoading = false;
        }
      });
    } else {
      // CREATE new quote
      const quoteData: Quote = {
        text: formValue.text,
        author: formValue.author,
        bookId: formValue.bookId || null,
        userId: Number(localStorage.getItem('userId')) || 1 // Fallback for demo
      };

      this.quoteService.createQuote(quoteData).subscribe({
        next: (newQuote: Quote) => {
          this.quotes.unshift(newQuote);
          this.resetForm();
          this.isLoading = false;
        },
        error: (err: any) => {
          console.error('Error creating quote:', err);
          this.errorMessage = this.translate.instant('failedCreateQuote') || 'Failed to create quote.';
          this.isLoading = false;
        }
      });
    }
  }

  // DELETE QUOTE
  deleteQuote(id: number | undefined): void {
    if (!id) return;

    // Check if user is logged in
    if (!this.isLoggedIn()) {
      alert(this.translate.instant('loginRequired'));
      return;
    }

    this.translate.get('confirmDeleteQuote').subscribe((translated: string) => {
      if (!confirm(translated || 'Are you sure you want to delete this quote?')) return;

      this.quoteService.deleteQuote(id).subscribe({
        next: () => {
          this.quotes = this.quotes.filter(q => q.id !== id);
        },
        error: (err: any) => {
          console.error('Error deleting quote:', err);
          alert(this.translate.instant('failedDeleteQuote') || 'Failed to delete quote.');
        }
      });
    });
  }

  private isLoggedIn(): boolean {
    // Check if user is logged in 
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    return !!(token && userId);
  }
}