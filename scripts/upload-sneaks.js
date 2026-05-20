// scripts/upload-sneaks.js
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SERVICE_ROLE_KEY);
const folder = './sneak-peeks';

async function upload() {
  const files = fs.readdirSync(folder).filter(f => /\.(png|jpg|jpeg)$/i.test(f));
  
  for (const file of files) {
    const filePath = path.join(folder, file);
    const { error } = await supabase.storage
      .from('SneakPeeks')
      .upload(file, fs.readFileSync(filePath), { 
        contentType: 'image/png',
        upsert: true // overwrite if exists
      });
    
    if (error) console.log('Failed:', file, error.message);
    else console.log('Uploaded:', file);
  }
  
  // Get all storage objects
  const { data: list } = await supabase.storage.from('SneakPeeks').list();
  
  // Clear existing DB rows first (prevents duplicates)
  await supabase.from('sneak_peeks').delete().neq('id', 0);
  
  // Repopulate
  for (const item of list) {
    const { data: { publicUrl } } = supabase.storage
      .from('SneakPeeks')
      .getPublicUrl(item.name);
    await supabase.from('sneak_peeks').insert({ image_url: publicUrl });
  }
  
  console.log('Done! Total:', list.length);
}

upload();
