const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { nanoid } = require('nanoid');
const { all } = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

app.use(cors({
    origin: 'http://localhost:3001',
    credentials: true 
}));

const PORT = process.env.PORT || 3000;

const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN;

const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const REFRESH_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN;

const refreshTokens = new Set();

const users = [];
let products = [
    {
        id: 1, 
        name: 'Ноутбук', 
        cost: 75000, 
        category: 'Электроника', 
        description: 'Описание ноутбука', 
        stock: 5, 
        rating: 4.8,
        imageUrl: '/images/laptop.jpg'
    },
    {
        id: 2, 
        name: 'Наушники', 
        cost: 5000, 
        category: 'Аксессуары', 
        description: 'Описание наушников', 
        stock: 15,
        rating: 4.5,
        imageUrl: '/images/headphones.jpg'
    },
    {
        id: 3, 
        name: 'Клавиатура', 
        cost: 3000, 
        category: 'Аксессуары', 
        description: 'Описание клавиатуры', 
        stock: 8,
        rating: 4.6,
        imageUrl: '/images/keyboard.jpg'
    },
    {
        id: 4, 
        name: 'Монитор', 
        cost: 25000, 
        category: 'Электроника', 
        description: 'Описание монитора', 
        stock: 3,
        rating: 4.9,
        imageUrl: '/images/monitor.jpg'
    },
    {
        id: 5, 
        name: 'Мышь', 
        cost: 1500, 
        category: 'Аксессуары', 
        description: 'Описание компьютерной мыши', 
        stock: 12,
        rating: 4.3,
        imageUrl: '/images/mouse.jpg'
    },
    {
        id: 6, 
        name: 'Смартфон', 
        cost: 45000, 
        category: 'Электроника', 
        description: 'Описание смартфона', 
        stock: 4,
        rating: 4.7,
        imageUrl: '/images/smartphone.jpg'
    },
    {
        id: 7, 
        name: 'Планшет', 
        cost: 35000, 
        category: 'Электроника', 
        description: 'Описание планшета', 
        stock: 6,
        rating: 4.4,
        imageUrl: '/images/tablet.jpg'
    },
    {
        id: 8, 
        name: 'Чехол', 
        cost: 1000, 
        category: 'Аксессуары', 
        description: 'Описание чехла для смартфона', 
        stock: 20,
        rating: 4.2,
        imageUrl: '/images/phonecase.jpg'
    },
    {
        id: 9, 
        name: 'Зарядка', 
        cost: 2000, 
        category: 'Аксессуары', 
        description: 'Описание зарядки', 
        stock: 10,
        rating: 4.5,
        imageUrl: '/images/charger.jpg'
    },
    {
        id: 10, 
        name: 'Колонка', 
        cost: 4000, 
        category: 'Аудио', 
        description: 'Описание колонки', 
        stock: 7,
        rating: 4.6,
        imageUrl: '/images/speaker.jpg'
    }
];

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
        const userRole = req.user.role;
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                error: "Доступ запрещён. Недостаточно прав."
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

/**
 * @swagger
 * /auth/register:
 *   get:
 *     summary: Регистрация пользователя
 *     tags: [Пользователи]
 *     responses:
 *       400:
 *         description: Все поля (email, first_name, last_name, password) обязательны
 *      409:
 *          description: Пользователь с таким email уже существует
 *      201:
 *          description: Пользователь добавлен
 *      500:
 *          description: Внутренняя ошибка сервера
 *         
 */
app.post('/api/auth/register', async (req, res) => {
    const { email, first_name, last_name, password } = req.body;

    if(!email || !first_name || !last_name || !password) {
        return res.status(400).json({error: "Все поля (email, first_name, last_name, password) обязательны"});
    }

    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
        return res.status(409).json({error: "Пользователь с таким email уже существует"});
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
            isBlocked: false
        };

        users.push(newUser);

        res.status(201).json({
            id: newUser.id, 
            email: newUser.email, 
            first_name: newUser.first_name, 
            last_name: newUser.last_name, 
            role: newUser.role});
    } catch (error) {
        console.error('Ошибка при регистрации: ', error);
        res.status(500).json({error: "Внутренняя ошибка сервера"});
    }
});

/**
 * @swagger
 * /auth/login:
 *   get:
 *     summary: Вход в аккаунт уже существующего пользователя
 *     tags: [Пользователи]
 *     responses:
 *       400:
 *         description: Email и пароль обязательны
 *      401:
 *          description: Неверный email или пароль
 *      500:
 *          description: Внутренняя ошибка сервера
 *         
 */
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({error: "Email и пароль обязательны"});
    }

    const user = users.find(u => u.email === email);
    if (!user) {
        return res.status(401).json({error: "Неверный email или пароль"});
    }

    if (user.isBlocked) {
        return res.status(403).json({error: "Пользователь заблокирован"});
    }

    try {
        const isValid = await bcrypt.compare(password, user.hashedPassword);
        if (!isValid) {
            return res.status(401).json({error: "Неверный email или пароль"});
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
        res.status(500).json({error: "Внутренняя ошибка сервера"});
    }
});

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Текущий пользователь
 *     tags: [Пользователи]
 */
app.get('/api/auth/me', authMiddleware, async (req, res) => {
    const userId = req.user.sub;
    const user = users.find(u => u.id === userId);

    if (!user) {
        return res.status(400).json({ error: "Пользователь не найден" });
    }

    res.json({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
    });
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

app.post('/api/auth/logout', (req, res) => {
    const { refreshToken } = req.body;
    
    if (refreshToken && refreshTokens.has(refreshToken)) {
        refreshTokens.delete(refreshToken);
    }
    
    res.json({ message: "Выход выполнен успешно" });
});

app.get('/api/users', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
    const usersList = users.map(user => ({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        isBlocked: user.isBlocked || false
    }));
    res.json(usersList);
});

app.get('/api/users/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
    const user = users.find(u => u.id === req.params.id);
    if (!user) {
        return res.status(404).json({ error: "Пользователь не найден" });
    }
    res.json({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        isBlocked: user.isBlocked || false
    });
});

app.put('/api/users/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
    const user = users.find(u => u.id === req.params.id);
    if (!user) {
        return res.status(404).json({ error: "Пользователь не найден" });
    }
    
    const { first_name, last_name, role, isBlocked } = req.body;
    
    if (first_name !== undefined) user.first_name = first_name;
    if (last_name !== undefined) user.last_name = last_name;
    if (role !== undefined && ['user', 'seller', 'admin'].includes(role)) {
        user.role = role;
    }
    if (isBlocked !== undefined) user.isBlocked = isBlocked;
    
    res.json({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        isBlocked: user.isBlocked || false
    });
});

app.delete('/api/users/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
    const userIndex = users.findIndex(u => u.id === req.params.id);
    if (userIndex === -1) {
        return res.status(404).json({ error: "Пользователь не найден" });
    }
    
    users[userIndex].isBlocked = true;
    users[userIndex].role = 'blocked';
    
    res.json({ message: "Пользователь заблокирован" });
});

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Создать новый товар
 *     tags: [Товары]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *             properties:
 *               title:
 *                 type: string
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Товар создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 */
app.post('/api/products', authMiddleware, roleMiddleware(['seller', 'admin']), async (req, res) => {
    const { title, price, category, description, imageUrl, stock } = req.body;
    const newProduct = {
        id: nanoid(),
        title,
        price: Number(price),
        category: category || 'Другое',
        description: description || '',
        imageUrl: imageUrl || '/images/default.jpg',
        stock: stock || 0
    };
    
    products.push(newProduct);
    res.status(201).json(newProduct);
});

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Получить список всех товаров
 *     tags: [Товары]
 *     responses:
 *       200:
 *         description: Список товаров
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
app.get('/api/products', authMiddleware, async (req, res) => {
    const user = users.find(u => u.id === req.user.sub);
    if (user && user.isBlocked) {
        return res.status(403).json({ error: "Пользователь заблокирован" });
    }
    res.json(products);
});

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Получить товар по ID
 *     tags: [Товары]
 *     parameters:
 *       - in: path
 *         title: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID товара
 *     responses:
 *       200:
 *         description: Товар найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Товар не найден
 */
app.get('/api/products/:id', authMiddleware, async (req, res) => {
    const user = users.find(u => u.id === req.user.sub);
    if (user && user.isBlocked) {
        return res.status(403).json({ error: "Пользователь заблокирован" });
    }
    
    let product = products.find(p => p.id == req.params.id);
    if (!product) return res.status(404).json({ message: 'Товар не найден' });
    res.json(product);
});

/**
 * @swagger
 * /products/{id}:
 *   patch:
 *     summary: Обновить товар
 *     tags: [Товары]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Товар обновлен
 *       404:
 *         description: Товар не найден
 */
app.put('/api/products/:id', authMiddleware, roleMiddleware(['seller', 'admin']), async (req, res) => {
    const product = products.find(p => p.id == req.params.id);
    if (!product) return res.status(404).json({ message: 'Товар не найден' });

    const { title, price, category, description, imageUrl, stock } = req.body;

    if (title !== undefined) product.title = title;
    if (price !== undefined) product.price = Number(price);
    if (category !== undefined) product.category = category;
    if (description !== undefined) product.description = description;
    if (imageUrl !== undefined) product.imageUrl = imageUrl;
    if (stock !== undefined) product.stock = stock;

    res.json(product);
});

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Удалить товар
 *     tags: [Товары]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Товар удален
 *       404:
 *         description: Товар не найден
 */

app.delete('/api/products/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
    const exists = products.some(p => p.id == req.params.id);
    if (!exists) return res.status(404).json({ message: 'Товар не найден' });
    
    products = products.filter(p => p.id != req.params.id);
    res.status(204).send();
});

const adminEmail = "admin@test.com";
const existingAdmin = users.find(u => u.email === adminEmail);
if (!existingAdmin) {
    const bcrypt = require('bcrypt');
    const hashedPassword = bcrypt.hashSync("admin123", 10);
    users.push({
        id: nanoid(),
        email: "admin@test.com",
        first_name: "Admin",
        last_name: "Adminov",
        hashedPassword: hashedPassword,
        role: "admin",
        isBlocked: false
    });
}

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});