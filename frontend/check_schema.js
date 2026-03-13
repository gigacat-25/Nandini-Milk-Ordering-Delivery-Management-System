import { supabase } from './src/lib/supabase.js'

async function checkSchema() {
    const { data, error } = await supabase.from('products').select('*').limit(1)
    if (error) {
        console.error('Error fetching product:', error)
    } else if (data && data.length > 0) {
        console.log('Product columns:', Object.keys(data[0]))
    } else {
        console.log('No products found to check schema.')
    }
}

checkSchema()
