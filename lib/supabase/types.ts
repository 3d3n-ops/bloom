export interface Folder {
  id: string
  name: string
  user_id: string
  created_at: string
  updated_at: string
}

export interface Note {
  id: string
  title: string
  content: string
  folder_id: string | null
  user_id: string
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

