# CSV Upload Format Guide

## CSV File Format for Menu Items

You can bulk upload menu items using a CSV file. Here's the format:

### Required Format

Your CSV file should have the following columns:

| Column Name | Description | Required | Example |
|------------|-------------|----------|---------|
| **name** | Item name | ✅ Yes | Xerox |
| **price** | Item price (in ₹) | ✅ Yes | 2 |
| **image** | Image URL | ❌ No | https://example.com/image.jpg |

### CSV Example

```csv
name,price,image
Xerox,2,https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop
Passport size print,50,https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=300&fit=crop
Maxi photo print,100,https://images.unsplash.com/photo-1516035069371-29a1b244b32a?w=400&h=300&fit=crop
Printout,5,https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=400&h=300&fit=crop
Colour print out,10,https://images.unsplash.com/photo-1611224923853-04b19e2e2b1d?w=400&h=300&fit=crop
```

### Column Name Variations

The system recognizes these column name variations:

- **Name column:** `name`, `item`, `item name`, `product name`
- **Price column:** `price`, `cost`, `amount`, `rate`
- **Image column:** `image`, `url`, `image url`, `photo`, `image_url`

### How to Use

1. **Create a CSV file** using Excel, Google Sheets, or any text editor
2. **Save as CSV format** (Comma Separated Values)
3. **Go to Admin Panel** → Manage Menu
4. **Click "Upload CSV"** button
5. **Select your CSV file**
6. **Choose an option:**
   - **OK** = Add items to existing menu
   - **Cancel** = Replace all existing items (with confirmation)

### Tips

- ✅ First row must be the header row
- ✅ Use commas to separate columns
- ✅ Image URL is optional (will use default if not provided)
- ✅ Price must be a valid number
- ✅ Empty rows will be skipped
- ✅ Items with invalid data will be skipped

### Sample CSV Template

A template file `menu_template.csv` is included in the project. You can:
1. Open it in Excel/Google Sheets
2. Edit the data
3. Save as CSV
4. Upload to the system

### Notes

- CSV files are parsed automatically
- Invalid rows are skipped (no errors, just warnings)
- Image URLs should be publicly accessible
- Prices are stored in ₹ (Indian Rupees)

