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

    
    const existingCartItems = localStorage.getItem("cartItems");
    let cartItems = [];

    if (existingCartItems) {
        cartItems = JSON.parse(existingCartItems);
    }


    cartItems.push(product);

    
    localStorage.setItem("cartItems", JSON.stringify(cartItems));

   
    const totalPrice = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

   
    localStorage.setItem("totalPrice", totalPrice.toFixed(2));


    alert(`Item added to cart! Total price: R${totalPrice.toFixed(2)}`);
});
