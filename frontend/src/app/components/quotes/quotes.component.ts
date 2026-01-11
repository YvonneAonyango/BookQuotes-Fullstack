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
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './quotes.component.html',
  styleUrls: ['./quotes.component.css']
})
export class QuotesComponent implements OnInit {
  globalQuotes: Quote[] = [];
  userQuotes: Quote[] = [];
  books: Book[] = [];
  quoteForm: FormGroup;
  isLoading = false;
  isEdit = false;
  editingQuoteId?: number;
  errorMessage = '';

  private meta = inject(Meta);
  private titleService = inject(Title);
  private translate = inject(TranslateService);
  private auth = inject(AuthService);

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
    this.translate.get('quoteCollectionDesc').subscribe(desc => {
      this.meta.updateTag({ name: 'description', content: desc || 'Save and manage your favorite quotes.' });
    });

    this.loadGlobalQuotes();

    if (this.isLoggedIn()) {
      this.loadUserQuotes();
      this.loadBooks();
    }
  }

  loadGlobalQuotes(): void {
    this.isLoading = true;
    this.quoteService.getGlobalQuotes().subscribe({
      next: quotes => {
        this.globalQuotes = quotes;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load quotes.';
        this.isLoading = false;
      }
    });
  }

  loadUserQuotes(): void {
    if (!this.isLoggedIn()) return;
    this.quoteService.getMyQuotes().subscribe({
      next: quotes => this.userQuotes = quotes,
      error: () => console.error('Failed to load user quotes')
    });
  }

  loadBooks(): void {
    this.bookService.getBooks().subscribe({
      next: books => this.books = books,
      error: err => console.error('Error loading books:', err)
    });
  }

  onSubmit(): void {
    if (!this.isLoggedIn()) {
      alert('Please log in to add a quote.');
      return;
    }

    if (this.quoteForm.invalid) return;

    const formValue = this.quoteForm.value;
    const quoteData: Quote = {
      text: formValue.text.trim(),
      author: formValue.author.trim(),
      bookId: formValue.bookId
    };

    this.isLoading = true;

    if (this.isEdit && this.editingQuoteId) {
      this.quoteService.updateQuote(this.editingQuoteId, quoteData).subscribe({
        next: updated => {
          const index = this.userQuotes.findIndex(q => q.id === updated.id);
          if (index !== -1) this.userQuotes[index] = updated;
          this.resetForm();
          this.isLoading = false;
        },
        error: () => {
          this.errorMessage = 'Failed to update quote.';
          this.isLoading = false;
        }
      });
    } else {
      this.quoteService.createQuote(quoteData).subscribe({
        next: newQuote => {
          this.userQuotes.unshift(newQuote);
          this.resetForm();
          this.isLoading = false;
        },
        error: () => {
          this.errorMessage = 'Failed to create quote.';
          this.isLoading = false;
        }
      });
    }
  }

  editQuote(id: number): void {
    if (!this.isLoggedIn()) return;

    const quote = this.userQuotes.find(q => q.id === id);
    if (!quote) return;

    this.isEdit = true;
    this.editingQuoteId = quote.id;
    this.quoteForm.patchValue({
      text: quote.text,
      author: quote.author,
      bookId: quote.bookId ?? null
    });
  }

  deleteQuote(id?: number): void {
    if (!id || !this.isLoggedIn()) return;

    if (!confirm('Are you sure you want to delete this quote?')) return;

    this.quoteService.deleteQuote(id).subscribe({
      next: () => {
        this.userQuotes = this.userQuotes.filter(q => q.id !== id);
      },
      error: () => alert('Failed to delete quote.')
    });
  }

  resetForm(): void {
    this.quoteForm.reset({ text: '', author: '', bookId: null });
    this.isEdit = false;
    this.editingQuoteId = undefined;
  }

  isLoggedIn(): boolean {
    return this.auth.isAuthenticated();
  }
}
