// Hand-written to match supabase/migrations. Regenerate with
// `npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts`
// once the Supabase CLI is linked.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string | null;
          user_id: string;
          full_name: string;
          avatar_url: string | null;
          role: Database['public']['Enums']['profile_role'];
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string | null;
          user_id: string;
          full_name: string;
          avatar_url?: string | null;
          role?: Database['public']['Enums']['profile_role'];
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string | null;
          user_id?: string;
          full_name?: string;
          avatar_url?: string | null;
          role?: Database['public']['Enums']['profile_role'];
        };
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string | null;
          business_name: string;
          contact_name: string | null;
          phone: string | null;
          email: string | null;
          website: string | null;
          industry: Database['public']['Enums']['lead_industry'];
          offer: Database['public']['Enums']['lead_offer'];
          stage: Database['public']['Enums']['lead_stage'];
          estimated_setup_fee: number | null;
          estimated_monthly: number | null;
          source: Database['public']['Enums']['lead_source'];
          owner_id: string | null;
          next_follow_up: string | null;
          notes: string | null;
          lost_reason: string | null;
          position: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string | null;
          business_name: string;
          contact_name?: string | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          industry?: Database['public']['Enums']['lead_industry'];
          offer?: Database['public']['Enums']['lead_offer'];
          stage?: Database['public']['Enums']['lead_stage'];
          estimated_setup_fee?: number | null;
          estimated_monthly?: number | null;
          source?: Database['public']['Enums']['lead_source'];
          owner_id?: string | null;
          next_follow_up?: string | null;
          notes?: string | null;
          lost_reason?: string | null;
          position?: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string | null;
          business_name?: string;
          contact_name?: string | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          industry?: Database['public']['Enums']['lead_industry'];
          offer?: Database['public']['Enums']['lead_offer'];
          stage?: Database['public']['Enums']['lead_stage'];
          estimated_setup_fee?: number | null;
          estimated_monthly?: number | null;
          source?: Database['public']['Enums']['lead_source'];
          owner_id?: string | null;
          next_follow_up?: string | null;
          notes?: string | null;
          lost_reason?: string | null;
          position?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'leads_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      clients: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string | null;
          lead_id: string | null;
          business_name: string;
          contact_name: string | null;
          phone: string | null;
          email: string | null;
          website: string | null;
          industry: Database['public']['Enums']['lead_industry'];
          package: string | null;
          setup_fee: number | null;
          monthly_retainer: number | null;
          status: Database['public']['Enums']['client_status'];
          start_date: string | null;
          owner_id: string | null;
          notes: string | null;
          vault_link: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string | null;
          lead_id?: string | null;
          business_name: string;
          contact_name?: string | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          industry?: Database['public']['Enums']['lead_industry'];
          package?: string | null;
          setup_fee?: number | null;
          monthly_retainer?: number | null;
          status?: Database['public']['Enums']['client_status'];
          start_date?: string | null;
          owner_id?: string | null;
          notes?: string | null;
          vault_link?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string | null;
          lead_id?: string | null;
          business_name?: string;
          contact_name?: string | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          industry?: Database['public']['Enums']['lead_industry'];
          package?: string | null;
          setup_fee?: number | null;
          monthly_retainer?: number | null;
          status?: Database['public']['Enums']['client_status'];
          start_date?: string | null;
          owner_id?: string | null;
          notes?: string | null;
          vault_link?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'clients_lead_id_fkey';
            columns: ['lead_id'];
            isOneToOne: true;
            referencedRelation: 'leads';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'clients_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      projects: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string | null;
          client_id: string;
          name: string;
          type: Database['public']['Enums']['project_type'];
          status: Database['public']['Enums']['project_status'];
          start_date: string | null;
          due_date: string | null;
          description: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string | null;
          client_id: string;
          name: string;
          type?: Database['public']['Enums']['project_type'];
          status?: Database['public']['Enums']['project_status'];
          start_date?: string | null;
          due_date?: string | null;
          description?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string | null;
          client_id?: string;
          name?: string;
          type?: Database['public']['Enums']['project_type'];
          status?: Database['public']['Enums']['project_status'];
          start_date?: string | null;
          due_date?: string | null;
          description?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'projects_client_id_fkey';
            columns: ['client_id'];
            isOneToOne: false;
            referencedRelation: 'clients';
            referencedColumns: ['id'];
          },
        ];
      };
      tasks: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string | null;
          project_id: string | null;
          client_id: string | null;
          title: string;
          description: string | null;
          assignee_id: string | null;
          due_date: string | null;
          status: Database['public']['Enums']['task_status'];
          priority: Database['public']['Enums']['task_priority'];
          position: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string | null;
          project_id?: string | null;
          client_id?: string | null;
          title: string;
          description?: string | null;
          assignee_id?: string | null;
          due_date?: string | null;
          status?: Database['public']['Enums']['task_status'];
          priority?: Database['public']['Enums']['task_priority'];
          position?: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string | null;
          project_id?: string | null;
          client_id?: string | null;
          title?: string;
          description?: string | null;
          assignee_id?: string | null;
          due_date?: string | null;
          status?: Database['public']['Enums']['task_status'];
          priority?: Database['public']['Enums']['task_priority'];
          position?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'tasks_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tasks_client_id_fkey';
            columns: ['client_id'];
            isOneToOne: false;
            referencedRelation: 'clients';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tasks_assignee_id_fkey';
            columns: ['assignee_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      move_lead: {
        Args: {
          p_lead_id: string;
          p_stage: Database['public']['Enums']['lead_stage'];
          p_index: number;
        };
        Returns: undefined;
      };
      convert_lead_to_client: {
        Args: {
          p_lead_id: string;
          p_client: Json;
          p_index?: number;
        };
        Returns: string;
      };
      move_task: {
        Args: {
          p_task_id: string;
          p_status: Database['public']['Enums']['task_status'];
          p_index: number;
        };
        Returns: undefined;
      };
    };
    Enums: {
      profile_role: 'founder';
      lead_industry:
        | 'salon'
        | 'dental'
        | 'medical'
        | 'guest_house'
        | 'construction'
        | 'bookkeeping'
        | 'real_estate'
        | 'cleaning'
        | 'driving_school'
        | 'gym'
        | 'legal'
        | 'other';
      lead_offer: 'whatsapp_automation' | 'website' | 'voice_agent' | 'other';
      lead_stage: 'new' | 'contacted' | 'call_booked' | 'proposal_sent' | 'won' | 'lost';
      lead_source: 'outreach' | 'referral' | 'website_form' | 'social' | 'other';
      client_status: 'onboarding' | 'active' | 'paused' | 'churned';
      project_type: 'whatsapp_agent' | 'website' | 'voice_agent' | 'automation' | 'other';
      project_status: 'planning' | 'building' | 'review' | 'live' | 'on_hold';
      task_status: 'todo' | 'doing' | 'done';
      task_priority: 'low' | 'medium' | 'high';
    };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicSchema = Database['public'];

export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row'];
export type TablesInsert<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Update'];
export type Enums<T extends keyof PublicSchema['Enums']> = PublicSchema['Enums'][T];
