import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Invoice } from '@/lib/models/invoice';
import { verifyAuth } from '@/lib/helpers/auth';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const userId = await verifyAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'No token provided or token invalid' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const query: any = { userId };

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { invoiceNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const invoices = await Invoice.find(query).sort({ createdAt: -1 });
    return NextResponse.json(invoices);
  } catch (err: any) {
    console.error('GetInvoices error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const userId = await verifyAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'No token provided or token invalid' }, { status: 401 });
    }

    const body = await req.json();
    const {
      invoiceNumber,
      customerName,
      customerPhone,
      customerAddress,
      date,
      dueDate,
      items,
      taxPercent,
      discountAmount,
      terms,
      status,
      templateId,
      templateCustomization
    } = body;

    if (!invoiceNumber || !customerName || !date || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Missing required invoice fields or items' }, { status: 400 });
    }

    // Calculate subtotal and validate items
    let subtotal = 0;
    const formattedItems = items.map((item: any) => {
      const rate = Number(item.rate) || 0;
      const qtyMatch = String(item.weightOrQty).match(/([\d.]+)/);
      const qtyVal = qtyMatch ? Number(qtyMatch[1]) : 1;
      const amount = rate * qtyVal;
      subtotal += amount;

      return {
        date: item.date || date,
        description: item.description,
        weightOrQty: item.weightOrQty,
        rate,
        amount
      };
    });

    const taxP = Number(taxPercent) || 0;
    const taxAmount = (subtotal * taxP) / 100;
    const discAmount = Number(discountAmount) || 0;
    const totalAmount = subtotal + taxAmount - discAmount;

    // Helper to generate total in words (Rupees)
    const numberToWords = (num: number): string => {
      const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
      const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
      
      const cleanNum = Math.round(num);
      if (cleanNum === 0) return 'Zero Rupees';

      const convertLessThanThousand = (n: number): string => {
        if (n < 20) return a[n];
        const digit = n % 10;
        if (n < 100) return b[Math.floor(n / 10)] + (digit ? '-' + a[digit] : '');
        return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 === 0 ? '' : 'and ' + convertLessThanThousand(n % 100));
      };

      const convert = (n: number): string => {
        if (n < 1000) return convertLessThanThousand(n);
        if (n < 100000) return convertLessThanThousand(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 !== 0 ? convertLessThanThousand(n % 1000) : '');
        if (n < 10000000) return convertLessThanThousand(Math.floor(n / 100000)) + 'Lakh ' + (n % 100000 !== 0 ? convert(n % 100000) : '');
        return convertLessThanThousand(Math.floor(n / 10000000)) + 'Crore ' + (n % 10000000 !== 0 ? convert(n % 10000000) : '');
      };

      return (convert(cleanNum) + 'Rupees Only').trim().replace(/\s+/g, ' ');
    };

    const totalAmountInWords = numberToWords(totalAmount);

    const invoice = new Invoice({
      userId,
      invoiceNumber,
      customerName,
      customerPhone: customerPhone || '',
      customerAddress: customerAddress || '',
      date,
      dueDate: dueDate || '',
      items: formattedItems,
      subtotal,
      taxPercent: taxP,
      taxAmount,
      discountAmount: discAmount,
      totalAmount,
      totalAmountInWords,
      terms: terms || '',
      status: status || 'Unpaid',
      templateId: templateId || 'classic',
      templateCustomization: templateCustomization || {}
    });

    await invoice.save();
    return NextResponse.json(invoice, { status: 201 });
  } catch (err: any) {
    console.error('CreateInvoice error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
