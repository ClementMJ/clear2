// Invoking strict mode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode#invoking_strict_mode
'use strict';

// current products on the page
let currentProducts = [];
let currentPagination = {};

//new objects for the features
let currentBrands=new Object();
let currentFilter={price:false, release:false, brand:"all", favorite:false};

let currentFavorites= [];


// inititiqte selectors
const selectShow = document.querySelector('#show-select');
const selectPage = document.querySelector('#page-select');
const selectBrand=document.querySelector('#brand-select');
const filterPrice=document.querySelector('#reasonable-price');
const filterRelease=document.querySelector('#recently-released');
const selectSort=document.querySelector('#sort-select');
const sectionProducts = document.querySelector('#products');
const spanNbProducts = document.querySelector('#nbProducts');
const spanNewProducts = document.querySelector('#newProducts');
const spanP50=document.querySelector('#p50');
const spanP90=document.querySelector('#p90');
const spanP95=document.querySelector('#p95');
const spanLastRelease=document.querySelector('#last-release');
const filterFavorites=document.querySelector('#favorites');


/**
 * Set global value
 * @param {Array} result - products to display
 * @param {Object} meta - pagination meta info
 */

const setCurrentProducts = ({result, meta}) => {
  currentProducts = result;
  currentPagination = meta;

  //updating the brands of the available products
  let brands= new Object();
  currentProducts.forEach((product, i) => {
    if(brands[product.brand]){
      brands[product.brand].push(product);
    }
    else {
      brands[product.brand]=[product];
    }
  });
  brands["all"]=currentProducts;
  currentBrands=brands;
  //like that when we change page, we keep the sorting method by applying it on the
  if(selectSort){
    currentBrands=sort(selectSort.value, currentBrands);
  }
};

/**
 * Fetch products from api
 * @param  {Number}  [page=1] - current page to fetch
 * @param  {Number}  [size=12] - size of the page
 * @return {Object}
 */
const fetchProducts = async (page=1 , size = 12) => {
  try {
    const response = await fetch(
      `https://clear-fashion-api.vercel.app?page=${page}&size=${size}`
    );
    const body = await response.json();

    if (body.success !== true) {
      console.error(body);
      return {currentProducts, currentPagination};
    }

    return body.data;
  } catch (error) {
    console.error(error);
    return {currentProducts, currentPagination};
  }
};

/**
 * Render list of products
 * @param  {Array} products
 */
const renderProducts = products => {
  const fragment = document.createDocumentFragment();
  const div = document.createElement('div');
  const template = products
    .map(product => {
      return (`
      <div class="product" id=${product.uuid}>
        <span>${product.brand}</span>
        <a href="${product.link}" target="_blank">${product.name}</a>
        <span>${product.price}</span>`).concat(
          (currentFavorites.includes(product)) ?
        `<span><button onclick="removeFavorite('${product.uuid}')">Remove favorite</button></span>` :
        `<span><button onclick="addFavorite('${product.uuid}')">Add favorite</button></span>`
      ).concat('\n</div>');
    })
    .join('');

  div.innerHTML = template;
  fragment.appendChild(div);
  sectionProducts.innerHTML = '<h2>Products</h2>';
  sectionProducts.appendChild(fragment);

};


/**
 * Render page selector
 * @param  {Object} pagination
 */
const renderPagination = pagination => {
  const {currentPage, pageCount} = pagination;
  const options = Array.from(
    {'length': pageCount},
    (value, index) => `<option value="${index + 1}">${index + 1}</option>`
  ).join('');

  selectPage.innerHTML = options;
  selectPage.selectedIndex = currentPage - 1;
};


/**
 * Render page selector
 * @param  {Object} pagination
 */

//no need for products, they are all contained in the "brand" object which simplifies the
// variables management
const render = (pagination=currentPagination, brands=currentBrands, filters=currentFilter) => {
  renderProducts(applyFilter(brands, filters));
  renderPagination(pagination);
  renderIndicators(applyFilter(brands, filters));
  renderBrands(brands);
};




//feature 2 : select a product by brands

//the object current brand has been created
//the function setCurrentProducts has been modified to update the brands too
const renderBrands=currentBrands =>{
  let options='';
  let brands=Object.keys(currentBrands);
  for (var index=0; index<brands.length;index++)
  {
    options+=`<option value="${brands[index]}">${brands[index]}</option>`;
  }
  selectBrand.innerHTML=options;
};




//feature 3 and 4 : Filter by recent products and reasonable price
// object "currentFilter" has been created

// function to update the status of the check box associated with the filters
function setCurrentFilter(currentFilter) {
  if(filterRelease.checked==true){
    currentFilter["release"]=true;
  } else{
    currentFilter["release"]=false;
  }
  if(filterPrice.checked==true){
    currentFilter["price"]=true;
  } else{
    currentFilter["price"]=false;
  }
  if(filterFavorites.checked==true){
    currentFilter["favorite"]=true;
  } else{
    currentFilter["favorite"]=false;
  }
  return currentFilter;
}

// function to get the products having a reasonable price
function reasonable_products(products){
  let res=[];
  products.forEach((product, i) => {
    if(product.price<=100){
      res.push(product);
    }
  });
  return res;
}

// function to compute the difference in days between two dates
function dayDiff(d1, d2)
{
  var res= Math.trunc((d1-d2)/86400000);
  return res;
}

// function to get the recently released products
function recent_products(products){
  let res=[];
  products.forEach((product, i) => {
    if(dayDiff(Date.now(), new Date(product.released))<15){
      res.push(product);
    }
  });
  return res;
}

// function to apply the filters
function applyFilter(brands, filters){
  let res=brands[filters.brand];
  if (filters["favorite"]==true){
    res=currentFavorites;
  }
  if (filters["price"]==true){
    res=reasonable_products(res);
  }

  if (filters["release"]==true){
    res=recent_products(res);
  }
  return res;
}

// feature 5 & 6 : sort by price

//first the function to sort an array of product by ascending price
function price_asc(a,b){
if (a.price<b.price){
  return -1;}
if (a.price>b.price){
  return 1;}
return 0
}

//the function to sort an array of product in descending price
function price_desc(a,b){
if (a.price<b.price){
  return 1;}
if (a.price>b.price){
  return -1;}
return 0
}

//the function to sort by ascending date

function date_asc(a,b){
if (new Date(a.released)>new Date(b.released))
  return -1;
if (new Date(a.released)<new Date(b.released))
  return 1;
return 0
}

//the function to sort by descending date
function date_desc(a,b){
if (new Date(a.released)>new Date(b.released))
  return 1;
if (new Date(a.released)<new Date(b.released))
  return -1;
return 0
}



//function to apply the sorting parameter by simply modifying the currentBrands object

//only the brands are needed because the products are displayed and rendered from this object only
function sort(typeOfSort, brands) {
  if(typeOfSort=='price-asc'){
    Object.keys(brands).forEach((brand, i) => {
      brands[brand].sort(price_asc);
    });}
  else if (typeOfSort=='price-desc'){
    Object.keys(brands).forEach((brand, i) => {
      brands[brand].sort(price_desc);
    });}
  else if (typeOfSort=='date-asc'){
    Object.keys(brands).forEach((brand, i) => {
      brands[brand].sort(date_asc);
    });}
  else if (typeOfSort=='date-desc'){
    Object.keys(brands).forEach((brand, i) => {
      brands[brand].sort(date_desc);
    });}
  return brands;
}

// feature 7-8-9-10-11: Indicate the number of products displayed

//updating the indicator with the length of the array displayed
// number of recent products

const renderIndicators = products => {

  if(products.length>0){
  spanNbProducts.innerHTML =`<strong>${ products.length}</strong>`;
  spanNewProducts.innerHTML=`<strong>${ recent_products(products).length}</strong>`;
  spanP50.innerHTML=`<strong>${percentile(products,50)+"€"}</strong>`;
  spanP90.innerHTML=`<strong>${percentile(products,90)+"€"}</strong>`;
  spanP95.innerHTML=`<strong>${percentile(products,95)+"€"}</strong>`;
  spanLastRelease.innerHTML=`<strong>${products.sort(date_asc)[0].released}</strong>`;
}
};

// this needs to be updated whenever the number of products displayer changes
// when --> changing page/brand/filter/show

//function to compute the specified percentile of the products

function percentile(products, perc){

  if (products.length>0){
  //first order the products by descending price
  products.sort(price_desc);
  //get the index of needed product
  let index=Math.trunc(products.length/100*perc); //returns the integer truncature of a number
  return products[index].price;}
}


//feature 12 : modification of the function "renderProduct"
// ---> target="_blank" argument added in the html override


//feature 13 :
// creation of a currentFavorites variable
//modification of the renderProduct function to add a button after each product

const addFavorite = (uuid) => {
  currentFavorites.push(currentProducts.find(product => product.uuid==uuid));
  render();

}

const removeFavorite = (uuid) => {
  currentFavorites=currentFavorites.filter(product => product.uuid != uuid);
  render();
}

//feature 14:

// modification of the currentFilter variable by adding a favorite filter
// adding the new filter in the "setCurrentFilter" and "applyFilter" functions
// adding a security by the length of the product array argument in the renderIndicators function


/**
 * Declaration of all Listeners
 */

/**
 * Select the number of products to display
 * @type {[type]}
 */
selectShow.addEventListener('change', event => {
  fetchProducts(currentPagination.currentPage, parseInt(event.target.value))
    .then(setCurrentProducts)
    .then(() => render( currentPagination, currentBrands, currentFilter));
});

selectPage.addEventListener('change', event => {
  fetchProducts(parseInt(event.target.value), currentPagination.pageSize)
    .then(setCurrentProducts)
    .then(() => render(currentPagination, currentBrands, currentFilter));
});

selectBrand.addEventListener('change', event => {
   currentFilter.brand=event.target.value;
   renderProducts(applyFilter(currentBrands,currentFilter));
   renderIndicators(applyFilter(currentBrands,currentFilter));
});


filterPrice.addEventListener('change', event => {
   currentFilter = setCurrentFilter(currentFilter);
   renderProducts(applyFilter(currentBrands, currentFilter));
   renderIndicators(applyFilter(currentBrands,currentFilter));
});

filterRelease.addEventListener('change', event => {
   currentFilter = setCurrentFilter(currentFilter);
   renderProducts(applyFilter(currentBrands, currentFilter));
   renderIndicators(applyFilter(currentBrands,currentFilter));
});

filterFavorites.addEventListener('change', event => {
   currentFilter = setCurrentFilter(currentFilter);
   renderProducts(applyFilter(currentBrands, currentFilter));
   renderIndicators(applyFilter(currentBrands,currentFilter));
});


selectSort.addEventListener('change', event =>{
  currentBrands=sort(event.target.value, currentBrands);
  renderProducts(applyFilter(currentBrands,currentFilter));
})

document.addEventListener('DOMContentLoaded', () =>
  fetchProducts()
    .then(setCurrentProducts)
    .then(() => render(currentPagination, currentBrands, currentFilter))
);