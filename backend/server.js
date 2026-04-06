const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { nanoid } = require('nanoid');
const cors = require('cors');

const app = express();

app.use(cors({
    origin: 'http://localhost:3001',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const PORT = 3000;

const JWT_SECRET = "my-really-super-important-and-secret-access-key";
const ACCESS_EXPIRES_IN = "30m";

const REFRESH_SECRET = "my-really-super-important-and-secret-refresh-key";
const REFRESH_EXPIRES_IN = "7d";

const refreshTokens = new Set();

const users = [];
let products = [];

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(' ');
    
    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({ 
            error: "Отсутствует или некорректный заголовок Authorization" 
        });
    }
    
    try {
        const payload = jwt.verify(token, JWT_SECRET);

        const user = users.find(u => u.id === payload.sub);
        if (!user || user.isActive === false) {
            return res.status(403).json({ error: "Аккаунт заблокирован" });
        }
        
        req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({ 
            error: "Невалидный или просроченный access-токен" 
        });
    }
}

function roleMiddleware(allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: "Необходима аутентификация" });
        }
        
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                error: `Доступ запрещен. Требуются роли: ${allowedRoles.join(', ')}` 
            });
        }
        
        next();
    };
}


function generateAccessToken(user) {
    return jwt.sign(
        {
            sub: user.id,
            email: user.email,
            role: user.role
        },
        JWT_SECRET,
        {
            expiresIn: ACCESS_EXPIRES_IN
        }
    );
}

function generateRefreshToken(user) {
    return jwt.sign(
        {
            sub: user.id,
            email: user.email,
        },
        REFRESH_SECRET,
        {
            expiresIn: REFRESH_EXPIRES_IN,
        }
    );
}

app.post('/api/auth/register', async (req, res) => {
    const { email, first_name, last_name, password } = req.body;

    if (!email || !first_name || !last_name || !password) {
        return res.status(400).json({ error: "Все поля (email, first_name, last_name, password) обязательны" });
    }

    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
        return res.status(409).json({ error: "Пользователь с таким email уже существует" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            id: nanoid(),
            email,
            first_name,
            last_name,
            hashedPassword,
            role: 'user', 
            isActive: true,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);

        res.status(201).json({
            id: newUser.id,
            email: newUser.email,
            first_name: newUser.first_name,
            last_name: newUser.last_name,
            role: newUser.role
        });
    } catch (error) {
        console.error('Ошибка при регистрации: ', error);
        res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email и пароль обязательны" });
    }

    const user = users.find(u => u.email === email);
    if (!user) {
        return res.status(401).json({ error: "Неверный email или пароль" });
    }

    if (user.isActive === false) {
        return res.status(403).json({ error: "Аккаунт заблокирован. Обратитесь к администратору." });
    }

    try {
        const isValid = await bcrypt.compare(password, user.hashedPassword);
        if (!isValid) {
            return res.status(401).json({ error: "Неверный email или пароль" });
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        refreshTokens.add(refreshToken);

        res.json({
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Ошибка при входе: ', error);
        res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
});

app.post('/api/auth/refresh', (req, res) => {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
        return res.status(400).json({ error: "refreshToken обязателен" });
    }
    
    if (!refreshTokens.has(refreshToken)) {
        return res.status(401).json({ error: "Невалидный refresh-токен" });
    }
    
    try {
        const payload = jwt.verify(refreshToken, REFRESH_SECRET);

        const user = users.find(u => u.id === payload.sub);
        if (!user) {
            return res.status(401).json({ error: "Пользователь не найден" });
        }
        
        if (user.isActive === false) {
            return res.status(403).json({ error: "Аккаунт заблокирован" });
        }

        refreshTokens.delete(refreshToken);
        
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);
        
        refreshTokens.add(newRefreshToken);
        
        res.json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        });
        
    } catch (err) {
        if (refreshTokens.has(refreshToken)) {
            refreshTokens.delete(refreshToken);
        }
        return res.status(401).json({ error: "Невалидный или просроченный refresh-токен" });
    }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
    const userId = req.user.sub;
    const user = users.find(u => u.id === userId);

    if (!user) {
        return res.status(404).json({ error: "Пользователь не найден" });
    }

    res.json({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        createdAt: user.createdAt
    });
});

app.post('/api/auth/logout', (req, res) => {
    const { refreshToken } = req.body;
    
    if (refreshToken && refreshTokens.has(refreshToken)) {
        refreshTokens.delete(refreshToken);
    }
    
    res.json({ message: "Выход выполнен успешно" });
});

app.get('/api/products', authMiddleware, async (req, res) => {
    res.json(products);
});
app.get('/api/products/:id', authMiddleware, async (req, res) => {
    const product = products.find(p => p.id === req.params.id);
    if (!product) {
        return res.status(404).json({ message: 'Товар не найден' });
    }
    res.json(product);
});

app.post('/api/products', authMiddleware, roleMiddleware(['seller', 'admin']),
    async (req, res) => {
        const { title, price, category, description } = req.body;
        
        if (!title || price === undefined) {
            return res.status(400).json({ error: "Поля title и price обязательны" });
        }
        
        const newProduct = {
            id: nanoid(),
            title,
            price: Number(price),
            category: category || 'Другое',
            description: description || '',
            createdBy: req.user.sub,
            createdByEmail: req.user.email,
            createdAt: new Date().toISOString()
        };
        
        products.push(newProduct);
        res.status(201).json(newProduct);
    }
);

app.put('/api/products/:id', authMiddleware, roleMiddleware(['seller', 'admin']),
    async (req, res) => {
        const product = products.find(p => p.id === req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Товар не найден' });
        }

        const { title, price, category, description } = req.body;

        if (title !== undefined) product.title = title;
        if (price !== undefined) product.price = Number(price);
        if (category !== undefined) product.category = category;
        if (description !== undefined) product.description = description;
        
        product.updatedAt = new Date().toISOString();

        res.json(product);
    }
);

app.delete('/api/products/:id', authMiddleware, roleMiddleware(['admin']),
    async (req, res) => {
        const index = products.findIndex(p => p.id === req.params.id);
        if (index === -1) {
            return res.status(404).json({ message: 'Товар не найден' });
        }
        
        products.splice(index, 1);
        res.status(204).send();
    }
);

app.get('/api/users', authMiddleware, roleMiddleware(['admin']),
    async (req, res) => {
        const safeUsers = users.map(user => ({
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            isActive: user.isActive !== false,
            createdAt: user.createdAt
        }));
        res.json(safeUsers);
    }
);

app.get('/api/users/:id', authMiddleware, roleMiddleware(['admin']),
    async (req, res) => {
        const { id } = req.params;
        const user = users.find(u => u.id === id);
        
        if (!user) {
            return res.status(404).json({ error: "Пользователь не найден" });
        }
        
        res.json({
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            isActive: user.isActive !== false,
            createdAt: user.createdAt
        });
    }
);

app.put('/api/users/:id', authMiddleware, roleMiddleware(['admin']),
    async (req, res) => {
        const { id } = req.params;
        const { first_name, last_name, role } = req.body;
        
        const userIndex = users.findIndex(u => u.id === id);
        if (userIndex === -1) {
            return res.status(404).json({ error: "Пользователь не найден" });
        }
        
        if (role && users[userIndex].role === 'admin' && role !== 'admin') {
            const adminCount = users.filter(u => u.role === 'admin').length;
            if (adminCount === 1) {
                return res.status(400).json({ error: "Нельзя изменить роль единственного администратора" });
            }
        }
        
        if (first_name) users[userIndex].first_name = first_name;
        if (last_name) users[userIndex].last_name = last_name;
        if (role && ['user', 'seller', 'admin'].includes(role)) {
            users[userIndex].role = role;
        }
        
        users[userIndex].updatedAt = new Date().toISOString();
        
        res.json({
            id: users[userIndex].id,
            email: users[userIndex].email,
            first_name: users[userIndex].first_name,
            last_name: users[userIndex].last_name,
            role: users[userIndex].role,
            isActive: users[userIndex].isActive !== false
        });
    }
);


app.delete('/api/users/:id', authMiddleware, roleMiddleware(['admin']),
    async (req, res) => {
        const { id } = req.params;
        const userIndex = users.findIndex(u => u.id === id);
        
        if (userIndex === -1) {
            return res.status(404).json({ error: "Пользователь не найден" });
        }
        
        if (users[userIndex].id === req.user.sub) {
            return res.status(400).json({ error: "Нельзя заблокировать самого себя" });
        }
        
        if (users[userIndex].role === 'admin') {
            const adminCount = users.filter(u => u.role === 'admin' && u.isActive !== false).length;
            if (adminCount === 1) {
                return res.status(400).json({ error: "Нельзя заблокировать единственного администратора" });
            }
        }
    
        users[userIndex].isActive = false;
        users[userIndex].blockedAt = new Date().toISOString();
        users[userIndex].blockedBy = req.user.email;
        
        res.json({ 
            message: "Пользователь заблокирован", 
            userId: id,
            userEmail: users[userIndex].email
        });
    }
);

async function seedUsers() {
    if (users.length === 0) {
        const hashedPassword = await bcrypt.hash("password123", 10);
        
        // Обычный пользователь
        users.push({
            id: nanoid(),
            email: "user@test.com",
            first_name: "Обычный",
            last_name: "Пользователь",
            hashedPassword,
            role: "user",
            isActive: true,
            createdAt: new Date().toISOString()
        });
        
        // Продавец
        users.push({
            id: nanoid(),
            email: "seller@test.com",
            first_name: "Продавец",
            last_name: "Тестовый",
            hashedPassword,
            role: "seller",
            isActive: true,
            createdAt: new Date().toISOString()
        });
        
        // Администратор
        users.push({
            id: nanoid(),
            email: "admin@test.com",
            first_name: "Администратор",
            last_name: "Системы",
            hashedPassword,
            role: "admin",
            isActive: true,
            createdAt: new Date().toISOString()
        });
    }
}

function seedProducts() {
    if (products.length === 0) {
        products.push({
            id: 1, 
            name: 'Ноутбук', 
            cost: 75000, 
            category: 'Электроника', 
            description: 'Описание ноутбука', 
            stock: 5, 
            rating: 4.8,
            imageUrl: '/images/laptop.jpg'
        });

        products.push({
            id: 2, 
            name: 'Наушники', 
            cost: 5000, 
            category: 'Аксессуары', 
            description: 'Описание наушников', 
            stock: 15,
            rating: 4.5,
            imageUrl: '/images/headphones.jpg'
        });

        products.push({
            id: 3, 
            name: 'Клавиатура', 
            cost: 3000, 
            category: 'Аксессуары', 
            description: 'Описание клавиатуры', 
            stock: 8,
            rating: 4.6,
            imageUrl: '/images/keyboard.jpg'
        });

        products.push({
            id: 4, 
            name: 'Монитор', 
            cost: 25000, 
            category: 'Электроника', 
            description: 'Описание монитора', 
            stock: 3,
            rating: 4.9,
            imageUrl: '/images/monitor.jpg'
        });

        products.push({
            id: 5, 
            name: 'Мышь', 
            cost: 1500, 
            category: 'Аксессуары', 
            description: 'Описание компьютерной мыши', 
            stock: 12,
            rating: 4.3,
            imageUrl: '/images/mouse.jpg'
        });
        products.push({
            id: 6, 
            name: 'Смартфон', 
            cost: 45000, 
            category: 'Электроника', 
            description: 'Описание смартфона', 
            stock: 4,
            rating: 4.7,
            imageUrl: '/images/smartphone.jpg'
        });
        products.push({
            id: 7, 
            name: 'Планшет', 
            cost: 35000, 
            category: 'Электроника', 
            description: 'Описание планшета', 
            stock: 6,
            rating: 4.4,
            imageUrl: '/images/tablet.jpg'
        });
        products.push({
            id: 8, 
            name: 'Чехол', 
            cost: 1000, 
            category: 'Аксессуары', 
            description: 'Описание чехла для смартфона', 
            stock: 20,
            rating: 4.2,
            imageUrl: '/images/phonecase.jpg'
        });
        products.push({
            id: 9, 
            name: 'Зарядка', 
            cost: 2000, 
            category: 'Аксессуары', 
            description: 'Описание зарядки', 
            stock: 10,
            rating: 4.5,
            imageUrl: '/images/charger.jpg'
        });
        products.push({
            id: 10, 
            name: 'Колонка', 
            cost: 4000, 
            category: 'Аудио', 
            description: 'Описание колонки', 
            stock: 7,
            rating: 4.6,
            imageUrl: '/images/speaker.jpg'
        });
    }
}

seedUsers().catch(console.error);
seedProducts();

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});