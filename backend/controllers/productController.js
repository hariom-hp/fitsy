const Product = require('../models/Product');
const mongoose = require('mongoose');

const isDbReady = () => mongoose.connection.readyState === 1;

// Default initial catalog preserving all original clothes + new luxury editions
let memoryProducts = [
  // Outerwear
  {
    _id: 'prod_001',
    id: 1,
    name: 'Contour Denim Trucker Jacket',
    price: 92,
    rating: 4.7,
    category: 'Outerwear',
    vtoType: 'upper-body',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    inventory: 45,
    description: 'Structured utility fit crafted from premium raw denim with custom copper hardware.',
    badge: 'Best Seller',
    accent: 'Structured utility fit',
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=900',
  },
  {
    _id: 'prod_002',
    id: 2,
    name: 'Minimal Charcoal Wool Coat',
    price: 186,
    rating: 4.9,
    category: 'Outerwear',
    vtoType: 'upper-body',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    inventory: 25,
    description: 'Cold-weather staple drape crafted from ultra-soft virgin wool with hand-finished lapels.',
    badge: 'Premium',
    accent: 'Cold-weather staple drape',
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=900',
  },
  {
    _id: 'prod_003',
    id: 3,
    name: 'Contour Blazer',
    price: 134,
    rating: 4.7,
    category: 'Outerwear',
    vtoType: 'upper-body',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    inventory: 30,
    description: 'Tailored fit blazer with structured shoulders and horn buttons.',
    badge: 'Office Edit',
    accent: 'Tailored fit',
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=900',
  },
  {
    _id: 'prod_004',
    id: 4,
    name: 'Utility Cargo Jacket',
    price: 118,
    rating: 4.5,
    category: 'Outerwear',
    vtoType: 'upper-body',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    inventory: 50,
    description: 'Structured pockets with breathable tech-cotton blend.',
    badge: 'Street Line',
    accent: 'Structured pockets',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=900',
  },
  {
    _id: 'prod_005',
    id: 5,
    name: 'Oversized Wool Coat',
    price: 345,
    rating: 4.8,
    category: 'Outerwear',
    vtoType: 'upper-body',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    inventory: 40,
    description: 'Structured oversized drape in double-faced Italian wool.',
    badge: 'New Season',
    accent: 'Structured drape',
    image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=900',
  },
  {
    _id: 'prod_020',
    id: 20,
    name: 'Silk Trench',
    price: 1250,
    rating: 5.0,
    category: 'Outerwear',
    vtoType: 'upper-body',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    inventory: 15,
    description: 'Champagne tailored fit double-breasted coat woven from 100% pure mulberry silk.',
    badge: 'Haute Atelier',
    accent: 'Champagne tailored fit',
    image: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&q=80&w=900',
  },
  {
    _id: 'prod_022',
    id: 22,
    name: 'Midnight Tailored Blazer',
    price: 450,
    rating: 4.9,
    category: 'Outerwear',
    vtoType: 'upper-body',
    sizes: ['38R', '40R', '42R', '44R'],
    inventory: 25,
    description: 'Midnight Blue sartorial blazer with hand-stitched peak lapels and satin lining.',
    badge: 'Editorial',
    accent: 'Sartorial Peak Lapels',
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=900',
  },

  // Tops
  {
    _id: 'prod_006',
    id: 6,
    name: 'Classic Minimal White T-Shirt',
    price: 45,
    rating: 4.9,
    category: 'Tops',
    vtoType: 'upper-body',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    inventory: 150,
    description: 'Premium 100% heavyweight combed cotton crewneck with reinforced stitching.',
    badge: 'Best Seller',
    accent: 'Premium 100% cotton crewneck',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=900',
  },
  {
    _id: 'prod_007',
    id: 7,
    name: 'Studio Linen Button Shirt',
    price: 68,
    rating: 4.8,
    category: 'Tops',
    vtoType: 'upper-body',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    inventory: 80,
    description: 'Soft organic summer layer woven from breathable French flax.',
    badge: 'New In',
    accent: 'Soft organic summer layer',
    image: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&q=80&w=900',
  },
  {
    _id: 'prod_008',
    id: 8,
    name: 'Ribbed Knit Set',
    price: 74,
    rating: 4.5,
    category: 'Tops',
    vtoType: 'upper-body',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    inventory: 60,
    description: 'Textured comfort ribbed knit crafted with micro-modal yarn.',
    badge: 'Weekend',
    accent: 'Textured comfort',
    image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&q=80&w=900',
  },
  {
    _id: 'prod_009',
    id: 9,
    name: 'Weekend Zip Hoodie',
    price: 59,
    rating: 4.4,
    category: 'Tops',
    vtoType: 'upper-body',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    inventory: 110,
    description: 'Laid-back brushed fleece hoodie with double-lined hood.',
    badge: 'Casual',
    accent: 'Laid-back fleece',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=900',
  },
  {
    _id: 'prod_010',
    id: 10,
    name: 'Pleated Evening Top',
    price: 71,
    rating: 4.2,
    category: 'Tops',
    vtoType: 'upper-body',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    inventory: 35,
    description: 'Sculpted metallic sheen top designed for nighttime events.',
    badge: 'Night Edit',
    accent: 'Sculpted shine',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=900',
  },
  {
    _id: 'prod_011',
    id: 11,
    name: 'Cashmere Ribbed Knit Sweater',
    price: 185,
    rating: 4.7,
    category: 'Tops',
    vtoType: 'upper-body',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    inventory: 40,
    description: 'Cloud-like grade-A Mongolian cashmere with ribbed cuffs.',
    badge: 'Staff Pick',
    accent: 'Cloud-like feel',
    image: 'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&q=80&w=900',
  },
  {
    _id: 'prod_012',
    id: 12,
    name: 'Silk Button-Down',
    price: 110,
    rating: 4.6,
    category: 'Tops',
    vtoType: 'upper-body',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    inventory: 70,
    description: 'Pure 19mm mulberry silk finish with subtle sheen.',
    badge: 'Premium',
    accent: 'Pure silk finish',
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=900',
  },

  // Bottoms
  {
    _id: 'prod_013',
    id: 13,
    name: 'Classic Indigo Denim Jeans',
    price: 110,
    rating: 4.8,
    category: 'Bottoms',
    vtoType: 'lower-body',
    sizes: ['24', '26', '28', '30', '32'],
    inventory: 120,
    description: 'Vintage straight fit denim engineered from Japanese selvedge.',
    badge: 'Essential',
    accent: 'Vintage straight fit',
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=900',
  },
  {
    _id: 'prod_014',
    id: 14,
    name: 'Wide-Leg Tailored Trousers',
    price: 145,
    rating: 4.6,
    category: 'Bottoms',
    vtoType: 'lower-body',
    sizes: ['24', '26', '28', '30', '32'],
    inventory: 80,
    description: 'Sharp tailoring with front pleats and fluid draping fabric.',
    badge: 'Essential',
    accent: 'Sharp tailoring',
    image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&q=80&w=900',
  },
  {
    _id: 'prod_015',
    id: 15,
    name: 'Pleated Linen Shorts',
    price: 58,
    rating: 4.3,
    category: 'Bottoms',
    vtoType: 'lower-body',
    sizes: ['24', '26', '28', '30', '32'],
    inventory: 65,
    description: 'Lightweight summer drape linen shorts with elasticated back waist.',
    badge: 'New In',
    accent: 'Lightweight summer drape',
    image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&q=80&w=900',
  },
  {
    _id: 'prod_016',
    id: 16,
    name: 'Tailored A-Line Skirt',
    price: 78,
    rating: 4.4,
    category: 'Bottoms',
    vtoType: 'lower-body',
    sizes: ['24', '26', '28', '30', '32'],
    inventory: 50,
    description: 'Structured silhouette wool-blend skirt with invisible side zipper.',
    badge: 'Classic',
    accent: 'Structured silhouette',
    image: 'https://images.unsplash.com/photo-1583496661160-fb48862c4a4e?auto=format&fit=crop&q=80&w=900',
  },

  // Dresses
  {
    _id: 'prod_017',
    id: 17,
    name: 'Emerald Silk Bias-Cut Midi Dress',
    price: 145,
    rating: 4.9,
    category: 'Dresses',
    vtoType: 'upper-body',
    sizes: ['XS', 'S', 'M', 'L'],
    inventory: 30,
    description: 'Fluid luxury drape silk dress contoured on the bias for a sculptural silhouette.',
    badge: 'Evening Edit',
    accent: 'Fluid luxury drape',
    image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=900',
  },
  {
    _id: 'prod_018',
    id: 18,
    name: 'Soft Motion Dress',
    price: 81,
    rating: 4.3,
    category: 'Dresses',
    vtoType: 'upper-body',
    sizes: ['XS', 'S', 'M', 'L'],
    inventory: 30,
    description: 'Fluid silhouette modal-jersey day dress with subtle waist cinching.',
    badge: 'Summer Edit',
    accent: 'Fluid silhouette',
    image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&q=80&w=900',
  },

  // Accessories
  {
    _id: 'prod_019',
    id: 19,
    name: 'Obsidian Tote',
    price: 895,
    rating: 4.9,
    category: 'Accessories',
    vtoType: 'accessories',
    sizes: ['One Size'],
    inventory: 20,
    description: 'Structured calfskin leather tote with palladium hardware and suede interior.',
    badge: 'Signature',
    accent: 'Structured calfskin leather',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=900',
  },
  {
    _id: 'prod_021',
    id: 21,
    name: 'Aero Shades',
    price: 340,
    rating: 4.8,
    category: 'Accessories',
    vtoType: 'accessories',
    sizes: ['One Size'],
    inventory: 40,
    description: 'Japanese aerospace-grade titanium frame with polarized UV400 lenses.',
    badge: 'Limited Run',
    accent: 'Titanium frame, polarized',
    image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=900',
  },
  {
    _id: 'prod_023',
    id: 23,
    name: 'Aero Leather Sneakers',
    price: 220,
    rating: 4.8,
    category: 'Accessories',
    vtoType: 'accessories',
    sizes: ['8', '9', '10', '11', '12'],
    inventory: 50,
    description: 'Pure White Italian nappa leather low-top sneakers with cushioned ergonomic footbed.',
    badge: 'Iconic',
    accent: 'Italian Nappa Leather',
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=900',
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