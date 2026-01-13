import { Component, Input, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Book, BookService } from '../../services/book.service';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-book-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, TranslateModule],
  templateUrl: './book-form.component.html',
  styleUrls: ['./book-form.component.css']
})
export class BookFormComponent implements OnInit {
  @Input() book?: Book;
  bookForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  isEdit = false;

  private bookService = inject(BookService);
  private fb = inject(FormBuilder);
  private translate = inject(TranslateService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.bookService.getBook(+id).subscribe({
        next: book => {
          this.book = book;
          this.initForm();
        },
        error: () => {
          this.errorMessage = this.translate.instant('errorLoadingBook');
        }
      });
    } else {
      this.initForm();
    }
  }

  initForm(): void {
    this.bookForm = this.fb.group({
      title: [this.book?.title || '', [Validators.required, Validators.minLength(2)]],
      author: [this.book?.author || '', [Validators.required, Validators.minLength(2)]],
      publishDate: [
        this.book?.publishDate?.split('T')[0] || this.getTodayDate(),
        Validators.required
      ]
    });
  }

  onSubmit(): void {
    if (!this.bookForm.valid) return;

    this.isLoading = true;
    const data: Book = this.bookForm.value;

    const request = this.book?.id
      ? this.bookService.updateBook(this.book.id, data)
      : this.bookService.createBook(data);

    request.subscribe({
      next: () => {
        this.router.navigate(['/books']); // immediate redirect
      },
      error: err => {
        console.error(err);
        this.errorMessage = this.translate.instant(this.book?.id ? 'errorUpdatingBook' : 'errorAddingBook');
        this.isLoading = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/books']);
  }

  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  formatDateForDisplay(date: string): string {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
