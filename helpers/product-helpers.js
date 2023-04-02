var db = require('../config/connection')
//var collection = require('../config/collections')
const collections = require('../config/collections')
//const {// response } = require('express')
var ObjectId = require('mongodb').ObjectId
const bcrypt = require('bcrypt');
module.exports = {

    addProduct: (product, callback) => {
        //console.log(product);
        db.get().collection('product').insertOne(product).then((data) => {

            callback(data.insertedId)
        })
    },

    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collections.PRODUCT_COLLECTION).find().toArray()
            resolve(products);
        })
    },

    deleteProduct:(prodID)=>{
        return new Promise((resolve, reject) => {
            console.log(new ObjectId(prodID))
            db.get().collection(collections.PRODUCT_COLLECTION).deleteOne({ _id:new ObjectId(prodID)}).then((response)=>{
                console.log(response);
                resolve(response);
            })
        })
    },

    getProductDetails:(proId) =>{
        return new Promise((resolve,reject) =>{
            db.get().collection(collections.PRODUCT_COLLECTION).findOne({_id:new ObjectId(proId)}).then((product) =>{
                resolve(product);
            })
        })
    },

    updateProduct:(proId,proDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.PRODUCT_COLLECTION).updateOne({_id:new ObjectId(proId)},{
                $set:{
                    Name:proDetails.Name,
                    Category:proDetails.Category,
                    Description:proDetails.Description,
                    Price:proDetails.Price
                }
            }).then((response)=>{
                resolve()
            })
        })

    },

    getCategoryKurta:()=>{
        return new Promise(async(resolve,reject)=>{
            let products= await db.get().collection(collections.PRODUCT_COLLECTION).find({Category:"kurta"}).toArray()
            resolve(products);
        })
    },

    getCategoryDress:()=>{
        return new Promise(async(resolve,reject)=>{
            let products= await db.get().collection(collections.PRODUCT_COLLECTION).find({Category:"dress"}).toArray()
            resolve(products);
        })
    },

    getCategoryKids:()=>{
        return new Promise(async(resolve,reject)=>{
            let products= await db.get().collection(collections.PRODUCT_COLLECTION).find({Category:"kids"}).toArray()
            resolve(products);
        })
    },

}
