type TopItem = {
    name: string;
    quantity: number;
    revenue: number;
};

type DailySale = {
    date: string;
    total: number;
};

interface GenerateHTMLParams {
    selectedRangeLabel: string;
    totalSales: number;
    averageTransaction: number;
    topItems: TopItem[];
    dailySales: DailySale[];
    businessInfo?: {
        name: string;
        address: string;
        phone: string;
        email: string;
        website?: string;
        logo?: string;
    };
}

export function generateHTMLForReport({
    selectedRangeLabel,
    totalSales,
    averageTransaction,
    topItems,
    dailySales,
    businessInfo
}: GenerateHTMLParams): string {
    const topItemsHTML = topItems.map((item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>₹${item.revenue.toFixed(2)}</td>
        </tr>
    `).join('');

    const dailySalesHTML = dailySales.map(sale => `
        <tr>
            <td>${sale.date}</td>
            <td>₹${sale.total.toFixed(2)}</td>
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
                        --hover-color: #e0e7ff;
                        --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
                        --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
                        --font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
                    }

                    * {
                        box-sizing: border-box;
                    }
                    
                    body { 
                        font-family: var(--font-family);
                        color: var(--text-color);
                        line-height: 1.6;
                        margin: 0;
                        padding: 2rem;
                        background-color: var(--background-color);
                        -webkit-font-smoothing: antialiased;
                        -moz-osx-font-smoothing: grayscale;
                    }
                    
                    .container {
                        max-width: 900px;
                        margin: 0 auto;
                        background-color: #ffffff;
                        padding: 2rem 2.5rem;
                        border-radius: 16px;
                        box-shadow: var(--shadow-md);
                        border: 1px solid var(--border-color);
                        transition: box-shadow 0.3s ease;
                    }

                    .container:hover {
                        box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
                    }
                    
                    table { 
                        width: 100%;
                        border-collapse: separate;
                        border-spacing: 0;
                        margin: 1.5rem 0;
                        font-size: 1rem;
                        border-radius: 8px;
                        overflow: hidden;
                        box-shadow: var(--shadow-sm);
                    }
                    
                    th, td { 
                        padding: 1.25rem 2rem;
                        text-align: left;
                        border-bottom: 1px solid var(--border-color);
                    }
                    
                    th { 
                        background-color: var(--primary-color);
                        font-weight: 700;
                        color: white;
                        text-transform: uppercase;
                        font-size: 0.85rem;
                        letter-spacing: 0.1em;
                        user-select: none;
                    }
                    
                    tr:last-child td {
                        border-bottom: none;
                    }
                    
                    tr:nth-child(even) {
                        background-color: #f3f4f6;
                    }
                    
                    tr:hover {
                        background-color: var(--hover-color);
                        transition: background-color 0.25s ease-in-out;
                    }
                    
                    .header { 
                        text-align: center;
                        margin-bottom: 2rem;
                        padding-bottom: 1.5rem;
                        border-bottom: 3px solid var(--primary-color);
                    }
                    
                    .header h1 {
                        color: var(--primary-color);
                        margin: 0;
                        font-size: 2.5rem;
                        font-weight: 800;
                        letter-spacing: -0.03em;
                        text-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    }
                    
                    .header p {
                        color: #6b7280;
                        font-size: 1.125rem;
                        margin-top: 0.5rem;
                        font-weight: 500;
                    }
                    
                    .summary {
                        background: linear-gradient(90deg, #e0e7ff, #c7d2fe);
                        padding: 1.5rem 2rem;
                        border-radius: 12px;
                        margin: 2rem 0;
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 1.75rem;
                        box-shadow: var(--shadow-sm);
                        color: var(--primary-color);
                        font-weight: 600;
                        font-size: 1.1rem;
                    }
                    
                    .summary h2 {
                        grid-column: 1 / -1;
                        margin: 0 0 1rem 0;
                        color: var(--secondary-color);
                        font-size: 1.5rem;
                        font-weight: 700;
                        letter-spacing: 0.05em;
                    }
                    
                    .summary p {
                        margin: 0;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    
                    .summary p strong {
                        color: var(--text-color);
                    }
                    
                    .section-title {
                        color: var(--secondary-color);
                        margin: 2rem 0 1rem 0;
                        font-size: 1.5rem;
                        font-weight: 700;
                        display: flex;
                        align-items: center;
                        gap: 0.75rem;
                        border-bottom: 2px solid var(--border-color);
                        padding-bottom: 0.25rem;
                    }
                    
                    .footer {
                        text-align: center;
                        margin-top: 3rem;
                        padding-top: 1.5rem;
                        border-top: 2px solid var(--border-color);
                        color: #6b7280;
                        font-size: 0.9rem;
                        font-weight: 500;
                        font-style: italic;
                    }
                    
                    .footer p {
                        margin: 0.25rem 0;
                    }
                    
                    @media print {
                        body {
                            padding: 0;
                            background: white;
                        }
                        .container {
                            box-shadow: none;
                            padding: 0;
                            border: none;
                        }
                    }

                    @media (max-width: 600px) {
                        .container {
                            padding: 1rem 1.25rem;
                        }
                        .summary {
                            grid-template-columns: 1fr;
                            gap: 1rem;
                        }
                        .section-title {
                            font-size: 1.25rem;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container" style="padding-left: 2.5rem; padding-right: 2.5rem;">
                    <div class="header" style="display: flex; flex-direction: column; align-items: center; gap: 2px; border-bottom: 2px solid var(--primary-color); padding-bottom: 1.2rem; margin-bottom: 1.5rem; background: none;">
                        ${businessInfo?.logo ? `<img src="${businessInfo.logo}" alt="Business Logo" style="height: 54px; object-fit: contain; margin-bottom: 2px; margin-right: 0; box-shadow: 0 1px 4px rgba(33,150,243,0.08); border-radius: 100px; border-width: 2px; border-color: rgb(229, 231, 235)" />` : ''}
                        <div style="text-align: center; width: 100%; line-height: 1.2; margin-bottom: 0.1rem;">
                            <span style="font-weight:700; color: var(--primary-color); font-size: 1.25rem; letter-spacing: 0.01em;">${businessInfo?.name || ''}</span><br/>
                            <span style="font-size:12px; color:#555;">${businessInfo?.address || ''}</span><br/>
                            ${businessInfo?.phone ? '<span style= "font-size:12px; color:#555;" > Phone: +91-' + businessInfo?.phone + '</span><br/ >' : ''}
                            <span style="font-size:12px; color:#555;">Email: ${businessInfo?.email || ''}</span><br/>
                            ${businessInfo?.website ? `<span style="font-size:12px; color:#555;">Website: <a href='${businessInfo.website}'>${businessInfo.website}</a></span>` : ''}
                        </div>
                        <div style="width: 100%; text-align: center; margin-top: 0.3rem;">
                            <h1 style="color: var(--primary-color); margin: 0; font-size: 1.45rem; font-weight: 800; letter-spacing: -0.01em; text-shadow: none;">Sales Report</h1>
                            <p style="color: #6b7280; font-size: 1rem; margin: 0.2rem 0 0 0; font-weight: 500;">${selectedRangeLabel}</p>
                        </div>
                    </div>
                    
                    <div class="summary" style="background: #f5faff; padding: 0.75rem 1.25rem; border-radius: 10px; margin: 1.2rem 0 1.5rem 0; display: flex; flex-direction: row; justify-content: space-between; align-items: center; gap: 1.5rem; box-shadow: var(--shadow-sm); color: var(--primary-color); font-weight: 600; font-size: 1.05rem;">
                        <div style="display: flex; flex-direction: column; align-items: flex-start;">
                            <span style="font-size: 1.08rem; font-weight: 700; color: var(--secondary-color); margin-bottom: 2px;">Summary</span>
                            <span style="font-size: 0.98rem; color: #333; font-weight: 500;">Total Sales</span>
                            <span style="font-size: 1.08rem; font-weight: 700; color: var(--primary-color);">₹${totalSales.toFixed(2)}</span>
                        </div>
                        <div style="height: 36px; width: 1.5px; background: #e0e7ef; margin: 0 10px;"></div>
                        <div style="display: flex; flex-direction: column; align-items: flex-start;">
                            <span style="font-size: 0.98rem; color: #333; font-weight: 500;">Avg. Transaction</span>
                            <span style="font-size: 1.08rem; font-weight: 700; color: var(--primary-color);">₹${averageTransaction.toFixed(2)}</span>
                        </div>
                    </div>

                    <div style="text-align:right; color:#888; font-size:0.98rem; margin-bottom: 1.2rem;">
                        Report generated on: <span style="color:#333; font-weight:500;">${new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>

                    <h2 class="section-title">Top Selling Items</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Item</th>
                                <th>Quantity</th>
                                <th>Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${topItemsHTML}
                        </tbody>
                    </table>

                    <h2 class="section-title">Daily Sales</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${dailySalesHTML}
                        </tbody>
                    </table>

                    <div class="footer">
                        <img src="https://oucfxeezfamenmsqkgib.supabase.co/storage/v1/object/public/receiptify/appImages/Receiptify-mdpi.jpg" alt="App Logo" style="height: 32px; margin-bottom: 0.5rem; display: block; margin-left: auto; margin-right: auto; border-radius: 100px" />
                        <p>Generated by Receiptify - Your Smart Receipt Generator</p>
                        <p>© ${new Date().getFullYear()} Receiptify. All rights reserved.</p>
                    </div>
                </div>
            </body>
        </html>
    `;
}