type ReceiptItem = {
    name: string;
    quantity: number;
    price: number;
};

type ReceiptData = {
    receiptNumber: string;
    date: string;
    time?: string;
    items: ReceiptItem[];
    total: number;
    totalAfterDiscount?: number; // Add totalAfterDiscount
    discount?: number; // Add discount
    businessInfo: {
        name: string;
        address: string;
        phone: string;
        email: string;
        website?: string;
        logo?: string; // Optional logo URL
    };
};

export function generateHTMLForReceipt(receiptData: ReceiptData): string {
    const { receiptNumber, date, items, total, totalAfterDiscount = 0, discount = 0, businessInfo } = receiptData;

    const itemsHTML = items.map(item => `
        <tr>
            <td>${item.name}</td>
            <td style="text-align:center;">${item.quantity}</td>
            <td style="text-align:right;">₹${item.price.toFixed(2)}</td>
            <td style="text-align:right;">₹${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
    `).join('');

    return `
    <html>
        <head>
            <style>
                :root {
                    --primary-color: #2196F3;
                    --secondary-color: #1565c0;
                    --text-color: #111827;
                    --border-color: #e5e7eb;
                    --background-color: #f9fafb;
                    --font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
                }
                body {
                    font-family: var(--font-family);
                    margin: 0;
                    padding: 0;
                    background-color: var(--background-color);
                    color: var(--text-color);
                }
                .container {
                    max-width: 380px;
                    margin: 24px auto;
                    background: #fff;
                    padding: 1.2rem 1.1rem 1.1rem 1.1rem;
                    border-radius: 12px;
                    box-shadow: 0 2px 8px rgba(33,150,243,0.10);
                    border: 1.5px dashed var(--primary-color);
                }
                .business-info {
                    border-bottom: 2px solid var(--primary-color);
                    padding-bottom: 8px;
                    margin-bottom: 12px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 6px;
                }
                .business-info img {
                    height: 38px;
                    object-fit: contain;
                    margin-bottom: 2px;
                    border-radius: 6px;
                }
                .business-info h2 {
                    color: var(--primary-color);
                    font-weight: 700;
                    font-size: 1.1rem;
                    margin: 0 0 2px 0;
                }
                .business-info p {
                    margin: 0;
                    font-size: 12px;
                    color: #555;
                }
                .receipt-header {
                    text-align: center;
                    margin-bottom: 10px;
                }
                .receipt-header h1 {
                    font-size: 1.15rem;
                    font-weight: 800;
                    color: #1a1a1a;
                    margin: 0 0 2px 0;
                }
                .receipt-header h3 {
                    font-weight: 600;
                    color: #333;
                    margin: 0 0 2px 0;
                    font-size: 0.98rem;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 10px;
                    font-size: 0.98rem;
                }
                th, td {
                    border: 1px solid #e5e7eb;
                    padding: 6px 4px;
                }
                th {
                    background-color: var(--primary-color);
                    color: white;
                    text-align: left;
                    font-size: 0.95rem;
                }
                tfoot td {
                    font-weight: bold;
                    font-size: 1.05em;
                }
                .total-row td {
                    border-top: 2px solid var(--primary-color);
                }
                .footer {
                    text-align: center;
                    margin-top: 1.5rem;
                    padding-top: 0.8rem;
                    border-top: 2px solid #e5e7eb;
                    color: #6b7280;
                    font-size: 0.85rem;
                    font-weight: 500;
                    font-style: italic;
                }
                .footer img {
                    height: 22px;
                    margin-bottom: 0.3rem;
                    display: block;
                    margin-left: auto;
                    margin-right: auto;
                }
                .footer p {
                    margin: 0.18rem 0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="business-info">
                    ${businessInfo.logo ? `<img src="${businessInfo.logo}" alt="Business Logo" />` : ''}
                    <h2>${businessInfo.name}</h2>
                    <p>${businessInfo.address}</p>
                    <p>Phone: +91-${businessInfo.phone}</p>
                    <p>Email: ${businessInfo.email}</p>
                    ${businessInfo.website ? `<p>Website: ${businessInfo.website}</p>` : ''}
                </div>
                <div class="receipt-header">
                    <h1>Receipt</h1>
                    <h3>Receipt Number: ${receiptNumber}</h3>
                    <h3>Date: ${date}</h3>
                    ${receiptData.time ? `<h3>Time: ${receiptData.time}</h3>` : ''}
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th style="text-align:center;">Qty</th>
                            <th style="text-align:right;">Price</th>
                            <th style="text-align:right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHTML}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3" style="text-align:right;">Subtotal</td>
                            <td style="text-align:right;">₹${total.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td colspan="3" style="text-align:right;">Discount</td>
                            <td style="text-align:right;">${discount}%</td>
                        </tr>
                        <tr class="total-row">
                            <td colspan="3" style="text-align:right;">Total After Discount</td>
                            <td style="text-align:right;">₹${(totalAfterDiscount ?? total).toFixed(2)}</td>
                        </tr>
                        <tr class="total-row">
                            <td colspan="3" style="text-align:right;">Grand Total</td>
                            <td style="text-align:right;">₹${total.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>
                <div class="footer">
                    <img src="https://oucfxeezfamenmsqkgib.supabase.co/storage/v1/object/public/receiptify/appImages/Receiptify-mdpi.webp" alt="App Logo" style="height: 32px; margin-bottom: 0.5rem; display: block; margin-left: auto; margin-right: auto; border-radius: 100px" />
                    <p>Generated by Receiptify - Your Smart Receipt Generator</p>
                    <p>© ${new Date().getFullYear()} Receiptify. All rights reserved.</p>
                </div>
            </div>
        </body>
    </html>
    `;
}
