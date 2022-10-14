const attr = require('dynamodb-data-types').AttributeValue;

exports.handler = async (event) => {


console.log(event)

    const order = event.body
    console.log('sanitizeOrder: ', order)
      
      let valid = true
      const drinks = attr.unwrap(event.menu.Item)
      
      console.log('drinks',drinks.menu)


        // Check drink.
        const result = drinks.menu.filter ((item) => item.drink === order.drink)
        
  
        
        
        
        if (result.length === 0) return false
      
        // Check modifiers
        console.log(JSON.stringify(result, null, 0))
        const modResult = order.modifiers.map((modifier) => {
          console.log(JSON.stringify(modifier, null, 0))
      
          const present = result[0].modifiers.filter((allowedModifiers) => allowedModifiers.Options.includes(modifier))
          if (present.length === 0) valid = false
        })
        console.log('sanitizeOrder: ', valid)
        // Order and modifiers both exist in the menu
        return valid
      }