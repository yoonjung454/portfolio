import sqlite3
from contextlib import closing
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

app = FastAPI()

DB_PATH = Path(__file__).parent / "cart.db"

INITIAL_PRODUCTS = [
    (1, "노트북", 1200000),
    (2, "키보드", 80000),
    (3, "마우스", 40000),
    (4, "헤드셋", 100000),
]


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with closing(get_db()) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                price INTEGER NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS cart (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER NOT NULL,
                quantity INTEGER NOT NULL DEFAULT 1,
                FOREIGN KEY (product_id) REFERENCES products (id)
            )
            """
        )

        count = conn.execute("SELECT COUNT(*) FROM products").fetchone()[0]
        if count == 0:
            conn.executemany(
                "INSERT INTO products (id, name, price) VALUES (?, ?, ?)",
                INITIAL_PRODUCTS,
            )
        conn.commit()


init_db()


class CartAddRequest(BaseModel):
    product_id: int


class CartUpdateRequest(BaseModel):
    quantity: int


CART_SELECT = """
    SELECT cart.id AS id, cart.product_id AS product_id,
           products.name AS name, products.price AS price,
           cart.quantity AS quantity
    FROM cart
    JOIN products ON cart.product_id = products.id
    ORDER BY cart.id
"""


@app.get("/products")
def read_products():
    with closing(get_db()) as conn:
        rows = conn.execute("SELECT * FROM products ORDER BY id").fetchall()
        return [dict(row) for row in rows]


@app.get("/cart")
def read_cart():
    with closing(get_db()) as conn:
        rows = conn.execute(CART_SELECT).fetchall()
        return [dict(row) for row in rows]


@app.post("/cart")
def add_to_cart(item: CartAddRequest):
    with closing(get_db()) as conn:
        product = conn.execute(
            "SELECT * FROM products WHERE id = ?", (item.product_id,)
        ).fetchone()
        if product is None:
            raise HTTPException(status_code=404, detail="상품을 찾을 수 없습니다.")

        existing = conn.execute(
            "SELECT * FROM cart WHERE product_id = ?", (item.product_id,)
        ).fetchone()

        if existing:
            conn.execute(
                "UPDATE cart SET quantity = quantity + 1 WHERE id = ?",
                (existing["id"],),
            )
        else:
            conn.execute(
                "INSERT INTO cart (product_id, quantity) VALUES (?, 1)",
                (product["id"],),
            )
        conn.commit()

        rows = conn.execute(CART_SELECT).fetchall()
        return [dict(row) for row in rows]


@app.patch("/cart/{cart_id}")
def update_cart_quantity(cart_id: int, item: CartUpdateRequest):
    if item.quantity < 1:
        raise HTTPException(status_code=400, detail="수량은 1 이상이어야 합니다.")

    with closing(get_db()) as conn:
        existing = conn.execute(
            "SELECT * FROM cart WHERE id = ?", (cart_id,)
        ).fetchone()
        if existing is None:
            raise HTTPException(status_code=404, detail="장바구니 항목을 찾을 수 없습니다.")

        conn.execute(
            "UPDATE cart SET quantity = ? WHERE id = ?", (item.quantity, cart_id)
        )
        conn.commit()

        rows = conn.execute(CART_SELECT).fetchall()
        return [dict(row) for row in rows]


@app.delete("/cart/{cart_id}")
def remove_from_cart(cart_id: int):
    with closing(get_db()) as conn:
        existing = conn.execute(
            "SELECT * FROM cart WHERE id = ?", (cart_id,)
        ).fetchone()
        if existing is None:
            raise HTTPException(status_code=404, detail="장바구니 항목을 찾을 수 없습니다.")

        conn.execute("DELETE FROM cart WHERE id = ?", (cart_id,))
        conn.commit()

        rows = conn.execute(CART_SELECT).fetchall()
        return [dict(row) for row in rows]


HTML_PAGE = """
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>미니 장바구니</title>
<style>
  body { font-family: sans-serif; max-width: 600px; margin: 40px auto; }
  .product, .cart-item {
    display: flex; justify-content: space-between; align-items: center;
    padding: 8px 0; border-bottom: 1px solid #ddd;
  }
  .cart-item-actions { display: flex; align-items: center; gap: 8px; }
  .qty-btn { width: 28px; height: 28px; }
  button { cursor: pointer; }
  button:disabled { cursor: not-allowed; opacity: 0.4; }
  #total { font-weight: bold; margin-top: 12px; font-size: 1.1em; }
</style>
</head>
<body>
  <h1>미니 장바구니</h1>

  <h2>상품 목록</h2>
  <div id="products"></div>

  <h2>장바구니</h2>
  <div id="cart"></div>
  <div id="total">총 상품 금액: 0원</div>

<script>
async function loadProducts() {
  const res = await fetch('/products');
  const products = await res.json();
  const container = document.getElementById('products');
  container.innerHTML = '';
  products.forEach(p => {
    const div = document.createElement('div');
    div.className = 'product';
    div.innerHTML = `<span>${p.name} - ${p.price.toLocaleString()}원</span>`;
    const btn = document.createElement('button');
    btn.textContent = '장바구니 담기';
    btn.onclick = () => addToCart(p.id);
    div.appendChild(btn);
    container.appendChild(div);
  });
}

async function loadCart() {
  const res = await fetch('/cart');
  const cart = await res.json();
  const container = document.getElementById('cart');
  container.innerHTML = '';
  let total = 0;
  cart.forEach(item => {
    total += item.price * item.quantity;
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `<span>${item.name} - ${item.price.toLocaleString()}원</span>`;

    const actions = document.createElement('div');
    actions.className = 'cart-item-actions';

    const minusBtn = document.createElement('button');
    minusBtn.className = 'qty-btn';
    minusBtn.textContent = '-';
    minusBtn.disabled = item.quantity <= 1;
    minusBtn.onclick = () => updateQuantity(item.id, item.quantity - 1);
    actions.appendChild(minusBtn);

    const qtySpan = document.createElement('span');
    qtySpan.textContent = item.quantity;
    actions.appendChild(qtySpan);

    const plusBtn = document.createElement('button');
    plusBtn.className = 'qty-btn';
    plusBtn.textContent = '+';
    plusBtn.onclick = () => updateQuantity(item.id, item.quantity + 1);
    actions.appendChild(plusBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '삭제';
    deleteBtn.onclick = () => removeFromCart(item.id);
    actions.appendChild(deleteBtn);

    div.appendChild(actions);
    container.appendChild(div);
  });
  document.getElementById('total').textContent = `총 상품 금액: ${total}원`;
}

async function addToCart(productId) {
  await fetch('/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product_id: productId })
  });
  loadCart();
}

async function updateQuantity(cartId, quantity) {
  if (quantity < 1) return;
  await fetch(`/cart/${cartId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity })
  });
  loadCart();
}

async function removeFromCart(cartId) {
  await fetch(`/cart/${cartId}`, { method: 'DELETE' });
  loadCart();
}

loadProducts();
loadCart();
</script>
</body>
</html>
"""


@app.get("/", response_class=HTMLResponse)
def read_root():
    return HTML_PAGE
