import { supabase } from '../lib/supabaseClient';

export interface UploadResult {
  url: string;
  isStorageUrl: boolean;
  error?: string;
}

/**
 * Service to handle uploading files to Supabase Storage buckets
 * Prevents base64 bloating in database tables which exhausts bandwidth (egress)
 */
export const storageService = {
  /**
   * Uploads a document (PDF or Image) to Supabase Storage bucket 'kyc-documents'
   * Falls back to 'documents' or 'public' if bucket exists
   */
  async uploadKycDoc(file: File, shopId: string, docType: string): Promise<UploadResult> {
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'dat';
      const cleanFileName = `${shopId}/${docType}_${Date.now()}.${ext}`;

      // 1. Try primary bucket 'kyc-documents'
      const { data, error } = await supabase.storage
        .from('kyc-documents')
        .upload(cleanFileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (!error && data?.path) {
        const { data: pubData } = supabase.storage.from('kyc-documents').getPublicUrl(cleanFileName);
        return {
          url: pubData.publicUrl,
          isStorageUrl: true,
        };
      }

      // 2. Try alternate bucket 'documents'
      const alt = await supabase.storage
        .from('documents')
        .upload(cleanFileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (!alt.error && alt.data?.path) {
        const { data: pubData } = supabase.storage.from('documents').getPublicUrl(cleanFileName);
        return {
          url: pubData.publicUrl,
          isStorageUrl: true,
        };
      }

      console.warn('[storageService] Storage bucket upload failed, using fallback reader:', error?.message);
      return {
        url: '',
        isStorageUrl: false,
        error: error?.message || 'Bucket not found',
      };
    } catch (err: any) {
      console.warn('[storageService] Upload exception:', err);
      return {
        url: '',
        isStorageUrl: false,
        error: err?.message,
      };
    }
  },

  /**
   * Upload shop logo or banner image to Supabase Storage 'shop-assets'
   */
  async uploadShopAsset(file: File, shopId: string, assetType: 'logo' | 'banner'): Promise<UploadResult> {
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const cleanFileName = `${shopId}/${assetType}_${Date.now()}.${ext}`;

      const { data, error } = await supabase.storage
        .from('shop-assets')
        .upload(cleanFileName, file, {
          cacheControl: '86400',
          upsert: true,
        });

      if (!error && data?.path) {
        const { data: pubData } = supabase.storage.from('shop-assets').getPublicUrl(cleanFileName);
        return {
          url: pubData.publicUrl,
          isStorageUrl: true,
        };
      }

      return {
        url: '',
        isStorageUrl: false,
        error: error?.message,
      };
    } catch (err: any) {
      return {
        url: '',
        isStorageUrl: false,
        error: err?.message,
      };
    }
  },
};
