const { createClient } = require('@supabase/supabase-js')
const supabase = createClient('https://tmygxnekjzyhwdajayrd.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRteWd4bmVranp5aHdkYWpheXJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4ODc1OTYsImV4cCI6MjA4ODQ2MzU5Nn0.hWVpjfACwrvKmp6mSTPK8toze4dSrl1DusuBfET4_ek')

async function test() {
    console.log("1. Testing DB Insert...");
    const { data, error } = await supabase.from('delivery_photos').insert([{
        delivery_type: 'order',
        target_id: '00000000-0000-0000-0000-000000000000',
        delivery_date: '2026-03-09',
        photo_url: 'https://test.com/photo.jpg'
    }]);
    console.log("DB Insert Error:", error ? error.message : "Success");

    console.log("2. Testing Storage Upload...");
    const { data: uploadData, error: uploadErr } = await supabase.storage.from('delivery-photos').upload('test/upload.txt', 'hello', { upsert: true, contentType: 'text/plain' });
    console.log("Storage Upload Error:", uploadErr ? uploadErr.message : "Success");
}
test()
