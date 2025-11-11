const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'pg-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

// Database connection
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '12345678',
    database: 'campuscrib'
};

let db;

async function connectDB() {
    try {
        db = await mysql.createConnection(dbConfig);
        console.log('Connected to MySQL database');
    } catch (error) {
        console.error('Database connection failed:', error);
        process.exit(1);
    }
}

// JWT middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password, full_name, phone, course } = req.body;

        // Check if user exists
        const [existingUsers] = await db.execute(
            'SELECT id FROM users WHERE email = ? OR username = ?',
            [email, username]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const [result] = await db.execute(
            'INSERT INTO users (username, email, password, full_name, phone, course) VALUES (?, ?, ?, ?, ?, ?)',
            [username, email, hashedPassword, full_name, phone, course]
        );

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const [users] = await db.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const user = users[0];

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        // Remove password from user object
        delete user.password;

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                phone: user.phone,
                course: user.course
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PG Listings Routes
app.get('/api/pgs', async (req, res) => {
    try {
        const [pgs] = await db.execute(`
            SELECT pg.*, u.full_name as owner_name, u.phone as owner_phone 
            FROM pg_listings pg 
            JOIN users u ON pg.user_id = u.id 
            WHERE pg.is_active = 1
            ORDER BY pg.created_at DESC
        `);
        res.json(pgs);
    } catch (error) {
        console.error('Error fetching PGs:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/pgs', authenticateToken, upload.array('images', 5), async (req, res) => {
    try {
        const {
            title, description, location, area, rent_amount, sharing_type,
            property_type, amenities, contact_number, whatsapp_number,
            distance_from_college, available_from, gender_preference
        } = req.body;

        // Process uploaded images
        let imagePaths = [];
        if (req.files && req.files.length > 0) {
            imagePaths = req.files.map(file => `uploads/${file.filename}`);
        }

        // Handle amenities - it might already be JSON string from FormData
        let amenitiesJson;
        try {
            amenitiesJson = typeof amenities === 'string' ? amenities : JSON.stringify(amenities);
        } catch (e) {
            amenitiesJson = JSON.stringify([]);
        }

        const [result] = await db.execute(`
            INSERT INTO pg_listings 
            (user_id, title, description, location, area, rent_amount, sharing_type, 
             property_type, amenities, contact_number, whatsapp_number, 
             distance_from_college, available_from, gender_preference, images)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            req.user.userId, title, description, location, area, rent_amount,
            sharing_type, property_type, amenitiesJson,
            contact_number, whatsapp_number, distance_from_college,
            available_from, gender_preference, JSON.stringify(imagePaths)
        ]);

        res.status(201).json({ 
            message: 'PG listing created successfully', 
            id: result.insertId,
            images: imagePaths
        });
    } catch (error) {
        console.error('Error creating PG listing:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Tiffin Services Routes
app.get('/api/tiffins', async (req, res) => {
    try {
        const [tiffins] = await db.execute(`
            SELECT t.*, u.full_name as owner_name, u.phone as owner_phone 
            FROM tiffin_services t 
            JOIN users u ON t.user_id = u.id 
            WHERE t.is_active = 1
            ORDER BY t.created_at DESC
        `);
        res.json(tiffins);
    } catch (error) {
        console.error('Error fetching tiffins:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/tiffins', authenticateToken, async (req, res) => {
    try {
        const {
            service_name, description, location, area, price_per_meal,
            meal_type, cuisine_type, menu_items, contact_number,
            whatsapp_number, delivery_areas, delivery_time
        } = req.body;

        const [result] = await db.execute(`
            INSERT INTO tiffin_services 
            (user_id, service_name, description, location, area, price_per_meal,
             meal_type, cuisine_type, menu_items, contact_number, whatsapp_number,
             delivery_areas, delivery_time)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            req.user.userId, service_name, description, location, area,
            price_per_meal, meal_type, cuisine_type, JSON.stringify(menu_items),
            contact_number, whatsapp_number, JSON.stringify(delivery_areas),
            delivery_time
        ]);

        res.status(201).json({ message: 'Tiffin service created successfully', id: result.insertId });
    } catch (error) {
        console.error('Error creating tiffin service:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Roommate Requests Routes
app.get('/api/roommates', async (req, res) => {
    try {
        const [roommates] = await db.execute(`
            SELECT r.*, u.full_name, u.phone, u.course 
            FROM roommate_requests r 
            JOIN users u ON r.user_id = u.id 
            WHERE r.is_active = 1
            ORDER BY r.created_at DESC
        `);
        res.json(roommates);
    } catch (error) {
        console.error('Error fetching roommate requests:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/roommates', authenticateToken, async (req, res) => {
    try {
        const {
            looking_for_gender, preferred_location, budget_min, budget_max,
            sharing_preference, lifestyle_preferences, about_me,
            contact_number, whatsapp_number
        } = req.body;

        const [result] = await db.execute(`
            INSERT INTO roommate_requests 
            (user_id, looking_for_gender, preferred_location, budget_min, budget_max,
             sharing_preference, lifestyle_preferences, about_me, contact_number, whatsapp_number)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            req.user.userId, looking_for_gender, preferred_location, budget_min,
            budget_max, sharing_preference, JSON.stringify(lifestyle_preferences),
            about_me, contact_number, whatsapp_number
        ]);

        res.status(201).json({ message: 'Roommate request created successfully', id: result.insertId });
    } catch (error) {
        console.error('Error creating roommate request:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Contact Messages Route
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, message } = req.body;

        const [result] = await db.execute(
            'INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)',
            [name, email, message]
        );

        res.status(201).json({ message: 'Message sent successfully' });
    } catch (error) {
        console.error('Error saving contact message:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// User's listings
app.get('/api/user/listings', authenticateToken, async (req, res) => {
    try {
        const [pgs] = await db.execute(
            'SELECT * FROM pg_listings WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.userId]
        );
        
        const [tiffins] = await db.execute(
            'SELECT * FROM tiffin_services WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.userId]
        );
        
        const [roommates] = await db.execute(
            'SELECT * FROM roommate_requests WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.userId]
        );

        res.json({
            pgs,
            tiffins,
            roommates
        });
    } catch (error) {
        console.error('Error fetching user listings:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete endpoints
app.delete('/api/pgs/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if the listing belongs to the user
        const [listings] = await db.execute(
            'SELECT * FROM pg_listings WHERE id = ? AND user_id = ?',
            [id, req.user.userId]
        );
        
        if (listings.length === 0) {
            return res.status(404).json({ message: 'Listing not found or unauthorized' });
        }
        
        // Delete the listing
        await db.execute('DELETE FROM pg_listings WHERE id = ? AND user_id = ?', [id, req.user.userId]);
        
        res.json({ message: 'PG listing deleted successfully' });
    } catch (error) {
        console.error('Error deleting PG listing:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.delete('/api/tiffins/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if the listing belongs to the user
        const [listings] = await db.execute(
            'SELECT * FROM tiffin_services WHERE id = ? AND user_id = ?',
            [id, req.user.userId]
        );
        
        if (listings.length === 0) {
            return res.status(404).json({ message: 'Tiffin service not found or unauthorized' });
        }
        
        // Delete the listing
        await db.execute('DELETE FROM tiffin_services WHERE id = ? AND user_id = ?', [id, req.user.userId]);
        
        res.json({ message: 'Tiffin service deleted successfully' });
    } catch (error) {
        console.error('Error deleting tiffin service:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.delete('/api/roommates/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if the listing belongs to the user
        const [listings] = await db.execute(
            'SELECT * FROM roommate_requests WHERE id = ? AND user_id = ?',
            [id, req.user.userId]
        );
        
        if (listings.length === 0) {
            return res.status(404).json({ message: 'Roommate request not found or unauthorized' });
        }
        
        // Delete the listing
        await db.execute('DELETE FROM roommate_requests WHERE id = ? AND user_id = ?', [id, req.user.userId]);
        
        res.json({ message: 'Roommate request deleted successfully' });
    } catch (error) {
        console.error('Error deleting roommate request:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update endpoints for inline editing
app.patch('/api/pgs/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        // Check if the listing belongs to the user
        const [listings] = await db.execute(
            'SELECT * FROM pg_listings WHERE id = ? AND user_id = ?',
            [id, req.user.userId]
        );
        
        if (listings.length === 0) {
            return res.status(404).json({ message: 'Listing not found or unauthorized' });
        }
        
        // Build dynamic update query
        const allowedFields = ['title', 'location', 'rent_amount', 'contact_number', 'whatsapp_number', 'description'];
        const updateFields = [];
        const updateValues = [];
        
        Object.keys(updates).forEach(key => {
            if (allowedFields.includes(key)) {
                updateFields.push(`${key} = ?`);
                updateValues.push(updates[key]);
            }
        });
        
        if (updateFields.length === 0) {
            return res.status(400).json({ message: 'No valid fields to update' });
        }
        
        updateValues.push(id, req.user.userId);
        
        await db.execute(
            `UPDATE pg_listings SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`,
            updateValues
        );
        
        res.json({ message: 'PG listing updated successfully' });
    } catch (error) {
        console.error('Error updating PG listing:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.patch('/api/tiffins/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        // Check if the listing belongs to the user
        const [listings] = await db.execute(
            'SELECT * FROM tiffin_services WHERE id = ? AND user_id = ?',
            [id, req.user.userId]
        );
        
        if (listings.length === 0) {
            return res.status(404).json({ message: 'Tiffin service not found or unauthorized' });
        }
        
        // Build dynamic update query
        const allowedFields = ['service_name', 'location', 'price_per_meal', 'contact_number', 'whatsapp_number', 'description'];
        const updateFields = [];
        const updateValues = [];
        
        Object.keys(updates).forEach(key => {
            if (allowedFields.includes(key)) {
                updateFields.push(`${key} = ?`);
                updateValues.push(updates[key]);
            }
        });
        
        if (updateFields.length === 0) {
            return res.status(400).json({ message: 'No valid fields to update' });
        }
        
        updateValues.push(id, req.user.userId);
        
        await db.execute(
            `UPDATE tiffin_services SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`,
            updateValues
        );
        
        res.json({ message: 'Tiffin service updated successfully' });
    } catch (error) {
        console.error('Error updating tiffin service:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.patch('/api/roommates/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        // Check if the listing belongs to the user
        const [listings] = await db.execute(
            'SELECT * FROM roommate_requests WHERE id = ? AND user_id = ?',
            [id, req.user.userId]
        );
        
        if (listings.length === 0) {
            return res.status(404).json({ message: 'Roommate request not found or unauthorized' });
        }
        
        // Build dynamic update query
        const allowedFields = ['looking_for_gender', 'preferred_location', 'budget_max', 'contact_number', 'whatsapp_number', 'about_me'];
        const updateFields = [];
        const updateValues = [];
        
        Object.keys(updates).forEach(key => {
            if (allowedFields.includes(key)) {
                updateFields.push(`${key} = ?`);
                updateValues.push(updates[key]);
            }
        });
        
        if (updateFields.length === 0) {
            return res.status(400).json({ message: 'No valid fields to update' });
        }
        
        updateValues.push(id, req.user.userId);
        
        await db.execute(
            `UPDATE roommate_requests SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`,
            updateValues
        );
        
        res.json({ message: 'Roommate request updated successfully' });
    } catch (error) {
        console.error('Error updating roommate request:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Tiffin Subscription Routes
app.post('/api/tiffins/:id/subscribe', authenticateToken, async (req, res) => {
    try {
        const tiffinId = req.params.id;
        const subscriberId = req.user.userId;
        const {
            subscription_type = 'daily',
            start_date,
            end_date,
            delivery_address,
            special_instructions,
            phone_number
        } = req.body;

        // Check if tiffin service exists
        const [tiffin] = await db.execute('SELECT id FROM tiffin_services WHERE id = ?', [tiffinId]);
        if (tiffin.length === 0) {
            return res.status(404).json({ message: 'Tiffin service not found' });
        }

        // Check if user is already subscribed
        const [existing] = await db.execute(
            'SELECT id FROM tiffin_subscriptions WHERE tiffin_id = ? AND subscriber_id = ? AND is_active = 1',
            [tiffinId, subscriberId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'You are already subscribed to this tiffin service' });
        }

        // Create subscription
        const [result] = await db.execute(`
            INSERT INTO tiffin_subscriptions 
            (tiffin_id, subscriber_id, subscription_type, start_date, end_date, 
             delivery_address, special_instructions, phone_number)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            tiffinId, subscriberId, subscription_type, start_date, end_date,
            delivery_address, special_instructions, phone_number
        ]);

        res.status(201).json({ 
            message: 'Successfully subscribed to tiffin service!', 
            subscriptionId: result.insertId 
        });
    } catch (error) {
        console.error('Error creating subscription:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's subscriptions
app.get('/api/my-subscriptions', authenticateToken, async (req, res) => {
    try {
        const [subscriptions] = await db.execute(`
            SELECT s.*, t.service_name, t.price_per_meal, t.location, t.delivery_time,
                   u.full_name as provider_name, u.phone as provider_phone
            FROM tiffin_subscriptions s
            JOIN tiffin_services t ON s.tiffin_id = t.id
            JOIN users u ON t.user_id = u.id
            WHERE s.subscriber_id = ? AND s.is_active = 1
            ORDER BY s.created_at DESC
        `, [req.user.userId]);

        res.json(subscriptions);
    } catch (error) {
        console.error('Error fetching subscriptions:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get subscribers for tiffin provider
app.get('/api/tiffins/:id/subscribers', authenticateToken, async (req, res) => {
    try {
        const tiffinId = req.params.id;

        // Check if user owns this tiffin service
        const [tiffin] = await db.execute(
            'SELECT user_id FROM tiffin_services WHERE id = ?', 
            [tiffinId]
        );

        if (tiffin.length === 0) {
            return res.status(404).json({ message: 'Tiffin service not found' });
        }

        if (tiffin[0].user_id !== req.user.userId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Get subscribers
        const [subscribers] = await db.execute(`
            SELECT s.*, u.full_name, u.email, u.phone
            FROM tiffin_subscriptions s
            JOIN users u ON s.subscriber_id = u.id
            WHERE s.tiffin_id = ? AND s.is_active = 1
            ORDER BY s.created_at DESC
        `, [tiffinId]);

        res.json(subscribers);
    } catch (error) {
        console.error('Error fetching subscribers:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Cancel subscription
app.delete('/api/subscriptions/:id', authenticateToken, async (req, res) => {
    try {
        const subscriptionId = req.params.id;

        // Check if subscription exists and belongs to user
        const [subscription] = await db.execute(
            'SELECT subscriber_id FROM tiffin_subscriptions WHERE id = ?',
            [subscriptionId]
        );

        if (subscription.length === 0) {
            return res.status(404).json({ message: 'Subscription not found' });
        }

        if (subscription[0].subscriber_id !== req.user.userId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Cancel subscription
        await db.execute(
            'UPDATE tiffin_subscriptions SET is_active = 0 WHERE id = ?',
            [subscriptionId]
        );

        res.json({ message: 'Subscription cancelled successfully' });
    } catch (error) {
        console.error('Error cancelling subscription:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Check subscription status
app.get('/api/tiffins/:id/subscription-status', authenticateToken, async (req, res) => {
    try {
        const tiffinId = req.params.id;
        const userId = req.user.userId;

        const [subscription] = await db.execute(
            'SELECT id, subscription_type, start_date, end_date FROM tiffin_subscriptions WHERE tiffin_id = ? AND subscriber_id = ? AND is_active = 1',
            [tiffinId, userId]
        );

        res.json({ 
            isSubscribed: subscription.length > 0,
            subscription: subscription.length > 0 ? subscription[0] : null
        });
    } catch (error) {
        console.error('Error checking subscription status:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PG Rental Routes
app.post('/api/pgs/:id/rent', authenticateToken, async (req, res) => {
    try {
        const pgId = req.params.id;
        const tenantId = req.user.userId;
        const {
            rental_type = 'monthly',
            start_date,
            end_date,
            emergency_contact_name,
            emergency_contact_phone,
            occupation,
            company_name,
            monthly_income,
            id_proof_type,
            id_proof_number,
            local_guardian_name,
            local_guardian_phone,
            special_requirements
        } = req.body;

        // Check if PG exists
        const [pg] = await db.execute('SELECT id, user_id FROM pg_listings WHERE id = ?', [pgId]);
        if (pg.length === 0) {
            return res.status(404).json({ message: 'PG not found' });
        }

        // Check if user is trying to rent their own PG
        if (pg[0].user_id === tenantId) {
            return res.status(400).json({ message: 'You cannot rent your own PG' });
        }

        // Check if user is already renting this PG
        const [existing] = await db.execute(
            'SELECT id FROM pg_rentals WHERE pg_id = ? AND tenant_id = ? AND is_active = 1',
            [pgId, tenantId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'You are already renting this PG' });
        }

        // Create rental
        const [result] = await db.execute(`
            INSERT INTO pg_rentals 
            (pg_id, tenant_id, rental_type, start_date, end_date, 
             emergency_contact_name, emergency_contact_phone, occupation, 
             company_name, monthly_income, id_proof_type, id_proof_number,
             local_guardian_name, local_guardian_phone, special_requirements)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            pgId, tenantId, rental_type, start_date, end_date || null,
            emergency_contact_name, emergency_contact_phone, occupation || null,
            company_name || null, monthly_income || null, id_proof_type || null, id_proof_number || null,
            local_guardian_name || null, local_guardian_phone || null, special_requirements || null
        ]);

        res.status(201).json({ 
            message: 'Successfully applied for PG rental!', 
            rentalId: result.insertId 
        });
    } catch (error) {
        console.error('Error creating PG rental:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's PG rentals
app.get('/api/my-rentals', authenticateToken, async (req, res) => {
    try {
        const [rentals] = await db.execute(`
            SELECT r.*, p.title, p.location, p.rent_amount, p.sharing_type,
                   u.full_name as owner_name, u.phone as owner_phone
            FROM pg_rentals r
            JOIN pg_listings p ON r.pg_id = p.id
            JOIN users u ON p.user_id = u.id
            WHERE r.tenant_id = ? AND r.is_active = 1
            ORDER BY r.created_at DESC
        `, [req.user.userId]);

        res.json(rentals);
    } catch (error) {
        console.error('Error fetching rentals:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get tenants for PG owner
app.get('/api/pgs/:id/tenants', authenticateToken, async (req, res) => {
    try {
        const pgId = req.params.id;

        // Check if user owns this PG
        const [pg] = await db.execute(
            'SELECT user_id FROM pg_listings WHERE id = ?', 
            [pgId]
        );

        if (pg.length === 0) {
            return res.status(404).json({ message: 'PG not found' });
        }

        if (pg[0].user_id !== req.user.userId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Get tenants
        const [tenants] = await db.execute(`
            SELECT r.*, u.full_name, u.email, u.phone, u.course
            FROM pg_rentals r
            JOIN users u ON r.tenant_id = u.id
            WHERE r.pg_id = ? AND r.is_active = 1
            ORDER BY r.created_at DESC
        `, [pgId]);

        res.json(tenants);
    } catch (error) {
        console.error('Error fetching tenants:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all tenants for owner (across all PGs)
app.get('/api/my-tenants', authenticateToken, async (req, res) => {
    try {
        const [tenants] = await db.execute(`
            SELECT r.*, p.title as pg_title, p.location, 
                   u.full_name, u.email, u.phone, u.course
            FROM pg_rentals r
            JOIN pg_listings p ON r.pg_id = p.id
            JOIN users u ON r.tenant_id = u.id
            WHERE p.user_id = ? AND r.is_active = 1
            ORDER BY r.created_at DESC
        `, [req.user.userId]);

        res.json(tenants);
    } catch (error) {
        console.error('Error fetching all tenants:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Cancel rental
app.delete('/api/rentals/:id', authenticateToken, async (req, res) => {
    try {
        const rentalId = req.params.id;

        // Check if rental exists and belongs to user
        const [rental] = await db.execute(
            'SELECT tenant_id FROM pg_rentals WHERE id = ?',
            [rentalId]
        );

        if (rental.length === 0) {
            return res.status(404).json({ message: 'Rental not found' });
        }

        if (rental[0].tenant_id !== req.user.userId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Cancel rental
        await db.execute(
            'UPDATE pg_rentals SET is_active = 0 WHERE id = ?',
            [rentalId]
        );

        res.json({ message: 'Rental cancelled successfully' });
    } catch (error) {
        console.error('Error cancelling rental:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Check rental status
app.get('/api/pgs/:id/rental-status', authenticateToken, async (req, res) => {
    try {
        const pgId = req.params.id;
        const userId = req.user.userId;

        const [rental] = await db.execute(
            'SELECT id, rental_type, start_date, end_date FROM pg_rentals WHERE pg_id = ? AND tenant_id = ? AND is_active = 1',
            [pgId, userId]
        );

        res.json({ 
            isRented: rental.length > 0,
            rental: rental.length > 0 ? rental[0] : null
        });
    } catch (error) {
        console.error('Error checking rental status:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Roommate Match Request Routes
app.post('/api/roommates/:id/request', authenticateToken, async (req, res) => {
    try {
        const roommatePostId = req.params.id;
        const requesterId = req.user.userId;
        const {
            message,
            preferred_move_in_date,
            budget_contribution,
            occupation,
            company_name,
            lifestyle_notes,
            contact_preference = 'whatsapp',
            emergency_contact_name,
            emergency_contact_phone
        } = req.body;

        // Check if roommate post exists
        const [roommatePost] = await db.execute('SELECT id, user_id FROM roommate_requests WHERE id = ?', [roommatePostId]);
        if (roommatePost.length === 0) {
            return res.status(404).json({ message: 'Roommate post not found' });
        }

        // Check if user is trying to request their own post
        if (roommatePost[0].user_id === requesterId) {
            return res.status(400).json({ message: 'You cannot send a request to your own roommate post' });
        }

        // Check if user has already sent a request
        const [existing] = await db.execute(
            'SELECT id FROM roommate_match_requests WHERE roommate_post_id = ? AND requester_id = ? AND is_active = 1',
            [roommatePostId, requesterId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'You have already sent a request for this roommate post' });
        }

        // Create roommate request
        const [result] = await db.execute(`
            INSERT INTO roommate_match_requests 
            (roommate_post_id, requester_id, message, preferred_move_in_date, 
             budget_contribution, occupation, company_name, lifestyle_notes,
             contact_preference, emergency_contact_name, emergency_contact_phone)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            roommatePostId, requesterId, message || null, preferred_move_in_date || null,
            budget_contribution || null, occupation || null, company_name || null, lifestyle_notes || null,
            contact_preference, emergency_contact_name || null, emergency_contact_phone || null
        ]);

        res.status(201).json({ 
            message: 'Roommate request sent successfully!', 
            requestId: result.insertId 
        });
    } catch (error) {
        console.error('Error creating roommate request:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's sent roommate requests
app.get('/api/my-roommate-requests', authenticateToken, async (req, res) => {
    try {
        const [requests] = await db.execute(`
            SELECT r.*, rr.looking_for_gender, rr.preferred_location, rr.budget_max, rr.sharing_preference,
                   u.full_name as post_owner_name, u.phone as post_owner_phone
            FROM roommate_match_requests r
            JOIN roommate_requests rr ON r.roommate_post_id = rr.id
            JOIN users u ON rr.user_id = u.id
            WHERE r.requester_id = ? AND r.is_active = 1
            ORDER BY r.created_at DESC
        `, [req.user.userId]);

        res.json(requests);
    } catch (error) {
        console.error('Error fetching roommate requests:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get requests for roommate post owner
app.get('/api/roommates/:id/requests', authenticateToken, async (req, res) => {
    try {
        const roommatePostId = req.params.id;

        // Check if user owns this roommate post
        const [roommatePost] = await db.execute(
            'SELECT user_id FROM roommate_requests WHERE id = ?', 
            [roommatePostId]
        );

        if (roommatePost.length === 0) {
            return res.status(404).json({ message: 'Roommate post not found' });
        }

        if (roommatePost[0].user_id !== req.user.userId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Get requests
        const [requests] = await db.execute(`
            SELECT r.*, u.full_name, u.email, u.phone, u.course
            FROM roommate_match_requests r
            JOIN users u ON r.requester_id = u.id
            WHERE r.roommate_post_id = ? AND r.is_active = 1
            ORDER BY r.created_at DESC
        `, [roommatePostId]);

        res.json(requests);
    } catch (error) {
        console.error('Error fetching requests:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all requests for owner (across all roommate posts)
app.get('/api/my-roommate-post-requests', authenticateToken, async (req, res) => {
    try {
        const [requests] = await db.execute(`
            SELECT r.*, rr.looking_for_gender, rr.preferred_location, rr.budget_max,
                   u.full_name, u.email, u.phone, u.course
            FROM roommate_match_requests r
            JOIN roommate_requests rr ON r.roommate_post_id = rr.id
            JOIN users u ON r.requester_id = u.id
            WHERE rr.user_id = ? AND r.is_active = 1
            ORDER BY r.created_at DESC
        `, [req.user.userId]);

        res.json(requests);
    } catch (error) {
        console.error('Error fetching all roommate requests:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Accept/Reject roommate request
app.patch('/api/roommate-requests/:id/status', authenticateToken, async (req, res) => {
    try {
        const requestId = req.params.id;
        const { status } = req.body; // 'accepted' or 'rejected'

        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status. Must be "accepted" or "rejected"' });
        }

        // Check if request exists and user owns the roommate post
        const [request] = await db.execute(`
            SELECT r.id, rr.user_id 
            FROM roommate_match_requests r
            JOIN roommate_requests rr ON r.roommate_post_id = rr.id
            WHERE r.id = ?
        `, [requestId]);

        if (request.length === 0) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (request[0].user_id !== req.user.userId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Update request status
        await db.execute(
            'UPDATE roommate_match_requests SET status = ? WHERE id = ?',
            [status, requestId]
        );

        res.json({ message: `Request ${status} successfully` });
    } catch (error) {
        console.error('Error updating request status:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Cancel roommate request
app.delete('/api/roommate-requests/:id', authenticateToken, async (req, res) => {
    try {
        const requestId = req.params.id;

        // Check if request exists and belongs to user
        const [request] = await db.execute(
            'SELECT requester_id FROM roommate_match_requests WHERE id = ?',
            [requestId]
        );

        if (request.length === 0) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (request[0].requester_id !== req.user.userId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Cancel request
        await db.execute(
            'UPDATE roommate_match_requests SET is_active = 0 WHERE id = ?',
            [requestId]
        );

        res.json({ message: 'Request cancelled successfully' });
    } catch (error) {
        console.error('Error cancelling request:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Check roommate request status
app.get('/api/roommates/:id/request-status', authenticateToken, async (req, res) => {
    try {
        const roommatePostId = req.params.id;
        const userId = req.user.userId;

        const [request] = await db.execute(
            'SELECT id, status, created_at FROM roommate_match_requests WHERE roommate_post_id = ? AND requester_id = ? AND is_active = 1',
            [roommatePostId, userId]
        );

        res.json({ 
            hasRequested: request.length > 0,
            request: request.length > 0 ? request[0] : null
        });
    } catch (error) {
        console.error('Error checking request status:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Start server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});