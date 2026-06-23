const xlsx = require('xlsx');
const fs = require('fs');

const file1 = '../stok-barang-2026-06-23.xlsx';
const file2 = '../layanan_digital_2026-06-23.xlsx';

function preview(file) {
    if (fs.existsSync(file)) {
        console.log(`\n--- Preview: ${file} ---`);
        const wb = xlsx.readFile(file);
        const sheetName = wb.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });
        console.log('Headers:', data[0]);
        console.log('Row 1:', data[1]);
        console.log('Row 2:', data[2]);
    } else {
        console.log(`${file} not found.`);
    }
}

preview(file1);
preview(file2);
