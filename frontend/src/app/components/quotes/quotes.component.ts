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
    this.titleService.setTitle('BookWebApp - My Quotes');

    this.translate.get('myQuotesSubtitle').subscribe(desc => {
      this.meta.updateTag({
        name: 'description',
        content: desc || 'Browse some of my favourite quotes'
      });
    });

    this.loadQuotes();

    if (this.isOwner()) {
      this.loadBooks();
    }
  }

  loadQuotes(): void {
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

  loadBooks(): void {
    this.bookService.getBooks().subscribe({
      next: books => this.books = books,
      error: err => console.error('Error loading books:', err)
    });
  }

  onSubmit(): void {
    if (!this.isOwner() || this.quoteForm.invalid) return;

    this.errorMessage = '';
    this.isLoading = true;

    const quoteData: Quote = {
      text: this.quoteForm.value.text.trim(),
      author: this.quoteForm.value.author.trim(),
      bookId: this.quoteForm.value.bookId,
      isGlobal: true
    };

    if (this.isEdit && this.editingQuoteId) {
      this.quoteService.updateQuote(this.editingQuoteId, quoteData).subscribe({
        next: () => {
          this.resetForm();
          this.loadQuotes();
          this.isLoading = false;
        },
        error: () => {
          this.errorMessage = 'Failed to update quote.';
          this.isLoading = false;
        }
      });
    } else {
      this.quoteService.createQuote(quoteData).subscribe({
        next: () => {
          this.resetForm();
          this.loadQuotes();
          this.isLoading = false;
        },
        error: () => {
          this.errorMessage = 'Failed to add quote.';
          this.isLoading = false;
        }
      });
    }
  }

  editQuote(quote: Quote): void {
    if (!this.isOwner()) return;

    this.isEdit = true;
    this.editingQuoteId = quote.id;

    this.quoteForm.patchValue({
      text: quote.text,
      author: quote.author,
      bookId: quote.bookId ?? null
    });
  }

  deleteQuote(id?: number): void {
    if (!id || !this.isOwner()) return;

    if (!confirm('Are you sure you want to delete this quote?')) return;

    this.quoteService.deleteQuote(id).subscribe({
      next: () => this.loadQuotes(),
      error: () => this.errorMessage = 'Failed to delete quote.'
    });
  }

  resetForm(): void {
    this.quoteForm.reset({ text: '', author: '', bookId: null });
    this.isEdit = false;
    this.editingQuoteId = undefined;
    this.errorMessage = '';
  }

  // ------------------- ONLY YVONNE CAN ADD/EDIT QUOTES -------------------
  isOwner(): boolean {
    const user: any = this.auth.getCurrentUser(); // type any to avoid TS errors
    if (!user) return false;

    // If user object has a username
    if (typeof user === 'object' && user.username) {
      return user.username.toLowerCase() === 'yvonne';
    }

    // If user is a string
    if (typeof user === 'string') {
      return user.toLowerCase() === 'yvonne';
    }

    return false;
  }
}