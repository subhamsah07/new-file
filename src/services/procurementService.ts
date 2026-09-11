/**
 * Procurement Service - Manages the 7-stage procurement workflow and verification audits.
 * Interfaces with 'procurement_requests' and 'verification_records' PostgreSQL tables.
 */

import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { ProcurementWorkflowStatus, VerificationType } from '../types/database';

export interface ProcurementRequestDetails {
  id: string;
  bookingId: string;
  farmerId: string;
  centreId: string;
  cropId: string;
  submittedQuantity: number;
  verifiedQuantity: number | null;
  configuredRate: number;
  verifiedRate: number | null;
  estimatedValue: number;
  finalValue: number | null;
  status: ProcurementWorkflowStatus;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationAuditRecord {
  id: string;
  procurementRequestId: string;
  verificationType: VerificationType;
  status: 'pending' | 'verified' | 'rejected';
  verifiedBy: string | null;
  notes: string | null;
  verifiedAt: string | null;
  createdAt: string;
}

const MOCK_PROCUREMENT_REQUEST: ProcurementRequestDetails = {
  id: 'pr-2026-sp7k4q',
  bookingId: 'book-2026-sp7k4q',
  farmerId: 'farmer-rameshwar-01',
  centreId: 'centre-ldh-04',
  cropId: 'c0000001-0000-0000-0000-000000000001',
  submittedQuantity: 25.0,
  verifiedQuantity: null,
  configuredRate: 2425.0,
  verifiedRate: null,
  estimatedValue: 60625.0,
  finalValue: null,
  status: 'booking',
  createdAt: '2026-09-06T14:30:00Z',
  updatedAt: '2026-09-06T21:10:00Z',
};

const MOCK_VERIFICATION_AUDIT: VerificationAuditRecord[] = [
  {
    id: 'vr-01',
    procurementRequestId: 'pr-2026-sp7k4q',
    verificationType: 'QR verification',
    status: 'pending',
    verifiedBy: null,
    notes: 'Awaiting farmer arrival at Mandi Gate 1',
    verifiedAt: null,
    createdAt: '2026-09-06T14:30:00Z',
  },
  {
    id: 'vr-02',
    procurementRequestId: 'pr-2026-sp7k4q',
    verificationType: 'document verification',
    status: 'pending',
    verifiedBy: null,
    notes: 'Land holding certificate & Kisan ID',
    verifiedAt: null,
    createdAt: '2026-09-06T14:30:00Z',
  },
  {
    id: 'vr-03',
    procurementRequestId: 'pr-2026-sp7k4q',
    verificationType: 'weight verification',
    status: 'pending',
    verifiedBy: null,
    notes: 'Electronic weighbridge gross & tare recording',
    verifiedAt: null,
    createdAt: '2026-09-06T14:30:00Z',
  },
  {
    id: 'vr-04',
    procurementRequestId: 'pr-2026-sp7k4q',
    verificationType: 'rate verification',
    status: 'pending',
    verifiedBy: null,
    notes: 'Quality inspection and moisture content assessment',
    verifiedAt: null,
    createdAt: '2026-09-06T14:30:00Z',
  },
];

class ProcurementService {
  /**
   * Retrieves active procurement request by booking ID.
   */
  async getRequestByBookingId(bookingId: string): Promise<ProcurementRequestDetails | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('procurement_requests')
          .select('*')
          .eq('booking_id', bookingId)
          .single();

        if (!error && data) {
          return {
            id: data.id,
            bookingId: data.booking_id,
            farmerId: data.farmer_id,
            centreId: data.centre_id,
            cropId: data.crop_id,
            submittedQuantity: Number(data.submitted_quantity),
            verifiedQuantity: data.verified_quantity ? Number(data.verified_quantity) : null,
            configuredRate: Number(data.configured_rate),
            verifiedRate: data.verified_rate ? Number(data.verified_rate) : null,
            estimatedValue: Number(data.estimated_value),
            finalValue: data.final_value ? Number(data.final_value) : null,
            status: data.status,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
        }
      } catch (err) {
        console.warn('Supabase procurement request query fallback', err);
      }
    }
    return bookingId === 'book-2026-sp7k4q' ? MOCK_PROCUREMENT_REQUEST : null;
  }

  /**
   * Retrieves verification audit checkpoint records for a procurement request.
   */
  async getVerificationRecords(procurementRequestId: string): Promise<VerificationAuditRecord[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('verification_records')
          .select('*')
          .eq('procurement_request_id', procurementRequestId)
          .order('created_at', { ascending: true });

        if (!error && data && data.length > 0) {
          return data.map((v: any) => ({
            id: v.id,
            procurementRequestId: v.procurement_request_id,
            verificationType: v.verification_type,
            status: v.status,
            verifiedBy: v.verified_by,
            notes: v.notes,
            verifiedAt: v.verified_at,
            createdAt: v.created_at,
          }));
        }
      } catch (err) {
        console.warn('Supabase verification audit records fallback', err);
      }
    }
    return [...MOCK_VERIFICATION_AUDIT];
  }
}

export const procurementService = new ProcurementService();
