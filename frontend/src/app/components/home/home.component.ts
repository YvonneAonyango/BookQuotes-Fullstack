import { Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { 
  faBook, 
  faQuoteLeft, 
  faUser, 
  faPlus, 
  faStar, 
  faLightbulb,
  faChartLine,
  faHistory,
  faArrowRight,
  faMoon,
  faSun
} from '@fortawesome/free-solid-svg-icons';
import { Meta, Title } from '@angular/platform-browser';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule, TranslateModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class HomeComponent implements OnInit {
  
  // Font Awesome icons
  faBook = faBook;
  faQuoteLeft = faQuoteLeft;
  faUser = faUser;
  faPlus = faPlus;
  faStar = faStar;
  faLightbulb = faLightbulb;
  faChartLine = faChartLine;
  faHistory = faHistory;
  faArrowRight = faArrowRight;
  faMoon = faMoon;
  faSun = faSun;
  
  // Theme state
  isDarkMode = false;

  private meta = inject(Meta);
  private titleService = inject(Title);
  private translate = inject(TranslateService);

  ngOnInit(): void {
    document.body.classList.add('homepage');
    this.titleService.setTitle('BookWebApp - Home');

    this.translate.get('homeDescription').subscribe((translated: string) => {
      this.meta.updateTag({
        name: 'description',
        content: translated
      });
    });

    // Check for saved theme preference or system preference
    this.checkThemePreference();
  }

  /* Check and apply saved theme preference */
  checkThemePreference(): void {
    // Check localStorage first
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark') {
      this.enableDarkMode();
    } else if (savedTheme === 'light') {
      this.enableLightMode();
    } else {
      // Check system preference if no saved preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        this.enableDarkMode();
      } else {
        this.enableLightMode();
      }
    }
  }

  /* Toggle between dark and light mode */
  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    
    if (this.isDarkMode) {
      this.enableDarkMode();
    } else {
      this.enableLightMode();
    }
  }
  /* Enable dark mode */
  enableDarkMode(): void {
    document.body.classList.add('dark-mode');
    localStorage.setItem('theme', 'dark');
    this.isDarkMode = true;
  }
  /* Enable light mode */
  enableLightMode(): void {
    document.body.classList.remove('dark-mode');
    localStorage.setItem('theme', 'light');
    this.isDarkMode = false;
  }
  /* Get the current theme icon */
  getThemeIcon() {
    return this.isDarkMode ? this.faSun : this.faMoon;
  }
  /*  Get the current theme text */
  getThemeText() {
    return this.isDarkMode ? 'Light Mode' : 'Dark Mode';
  }
}