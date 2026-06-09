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

    const invoices = await Invoice.find({ userId });

    let totalRevenue = 0;
    let totalPaid = 0;
    let totalUnpaid = 0;
    let paidCount = 0;
    let unpaidCount = 0;
    
    // Revenue by date (grouped by invoice date)
    const revenueByDateMap: Record<string, number> = {};
    // Sales by item map
    const salesByItemMap: Record<string, { quantity: number; revenue: number }> = {};

    invoices.forEach(inv => {
      totalRevenue += inv.totalAmount;
      if (inv.status === 'Paid') {
        totalPaid += inv.totalAmount;
        paidCount++;
      } else {
        totalUnpaid += inv.totalAmount;
        unpaidCount++;
      }

      // Group revenue by date
      const dateKey = inv.date;
      revenueByDateMap[dateKey] = (revenueByDateMap[dateKey] || 0) + inv.totalAmount;

      // Group items
      inv.items.forEach((item: any) => {
        const name = item.description;
        const qtyMatch = String(item.weightOrQty).match(/([\d.]+)/);
        const qtyVal = qtyMatch ? Number(qtyMatch[1]) : 1;
        const prev = salesByItemMap[name] || { quantity: 0, revenue: 0 };
        salesByItemMap[name] = {
          quantity: prev.quantity + qtyVal,
          revenue: prev.revenue + item.amount
        };
      });
    });

    // Format revenue by date as array
    const revenueOverTime = Object.keys(revenueByDateMap).map(date => ({
      date,
      revenue: Math.round(revenueByDateMap[date])
    })).sort((a, b) => {
      const parseDate = (dStr: string) => {
        const parts = dStr.split('/');
        if (parts.length === 3) {
          return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime();
        }
        return new Date(dStr).getTime();
      };
      return parseDate(a.date) - parseDate(b.date);
    });

    // Format top items
    const topItems = Object.keys(salesByItemMap).map(name => ({
      name,
      quantity: Math.round(salesByItemMap[name].quantity * 10) / 10,
      revenue: Math.round(salesByItemMap[name].revenue)
    })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    return NextResponse.json({
      summary: {
        totalInvoices: invoices.length,
        totalRevenue: Math.round(totalRevenue),
        totalPaid: Math.round(totalPaid),
        totalUnpaid: Math.round(totalUnpaid),
        paidCount,
        unpaidCount
      },
      revenueOverTime,
      topItems
    });
  } catch (err: any) {
    console.error('GetAnalytics error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
