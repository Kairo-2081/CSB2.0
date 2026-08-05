// Supabase Database Types
export interface Database {
  public: {
    Tables: {
      complaints: {
        Row: {
          id: string;
          title: string;
          description: string;
          category: "hall" | "dining" | "lab" | "academic" | "administration";
          status: "pending" | "in_progress" | "resolved";
          posted_by: string;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          category: "hall" | "dining" | "lab" | "academic" | "administration";
          status?: "pending" | "in_progress" | "resolved";
          posted_by: string;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          category?: "hall" | "dining" | "lab" | "academic" | "administration";
          status?: "pending" | "in_progress" | "resolved";
          posted_by?: string;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      lost_found_items: {
        Row: {
          id: string;
          title: string;
          description: string;
          location: string;
          type: "lost" | "found";
          posted_by: string;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          location: string;
          type: "lost" | "found";
          posted_by: string;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          location?: string;
          type?: "lost" | "found";
          posted_by?: string;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      marketplace_items: {
        Row: {
          id: string;
          title: string;
          description: string;
          price: number;
          seller: string;
          phone: string;
          category: string;
          is_sold: boolean;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          price: number;
          seller: string;
          phone: string;
          category: string;
          is_sold?: boolean;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          price?: number;
          seller?: string;
          phone?: string;
          category?: string;
          is_sold?: boolean;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      notices: {
        Row: {
          id: string;
          title: string;
          description: string;
          category: "general" | "academic" | "event" | "urgent";
          posted_by: string;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          category: "general" | "academic" | "event" | "urgent";
          posted_by: string;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          category?: "general" | "academic" | "event" | "urgent";
          posted_by?: string;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      bicycles: {
        Row: {
          id: string;
          registration_number: string;
          status: "available" | "rented" | "maintenance";
          rented_by: string | null;
          user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          registration_number: string;
          status?: "available" | "rented" | "maintenance";
          rented_by?: string | null;
          user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          registration_number?: string;
          status?: "available" | "rented" | "maintenance";
          rented_by?: string | null;
          user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      blood_donations: {
        Row: {
          id: string;
          blood_type: string;
          donor_name: string;
          phone: string;
          location: string;
          available_units: number;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          blood_type: string;
          donor_name: string;
          phone: string;
          location: string;
          available_units: number;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          blood_type?: string;
          donor_name?: string;
          phone?: string;
          location?: string;
          available_units?: number;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      faculty_suggestions: {
        Row: {
          id: string;
          title: string;
          description: string;
          faculty_name: string;
          subject: string;
          rating: number;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          faculty_name: string;
          subject: string;
          rating: number;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          faculty_name?: string;
          subject?: string;
          rating?: number;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      animal_welfare: {
        Row: {
          id: string;
          title: string;
          description: string;
          location: string;
          urgency_level: "low" | "medium" | "high";
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          location: string;
          urgency_level: "low" | "medium" | "high";
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          location?: string;
          urgency_level?: "low" | "medium" | "high";
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: "student" | "faculty" | "admin";
          department: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          role: "student" | "faculty" | "admin";
          department: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: "student" | "faculty" | "admin";
          department?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
