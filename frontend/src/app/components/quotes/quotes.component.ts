import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TruncatePipe } from '../../pipes/truncate.pipe';

import { Quote, QuoteService } from '../../services/quote.service';
import { Book, BookService } from '../../services/book.service';

@Component({
  selector: 'app-quotes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TruncatePipe,
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
    this.quoteService.getQuotes().subscribe({
      next: (quotes: Quote[]) => {
        this.quotes = quotes;
        this.isLoading = false;
      },
      error: (error: unknown) => {
        console.error('Error loading quotes:', error);
        this.isLoading = false;
      }
    });
  }

  loadBooks(): void {
    this.bookService.getBooks().subscribe({
      next: (books: Book[]) => this.books = books,
      error: (error: unknown) => console.error('Error loading books:', error)
    });
  }

  getBookTitle(bookId?: number | null): string {
    if (!bookId) return '';
    const book = this.books.find(b => b.id === bookId);
    return book ? book.title : '';
  }

  canEditOrDelete(quote: Quote): boolean {
    const currentUserId = Number(localStorage.getItem('userId'));
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    return isAdmin || quote.userId === currentUserId || !quote.id;
  }

  editQuote(quote: Quote): void {
    this.isEdit = true;
    this.editingQuoteId = quote.id;

    this.quoteForm.patchValue({
      text: quote.text,
      author: quote.author,
      bookId: quote.bookId || null
    });

    document.querySelector('.quote-form-section')?.scrollIntoView({ behavior: 'smooth' });
  }

  cancelEdit(): void {
    this.resetForm();
  }

  resetForm(): void {
    this.quoteForm.reset({ text: '', author: '', bookId: null });
    this.isEdit = false;
    this.editingQuoteId = undefined;
  }

  onSubmit(): void {
    if (!this.quoteForm.valid) return;

    this.isLoading = true;
    const formValue = this.quoteForm.value;

    if (this.isEdit && this.editingQuoteId) {
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
        error: (err: unknown) => {
          console.error('Error updating quote:', err);
          this.isLoading = false;
        }
      });
    } else {
      const quoteData: Quote = {
        text: formValue.text,
        author: formValue.author,
        bookId: formValue.bookId || null,
        userId: Number(localStorage.getItem('userId'))
      };

      this.quoteService.createQuote(quoteData).subscribe({
        next: (newQuote: Quote) => {
          this.quotes.push(newQuote);
          this.resetForm();
          this.isLoading = false;
        },
        error: (err: unknown) => {
          console.error('Error creating quote:', err);
          this.isLoading = false;
        }
      });
    }
  }

  deleteQuote(id: number | undefined): void {
    if (!id) return;

    this.translate.get('confirmDeleteQuote').subscribe((translated: string) => {
      if (!confirm(translated || 'Are you sure you want to delete this quote?')) return;

      this.quoteService.deleteQuote(id).subscribe({
        next: () => {
          this.quotes = this.quotes.filter(q => q.id !== id);
        },
        error: (err: unknown) => console.error('Error deleting quote:', err)
      });
    });
  }
}