## Project Overview
This project is a full‑stack application where users can register, log in, add and store books, and document their favourite quotes. 
Quotes are not required to be associated with books. The frontend is built with Angular 20, 
and the backend uses a .NET 9 API deployed via Render with a PostgreSQL database.

### Frontend (Angular)
#### Structure
Components:
books
quotes
dashboard
bookform
homepage
navbar

#### Services:
Book service
Quote service
Theme
Translations

#### Features:
Crud for both books and quotes independently
JWT Authentication (login/register)
Admin dashboard functionalities

### Backend (.NET 9 API)
#### Models:
Book
Quote
User

#### Controllers:
BooksController
QuotesController
UserController

#### API configuration
EF Core setup
JWT auth
CORS policy

#### Database
Backend originally developed using SQLite Server locally
For deployment on Render, database was migrated to PostgreSQL because Render doesn't support SQL Server
EF Core handles mapping differences automatically

### Deployment
Code hosted on GitHub
Frontend deployed on Render (static site)
Backend deployed on Render Web Service
PostgreSQL database created via Render Dashboard

### Environment Variables
Typical variables include:
JWT_SECRET
POSTGRES_CONNECTION_STRING
ASPNETCORE_ENVIRONMENT

### Running the Project Locally
## Frontend
cd frontend
npm install
ng serve -o

### Backend
cd backend
dotnet restore
dotnet run

## License
MIT License
