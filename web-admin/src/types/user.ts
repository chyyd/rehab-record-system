export interface LoginDto {
  username: string
  password: string
}

export interface UserInfo {
  id: number
  username: string
  name: string
  role: 'admin' | 'physician' | 'therapist' | 'nurse'
  department: string
  isActive: boolean
}
