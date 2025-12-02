import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Book, BookService } from '../../services/book.service';

@Component({
  selector: 'app-book-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './book-form.component.html',
  styleUrls: ['./book-form.component.css']
})
export class BookFormComponent implements OnInit {

  bookForm: FormGroup;
  isEdit = false;
  bookId?: number;
  isLoading = false;

  // ✅ Added this to fix template error
  showBackButton = true;

  constructor(
    private fb: FormBuilder,
    private bookService: BookService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.bookForm = this.fb.group({
      title: ['', Validators.required],
      author: ['', Validators.required],
      publicationDate: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEdit = true;
        this.bookId = +params['id'];
        this.loadBook();
      }
    });
  }

  loadBook(): void {
    if (this.bookId) {
      this.isLoading = true;
      this.bookService.getBook(this.bookId).subscribe({
        next: (book) => {
          this.bookForm.patchValue({
            title: book.title,
            author: book.author,
            publicationDate: book.publicationDate.split('T')[0]
          });
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading book:', error);
          this.isLoading = false;
        }
      });
    }
  }

  onSubmit(): void {
    if (this.bookForm.valid) {
      this.isLoading = true;
      const bookData: Book = this.bookForm.value;

      const operation = this.isEdit && this.bookId
        ? this.bookService.updateBook(this.bookId, bookData)
        : this.bookService.createBook(bookData);

      operation.subscribe({
        next: () => {
          this.isLoading = false;
          this.router.navigate(['/books']);
        },
        error: (error) => {
          console.error('Error saving book:', error);
          this.isLoading = false;
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/books']);
  }
}