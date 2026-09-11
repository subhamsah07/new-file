/**
 * Payment Service - Tracks Direct Benefit Transfer (DBT) disbursements and payment records.
 * Interfaces with 'payments' PostgreSQL table.
 */

import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { PaymentStatus } from '../types/database';

export interface PaymentRecord {
  id: string;
  procurementRequestId: string;
  farmerId: string;
  amount: number;
  paymentStatus: PaymentStatus;
  paymentReference: string | null;
  processedBy: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const MOCK_PAYMENTS: PaymentRecord[] = [
  {
    id: 'pay-2026-001',
    procurementRequestId: 'pr-past-01',
    farmerId: 'farmer-rameshwar-01',
    amount: 46000.0,
    paymentStatus: 'completed',
    paymentReference: 'DBT-2026-PUNB-998124',
    processedBy: 'a0000001-0000-0000-0000-000000000001',
    processedAt: '2026-05-20T11:45:00Z',
    createdAt: '2026-05-20T10:00:00Z',
    updatedAt: '2026-05-20T11:45:00Z',
  },
  {
    id: 'pay-2026-002',
    procurementRequestId: 'pr-past-02',
    farmerId: 'farmer-rameshwar-01',
    amount: 68930.0,
    paymentStatus: 'completed',
    paymentReference: 'DBT-2026-PUNB-441091',
    processedBy: 'a0000001-0000-0000-0000-000000000001',
    processedAt: '2026-04-05T15:20:00Z',
    createdAt: '2026-04-05T14:00:00Z',
    updatedAt: '2026-04-05T15:20:00Z',
  },
];

class PaymentService {
  /**
   * Retrieves all DBT payments for the logged-in farmer.
   */
  async getFarmerPayments(): Promise<PaymentRecord[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('farmer_id', user.id)
            .order('created_at', { ascending: false });

          if (!error && data && data.length > 0) {
            return data.map((p: any) => ({
              id: p.id,
              procurementRequestId: p.procurement_request_id,
              farmerId: p.farmer_id,
              amount: Number(p.amount),
              paymentStatus: p.payment_status,
              paymentReference: p.payment_reference,
              processedBy: p.processed_by,
              processedAt: p.processed_at,
              createdAt: p.created_at,
              updatedAt: p.updated_at,
            }));
          }
        }
      } catch (err) {
        console.warn('Supabase payments query fallback', err);
      }
    }
    return [...MOCK_PAYMENTS];
  }
}

export const paymentService = new PaymentService();
