var express = require('express');
var router = express.Router();
const bodyParse = require('body-parser');
const usersHelpers = require('../helpers/users-helpers');
const productHelpers = require('../helpers/product-helpers');
const adminHelpers = require('../helpers/admin-helpers');
//const { route } = require('./user');
const { response } = require('express');
var adminhd=true;
const verifyALogin=(req,res,next) => {
  if(req.session.admin){
    next()
  }else{
    res.redirect('adminlogin')
  }
};

/* GET users listing. */
router.get('/', function(req, res, next) {
  let admin = req.session.admin;
  productHelpers.getAllProducts().then((products) =>{
  
    console.log(products);
    res.render('admin/adminpage',{products,admin});
  })
 /* let products=[
    {
      nam:'aline kurta-white',
      category:'Kurta',
      price:500,
      image:"https://images.meesho.com/images/products/42712985/tw9kg_400.webp",
      description:"Aline white kurta,cottan fabric,S to Xl sizes available"

    },
    {
      nam:'Frock kurta-White',
      category:'Kurta',
      price:750,
      image:'https://images.meesho.com/images/products/188330432/qbedf_400.webp',
      description:'White frock kurta,cotton fabric,S to Xl sizes available'
    },
    {
      nam:'Flared kurta-Blue',
      category:'Kurta',
      price:899,
      image:'https://images.meesho.com/images/products/49056795/kaov4_400.webp',
      description:'Blue flared kurta,cotton fabric,S to Xl sizes available'
    },
    {
      nam:'Anarkali kurta-Cyan',
      category:'Kurta',
      price:1289,
      image:'https://images.meesho.com/images/products/13362340/1c14a_400.webp',
      description:'Cyan anarkali kurta,linen fabric,S to Xl sizes available'
    }
  ] */
  
});

router.get('/allproducts',verifyALogin,(req,res)=>{
  productHelpers.getAllProducts().then((products) =>{
  res.render('admin/view-products',{products,admin:req.session.admin})
})
});
router.get('/adminlogin',(req, res)=>{
  if(req.session.admin){
    res.redirect('/')
  }else{
    res.render('admin/adlogin',{"LoginErr":req.session.adminLoginErr})
    req.session.adminLoginErr = false;
  }
    
  });

//router.get('/adminsignup',(req, res) => {
  //res.render('admin/adsignup');
//});

//router.post('/asignup',(req, res) => {
 // console.log(req.body);
  //adminHelpers.doadSignup(req.body).then((response) => {
    //console.log(response);
    //req.session.admin=response.admin;
    //req.session.admin.loggedIn=true;
    //res.redirect('allproducts')
  //});
//});

router.post('/adminlogin',(req, res) =>{
  //passing data from browser to dologin function as req.body
  adminHelpers.doadLogin(req.body).then((response) => {
    if (response.status) {
      req.session.admin = response.admin;
      req.session.admin.loggedIn = true;
      res.redirect('/admin');
    } else {
      //req.session.userLoginErr = true;
      req.session.adminLoginErr = true
      res.redirect('/admin/adminlogin');
    }
  })
});

router.get('/adminlogout',(req, res) => {
  req.session.admin=null;
  //req.session.admin.loggedIn=false;
  res.redirect('/admin/adminlogin');
});

router.get('/add-product',verifyALogin,function(req,res,next){
  res.render('admin/add-product',{admin:true});
})

router.post('/add-product',function(req,res){
  //res.send('Added Successfully');
  //console.log(req.body)
 // console.log(req.files.Image)

  productHelpers.addProduct(req.body,(id)=>{
    let image= req.files.Image
    console.log(id);
    image.mv('./public/product-images/'+id+'.jpg',(err,done) =>{
      if(!err){
        res.render("admin/add-product",{admin:true});
      }else{
        console.log(err);
      }
    })
   
  })
  
  
  
});

router.get('/delete-product/:id',(req,res) => {
  let proId = req.params.id
  //console.log(proId);
  productHelpers.deleteProduct(proId).then((response) => {
    res.redirect('/admin')
  })
});

router.get('/edit-product/:id',async(req,res) => {
  let product = await productHelpers.getProductDetails(req.params.id)
  console.log(product);
  res.render("admin/edit-product",{admin:true,product});
});

router.post('/edit-product/:id',(req,res) => {
  let id = req.params.id
  productHelpers.updateProduct(req.params.id,req.body).then(()=>{
    res.redirect('/admin')

    if(req.files.Image){
      let image = req.files.Image;
      image.mv('./public/product-images/'+id+'.jpg')
      
    }
  })
});

router.get('/allOrders',verifyALogin,async(req,res)=>{
  let orders = await adminHelpers.getUserOrders(req.session)
  res.render('admin/all-orders',{admin:req.session.admin,orders})
});

router.get('/allUsers',verifyALogin,async(req,res)=>{
  let users= await adminHelpers.getAllUsers(req.session)
  res.render('admin/all-users',{admin:req.session.admin,users})
});

module.exports = router;
