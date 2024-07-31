// Listen for the Alpine.js initialization event
document.addEventListener("alpine:init", () => {
    // Define a new Alpine.js component named 'pizzaCart'
    Alpine.data('pizzaCart', () => {
        return {
            // Component state variables
            title: 'Pizzas', // Title of the pizza section
            pizzas: [], // List of available pizzas
            username: localStorage.getItem('username') || '', // Username from local storage
            cartId: localStorage.getItem('cartId') || '', // Cart ID from local storage
            cartPizzas: [], // List of pizzas in the cart
            cartTotal: 0.00, // Total cost of the cart
            paymentAmount: 0, // Amount entered for payment
            message: '', // Message for user feedback
            orderHistory: JSON.parse(localStorage.getItem('orderHistory')) || [], // Order history from local storage
            showOrderHistory: false, // Flag to show or hide order history
            featuredPizzas: [], // List of featured pizzas

            // Toggles the visibility of the order history
            toggle() {
                this.showOrderHistory = !this.showOrderHistory;
                if (this.showOrderHistory) {
                    this.history(); // Fetch order history if showing
                }
            },

            // Fetches featured pizzas from the API
            getFeaturedPizzas() {
                const featuredPizzasURL = `https://pizza-api.projectcodex.net/api/pizzas/featured?username=${this.username}`;
                axios.get(featuredPizzasURL)
                    .then(response => {
                        this.featuredPizzas = response.data.pizzas || [];
                        console.log(response.data.pizzas);
                    })
                    .catch(error => {
                        console.error('Error fetching featured pizzas:', error);
                        this.message = 'Failed to fetch featured pizzas. Please try again later.';
                    });
            },

            // Sets a pizza as featured via the API
            setFeaturedPizza(pizzaId) {
                return axios.post('https://pizza-api.projectcodex.net/api/pizzas/featured', {
                    username: this.username,
                    pizza_id: pizzaId,
                }).then(() => {
                    this.getFeaturedPizzas();
                }).catch(error => console.error('Error setting featured pizza:', error));
            },

            // Saves the current cart state to local storage as order history
            saveCartHistory() {
                const history = JSON.parse(localStorage.getItem('orderHistory')) || [];
                const currentCart = {
                    id: this.cartId,
                    pizzas: this.cartPizzas,
                    total: this.cartTotal,
                    date: new Date().toISOString(),
                    status: 'paid',
                    username: this.username
                };
                history.push(currentCart);
                localStorage.setItem('orderHistory', JSON.stringify(history));
                this.orderHistory = history;
            },

            // Loads order history from local storage
            history() {
                const history = JSON.parse(localStorage.getItem('orderHistory')) || [];
                this.orderHistory = history;
            },

            // Handles user login
            login() {
                if (this.username.length > 2) {
                    localStorage.setItem('username', this.username);
                    this.createCart();
                } else {
                    alert("Username is too short");
                }
            },

            // Handles user logout
            logout() {
                if (confirm('Do you want to logout?')) {
                    this.username = '';
                    this.cartId = '';
                    localStorage.removeItem('cartId');
                    localStorage.removeItem('username');
                }
            },

            // Creates a new cart for the user via the API
            createCart() {
                if (!this.username) {
                    console.error('No username to create cart for');
                    return;
                }

                const cartId = localStorage.getItem('cartId');

                if (cartId) {
                    this.cartId = cartId;
                    return Promise.resolve();
                } else {
                    const createCartURL = `https://pizza-api.projectcodex.net/api/pizza-cart/create?username=${this.username}`;
                    return axios.get(createCartURL)
                        .then(result => {
                            this.cartId = result.data.cart_code;
                            localStorage.setItem('cartId', this.cartId);
                            this.showCartData();
                        })
                        .catch(error => console.error('Error creating cart:', error));
                }
            },

            // Fetches the current cart data from the API
            getCart() {
                const getCartURL = `https://pizza-api.projectcodex.net/api/pizza-cart/${this.cartId}/get`;
                return axios.get(getCartURL)
                    .catch(error => console.error('Error fetching cart:', error));
            },

            // Adds a pizza to the cart via the API
            addPizzaToCart(pizzaId) {
                axios.post('https://pizza-api.projectcodex.net/api/pizza-cart/add', {
                    "cart_code": this.cartId,
                    "pizza_id": pizzaId
                }).then(() => {
                    this.showCartData();
                }).catch(error => console.error('Error adding pizza to cart:', error));
            },

            // Removes a pizza from the cart via the API
            removePizzaFromCart(pizzaId) {
                axios.post('https://pizza-api.projectcodex.net/api/pizza-cart/remove', {
                    "cart_code": this.cartId,
                    "pizza_id": pizzaId
                }).then(() => {
                    this.showCartData();
                }).catch(error => console.error('Error removing pizza from cart:', error));
            },

            // Handles the payment process for the cart
            payForCart() {
                this.pay(this.paymentAmount).then(result => {
                    if (result.data.status === 'failure') {
                        this.message = result.data.message;
                    } else {
                        const change = this.paymentAmount - this.cartTotal;
                        this.message = `Payment successful! Your change is R${change.toFixed(2)}. Thank you for your continued support.`;

                        this.saveCartHistory();
                        this.showCartData();
                        setTimeout(() => {
                            this.resetCart();
                        }, 3000);
                    }
                }).catch(error => console.error('Error paying for cart:', error));
            },

            // Makes a payment API call
            pay(amount) {
                return axios.post('https://pizza-api.projectcodex.net/api/pizza-cart/pay', {
                    "cart_code": this.cartId,
                    "amount": parseFloat(amount).toFixed(2)
                }).catch(error => console.error('Error processing payment:', error));
            },

            // Displays the current cart data
            showCartData() {
                this.getCart().then(result => {
                    const cartData = result.data;
                    this.cartPizzas = cartData.pizzas.map(pizza => ({
                        ...pizza,
                        price: parseFloat(pizza.price).toFixed(2),
                        total: (parseFloat(pizza.price) * pizza.qty).toFixed(2)
                    }));
                    this.cartTotal = parseFloat(cartData.total).toFixed(2);
                }).catch(error => console.error('Error displaying cart data:', error));
            },

            // Resets the cart state
            resetCart() {
                this.cartPizzas = [];
                this.cartTotal = 0.00;
                this.cartId = '';
                localStorage.removeItem('cartId');
                this.createCart();
                this.paymentAmount = 0.00;
                this.message = '';
            },

            // Initializes the component state
            init() {
                if (this.cartId) {
                    this.showCartData();
                }
                axios.get('https://pizza-api.projectcodex.net/api/pizzas')
                    .then(result => {
                        console.log(result.data);
                        this.pizzas = result.data.pizzas.map(pizza => ({
                            ...pizza,
                            price: parseFloat(pizza.price).toFixed(2)
                        }));
                    })
                    .catch(error => console.error('Error fetching pizzas:', error));
            }
        };
    });
});
