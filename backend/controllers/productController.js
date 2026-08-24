const Product = require('../models/Product');
const mongoose = require('mongoose');

const isDbReady = () => mongoose.connection.readyState === 1;

// Default initial catalog
let memoryProducts = [
  {
    _id: 'prod_mem_001',
    name: 'Contour Denim Jacket',
    price: 92,
    rating: 4.6,
    category: 'Outerwear',
    vtoType: 'upper-body',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    inventory: 45,
    description: 'Contour Denim Jacket brings relaxed utility fit styling with try-on compatibility.',
    badge: 'Best Seller',
    accent: 'Relaxed utility fit',
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=900',
  },
  {
    _id: 'prod_mem_002',
    name: 'Contour Blazer',
    price: 134,
    rating: 4.7,
    category: 'Outerwear',
    vtoType: 'upper-body',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    inventory: 30,
    description: 'Contour Blazer brings tailored fit styling with a polished presentation.',
    badge: 'Office Edit',
    accent: 'Tailored fit',
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=900',
  },
  {
    _id: 'prod_mem_003',
    name: 'Minimal Wool Coat',
    price: 186,
    rating: 4.8,
    category: 'Outerwear',
    vtoType: 'upper-body',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    inventory: 25,
    description: 'Minimal Wool Coat brings cold-weather staple styling and try-on compatibility.',
    badge: 'Premium',
    accent: 'Cold-weather staple',
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=900',
  },
  {
    _id: 'prod_mem_004',
    name: 'Studio Linen Shirt',
    price: 68,
    rating: 4.4,
    category: 'Tops',
    vtoType: 'upper-body',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    inventory: 80,
    description: 'Studio Linen Shirt brings soft summer layer styling.',
    badge: 'New In',
    accent: 'Soft summer layer',
    image: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&q=80&w=900',
  },
  {
    _id: 'prod_mem_005',
    name: 'Classic Straight Denim',
    price: 120,
    rating: 4.8,
    category: 'Bottoms',
    vtoType: 'lower-body',
    sizes: ['24', '26', '28', '30', '32'],
    inventory: 120,
    description: 'Classic Straight Denim brings vintage wash styling.',
    badge: 'Core Collection',
    accent: 'Vintage wash',
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=900',
  },
  {
    _id: 'prod_mem_006',
    name: 'Silk Bias-Cut Midi Dress',
    price: 210,
    rating: 4.9,
    category: 'Dresses',
    vtoType: 'upper-body',
    sizes: ['XS', 'S', 'M', 'L'],
    inventory: 30,
    description: 'Silk Bias-Cut Midi Dress brings fluid movement styling.',
    badge: 'Best Seller',
    accent: 'Fluid movement',
    image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=900',
  },
];

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  if (isDbReady()) {
    try {
      const products = await Product.find({});
      if (products && products.length > 0) {
        return res.json({ products, total: products.length });
      }
    } catch (error) {
      console.warn('[DB Error during getProducts, using memory store]:', error.message);
    }
  }

  return res.json({ products: memoryProducts, total: memoryProducts.length });
};

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  const targetId = String(req.params.id);

  if (isDbReady()) {
    try {
      const product = await Product.findById(targetId);
      if (product) {
        return res.json({ product });
      }
    } catch {
      // Check memory store
    }
  }

  const memProduct = memoryProducts.find(
    (p) => String(p._id) === targetId || String(p.id) === targetId
  );
  if (memProduct) {
    return res.json({ product: memProduct });
  }

  return res.status(404).json({ message: 'Product not found' });
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  const productData = {
    name: req.body.name || 'New Product',
    price: Number(req.body.price) || 0,
    category: req.body.category || 'Outerwear',
    vtoType: req.body.vtoType || 'upper-body',
    inventory: Number(req.body.inventory) || 50,
    sizes: req.body.sizes || ['XS', 'S', 'M', 'L', 'XL'],
    description: req.body.description || 'Premium designer garment with virtual try-on compatibility.',
    badge: req.body.badge || 'New Arrival',
    accent: req.body.accent || '',
    image:
      req.body.image ||
      'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=900',
    rating: 4.8,
  };

  if (isDbReady()) {
    try {
      const product = new Product(productData);
      const createdProduct = await product.save();
      return res.status(201).json(createdProduct);
    } catch (error) {
      console.warn('[DB Error during createProduct, using memory store]:', error.message);
    }
  }

  const newMemProd = {
    ...productData,
    _id: `prod_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  memoryProducts.unshift(newMemProd);
  return res.status(201).json(newMemProd);
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  const targetId = String(req.params.id);

  if (isDbReady()) {
    try {
      const product = await Product.findById(targetId);
      if (product) {
        Object.assign(product, req.body);
        const updatedProduct = await product.save();
        return res.json(updatedProduct);
      }
    } catch (error) {
      console.warn('[DB Error during updateProduct, using memory store]:', error.message);
    }
  }

  const memIdx = memoryProducts.findIndex(
    (p) => String(p._id) === targetId || String(p.id) === targetId
  );
  if (memIdx !== -1) {
    memoryProducts[memIdx] = { ...memoryProducts[memIdx], ...req.body };
    return res.json(memoryProducts[memIdx]);
  }

  return res.status(404).json({ message: 'Product not found' });
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  const targetId = String(req.params.id);

  if (isDbReady()) {
    try {
      const product = await Product.findById(targetId);
      if (product) {
        await Product.deleteOne({ _id: product._id });
        return res.json({ message: 'Product removed successfully', id: targetId });
      }
    } catch (error) {
      console.warn('[DB Error during deleteProduct, using memory store]:', error.message);
    }
  }

  const beforeLen = memoryProducts.length;
  memoryProducts = memoryProducts.filter(
    (p) => String(p._id) !== targetId && String(p.id) !== targetId
  );

  if (memoryProducts.length < beforeLen) {
    return res.json({ message: 'Product removed successfully', id: targetId });
  }

  return res.json({ message: 'Product removed successfully', id: targetId });
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};