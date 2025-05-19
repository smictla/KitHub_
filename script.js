document.addEventListener('DOMContentLoaded', () => {
    const contenidoPrincipal = document.querySelector('.contenido'); // Selector más general para delegación
    const cartIcon = document.getElementById('cart-icon');
    const cartDropdown = document.getElementById('cart-dropdown');
    const cartItemsList = document.getElementById('cart-items');
    const cartTotalPriceEl = document.getElementById('cart-total-price');
    const cartCounterEl = document.getElementById('cart-counter');
    const clearCartButton = document.getElementById('clear-cart-btn');

    let cart = []; 

    loadCartFromLocalStorage();

    if (contenidoPrincipal) {
        contenidoPrincipal.addEventListener('click', (event) => {
            // Manejo de "Añadir al carrito" para productos y paquetes
            if (event.target.classList.contains('add-to-cart-btn')) {
                const itemElement = event.target.closest('.producto'); // .paquete también tiene .producto
                if (itemElement && itemElement.dataset.name && itemElement.dataset.price) {
                    const name = itemElement.dataset.name;
                    const price = parseFloat(itemElement.dataset.price);
                    addToCart(name, price);
                }
            }

            // Manejo de desplegar/colapsar contenido del paquete
            const paqueteHeader = event.target.closest('.paquete-header');
            if (paqueteHeader) {
                const paqueteDiv = paqueteHeader.closest('.paquete');
                if (paqueteDiv) {
                    paqueteDiv.classList.toggle('abierto');
                }
            }
        });
    }
    
    if (cartIcon) {
        cartIcon.addEventListener('click', toggleCartDropdown);
    }
    if (clearCartButton) {
        clearCartButton.addEventListener('click', clearCart);
    }

    if (cartItemsList) {
        cartItemsList.addEventListener('click', (event) => {
            const target = event.target;
            const cartItemElement = target.closest('.cart-item');
            
            if (!cartItemElement) return;
            
            const itemName = cartItemElement.dataset.name;

            if (!itemName) return;

            let actionTaken = false; 

            if (target.classList.contains('increase-quantity')) {
                increaseQuantity(itemName);
                actionTaken = true;
            } else if (target.classList.contains('decrease-quantity')) {
                decreaseQuantity(itemName);
                actionTaken = true;
            } else if (target.classList.contains('remove-item-btn')) {
                removeItemFromCart(itemName);
                actionTaken = true;
            }

            if (actionTaken) {
                event.stopPropagation(); 
            }
        });
    }

    window.addEventListener('click', (event) => {
        if (cartDropdown && cartIcon && !cartIcon.contains(event.target) && !cartDropdown.contains(event.target) && cartDropdown.classList.contains('show')) {
            cartDropdown.classList.remove('show');
        }
    });

    function addToCart(name, price) {
        const existingProductIndex = cart.findIndex(item => item.name === name);
        if (existingProductIndex > -1) {
            cart[existingProductIndex].quantity += 1;
        } else {
            cart.push({ name, price, quantity: 1 });
        }
        updateCartDisplay();
        saveCartToLocalStorage();
    }

    function increaseQuantity(name) {
        const productIndex = cart.findIndex(item => item.name === name);
        if (productIndex > -1) {
            cart[productIndex].quantity += 1;
            updateCartDisplay();
            saveCartToLocalStorage();
        }
    }

    function decreaseQuantity(name) {
        const productIndex = cart.findIndex(item => item.name === name);
        if (productIndex > -1) {
            cart[productIndex].quantity -= 1;
            if (cart[productIndex].quantity <= 0) {
                cart.splice(productIndex, 1);
            }
            updateCartDisplay();
            saveCartToLocalStorage();
        }
    }

    function removeItemFromCart(name) {
        cart = cart.filter(item => item.name !== name);
        updateCartDisplay();
        saveCartToLocalStorage();
    }

    function updateCartDisplay() {
        if (!cartItemsList || !cartTotalPriceEl || !cartCounterEl) return;

        cartItemsList.innerHTML = ''; 

        if (cart.length === 0) {
            const emptyMsgLi = document.createElement('li');
            emptyMsgLi.classList.add('cart-empty-msg');
            emptyMsgLi.textContent = 'Tu carrito está vacío.';
            cartItemsList.appendChild(emptyMsgLi);
        } else {
            cart.forEach(item => {
                const li = document.createElement('li');
                li.classList.add('cart-item');
                li.dataset.name = item.name;

                li.innerHTML = `
                    <div class="item-info">
                        <span class="item-name">${item.name}</span>
                        <span class="item-unit-price">$${item.price.toFixed(2)} c/u</span>
                    </div>
                    <div class="quantity-controls">
                        <button class="decrease-quantity" aria-label="Disminuir cantidad">-</button>
                        <span class="item-quantity">${item.quantity}</span>
                        <button class="increase-quantity" aria-label="Aumentar cantidad">+</button>
                    </div>
                    <span class="item-subtotal">$${(item.price * item.quantity).toFixed(2)}</span>
                    <button class="remove-item-btn" aria-label="Eliminar producto">×</button>
                `;
                cartItemsList.appendChild(li);
            });
        }

        const totalPrice = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        cartTotalPriceEl.textContent = totalPrice.toFixed(2);

        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        cartCounterEl.textContent = totalItems;
        
        cartCounterEl.classList.add('updated');
        setTimeout(() => cartCounterEl.classList.remove('updated'), 300);
    }
    
    function toggleCartDropdown() {
        if (cartDropdown) {
            cartDropdown.classList.toggle('show');
        }
    }

    function clearCart() {
        cart = [];
        updateCartDisplay();
        saveCartToLocalStorage();
    }

    function saveCartToLocalStorage() {
        localStorage.setItem('kitHubCart', JSON.stringify(cart));
    }

    function loadCartFromLocalStorage() {
        const savedCart = localStorage.getItem('kitHubCart');
        if (savedCart) {
            cart = JSON.parse(savedCart);
        }
        updateCartDisplay();
    }

    // Animación de entrada para productos y paquetes
    const elementosAnimados = document.querySelectorAll('.producto'); // .paquete también tiene .producto
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1 
    };

    const observer = new IntersectionObserver((entries, observerRef) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    elementosAnimados.forEach(elemento => {
        observer.observe(elemento);
    });

    // Estilo para animación del contador del carrito (inyectado)
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = `
    #cart-counter.updated {
        animation: bounce 0.3s ease;
    }
    @keyframes bounce {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.3); }
    }`;
    document.head.appendChild(styleSheet);
});