var db = require('../config/connection');
const collections = require('../config/collections');
const bcrypt = require('bcrypt');
const { response } = require('express');
var ObjectId = require('mongodb').ObjectId;
const Razorpay = require('razorpay');
const { resolve } = require('path');
const { rejects } = require('assert');
var instance = new Razorpay({
    key_id: 'YOUR_KEY_ID',
    key_secret: 'YOUR_KEY_SECRET',
  });
module.exports = {
    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            userData.Password = await bcrypt.hash(userData.Password, 10);
            db.get().collection(collections.USER_COLLECTION).insertOne(userData).then((data) => {
                console.log(data);

                resolve(data.insertedId);
            })
        })
    },

    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false;
            let response = {}
            //finding data form database and assign it to variable user
            let user = await db.get().collection(collections.USER_COLLECTION).findOne({ Email: userData.Email })
            if (user) {
                //compare password from Browser and data base
                bcrypt.compare(userData.Password, user.Password).then((status) => {
                    if (status) {
                        console.log("logined success");
                        response.user = user;
                        response.status = true;
                        resolve(response);
                    } else {
                        console.log("password error");
                        resolve({ status: false });
                    }
                })
            } else {
                console.log("login failed");
                resolve({ status: false });
            }
        })
    },

    addToCart: (proId,userId) => {
        let proObj={
            item:new ObjectId(proId),
            quantity:1,
        }
    return new Promise(async (resolve, reject) => {
            let userCart=await db.get().collection(collections.CART_COLLECTION).findOne({user:new ObjectId(userId) })
            if (userCart) {
                let proExist=userCart.products.findIndex(product=>product.item==proId)
                console.log(proExist);
                if(proExist!=-1){
                    db.get().collection(collections.CART_COLLECTION).updateOne({'products.item':new ObjectId(proId),user:new ObjectId(userId)},
                    {
                        $inc:{'products.$.quantity':1}
                    }
                    ).then(() =>{
                        resolve()
                    })
                }else{
                 db.get().collection(collections.CART_COLLECTION).updateOne({user:new ObjectId(userId)},{$push:{products:proObj}}).then((response)=>{
                    resolve()
                    })
                }
            } else {
                let cartObj = {
                    user:new ObjectId(userId),
                    products:[proObj]
                }
                db.get().collection(collections.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                })
            }
            
           
        })
    },

    getCartproducts:(userId) =>{
        return new Promise(async(resolve,reject)=>{
            let cartItems= await db.get().collection(collections.CART_COLLECTION).aggregate([
                {   //matching userId finding particular users cart
                    $match:{user:new ObjectId(userId)},
                },
                {
                    $unwind:"$products",
                },
                {
                    $project:{
                        item:"$products.item",
                        quantity:"$products.quantity",
                    },
                },
                {
                    $lookup:{
                        from:collections.PRODUCT_COLLECTION,
                        localField:"item",
                        foreignField:"_id",
                        as:"product",
                    }
                },
                //{
                   // $lookup:{   //from:searching inside collections.PRODUCT_COLLECTION which means the database product
                        //from:collections.PRODUCT_COLLECTION,
                //},
                {
                    $project:{
                        item:1,
                        quantity:1,
                        product:{$arrayElemAt:["$product",0]},
                    },
                },
                    
               // {
                        //let:proList assign array products inside cart db
                       // let:{proList:'$products'},
                       // pipeline:[
                           // {
                                //$match:{
                                    //$expr:{
                                       // $in:['$_id',"$$proList"]
                                    //}
                               // }

                           // }
                       // ],
                      // as:'cartItems',
                    //}
               // },
            ]).toArray();
            console.log(cartItems);
            resolve(cartItems);
        })

    },

    getCartCount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let count=0;
            let cart=await db.get().collection(collections.CART_COLLECTION).findOne({user:new ObjectId(userId)})
            if(cart){
                //count assign let cart which find and assign above line.products which is array inside cartObj.length function
                count=cart.products.length
            }
            resolve(count)
        })
    },

    changeProductQuantity:(details) =>{
        dcount=parseInt(details.count)
        dquantity=parseInt(details.quantity)
        ccount=parseInt(details.cartqty)
        return new Promise((resolve,reject) =>{
            if(dcount==-1 && dquantity==1|| dquantity>=1 && dcount===0){
                db.get().collection(collections.CART_COLLECTION).updateOne({_id:new ObjectId(details.cart)},
                {
                    $pull:{products:{item:new ObjectId(details.product)}}
                }
                ).then((response)=>{
                    resolve({removeProduct:true})
                })
            }else{
            db.get().collection(collections.CART_COLLECTION).updateOne({_id:new ObjectId(details.cart),'products.item':new ObjectId(details.product)},
                    {
                        $inc:{'products.$.quantity':dcount}
                    }
                    ).then((response) =>{
                        resolve({status:true})
                    })
                    
                }
        })
    
    },

    getTotalAmount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let total= await db.get().collection(collections.CART_COLLECTION).aggregate([
                {   //matching userId finding particular users cart
                    $match:{user:new ObjectId(userId)},
                },
                {
                    $unwind:"$products",
                },
                {
                    $project:{
                        item:"$products.item",
                        quantity:"$products.quantity",
                    },
                },
                {
                    $lookup:{
                        from:collections.PRODUCT_COLLECTION,
                        localField:"item",
                        foreignField:"_id",
                        as:"product",
                    },
                },
                {
                    $project:{
                        item:1,
                        quantity:1,
                        product:{$arrayElemAt:["$product",0]},
                    },
                },
                {
                
                    $group:{
                        _id:null,
                        total:{$sum:{$multiply:[{$toInt:"$quantity"},{$toInt:"$product.Price"},],},},
                    },
                },
            ]).toArray();
           //console.log($quantity,$product.Price); 
            console.log(total);
            if(total[0]){
            resolve(total[0].total);
            }else{
                resolve([]);
            }
        })
    },

    placeOrder:(order,products,total)=>{
        return new Promise((resolve,reject)=>{
            console.log(order,products,total);
            let status=order['payment-method']==='COD'?'placed':'pending'
            let orderObj={
                deliveryDetails:{
                    address:order.address,
                    mobile:order.mobile,
                    pincode:order.pincode,
                },
                userId:new ObjectId(order.userId),
                paymentMethode:order['payment-method'],
                products:products,
                totalAmount:total,
                date:new Date(),
                status:status,
                
            }
            db.get().collection(collections.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
                db.get().collection(collections.CART_COLLECTION).deleteOne({user:new ObjectId(order.userId)})
                resolve(response)
            })
        })
    },

    getCartProductList:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cart=await db.get().collection(collections.CART_COLLECTION).findOne({user:new ObjectId(userId)})
            resolve(cart.products);
        })

    },

    getUserOrders:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let orders=await db.get().collection(collections.ORDER_COLLECTION).find({userId:new ObjectId(userId)}).toArray()
            resolve(orders)
        })
    },

    getOrderedProducts:(orderId)=>{
        return new Promise(async(resolve,reject)=>{
            let orderItems=await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                {
                    $match:{_id:new ObjectId(orderId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity',
                    },
                },
                {
                    $lookup:{
                        from:collections.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,
                        quantity:1,
                        product:{$arrayElemAt:['$product',0]},
                    },
                },
            ]).toArray()
            console.log(orderItems);
            resolve(orderItems)
        })

    },

    generateRazorpay:(orderId,total)=>{
       return new Promise((resolve,reject)=>{
        instance.orders.create({
          amount: total*100,
          currency: "INR",
          receipt: ""+orderId,
          notes: {
            key1: "value3",
            key2: "value2"
          }
        })
        resolve(order);
       }) 
    },

    verifyPayment:(details)=>{
        return new Promise((resolve,reject)=>{
            const crypto = require('crypto');
            const hmac = crypto.createHmac('sha256','secretkey');
            hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]'])
            hmac=hmac.digest('hex')
            if(hmac==details['payment[razorpay_signature]']){
                resolve()
            }else{
                reject()
            }
        })
    },

    changePaymentStatus:(orderId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.ORDER_COLLECTION).updateOne({_id:new ObjectId(orderId)},
            {
                $set:{
                    status:'placed'
                }
            }
            ).then(()=>{
                resolve()
            })
        })
    },

}

