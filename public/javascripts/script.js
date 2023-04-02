const { response } = require("express")

function addToCart(proId){
    $.ajax({
        url:'/add-to-cart/'+proId,
        method:'get',
        success:(response)=>{
            if(response.status){
                let count=$('#cart-count').html()
                count=parseInt(count)+1
                $('#cart-count').html(count)
            }
            
        }
    })
}

function changeQuantity(cartId,proId,userId,count){
    let quantity=parseInt(document.getElementById(proId).innerHTML)
    count=parseInt(count)
    console.log(count);
    $.ajax({
        url:'/change-product-quantity',
        data:{
            cart:cartId,
            product:proId,
            user:userId,
            count:count,
            quantity:quantity,
            cartqty:count,
        },
        method:'post',
        success:(response)=>{
            
            if(response.removeProduct){
                alert("Product removed from cart")
                location.reload()
            }else{

                document.getElementById(proId).innerHTML=quantity+count
                document.getElementById('totalA').innerHTML=response.total
            }
        }
    })
}

function removeProductFromCart(proId,cartId){
    $.ajax({
        url:'/remove-Cart',
        data:{
            product:proId,
            cart:cartId,
        },
        method:'post',
        success:(response)=>{
            alert("Are you sure want to remove this product ?")
            location.reload()
        }
    })
}

