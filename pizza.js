document.addEventListener("alpine:init", () => {
    Alpine.data('pizzaCart', () => {
        return {
            title: 'Pizza Cart API',
            username: '',
            cartId: '',
            cartPizzas: [],
            cartTotal: 0,
            paymentAmount: 0,
            message: '',
            featuredPizzas: [],

            login() {
                if (this.username.length > 2) {
                    localStorage['username'] = this.username;
                    this.createCart();
                } else {
                    alert("Username is too short");
                }
            },
            logout() {
                if (confirm('Do you want to logout?')) {
                    this.username = '';
                    this.cartId = '';
                    localStorage.removeItem('username');
                    localStorage.removeItem('cartId');
                }
            },
            createCart() {
                if (!this.username) {
                    this.cartId = 'No username to create a cart for';
                    return Promise.resolve();
                }
                const cartId = localStorage['cartId'];

                if (cartId) {
                    this.cartId = cartId;
                    return Promise.resolve();
                } else {
                    const createCartURL = `https://pizza-api.projectcodex.net/api/pizza-cart/create?username=${this.username}`;
                    return axios.get(createCartURL)
                        .then(result => {
                            this.cartId = result.data.cart_code;
                            localStorage['cartId'] = this.cartId;
                        });
                }
            },

            getCart() {
                const getCartURL = `https://pizza-api.projectcodex.net/api/pizza-cart/${this.cartId}/get`;
                return axios.get(getCartURL);
            },
            addPizza(pizzaId) {
                return axios.post('https://pizza-api.projectcodex.net/api/pizza-cart/add', {
                    "cart_code": this.cartId,
                    "pizza_id": pizzaId
                });
            },

            removePizza(pizzaId) {
                return axios.post('https://pizza-api.projectcodex.net/api/pizza-cart/remove', {
                    "cart_code": this.cartId,
                    "pizza_id": pizzaId
                });
            },

            pay(amount) {
                return axios.post('https://pizza-api.projectcodex.net/api/pizza-cart/pay', {
                    "cart_code": this.cartId,
                    amount
                });
            },
            showCartData() {
                this.getCart().then(result => {
                    const cartData = result.data;
                    this.cartPizzas = cartData.pizzas;
                    this.cartTotal = isNaN(cartData.total) ? 0.00 : parseFloat(cartData.total).toFixed(2);
                });
            },

            init() {
                const storedUsername = localStorage['username'];
                if (storedUsername) {
                    this.username = storedUsername;
                }

                axios
                    .get('https://pizza-api.projectcodex.net/api/pizzas')
                    .then(result => {
                        this.pizzas = result.data.pizzas;
                    });

                const storedCartId = localStorage['cartId'];
                if (storedCartId) {
                    this.cartId = storedCartId;
                    this.showCartData();
                } else if (this.username) {
                    this.createCart()
                        .then(() => {
                            this.showCartData();
                        });
                }

                this.getFeaturedPizzas();
            },
            addPizzaToCart(pizzaId) {
                this.addPizza(pizzaId)
                    .then(() => {
                        this.showCartData();
                    });
            },
            removePizzaFromCart(pizzaId) {
                this.removePizza(pizzaId)
                    .then(() => {
                        this.showCartData();
                    });
            },
            payForCart() {
                this.pay(this.paymentAmount)
                    .then(result => {
                        if (result.data.status === 'failure') {
                            this.message = result.data.message;
                            setTimeout(() => this.message = '', 3000);
                        } else {
                            let change = this.paymentAmount - this.cartTotal;
                            change = change > 0 ? change.toFixed(2) : 0;
                            this.message = `Thank you for your purchase!${change > 0 ? ' Your change is R' + change : ''}`;
                            setTimeout(() => {
                                this.message = '';
                                this.cartPizzas = [];
                                this.cartTotal = 0.00;
                                this.cartId = '';
                                this.paymentAmount = 0;
                                this.createCart();
                            }, 5000);
                        }
                    });
            },

            setFeaturedPizza(pizzaId) {
                const setFeaturedPizzaURL = `https://pizza-api.projectcodex.net/api/pizzas/featured`;
                axios.post(setFeaturedPizzaURL, {
                    "username": this.username,
                    "pizza_id": pizzaId
                }).then(() => {
                    this.getFeaturedPizzas();
                });
            },

            getFeaturedPizzas() {
                const getFeaturedPizzasURL = `https://pizza-api.projectcodex.net/api/pizzas/featured?username=${this.username}`;
                axios.get(getFeaturedPizzasURL).then(result => {
                    this.featuredPizzas = result.data.pizzas;
                });
            }
        }
    });
});
