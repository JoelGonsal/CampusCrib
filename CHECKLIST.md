# Setup Checklist for Mac M1

## Before You Start
- [ ] Extract the zip file
- [ ] Open Terminal
- [ ] Navigate to the project folder: `cd path/to/campuscrib`

## Installation Checklist

### Prerequisites
- [ ] Install Node.js (check: `node --version`)
- [ ] Install MySQL (check: `mysql --version`)

### Database Setup
- [ ] Start MySQL service
- [ ] Create database `campuscrib`
- [ ] Create user `campuscrib_user`
- [ ] Import `database/schema.sql`
- [ ] Import `database/add_roommate_requests_table.sql`

### Project Setup
- [ ] Run `npm install`
- [ ] Create `.env` file with database credentials
- [ ] Verify `.env` has correct MySQL password

### Running the App
- [ ] Navigate to server folder: `cd server`
- [ ] Start server: `node server.js`
- [ ] See "Server running on port 3000" message
- [ ] Open browser to `http://localhost:3000`

## Verification
- [ ] Homepage loads correctly
- [ ] Can navigate to different pages
- [ ] Can register a new account
- [ ] Can login with test credentials
- [ ] Dashboard displays correctly
- [ ] Can view PG listings
- [ ] Can view Tiffin services
- [ ] Can view Roommate finder

## If Something Goes Wrong

### MySQL Not Starting
```bash
brew services restart mysql
```

### Port 3000 Already in Use
```bash
lsof -ti:3000 | xargs kill
```

### Database Connection Error
- Check MySQL is running: `brew services list`
- Verify credentials in `.env` file
- Test connection: `mysql -u campuscrib_user -p`

### Missing Dependencies
```bash
rm -rf node_modules
npm install
```

## Success! ✅
When everything works, you should see:
- Server running message in terminal
- Website loads at localhost:3000
- Can login and navigate pages
- Dashboard shows quick actions
- All features are accessible

---

**Need help? Check SETUP_INSTRUCTIONS.md for detailed guide!**
