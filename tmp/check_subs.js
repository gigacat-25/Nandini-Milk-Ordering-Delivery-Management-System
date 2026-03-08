import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../frontend/.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function check() {
    console.log('Fetching subscriptions...')
    const { data, error } = await supabase.from('subscriptions').select('*')
    if (error) {
        console.error(error)
    } else {
        console.log('Count:', data.length)
        console.log(data)
    }

    console.log('\nFetching users...')
    const { data: users } = await supabase.from('users').select('*')
    console.log('Users:', users?.length)
}

check()
