const app = document.querySelector('#app');

document.getElementById('btn-add-product').style.display = 'block';
document.getElementById('btn-update-product').style.display = 'none';

let inputProductName = document.querySelector('#input-product-name');
let inputQuantity = document.querySelector('#input-quantity');


inputProductName.addEventListener("change", (e) => {
    return inputProductName.textContent = e.target.value;
});
inputQuantity.addEventListener("change", (e) => {
    return inputQuantity.textContent = e.target.value;
});

const addProduct = async () => {
    console.log(inputProductName.textContent);
    let productname = inputProductName.textContent;
    let quantity = inputQuantity.textContent;

    const addedProduct = await fetch("http://localhost:3000/product", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "productname": productname,
            "quantity": quantity
        })
    })
    document.getElementById('input-product-name').value = '';
    document.getElementById('input-quantity').value = '';

    app.innerHTML = ``;
    await getProducts();
}

const handleDelete = async (id) => {
    const deletedProduct = await fetch(`http://localhost:3000/products/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
    })
        .then(res => res.json())
        .then(data => data.err);
    if (deletedProduct === null) {
        app.innerHTML = ``;
        await getProducts();
    }
}

let idcopy;
const readyToUpdate = async (id) => {
    idcopy = id;
    const singleProduct = await fetch(`http://localhost:3000/products/${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
    })
        .then(res => res.json())
        .then(data => {
            console.log(data.product);
            return data.product;
        });
    document.getElementById('input-product-name').value = singleProduct.productname;
    document.getElementById('input-quantity').value = singleProduct.quantity;

    document.getElementById('btn-add-product').style.display = 'none';
    document.getElementById('btn-update-product').style.display = 'block';
}

const updateProduct = async (e) => {

    document.querySelector('#input-product-name').addEventListener("change", (e) => document.querySelector('#input-product-name').value = e.target.value);
    document.querySelector('#input-quantity').addEventListener("change", (e) => document.querySelector('#input-quantity').value = e.target.value);

    document.getElementById('btn-add-product').style.display = 'block';
    document.getElementById('btn-update-product').style.display = 'none';
    let productNewname = document.querySelector('#input-product-name').value;
    let newQuantity = document.querySelector('#input-quantity').value;

    const updatedProduct = await fetch(`http://localhost:3000/products/${idcopy}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
            "productname": productNewname,
            "quantity": newQuantity
        })
    })
        .then(res => res.json())
        .then(data => {
            console.log(data.err);
            return data.err;
        });
    document.getElementById('input-product-name').value = '';
    document.getElementById('input-quantity').value = '';
    if (updatedProduct === null) {
        app.innerHTML = ``;
        await getProducts();
    }
}

document.getElementById('btn-update-product').addEventListener("click", updateProduct);

const getProducts = async () => {

    const allProducts = await fetch('http://localhost:3000/products', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
        .then(response => response.json())
        .then(data => {
            console.log(data.products);
            return data.products;
        });

    await allProducts.forEach((item) => {
        return app.innerHTML += `
        <div class=product  >
        <div class=productname>${item.productname}</div>
        <div class=quantity>${item.quantity}</div>
        <button class=delete onclick="handleDelete(${item.id})" >delete</button>
        <button class=update onclick="readyToUpdate(${item.id})" >update</button>
        </div>
        `;
    });
}

getProducts();



