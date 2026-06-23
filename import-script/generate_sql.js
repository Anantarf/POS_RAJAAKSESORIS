const xlsx = require('xlsx');
const fs = require('fs');

const stokFile = '../stok-barang-2026-06-23.xlsx';
const layananFile = '../layanan_digital_2026-06-23.xlsx';
const outputFile = '../supabase/migrations/setup_data_import.sql';

let sql = `-- =============================================================================
-- SCRIPT IMPORT DATA: STOK BARANG & LAYANAN DIGITAL
-- =============================================================================\n\n`;

// Process Stok Barang
if (fs.existsSync(stokFile)) {
    const wb = xlsx.readFile(stokFile);
    const data = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    
    sql += `-- MENGIMPOR ${data.length} DATA STOK BARANG\n`;
    
    // Process in batches of 100 to avoid giant single insert if needed, but a single statement is fine for small datasets
    sql += `INSERT INTO public.produk (kode_produk, nama, kategori, stok, stok_minimum, harga_beli, harga_jual, status) VALUES\n`;
    
    const values = data.map(row => {
        const barcode = (row['Barcode'] || '').toString().trim().replace(/'/g, "''");
        const nama = (row['Nama Barang'] || '').toString().trim().replace(/'/g, "''");
        const kategori = (row['Kategori'] || '').toString().trim().replace(/'/g, "''");
        const stok = parseInt(row['Stok'] || 0, 10);
        const stok_min = parseInt(row['Stok Minimum'] || 0, 10);
        const modal = parseInt(row['Harga Modal'] || 0, 10);
        const jual = parseInt(row['Harga Jual'] || 0, 10);
        
        return `('${barcode}', '${nama}', '${kategori}', ${stok}, ${stok_min}, ${modal}, ${jual}, 'active')`;
    });
    
    sql += values.join(',\n') + '\n';
    sql += `;\n\n`;
}

// Process Layanan Digital
if (fs.existsSync(layananFile)) {
    const wb = xlsx.readFile(layananFile);
    const data = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    
    sql += `-- MENGIMPOR ${data.length} DATA LAYANAN DIGITAL\n`;
    sql += `INSERT INTO public.services_products (category, provider, name, service_type, cost, default_price, active) VALUES\n`;
    
    const values = data.map(row => {
        let category = (row['kategori'] || '').toString().trim().toLowerCase().replace(/'/g, "''");
        // Map category if needed
        if (category === 'game') category = 'voucher_game';
        if (category === 'pln') category = 'token_listrik';
        const provider = (row['Provider'] || '').toString().trim().replace(/'/g, "''");
        const name = (row['nama_Layanan'] || '').toString().trim().replace(/'/g, "''");
        const type = (row['jenis'] || '').toString().trim().replace(/'/g, "''");
        const cost = parseInt(row['modal'] || 0, 10);
        const price = parseInt(row['harga_jual'] || 0, 10);
        const active = (row['Status'] || '').toString().trim().toLowerCase() === 'aktif';
        
        return `('${category}', '${provider}', '${name}', '${type}', ${cost}, ${price}, ${active})`;
    });
    
    sql += values.join(',\n') + '\n';
    sql += `;\n\n`;
}

fs.writeFileSync(outputFile, sql);
console.log('SQL Generated: ' + outputFile);
