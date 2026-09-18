 // ==========================
// SUPABASE CONNECTION
// ==========================

const SUPABASE_URL = "https://sdycertdcrcxuygunlgf.supabase.co";

const SUPABASE_KEY = "sb_publishable_IwpL3sk7-mkC65RsO5IX0Q_yn7iMqSO";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);
// =========================
// BASIC ELEMENTS
// =========================

const cartDisplay = document.querySelector(".cart span");
const products = document.querySelectorAll(".product");

const cartButton = document.querySelector(".cart");
const cartPanel = document.getElementById("cartPanel");
const closeCart = document.getElementById("closeCart");
const cartOverlay = document.getElementById("cartOverlay");

const cartItemsContainer = document.getElementById("cartItems");
const cartTotalDisplay = document.getElementById("cartTotal");
const moreProductsContainer = document.getElementById("moreProducts");

const checkoutBtn = document.querySelector(".checkout-btn");
const checkoutPanel = document.getElementById("checkoutPanel");
const checkoutOverlay = document.getElementById("checkoutOverlay");
const closeCheckout = document.getElementById("closeCheckout");

const useCurrentLocationBtn =
    document.getElementById("useCurrentLocation");

const locationStatus =
    document.getElementById("locationStatus");

const customerAreaInput =
    document.getElementById("customerArea");

let cart = {};

let customerLatitude = null;
let customerLongitude = null;


// =========================
// SHOP LOCATION
// =========================

// Ye shop / pickup point ki permanent location hai.
// Baad mein isay asani se change kiya ja sakta hai.

const SHOP_LATITUDE = 33.142373;
const SHOP_LONGITUDE = 73.722759;


// =========================
// DELIVERY SETTINGS
// =========================

// 0 se 4 KM tak Rs. 250
const BASE_DISTANCE_KM = 4;
const BASE_DELIVERY_CHARGE = 250;

// 4 KM ke baad har extra KM ke Rs. 50
const EXTRA_CHARGE_PER_KM = 50;

let customerDistanceKm = null;
let calculatedDeliveryCharge = 0;


// =========================
// PRODUCT DATA
// =========================

function getProductData(product) {

    const name =
        product.querySelector("h3").textContent.trim();

    const unit =
        product.querySelector("p").textContent.trim();

    const priceText =
        product.querySelector("strong").textContent;

    const price =
        Number(priceText.replace(/[^\d]/g, ""));

    const image =
        product.querySelector("img").src;

    return {
        name,
        unit,
        price,
        image
    };
}


// =========================
// CART COUNT
// =========================

function updateCartCount() {

    let totalItems = 0;

    Object.values(cart).forEach((item) => {
        totalItems += item.quantity;
    });

    if (cartDisplay) {
        cartDisplay.textContent = totalItems;
    }
}


// =========================
// RENDER CART
// =========================

function renderCart() {

    if (!cartItemsContainer) {
        return;
    }

    cartItemsContainer.innerHTML = "";

    const cartProducts = Object.values(cart);

    if (cartProducts.length === 0) {

        cartItemsContainer.innerHTML = `
            <p class="empty-cart">
                Your cart is empty.
            </p>
        `;

        if (cartTotalDisplay) {
            cartTotalDisplay.textContent = "0";
        }

        updateCartCount();
        renderMoreProducts();

        return;
    }


    let totalPrice = 0;


    cartProducts.forEach((item) => {

        const itemTotal =
            item.price * item.quantity;

        totalPrice += itemTotal;


        const cartItem =
            document.createElement("div");

        cartItem.className = "cart-item";


        cartItem.innerHTML = `

            <img
                src="${item.image}"
                alt="${item.name}"
                class="cart-item-image"
            >

            <div class="cart-item-details">

                <div class="cart-item-top">

                    <div>
                        <h4>${item.name}</h4>
                        <p>${item.unit}</p>

                        <span>
                            Rs. ${item.price} each
                        </span>
                    </div>

                    <button
                        class="remove-cart-item"
                        data-name="${item.name}"
                    >
                        ×
                    </button>

                </div>


                <div class="cart-item-bottom">

                    <div class="cart-item-quantity">

                        <button
                            class="cart-minus"
                            data-name="${item.name}"
                        >
                            −
                        </button>

                        <span>
                            ${item.quantity}
                        </span>

                        <button
                            class="cart-plus"
                            data-name="${item.name}"
                        >
                            +
                        </button>

                    </div>

                    <strong>
                        Rs. ${itemTotal}
                    </strong>

                </div>

            </div>
        `;


        cartItemsContainer.appendChild(cartItem);
    });


    if (cartTotalDisplay) {
        cartTotalDisplay.textContent = totalPrice;
    }

    updateCartCount();
    setupCartButtons();
    renderMoreProducts();
}


// =========================
// CART BUTTONS
// =========================

function setupCartButtons() {

    document
        .querySelectorAll(".cart-plus")
        .forEach((button) => {

            button.addEventListener("click", () => {

                const name =
                    button.dataset.name;

                if (!cart[name]) {
                    return;
                }

                cart[name].quantity++;

                updateMainProductQuantity(name);

                renderCart();
            });
        });


    document
        .querySelectorAll(".cart-minus")
        .forEach((button) => {

            button.addEventListener("click", () => {

                const name =
                    button.dataset.name;

                if (!cart[name]) {
                    return;
                }

                if (cart[name].quantity > 1) {

                    cart[name].quantity--;

                    updateMainProductQuantity(name);

                } else {

                    delete cart[name];

                    resetProductButton(name);
                }

                renderCart();
            });
        });


    document
        .querySelectorAll(".remove-cart-item")
        .forEach((button) => {

            button.addEventListener("click", () => {

                const name =
                    button.dataset.name;

                delete cart[name];

                resetProductButton(name);

                renderCart();
            });
        });
}


// =========================
// MAIN PRODUCT QTY UPDATE
// =========================

function updateMainProductQuantity(productName) {

    products.forEach((product) => {

        const name =
            product.querySelector("h3")
                .textContent
                .trim();

        if (name === productName) {

            const qtyText =
                product.querySelector(".qty");

            if (qtyText && cart[name]) {

                qtyText.textContent =
                    cart[name].quantity;
            }
        }
    });
}


// =========================
// RESET PRODUCT BUTTON
// =========================

function resetProductButton(productName) {

    products.forEach((product) => {

        const name =
            product.querySelector("h3")
                .textContent
                .trim();

        if (name === productName) {

            const quantityBox =
                product.querySelector(".quantity-box");

            if (quantityBox) {

                const newButton =
                    document.createElement("button");

                newButton.textContent =
                    "Add to Cart";

                quantityBox.replaceWith(
                    newButton
                );

                setupAddButton(
                    product,
                    newButton
                );
            }
        }
    });
}


// =========================
// QUANTITY BOX
// =========================

function createQuantityBox(product, name) {

    const quantityBox =
        document.createElement("div");

    quantityBox.className =
        "quantity-box";


    quantityBox.innerHTML = `

        <button class="qty-btn minus">
            −
        </button>

        <span class="qty">
            ${cart[name].quantity}
        </span>

        <button class="qty-btn plus">
            +
        </button>
    `;


    const plusButton =
        quantityBox.querySelector(".plus");

    const minusButton =
        quantityBox.querySelector(".minus");

    const qtyText =
        quantityBox.querySelector(".qty");


    plusButton.addEventListener("click", () => {

        if (!cart[name]) {
            return;
        }

        cart[name].quantity++;

        qtyText.textContent =
            cart[name].quantity;

        renderCart();
    });


    minusButton.addEventListener("click", () => {

        if (!cart[name]) {
            return;
        }

        if (cart[name].quantity > 1) {

            cart[name].quantity--;

            qtyText.textContent =
                cart[name].quantity;

        } else {

            delete cart[name];

            resetProductButton(name);
        }

        renderCart();
    });


    return quantityBox;
}


// =========================
// ADD PRODUCT
// =========================

function setupAddButton(product, button) {

    if (!button) {
        return;
    }


    button.addEventListener("click", () => {

        const data =
            getProductData(product);


        cart[data.name] = {

            name: data.name,
            unit: data.unit,
            price: data.price,
            image: data.image,
            quantity: 1
        };


        const quantityBox =
            createQuantityBox(
                product,
                data.name
            );


        button.replaceWith(
            quantityBox
        );


        renderCart();


        if (cartPanel) {
            cartPanel.classList.add("active");
        }

        if (cartOverlay) {
            cartOverlay.classList.add("active");
        }
    });
}


// =========================
// ACTIVATE PRODUCTS
// =========================

products.forEach((product) => {

    const button =
        product.querySelector("button");

    setupAddButton(
        product,
        button
    );
});


// =========================
// MORE PRODUCTS
// =========================

function renderMoreProducts() {

    if (!moreProductsContainer) {
        return;
    }


    moreProductsContainer.innerHTML = "";


   document.querySelectorAll(".product").forEach((product) => {

        const data =
            getProductData(product);


        if (cart[data.name]) {
            return;
        }


        const card =
            document.createElement("div");

        card.className =
            "more-product-card";


        card.innerHTML = `

            <img
                src="${data.image}"
                alt="${data.name}"
            >

            <h4>${data.name}</h4>

            <p>${data.unit}</p>

            <strong>
                Rs. ${data.price}
            </strong>

            <button>
                Add +
            </button>
        `;


        const addButton =
            card.querySelector("button");


        addButton.addEventListener("click", () => {

            cart[data.name] = {

                name: data.name,
                unit: data.unit,
                price: data.price,
                image: data.image,
                quantity: 1
            };


            const originalButton =
                product.querySelector("button");


            if (originalButton) {

                const quantityBox =
                    createQuantityBox(
                        product,
                        data.name
                    );


                originalButton.replaceWith(
                    quantityBox
                );
            }


            renderCart();
        });


        moreProductsContainer.appendChild(
            card
        );
    });
}


// =========================
// CART OPEN / CLOSE
// =========================

if (cartButton) {

    cartButton.addEventListener("click", () => {

        renderCart();

        if (cartPanel) {
            cartPanel.classList.add("active");
        }

        if (cartOverlay) {
            cartOverlay.classList.add("active");
        }
    });
}


if (closeCart) {

    closeCart.addEventListener("click", () => {

        if (cartPanel) {
            cartPanel.classList.remove("active");
        }

        if (cartOverlay) {
            cartOverlay.classList.remove("active");
        }
    });
}


if (cartOverlay) {

    cartOverlay.addEventListener("click", () => {

        if (cartPanel) {
            cartPanel.classList.remove("active");
        }

        cartOverlay.classList.remove("active");
    });
}


// =========================
// CHECKOUT OPEN / CLOSE
// =========================

if (checkoutBtn) {

    checkoutBtn.addEventListener("click", () => {

        if (Object.keys(cart).length === 0) {

            alert(
                "Your cart is empty."
            );

            return;
        }


        if (cartPanel) {
            cartPanel.classList.remove("active");
        }

        if (cartOverlay) {
            cartOverlay.classList.remove("active");
        }


        resetCheckoutView();


        if (checkoutPanel) {
            checkoutPanel.classList.add("active");
        }

        if (checkoutOverlay) {
            checkoutOverlay.classList.add("active");
        }
    });
}


if (closeCheckout) {

    closeCheckout.addEventListener("click", () => {

        if (checkoutPanel) {
            checkoutPanel.classList.remove("active");
        }

        if (checkoutOverlay) {
            checkoutOverlay.classList.remove("active");
        }
    });
}


if (checkoutOverlay) {

    checkoutOverlay.addEventListener("click", () => {

        if (checkoutPanel) {
            checkoutPanel.classList.remove("active");
        }

        checkoutOverlay.classList.remove("active");
    });
}


// =========================
// RESET CHECKOUT SCREEN
// =========================

function resetCheckoutView() {

    const deliveryHeading =
        document.querySelector(
            ".checkout-content > h3"
        );


    const formElements =
        document.querySelectorAll(
            "#customerName, #customerPhone, #customerArea, #customerAddress, #continueCheckout, .location-buttons, #locationStatus"
        );


    const orderSummaryStep =
        document.getElementById(
            "orderSummaryStep"
        );


    formElements.forEach((element) => {

        element.style.display = "";
    });


    if (deliveryHeading) {

        deliveryHeading.style.display = "";
    }


    if (orderSummaryStep) {

        orderSummaryStep.classList.remove(
            "active"
        );
    }
}


// =========================
// DISTANCE CALCULATION
// =========================

function degreesToRadians(degrees) {

    return degrees *
        (Math.PI / 180);
}


function calculateDistanceKm(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const earthRadiusKm = 6371;


    const dLat =
        degreesToRadians(
            lat2 - lat1
        );


    const dLon =
        degreesToRadians(
            lon2 - lon1
        );


    const firstLatitude =
        degreesToRadians(lat1);


    const secondLatitude =
        degreesToRadians(lat2);


    const a =

        Math.sin(dLat / 2) *
        Math.sin(dLat / 2) +

        Math.sin(dLon / 2) *
        Math.sin(dLon / 2) *

        Math.cos(firstLatitude) *
        Math.cos(secondLatitude);


    const c =

        2 *

        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );


    const distance =
        earthRadiusKm * c;


    return distance;
}


// =========================
// DELIVERY CHARGE
// =========================

function calculateDeliveryCharge(distanceKm) {

    // 4 KM ya is se kam

    if (distanceKm <= BASE_DISTANCE_KM) {

        return BASE_DELIVERY_CHARGE;
    }


    // 4 KM ke baad ka distance

    const extraDistance =
        distanceKm - BASE_DISTANCE_KM;


    // Agar 4.2 KM hai to extra 1 KM count hoga
    // Agar 5.1 KM hai to extra 2 KM count honge

    const extraKm =
        Math.ceil(extraDistance);


    const extraCharge =
        extraKm *
        EXTRA_CHARGE_PER_KM;


    return (
        BASE_DELIVERY_CHARGE +
        extraCharge
    );
}


// =========================
// CURRENT LOCATION
// =========================

if (useCurrentLocationBtn) {

    useCurrentLocationBtn.addEventListener(
        "click",
        () => {

            if (!navigator.geolocation) {

                if (locationStatus) {

                    locationStatus.textContent =
                        "Location is not supported on this device.";
                }

                return;
            }


            if (locationStatus) {

                locationStatus.textContent =
                    "Getting your location...";
            }


            navigator.geolocation.getCurrentPosition(

                async (position) => {

                    customerLatitude =
                        position.coords.latitude;


                    customerLongitude =
                        position.coords.longitude;


                    // Shop se customer tak distance

                    customerDistanceKm =
                        calculateDistanceKm(

                            SHOP_LATITUDE,
                            SHOP_LONGITUDE,

                            customerLatitude,
                            customerLongitude
                        );


                    // Delivery charge calculate

                    calculatedDeliveryCharge =
                        calculateDeliveryCharge(
                            customerDistanceKm
                        );


                    if (locationStatus) {

                        locationStatus.textContent =
                            "✓ Location captured successfully";
                    }


                    // =========================
                    // AREA / SECTOR DETECTION
                    // =========================

                    try {

                        const response =
                            await fetch(

                                `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${customerLatitude}&lon=${customerLongitude}`
                            );


                        if (!response.ok) {

                            throw new Error(
                                "Location service error"
                            );
                        }


                        const data =
                            await response.json();


                        const address =
                            data.address || {};


                        const area =

                            address.suburb ||

                            address.neighbourhood ||

                            address.quarter ||

                            address.city_district ||

                            address.town ||

                            address.city ||

                            address.village ||

                            "";


                        if (
                            area &&
                            customerAreaInput
                        ) {

                            customerAreaInput.value =
                                area;


                            if (locationStatus) {

                                locationStatus.textContent =
                                    "✓ Location & area detected successfully";
                            }

                        } else {

                            if (locationStatus) {

                                locationStatus.textContent =
                                    "✓ Location captured — please enter Area / Sector";
                            }
                        }


                    } catch (error) {


                        if (locationStatus) {

                            locationStatus.textContent =
                                "✓ Location captured — please enter Area / Sector";
                        }
                    }
                },


                () => {

                    if (locationStatus) {

                        locationStatus.textContent =
                            "Unable to get location. Please allow location permission.";
                    }
                },


                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 0
                }
            );
        }
    );
}


// =========================
// CONTINUE CHECKOUT
// =========================

document.addEventListener(
    "click",
    (event) => {

        if (
            event.target.id !==
            "continueCheckout"
        ) {

            return;
        }


        const name =
            document
                .getElementById("customerName")
                .value
                .trim();


        const phone =
            document
                .getElementById("customerPhone")
                .value
                .trim();


        const area =
            document
                .getElementById("customerArea")
                .value
                .trim();


        const address =
            document
                .getElementById("customerAddress")
                .value
                .trim();


        // =========================
        // CHECK CUSTOMER DETAILS
        // =========================

        if (
            !name ||
            !phone ||
            !area ||
            !address
        ) {

            alert(
                "Please complete all delivery details."
            );

            return;
        }


        // =========================
        // CHECK LOCATION
        // =========================

        if (
            customerLatitude === null ||
            customerLongitude === null
        ) {

            alert(
                "Please use Current Location before continuing."
            );

            return;
        }


        // Dobara fresh distance calculate

        customerDistanceKm =
            calculateDistanceKm(

                SHOP_LATITUDE,
                SHOP_LONGITUDE,

                customerLatitude,
                customerLongitude
            );


        calculatedDeliveryCharge =
            calculateDeliveryCharge(
                customerDistanceKm
            );


        const orderSummaryStep =
            document.getElementById(
                "orderSummaryStep"
            );


        const checkoutItems =
            document.getElementById(
                "checkoutItems"
            );


        const checkoutSubtotal =
            document.getElementById(
                "checkoutSubtotal"
            );


        const deliveryCharges =
            document.getElementById(
                "deliveryCharges"
            );


        const grandTotal =
            document.getElementById(
                "grandTotal"
            );


        // =========================
        // HIDE DELIVERY FORM
        // =========================

        document
            .querySelectorAll(
                "#customerName, #customerPhone, #customerArea, #customerAddress, #continueCheckout, .location-buttons, #locationStatus"
            )
            .forEach((element) => {

                element.style.display =
                    "none";
            });


        const deliveryHeading =
            document.querySelector(
                ".checkout-content > h3"
            );


        if (deliveryHeading) {

            deliveryHeading.style.display =
                "none";
        }


        // =========================
        // SHOW ORDER SUMMARY
        // =========================

        if (orderSummaryStep) {

            orderSummaryStep.classList.add(
                "active"
            );
        }


        if (checkoutItems) {

            checkoutItems.innerHTML = "";
        }


        let subtotal = 0;


        Object.values(cart).forEach((item) => {

            const itemTotal =
                item.price *
                item.quantity;


            subtotal += itemTotal;


            if (checkoutItems) {

                checkoutItems.innerHTML += `

                    <div class="checkout-item">

                        <span>
                            ${item.name}
                            ×
                            ${item.quantity}
                        </span>

                        <strong>
                            Rs. ${itemTotal}
                        </strong>

                    </div>
                `;
            }
        });


        // =========================
        // SHOW DELIVERY DISTANCE
        // =========================

        if (checkoutItems) {

            checkoutItems.innerHTML += `

                <div class="checkout-item">

                    <span>
                        Delivery Distance
                    </span>

                    <strong>
                        ${customerDistanceKm.toFixed(1)} KM
                    </strong>

                </div>
            `;
        }


        // =========================
        // DELIVERY CHARGE
        // =========================

        const delivery =
            calculatedDeliveryCharge;


        if (checkoutSubtotal) {

            checkoutSubtotal.textContent =
                subtotal;
        }


        if (deliveryCharges) {

            deliveryCharges.textContent =
                delivery;
        }


        if (grandTotal) {

            grandTotal.textContent =
                subtotal + delivery;
        }


        if (checkoutPanel) {

            checkoutPanel.scrollTop = 0;
        }
    }
);


// =========================
// PLACE ORDER
// =========================

document.addEventListener(
    "click",
    async (event) => {
    

        if (
            event.target.id !==
            "placeOrderBtn"
        ) {

            return;
        }

// Customer must be logged in before placing order
const { data: { user } } = await supabaseClient.auth.getUser();

if (!user) {

    localStorage.setItem(
        "pendingOrderCart",
        JSON.stringify(cart)
    );

    localStorage.setItem(
    "pendingCheckoutDetails",
    JSON.stringify({
        name: document.getElementById("customerName").value.trim(),
        phone: document.getElementById("customerPhone").value.trim(),
        area: document.getElementById("customerArea").value.trim(),
        address: document.getElementById("customerAddress").value.trim(),
        latitude: customerLatitude,
        longitude: customerLongitude,
        distanceKm: customerDistanceKm,
        deliveryCharge: calculatedDeliveryCharge
    })
);
    localStorage.setItem(
        "returnAfterLogin",
        "checkout"
    );

    alert("Please login first to place your order.");

    window.location.href = "login.html";

    return;
}
        if (
            Object.keys(cart).length === 0
        ) {

            alert(
                "Your cart is empty."
            );

            return;
        }


        const name = document.getElementById("customerName").value.trim();
const phone = document.getElementById("customerPhone").value.trim();
const area = document.getElementById("customerArea").value.trim();
const address = document.getElementById("customerAddress").value.trim();

const orderItems = Object.values(cart);

let subtotal = 0;

orderItems.forEach((item) => {
    subtotal += item.price * item.quantity;
});

const orderData = {
    customer_name: name,
    customer_phone: phone,
    customer_area: area,
    customer_address: address,
    customer_latitude: customerLatitude,
    customer_longitude: customerLongitude,
   distance_km: customerDistanceKm,
    delivery_charge: calculatedDeliveryCharge,
    subtotal: subtotal,
    grand_total: subtotal + calculatedDeliveryCharge,
    items: orderItems,
    order_status: "Pending",
    payment_method: "Cash on Delivery"
};

const { data, error } = await supabaseClient
    .from("orders")
    .insert([orderData])
    .select("id, order_status");

if (error) {
    console.error("Order Error:", error);
    alert("Order save nahi hua. Dobara try karein.");
    return;
}

const savedOrder = data && data.length ? data[0] : null;

if (savedOrder) {

    const currentOrderCard =
        document.getElementById("currentOrderCard");

    const currentOrderId =
        document.getElementById("currentOrderId");

    const currentOrderStatus =
        document.getElementById("currentOrderStatus");

    const currentOrderTotal =
        document.getElementById("currentOrderTotal");

    currentOrderId.textContent =
        savedOrder.id;

    currentOrderStatus.textContent =
        savedOrder.order_status || "Pending";

    currentOrderTotal.textContent =
        "Rs. " + (orderData.grand_total || 0);

    if (currentOrderCard) {
    currentOrderCard.style.display = "flex";
}

    localStorage.setItem(
        "currentOrderId",
        savedOrder.id
    );
    localStorage.setItem(
    "currentOrderId",
    savedOrder.id
);

// 👇 یہاں نیا code paste کریں

const checkoutPanel =
    document.getElementById("checkoutPanel");

const checkoutOverlay =
    document.getElementById("checkoutOverlay");

if (checkoutPanel) {
    checkoutPanel.classList.remove("active");
}

if (checkoutOverlay) {
    checkoutOverlay.classList.remove("active");
}

document.body.style.overflow = "";

setTimeout(() => {
    if (currentOrderCard) {
        currentOrderCard.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}, 200);
}


 showOrderSuccessPopup(
    savedOrder?.id || "Saved",
    savedOrder?.order_status || "Pending"
);

console.log("Saved Order:", data);
    }
);


// =========================
// INITIAL DISPLAY
// =========================

renderMoreProducts();
// ==========================
// LOAD PRODUCTS FROM SUPABASE
// ==========================

async function loadProducts() {
    const { data, error } = await supabaseClient
        .from("products")
        .select("*")
        .eq("is_available", true)
        .order("id", { ascending: true });

    if (error) {
        console.error("Error loading products:", error);
        return;
    }

    console.log("Products from Supabase:", data);
}

loadProducts();

// ==========================
// DISPLAY SUPABASE PRODUCTS ON MAIN WEBSITE
// ==========================

async function displayDatabaseProducts() {
    const productList = document.getElementById("productList");

    if (!productList) {
        return;
    }

    const { data, error } = await supabaseClient
        .from("products")
        .select("*")
        .eq("is_available", true)
        .order("id", { ascending: true });

    if (error) {
        console.error("Error displaying products:", error);
        return;
    }

    data.forEach((item) => {

        // Don't show duplicate products already present in HTML
        const existingProducts =
            productList.querySelectorAll(".product h3");

        const alreadyExists = Array.from(existingProducts).some(
            (title) =>
                title.textContent.trim().toLowerCase() ===
                item.product_name.trim().toLowerCase()
        );

        if (alreadyExists) {
            return;
        }

        const card = document.createElement("div");
        card.className = "product";
        card.dataset.category = item.product_category || "";

        const image =
            item.product_image ||
            "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80";

        card.innerHTML = `
            <img src="${image}" alt="${item.product_name}">
            <h3>${item.product_name}</h3>
            <p>${item.product_unit}</p>
            <strong>Rs. ${item.product_price}</strong>
            <button>Add to Cart</button>
        `;

        productList.appendChild(card);

        const button = card.querySelector("button");

        setupAddButton(
            card,
            button
        );
    });
}

displayDatabaseProducts();
// موبائل پر pinch zoom روکنے کے لیے
document.addEventListener(
    "touchmove",
    function (event) {
        if (event.touches.length > 1) {
            event.preventDefault();
        }
    },
    { passive: false }
);

document.addEventListener(
    "gesturestart",
    function (event) {
        event.preventDefault();
    }
);

// ===============================
// PRODUCT SEARCH
// ===============================

const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");

function searchProducts() {
    const searchText = searchInput.value.trim().toLowerCase();
    const products = document.querySelectorAll("#productList .product");

    let found = 0;

    products.forEach((product) => {
        const productName =
            product.querySelector("h3")?.textContent.toLowerCase() || "";

        if (productName.includes(searchText)) {
            product.style.display = "";
            found++;
        } else {
            product.style.display = "none";
        }
    });

    let noResults = document.getElementById("noSearchResults");

    if (found === 0) {
        if (!noResults) {
            noResults = document.createElement("p");
            noResults.id = "noSearchResults";
            noResults.textContent = "No products found";
            document.getElementById("productList").appendChild(noResults);
        }
    } else if (noResults) {
        noResults.remove();
    }

    document.querySelector(".products")?.scrollIntoView({
        behavior: "smooth"
    });
}

searchButton.addEventListener("click", searchProducts);

searchInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        searchProducts();
    }
});
searchInput.addEventListener("input", searchProducts);
const checkOrderStatusButton =
    document.getElementById("checkOrderStatus");

const trackingOrderIdInput =
    document.getElementById("trackingOrderId");

const trackingResult =
    document.getElementById("trackingResult");

if (checkOrderStatusButton) {

    checkOrderStatusButton.addEventListener(
        "click",
        async function () {

            const orderId =
                trackingOrderIdInput.value.trim();

            if (!orderId) {
                trackingResult.innerHTML =
                    "Please enter your Order ID.";
                return;
            }

            trackingResult.innerHTML =
                "Checking order...";

            const { data, error } =
                await supabaseClient
                    .from("orders")
                    .select(
                        "id, order_status, customer_name, grand_total"
                    )
                    .eq("id", orderId)
                    .single();

            if (error || !data) {
                console.error("Track Order Error:", error);

                trackingResult.innerHTML =
                    "❌ Order not found. Please check your Order ID.";

                return;
            }

            trackingResult.innerHTML = `
                <div class="tracking-result-card">
                    <strong>Order #${data.id}</strong>
                    <p>Status: <b>${data.order_status || "Pending"}</b></p>
                    <p>Total: Rs. ${data.grand_total || 0}</p>
                </div>
            `;
        }
    );
}
const menuToggle = document.getElementById("menuToggle");
const mainMenu = document.getElementById("mainMenu");

if (menuToggle && mainMenu) {

    menuToggle.addEventListener("click", function () {
        mainMenu.classList.toggle("active");
    });

    mainMenu.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", function () {
            mainMenu.classList.remove("active");
        });
    });
}
// ==============================
// CATEGORY FILTER
// ==============================

const categoryCards = document.querySelectorAll(".category");

categoryCards.forEach((card) => {

    card.style.cursor = "pointer";

    card.addEventListener("click", function () {

        const selectedCategory =
            this.dataset.category;

        document
            .querySelectorAll(".product")
            .forEach((product) => {

                const productCategory =
                    product.dataset.category;

                if (
                    productCategory === selectedCategory
                ) {
                    product.style.display = "";
                } else {
                    product.style.display = "none";
                }

            });

        const productsSection =
            document.querySelector(".products-section");

        if (productsSection) {
            productsSection.scrollIntoView({
                behavior: "smooth"
            });
        }

    });

});
// ==================================
// CURRENT ORDER - RESTORE AFTER REFRESH
// ==================================

async function loadSavedCurrentOrder() {

    const savedOrderId =
        localStorage.getItem("currentOrderId");

    if (!savedOrderId) {
        return;
    }

    const { data, error } = await supabaseClient
        .from("orders")
        .select("id, order_status, grand_total")
        .eq("id", savedOrderId)
        .single();

    if (error || !data) {
        console.error("Current order load error:", error);
        return;
    }

    const card =
        document.getElementById("currentOrderCard");

    const orderId =
        document.getElementById("currentOrderId");

    const orderStatus =
        document.getElementById("currentOrderStatus");

    const orderTotal =
        document.getElementById("currentOrderTotal");

    if (!card) return;

    orderId.textContent = data.id;

    orderStatus.textContent =
        data.order_status || "Pending";

    orderTotal.textContent =
        "Rs. " + (data.grand_total || 0);

    card.style.display = "flex";
}

// CHECK LATEST STATUS BUTTON

const refreshCurrentOrderButton =
    document.getElementById("refreshCurrentOrder");

if (refreshCurrentOrderButton) {

    refreshCurrentOrderButton.addEventListener(
        "click",
        async function () {

            await loadSavedCurrentOrder();

        }
    );
}


// PAGE REFRESH PAR ORDER DOBARA SHOW KARO

loadSavedCurrentOrder();
// ========================================
// NEW CURRENT ORDER PANEL
// ========================================

const currentOrderPanel =
    document.getElementById("currentOrderPanel");

const currentOrderOverlay =
    document.getElementById("currentOrderOverlay");

const closeCurrentOrderPanel =
    document.getElementById("closeCurrentOrderPanel");

function openCurrentOrderPanel() {
    if (currentOrderPanel) {
        currentOrderPanel.classList.add("active");
    }

    if (currentOrderOverlay) {
        currentOrderOverlay.classList.add("active");
    }
}

function closeOrderPanel() {
    if (currentOrderPanel) {
        currentOrderPanel.classList.remove("active");
    }

    if (currentOrderOverlay) {
        currentOrderOverlay.classList.remove("active");
    }
}

async function loadCurrentOrder(openPanel = false) {

    const orderId =
        localStorage.getItem("currentOrderId");

    if (!orderId) {
        if (openPanel) {
            alert("No current order found.");
        }
        return;
    }

    const { data, error } = await supabaseClient
        .from("orders")
        .select("id, order_status, grand_total")
        .eq("id", orderId)
        .single();

    if (error || !data) {
        console.error("Current Order Error:", error);

        if (openPanel) {
            alert("Order could not be loaded.");
        }

        return;
    }

    document.getElementById("currentOrderId").textContent =
        data.id;

    document.getElementById("currentOrderStatus").textContent =
        data.order_status || "Pending";

    document.getElementById("currentOrderTotal").textContent =
        "Rs. " + (data.grand_total || 0);

    if (openPanel) {
        openCurrentOrderPanel();
    }
}

// CURRENT ORDER MENU
document.getElementById("currentOrderMenu")
    ?.addEventListener("click", async function (event) {

        event.preventDefault();

        await loadCurrentOrder(true);

    });


// CLOSE BUTTON
if (closeCurrentOrderPanel) {
    closeCurrentOrderPanel.addEventListener(
        "click",
        closeOrderPanel
    );
}


// CLICK OUTSIDE TO CLOSE
if (currentOrderOverlay) {
    currentOrderOverlay.addEventListener(
        "click",
        closeOrderPanel
    );
}


// CHECK LATEST STATUS
const latestStatusButton =
    document.getElementById("refreshCurrentOrder");

if (latestStatusButton) {

    latestStatusButton.addEventListener(
        "click",
        async function () {

            await loadCurrentOrder(false);

            alert("Order status updated.");
        }
    );
}


// RESTORE ORDER DATA AFTER REFRESH
loadCurrentOrder(false);
async function checkOrderNow() {

    const orderId =
        document.getElementById("trackingOrderId").value.trim();

    const trackingResult =
        document.getElementById("trackingResult");

    if (!orderId) {
        trackingResult.innerHTML =
            "Please enter your Order ID.";
        return;
    }

    trackingResult.innerHTML =
        "Checking order...";

    const { data, error } =
        await supabaseClient
            .from("orders")
            .select("id, order_status, grand_total")
            .eq("id", orderId)
            .single();

    if (error || !data) {
        trackingResult.innerHTML =
            "❌ Order not found.";
        return;
    }

    trackingResult.innerHTML = `
        <div class="tracking-result-card">
            <strong>Order #${data.id}</strong>
            <p>Status: <b>${data.order_status || "Pending"}</b></p>
            <p>Total: Rs. ${data.grand_total || 0}</p>
        </div>
    `;
}
// =====================================
// CUSTOMER LOGIN / ACCOUNT MENU
// =====================================

async function updateAuthMenu() {

    const loginMenu =
        document.getElementById("loginMenu");

    const accountMenu =
        document.getElementById("accountMenu");

    const logoutMenu =
        document.getElementById("logoutMenu");

    if (!loginMenu || !accountMenu || !logoutMenu) {
        return;
    }

    const { data } =
        await supabaseClient.auth.getUser();

    const user = data?.user;

    if (user) {

        loginMenu.style.display = "none";

        accountMenu.style.display = "";

        logoutMenu.style.display = "";

        const fullName =
            user.user_metadata?.full_name || "My Account";

        accountMenu.textContent = fullName;

    } else {

        loginMenu.style.display = "";

        accountMenu.style.display = "none";

        logoutMenu.style.display = "none";
    }
}


// LOGOUT
document.getElementById("logoutMenu")
    ?.addEventListener("click", async function (event) {

        event.preventDefault();

        await supabaseClient.auth.signOut();

        window.location.href = "index.html";
    });


// CHECK LOGIN WHEN PAGE LOADS
updateAuthMenu();
// SHOW TRACK ORDER SECTION ONLY WHEN TRACK ORDER MENU IS CLICKED
const trackOrderMenu =
    document.querySelector('a[href="#orderTracking"]');

if (trackOrderMenu) {
    trackOrderMenu.addEventListener(
        "click",
        function () {

            const orderTrackingSection =
                document.getElementById("orderTracking");

            if (orderTrackingSection) {
                orderTrackingSection.style.display = "block";

                orderTrackingSection.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        }
    );
}
// =====================================
// RESTORE CART AFTER LOGIN
// =====================================

function restorePendingOrderCart() {

    const params = new URLSearchParams(window.location.search);

    if (params.get("resumeCheckout") !== "true") {
        return;
    }

    const savedCart =
        localStorage.getItem("pendingOrderCart");

    if (!savedCart) {
        return;
    }

    try {
        const restoredCart = JSON.parse(savedCart);

        Object.keys(cart).forEach((key) => {
            delete cart[key];
        });

        Object.assign(cart, restoredCart);

        updateCart();
        const savedDetails =
    localStorage.getItem("pendingCheckoutDetails");

if (savedDetails) {

    const details =
        JSON.parse(savedDetails);

    document.getElementById("customerName").value =
        details.name || "";

    document.getElementById("customerPhone").value =
        details.phone || "";

    document.getElementById("customerArea").value =
        details.area || "";

    document.getElementById("customerAddress").value =
        details.address || "";

    customerLatitude =
        details.latitude || null;

    customerLongitude =
        details.longitude || null;

    currentDistanceKm =
        details.distanceKm || 0;

    calculatedDeliveryCharge =
        details.deliveryCharge || 0;
}

setTimeout(() => {
    const checkoutPanel =
        document.getElementById("checkoutPanel");

    const checkoutOverlay =
        document.getElementById("checkoutOverlay");

    if (checkoutPanel) {
        checkoutPanel.classList.add("active");
    }

    if (checkoutOverlay) {
        checkoutOverlay.classList.add("active");
    }

    document.body.style.overflow = "hidden";
}, 300);

        localStorage.removeItem("returnAfterLogin");

        setTimeout(() => {
            const cartButton =
                document.querySelector(".cart");

            if (cartButton) {
                cartButton.click();
            }
        }, 300);

    } catch (error) {
        console.error("Cart restore failed:", error);
    }
}

restorePendingOrderCart();
function showOrderSuccessPopup(orderId, status) {
    const oldPopup = document.getElementById("orderSuccessPopup");
    if (oldPopup) oldPopup.remove();

    const popup = document.createElement("div");
    popup.id = "orderSuccessPopup";

    popup.innerHTML = `
        <div style="
            position:fixed;
            inset:0;
            background:rgba(0,0,0,0.55);
            display:flex;
            align-items:center;
            justify-content:center;
            z-index:99999;
            padding:20px;
        ">
            <div style="
                background:#ffffff;
                width:100%;
                max-width:420px;
                border-radius:20px;
                padding:32px 25px;
                text-align:center;
                box-shadow:0 20px 60px rgba(0,0,0,0.25);
            ">

                <div style="
                    width:70px;
                    height:70px;
                    margin:0 auto 18px;
                    border-radius:50%;
                    background:#07883f;
                    color:white;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    font-size:38px;
                    font-weight:bold;
                ">✓</div>

                <h2 style="
                    margin:0 0 10px;
                    color:#07883f;
                    font-size:25px;
                ">
                    Order Placed Successfully!
                </h2>

                <p style="
                    color:#555;
                    margin-bottom:22px;
                ">
                    Thank you! Your order has been received.
                </p>

                <div style="
                    background:#f5f7f5;
                    border-radius:12px;
                    padding:15px;
                    margin-bottom:20px;
                    text-align:left;
                ">
                    <p style="margin:5px 0;">
                        <strong>Order ID:</strong> ${orderId}
                    </p>

                    <p style="margin:5px 0;">
                        <strong>Status:</strong>
                        <span style="color:#07883f;font-weight:bold;">
                            ${status}
                        </span>
                    </p>
                </div>

                <button
onclick="finishOrderSuccess()"                    style="
                        width:100%;
                        border:none;
                        background:#ff6600;
                        color:white;
                        padding:14px;
                        border-radius:10px;
                        font-size:16px;
                        font-weight:bold;
                        cursor:pointer;
                    "
                >
                    Continue Shopping
                </button>

            </div>
        </div>
    `;

    document.body.appendChild(popup);
}
function finishOrderSuccess() {
    // Close success popup
    const popup = document.getElementById("orderSuccessPopup");
    if (popup) {
        popup.remove();
    }

    // Clear cart object
    Object.keys(cart).forEach((key) => {
        delete cart[key];
    });

    // Update cart UI
    updateCartCount();

    // Clear temporary saved checkout/order data
    localStorage.removeItem("pendingOrderCart");
    localStorage.removeItem("pendingCheckoutDetails");
    localStorage.removeItem("returnAfterLogin");

    // Close checkout panel if open
    const checkoutPanel = document.getElementById("checkoutPanel");
    const checkoutOverlay = document.getElementById("checkoutOverlay");

    if (checkoutPanel) {
        checkoutPanel.classList.remove("active");
    }

    if (checkoutOverlay) {
        checkoutOverlay.classList.remove("active");
    }

    document.body.style.overflow = "";

    // Go back to top
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}