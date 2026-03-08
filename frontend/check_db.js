import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function check() {
    const { data, error } = await supabase.from('subscriptions').select('*')
    if (error) {
        console.error(error)
    } else {
        console.log('Total Subscriptions in DB:', data.length)
        if (data.length > 0) {
            console.log(data)
        }
    }
}

check()
