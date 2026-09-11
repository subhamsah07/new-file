/**
 * Payment Service - Tracks Direct Benefit Transfer (DBT) disbursements and payment records.
 * Interfaces directly with the 'payments' PostgreSQL table in Supabase.
 * Strictly adheres to Row Level Security: farmers can ONLY access their own payment records.
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
  // Optional expanded details when available
  token?: string;
  cropName?: string;
  centreName?: string;
  quantityQuintals?: number;
}

class PaymentService {
  /**
   * Retrieves all real DBT payments for the logged-in farmer from Supabase.
   * Zero mock data.
   */
  async getFarmerPayments(farmerId?: string): Promise<PaymentRecord[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    try {
      let targetFarmerId = farmerId;
      if (!targetFarmerId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];
        targetFarmerId = user.id;
      }

      const { data, error } = await supabase
        .from('payments')
        .select(`
          id,
          procurement_request_id,
          farmer_id,
          amount,
          payment_status,
          payment_reference,
          processed_by,
          processed_at,
          created_at,
          updated_at,
          procurement_requests (
            submitted_quantity,
            verified_quantity,
            crop_id,
            crops ( name ),
            procurement_centres ( name ),
            bookings ( token )
          )
        `)
        .eq('farmer_id', targetFarmerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching farmer payments:', error);
        return [];
      }

      if (!data) return [];

      return data.map((p: any) => ({
        id: p.id,
        procurementRequestId: p.procurement_request_id,
        farmerId: p.farmer_id,
        amount: Number(p.amount) || 0,
        paymentStatus: p.payment_status as PaymentStatus,
        paymentReference: p.payment_reference,
        processedBy: p.processed_by,
        processedAt: p.processed_at,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        token: p.procurement_requests?.bookings?.token,
        cropName: p.procurement_requests?.crops?.name,
        centreName: p.procurement_requests?.procurement_centres?.name,
        quantityQuintals: Number(p.procurement_requests?.verified_quantity || p.procurement_requests?.submitted_quantity) || undefined,
      }));
    } catch (err) {
      console.warn('Payment query error:', err);
      return [];
    }
  }

  /**
   * Retrieves the specific payment record linked to a booking ID.
   */
  async getPaymentForBooking(bookingId: string): Promise<PaymentRecord | null> {
    if (!isSupabaseConfigured() || !bookingId) return null;

    try {
      // First find the procurement request ID for this booking
      const { data: pr, error: prErr } = await supabase
        .from('procurement_requests')
        .select('id')
        .eq('booking_id', bookingId)
        .maybeSingle();

      if (prErr || !pr) {
        return null;
      }

      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('procurement_request_id', pr.id)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        procurementRequestId: data.procurement_request_id,
        farmerId: data.farmer_id,
        amount: Number(data.amount) || 0,
        paymentStatus: data.payment_status as PaymentStatus,
        paymentReference: data.payment_reference,
        processedBy: data.processed_by,
        processedAt: data.processed_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (err) {
      console.warn('Error fetching payment for booking:', err);
      return null;
    }
  }

  /**
   * Subscribes to realtime updates on the payments table for a specific farmer.
   */
  subscribeToFarmerPayments(farmerId: string, onUpdate: () => void): () => void {
    if (!isSupabaseConfigured() || !farmerId) {
      return () => {};
    }

    const channel = supabase
      .channel(`farmer_payments_${farmerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: `farmer_id=eq.${farmerId}`,
        },
        () => {
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const paymentService = new PaymentService();

