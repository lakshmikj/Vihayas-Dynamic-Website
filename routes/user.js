const { response } = require('express');
var express = require('express');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers');
const usersHelpers = require('../helpers/users-helpers')

const verifyLogin=(req,res,next) => {
  if(req.session.user){
    next()
  }else{
    res.redirect('/login')
  }
};
/* GET home page. */

router.get('/',async function (req, res, next) {
  let user = req.session.user;
  //console.log(req.session.user._id);
  //console.log(user);
  let cartCount=null;
  if(req.session.user){
   cartCount=await usersHelpers.getCartCount(req.session.user._id)
  }
  productHelpers.getAllProducts().then((products) => {
    //console.log(products);
    res.render('user/uview-products', { products,user,cartCount,userh:true});
  })
  /* let products=[
     {
       nam:'aline kurta-white',
       image:"https://images.meesho.com/images/products/42712985/tw9kg_400.webp",
       description:"Aline white kurta,cottan fabric,S to Xl sizes available"
 
     },
     {
       nam:'Frock kurta-White',
       image:'https://images.meesho.com/images/products/188330432/qbedf_400.webp',
       description:'White frock kurta,cotton fabric,S to Xl sizes available'
     },
     {
       nam:'Flared kurta-Blue',
       image:'https://images.meesho.com/images/products/49056795/kaov4_400.webp',
       description:'Blue flared kurta,cotton fabric,S to Xl sizes available'
     },
     {
       nam:'Anarkali kurta-Cyan',
       image:'https://images.meesho.com/images/products/13362340/1c14a_400.webp',
       description:'Cyan anarkali kurta,linen fabric,S to Xl sizes available'
     }
   ] */

});

router.get('/login', (req, res) => {
  console.log(req.session.user);
  if (req.session.user) {
    res.redirect('/');
  } else{

    res.render('user/ulogin',{"LoginErr":req.session.userLoginErr,userh:true});
    req.session.userLoginErr = false;
  }
});

router.get('/signup', (req, res) => {
  res.render('user/usignup',{userh:true});
});

router.post('/signup', (req, res) => {
  usersHelpers.doSignup(req.body).then((response) => {
    console.log(response);
    req.session.user=response.user;
    req.session.user.loggedIn=true;
    res.redirect('/')
  });
});

router.post('/login', (req, res) => {
  //passing data from browser to dologin function as req.body
  usersHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.user = response.user;
      req.session.user.loggedIn = true;
      res.redirect('/');
    } else {
      //req.session.userLoginErr = true;
      req.session.userLoginErr = "invalid username or password"
      res.redirect('/login');
    }
  })
});

router.get('/logout', (req, res) => {
  req.session.user=null;
  //req.session.user.loggedIn =false;
  res.redirect('/');
});

router.get('/cart',verifyLogin,async(req,res) => {
  if(req.session.user){
    cartCount=await usersHelpers.getCartCount(req.session.user._id)
   }
 let product=await usersHelpers.getCartproducts(req.session.user._id)
  let totalAmount=0
  
  if(product.length>0){
   totalAmount=await usersHelpers.getTotalAmount(req.session.user._id)
  }
  console.log(product);
  res.render('user/ucart',{product,user:req.session.user._id,totalAmount,cartCount,userh:true})
});

router.get('/add-to-cart/:id',(req,res) =>{
  console.log("api call");
  //req.session.isloggedin=true;
 // console.log(req.session.user._id);
  usersHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
    res.json({status:true})
    //res.redirect('/')
  })
  
});

router.post('/change-product-quantity',(req,res,next) =>{
  console.log(req.body);
  usersHelpers.changeProductQuantity(req.body).then(async(response)=>{
     response.total=await usersHelpers.getTotalAmount(req.body.user)
    res.json(response)
  })
})

router.get('/place-order',verifyLogin,async(req,res)=>{
  let total= await usersHelpers.getTotalAmount(req.session.user._id)
  res.render('user/place-order',{total,user:req.session.user,userh:true})
})

router.post('/place-order',async(req,res)=>{
  let product=await usersHelpers.getCartProductList(req.body.userId)
  let totalPrice=await usersHelpers.getTotalAmount(req.body.userId)
  usersHelpers.placeOrder(req.body,product,totalPrice).then((orderId)=>{
    if(req.body['payment-method']==='COD'){
      res.json({codSuccess:true})
    }else{
      usersHelpers.generateRazorpay(orderId,totalPrice).then((response)=>{
        res.json(response)
      })
    }
    
  })
  console.log(req.body);
})

router.get('/order-success',verifyLogin,(req,res)=>{
  res.render('user/order-success',{user:req.session.user,userh:true})
})

router.get('/orders',verifyLogin,async(req,res)=>{
  let orders=await usersHelpers.getUserOrders(req.session.user._id)
  res.render('user/orders',{user:req.session.user,orders,userh:true})
})

router.get('/view-ordered-products/:id',verifyLogin,async(req,res)=>{
  let products=await usersHelpers.getOrderedProducts(req.params.id)
  res.render('user/view-ordered-products',{user:req.session.user,products,userh:true})
})

router.post('/verify-payment',(res,req)=>{
  console.log(req.body);
  usersHelpers.verifyPayment(req.body).then(()=>{
    usersHelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
      console.log('payment successfull');
      res.json({status:true})
    })
  }).catch((err)=>{
    console.log(err);
    res.json({status:false})
  })
})
router.get('/categoryKurta',verifyLogin,async(req,res)=>{
  if(req.session.user){
    cartCount=await usersHelpers.getCartCount(req.session.user._id)
   }
   productHelpers.getCategoryKurta().then((products) => {
     //console.log(products);
     res.render('user/kurtaCategory', { products,user:req.session.user._id,cartCount,userh:true});
})
})

router.get('/categoryDress',verifyLogin,async(req,res)=>{
  if(req.session.user){
    cartCount=await usersHelpers.getCartCount(req.session.user._id)
   }
   productHelpers.getCategoryDress().then((products) => {
     //console.log(products);
     res.render('user/dressCategory', { products,user:req.session.user._id,cartCount,userh:true});
})
})

router.get('/categoryKids',verifyLogin,async(req,res)=>{
  if(req.session.user){
    cartCount=await usersHelpers.getCartCount(req.session.user._id)
   }
   productHelpers.getCategoryKids().then((products) => {
     //console.log(products);
     res.render('user/kidsCategory', { products,user:req.session.user._id,cartCount,userh:true});
})
})

module.exports = router;
