export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string;
          role: 'admin' | 'user' | 'guest';
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email: string;
          role?: 'admin' | 'user' | 'guest';
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          email?: string;
          role?: 'admin' | 'user' | 'guest';
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          color: string | null;
          icon: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          color?: string | null;
          icon?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          color?: string | null;
          icon?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      locations: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          building: string | null;
          floor: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          building?: string | null;
          floor?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          building?: string | null;
          floor?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      storage_bins: {
        Row: {
          id: string;
          name: string;
          location_id: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          location_id: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          location_id?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'storage_bins_location_id_fkey';
            columns: ['location_id'];
            isOneToOne: false;
            referencedRelation: 'locations';
            referencedColumns: ['id'];
          }
        ];
      };
      items: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          category_id: string | null;
          location_id: string | null;
          storage_bin_id: string | null;
          quantity: number;
          min_quantity: number;
          unit: string;
          qr_code: string | null;
          image_url: string | null;
          notes: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          category_id?: string | null;
          location_id?: string | null;
          storage_bin_id?: string | null;
          quantity?: number;
          min_quantity?: number;
          unit?: string;
          qr_code?: string | null;
          image_url?: string | null;
          notes?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          category_id?: string | null;
          location_id?: string | null;
          storage_bin_id?: string | null;
          quantity?: number;
          min_quantity?: number;
          unit?: string;
          qr_code?: string | null;
          image_url?: string | null;
          notes?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'items_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'items_location_id_fkey';
            columns: ['location_id'];
            isOneToOne: false;
            referencedRelation: 'locations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'items_storage_bin_id_fkey';
            columns: ['storage_bin_id'];
            isOneToOne: false;
            referencedRelation: 'storage_bins';
            referencedColumns: ['id'];
          }
        ];
      };
      checkouts: {
        Row: {
          id: string;
          item_id: string;
          checked_out_by: string;
          checked_in_by: string | null;
          quantity: number;
          purpose: string | null;
          expected_return: string | null;
          checked_in_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          item_id: string;
          checked_out_by: string;
          checked_in_by?: string | null;
          quantity: number;
          purpose?: string | null;
          expected_return?: string | null;
          checked_in_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          item_id?: string;
          checked_out_by?: string;
          checked_in_by?: string | null;
          quantity?: number;
          purpose?: string | null;
          expected_return?: string | null;
          checked_in_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'checkouts_item_id_fkey';
            columns: ['item_id'];
            isOneToOne: false;
            referencedRelation: 'items';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'checkouts_checked_out_by_fkey';
            columns: ['checked_out_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'checkouts_checked_in_by_fkey';
            columns: ['checked_in_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      audit_logs: {
        Row: {
          id: string;
          table_name: string;
          record_id: string;
          action: string;
          actor_id: string | null;
          actor_email: string | null;
          old_data: Json | null;
          new_data: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          table_name: string;
          record_id: string;
          action: string;
          actor_id?: string | null;
          actor_email?: string | null;
          old_data?: Json | null;
          new_data?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: never;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type Location = Database['public']['Tables']['locations']['Row'];
export type StorageBin = Database['public']['Tables']['storage_bins']['Row'];
export type Item = Database['public']['Tables']['items']['Row'];
export type Checkout = Database['public']['Tables']['checkouts']['Row'];
export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];

export type ItemWithRelations = Item & {
  categories: Category | null;
  locations: Location | null;
  storage_bins: StorageBin | null;
};

export type CheckoutWithRelations = Checkout & {
  items: Item | null;
  profiles: Profile | null;
};
