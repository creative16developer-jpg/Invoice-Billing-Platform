import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Invoice } from '@/lib/models/invoice';
import { verifyAuth } from '@/lib/helpers/auth';

export async function GET(req: NextRequest, context: { params: any }) {
  try {
    await dbConnect();
    const userId = await verifyAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'No token provided or token invalid' }, { status: 401 });
    }

    const { id } = await context.params;
    const invoice = await Invoice.findOne({ _id: id, userId });
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    return NextResponse.json(invoice);
  } catch (err: any) {
    console.error('GetInvoiceById error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: { params: any }) {
  try {
    await dbConnect();
    const userId = await verifyAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'No token provided or token invalid' }, { status: 401 });
    }

    const { id } = await context.params;
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

    const invoice = await Invoice.findOne({ _id: id, userId });
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (invoiceNumber) invoice.invoiceNumber = invoiceNumber;
    if (customerName) invoice.customerName = customerName;
    if (customerPhone !== undefined) invoice.customerPhone = customerPhone;
    if (customerAddress !== undefined) invoice.customerAddress = customerAddress;
    if (date) invoice.date = date;
    if (dueDate !== undefined) invoice.dueDate = dueDate;
    if (status) invoice.status = status;
    if (terms !== undefined) invoice.terms = terms;
    if (templateId) invoice.templateId = templateId;
    if (templateCustomization) invoice.templateCustomization = templateCustomization;

    if (items && Array.isArray(items)) {
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

      invoice.items = formattedItems as any;
      invoice.subtotal = subtotal;

      const taxP = taxPercent !== undefined ? Number(taxPercent) : invoice.taxPercent;
      const discAmount = discountAmount !== undefined ? Number(discountAmount) : invoice.discountAmount;
      
      invoice.taxPercent = taxP;
      invoice.taxAmount = (subtotal * taxP) / 100;
      invoice.discountAmount = discAmount;
      invoice.totalAmount = subtotal + invoice.taxAmount - discAmount;

      // Update total in words
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
      invoice.totalAmountInWords = numberToWords(invoice.totalAmount);
    } else if (taxPercent !== undefined || discountAmount !== undefined) {
      const taxP = taxPercent !== undefined ? Number(taxPercent) : invoice.taxPercent;
      const discAmount = discountAmount !== undefined ? Number(discountAmount) : invoice.discountAmount;
      
      invoice.taxPercent = taxP;
      invoice.taxAmount = (invoice.subtotal * taxP) / 100;
      invoice.discountAmount = discAmount;
      invoice.totalAmount = invoice.subtotal + invoice.taxAmount - discAmount;
      
      // Update total in words
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
      invoice.totalAmountInWords = numberToWords(invoice.totalAmount);
    }

    await invoice.save();
    return NextResponse.json(invoice);
  } catch (err: any) {
    console.error('UpdateInvoice error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: any }) {
  try {
    await dbConnect();
    const userId = await verifyAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'No token provided or token invalid' }, { status: 401 });
    }

    const { id } = await context.params;
    const invoice = await Invoice.findOneAndDelete({ _id: id, userId });
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Invoice deleted successfully' });
  } catch (err: any) {
    console.error('DeleteInvoice error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
