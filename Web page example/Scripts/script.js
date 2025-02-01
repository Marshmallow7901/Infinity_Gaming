const addToCartButton = document.getElementById("addToCartButton");

addToCartButton.addEventListener("click", () => {
    const productContainer = document.querySelector(".product-container");

    const productName = productContainer.querySelector("h1").textContent;
    const productPrice = productContainer.querySelector("strong").textContent.replace("R", "");
    const productQuantity = 1;

    const product = {
        name: productName,
        price: parseFloat(productPrice),
        quantity: productQuantity
    };

    // Retrieve existing cart items from local storage
    const existingCartItems = localStorage.getItem("cartItems");
    let cartItems = [];

    if (existingCartItems) {
        cartItems = JSON.parse(existingCartItems);
    }

    // Add the new product to the cart
    cartItems.push(product);

    // Save updated cart items to local storage
    localStorage.setItem("cartItems", JSON.stringify(cartItems));

    // Calculate the total price of all items in the cart
    const totalPrice = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

    // Optionally, save the total price to local storage if you want to persist it
    localStorage.setItem("totalPrice", totalPrice.toFixed(2));

    // Display an alert to the user
    alert(`Item added to cart! Total price: R${totalPrice.toFixed(2)}`);
});
