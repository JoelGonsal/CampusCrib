# CampusCrib - Setup Instructions for Mac M1

## Prerequisites

Before running this project, you need to install:

1. **Node.js** (v14 or higher)
   - Download from: https://nodejs.org/
   - Or install via Homebrew: `brew install node`

2. **MySQL** (v8.0 or higher)
   - Download from: https://dev.mysql.com/downloads/mysql/
   - Or install via Homebrew: `brew install mysql`

## Setup Steps

### 1. Extract the Project
```bash
unzip campuscrib.zip
cd campuscrib
```

### 2. Install Dependencies
```bash
npm install
```

This will install:
- express
- mysql2
- cors
- bcryptjs
- jsonwebtoken
- dotenv

### 3. Setup MySQL Database

#### Start MySQL Service
```bash
# If installed via Homebrew
brew services start mysql

# Or start manually
mysql.server start
```

#### Create Database and User
```bash
# Login to MySQL (default password might be empty or 'root')
mysql -u root -p

# In MySQL prompt, run:
CREATE DATABASE campuscrib;
CREATE USER 'campuscrib_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON campuscrib.* TO 'campuscrib_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### Run Database Schema
```bash
# Navigate to database folder
cd database

# Import the schema
mysql -u campuscrib_user -p campuscrib < schema.sql

# Import any additional SQL files if needed
mysql -u campuscrib_user -p campuscrib < add_roommate_requests_table.sql
```

### 4. Configure Environment Variables

Create a `.env` file in the root directory:
```bash
touch .env
```

Add the following content (update with your MySQL credentials):
```env
DB_HOST=localhost
DB_USER=campuscrib_user
DB_PASSWORD=your_password
DB_NAME=campuscrib
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production
PORT=3000
```

### 5. Start the Server

```bash
# Navigate to server folder
cd server

# Start the server
node server.js
```

You should see:
```
Connected to MySQL database
Server running on port 3000
```

### 6. Access the Application

Open your browser and go to:
```
http://localhost:3000
```

## Test Credentials

If you want to test with existing data:
- **Email:** aksh20@gmail.com
- **Password:** password123

## Project Structure

```
campuscrib/
├── server/
│   └── server.js          # Backend API server
├── database/
│   ├── schema.sql         # Database schema
│   └── *.sql             # Additional SQL files
├── js/                    # Frontend JavaScript files
├── *.html                # HTML pages
├── modern-style.css      # Styles
└── .env                  # Environment variables (create this)
```

## Troubleshooting

### MySQL Connection Issues
- Make sure MySQL is running: `brew services list`
- Check MySQL credentials in `.env` file
- Try connecting manually: `mysql -u campuscrib_user -p`

### Port Already in Use
If port 3000 is already in use:
- Change PORT in `.env` file
- Or kill the process: `lsof -ti:3000 | xargs kill`

### Node Modules Issues
If you get module errors:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Database Schema Issues
If tables are missing:
```bash
cd database
mysql -u campuscrib_user -p campuscrib < schema.sql
```

## Development Tips

### Viewing Logs
- Server logs appear in the terminal where you ran `node server.js`
- Browser console (F12) shows frontend errors

### Stopping the Server
- Press `Ctrl + C` in the terminal

### Restarting After Changes
- Stop the server (Ctrl + C)
- Start again: `node server.js`

## Features

- **User Authentication** - Register, Login, JWT-based auth
- **PG/Flat Listings** - Browse and post accommodations
- **Tiffin Services** - Find home-cooked meal providers
- **Roommate Finder** - Find compatible roommates
- **Dashboard** - Manage your listings and requests
- **My Rentals** - Track your rental applications
- **My Tenants** - Manage your tenants

## Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Verify all prerequisites are installed
3. Make sure MySQL is running
4. Check server logs for error messages
5. Check browser console for frontend errors

## Notes for Mac M1

- Node.js and MySQL work natively on M1
- No Rosetta translation needed
- All dependencies are M1 compatible
- Performance should be excellent on M1

Enjoy using CampusCrib! 🏠
