# Quick Start Guide - CampusCrib

## TL;DR - Fastest Way to Run

### 1. Install Prerequisites (if not already installed)
```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js and MySQL
brew install node mysql
```

### 2. Setup Database
```bash
# Start MySQL
brew services start mysql

# Create database (use password 'root' or leave empty when prompted)
mysql -u root -p << EOF
CREATE DATABASE campuscrib;
CREATE USER 'campuscrib_user'@'localhost' IDENTIFIED BY 'campuscrib123';
GRANT ALL PRIVILEGES ON campuscrib.* TO 'campuscrib_user'@'localhost';
FLUSH PRIVILEGES;
EOF

# Import schema
mysql -u campuscrib_user -p campuscrib < database/schema.sql
```

### 3. Install & Configure
```bash
# Install dependencies
npm install

# Create .env file
cat > .env << EOF
DB_HOST=localhost
DB_USER=campuscrib_user
DB_PASSWORD=campuscrib123
DB_NAME=campuscrib
JWT_SECRET=super_secret_key_change_in_production
PORT=3000
EOF
```

### 4. Run
```bash
cd server
node server.js
```

### 5. Open Browser
```
http://localhost:3000
```

## Test Login
- Email: `aksh20@gmail.com`
- Password: `password123`

---

**That's it! You're ready to go! 🚀**

For detailed instructions, see `SETUP_INSTRUCTIONS.md`
