var db = require('../config/connection');
const collections = require('../config/collections');
var ObjectId = require('mongodb').ObjectId;
const bcrypt = require('bcrypt');

module.exports = {

    //doadSignup: (adminData) => {
        //return new Promise(async (resolve, reject) => {
            //adminData.Password = await bcrypt.hash(adminData.Password, 10);
            //db.get().collection(collections.ADMIN_COLLECTION).insertOne(adminData).then((data) => {
                //console.log(data);

                //resolve(data.insertedId);
            //})
        //})
    //},

    doadLogin: (adminData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false;
            let response = {}
            //finding data form database and assign it to variable user
            let admin = await db.get().collection(collections.ADMIN_COLLECTION).findOne({ Email: adminData.Email })
            if (admin) {
                //compare password from Browser and data base
                bcrypt.compare(adminData.Password, admin.Password).then((status) => {
                    if (status) {
                        console.log("logined success");
                        response.admin = admin;
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

    getUserOrders:(user)=>{
        return new Promise(async(resolve,reject)=>{
            let orders = await db.get().collection(collections.ORDER_COLLECTION).find({}).toArray()
                resolve(orders)
        })
    },

    getAllUsers:(user)=>{
        return new Promise(async(resolve,reject)=>{
            let users = await db.get().collection(collections.USER_COLLECTION).find({}).toArray()
            resolve(users)
        })
    },
}